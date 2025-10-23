import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthSession } from '@/hooks/useAuth';

export function useCheckinSync() {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();

  useEffect(() => {
    if (!session?.user) {
      console.log('[CheckinSync] No session, skipping sync setup');
      return;
    }

    console.log(
      '[CheckinSync] Setting up real-time sync for user:',
      session.user.id
    );

    // Subscribe to reading_sessions changes
    const sessionsChannel = supabase
      .channel('reading_sessions_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_sessions',
          filter: `user_id=eq.${session.user.id}`,
        },
        async payload => {
          console.log(
            '[CheckinSync] 🔥 Reading session changed:',
            payload.eventType,
            payload.new || payload.old
          );

          // Sync checkins with reading sessions
          await syncCheckinsWithSessions(session.user.id);

          // Invalidate and refetch all related queries
          queryClient.invalidateQueries({ queryKey: ['checkin'] });
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.invalidateQueries({ queryKey: ['reading'] });
          queryClient.invalidateQueries({ queryKey: ['khatam'] });

          // Force refetch critical data
          queryClient.refetchQueries({ queryKey: ['checkin', 'today'] });
          queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
          queryClient.refetchQueries({ queryKey: ['reading', 'today'] });
          queryClient.refetchQueries({ queryKey: ['khatam', 'progress'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[CheckinSync] Cleaning up real-time sync');
      sessionsChannel.unsubscribe();
    };
  }, [session?.user, queryClient]);
}

async function syncCheckinsWithSessions(userId: string) {
  try {
    console.log('[CheckinSync] Syncing checkins with reading sessions...');

    // Get all reading sessions for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const { data: sessions, error: sessionsError } = await supabase
      .from('reading_sessions')
      .select('date, ayat_count')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (sessionsError) {
      console.error('[CheckinSync] Error fetching sessions:', sessionsError);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('[CheckinSync] No sessions found');
      return;
    }

    // Group sessions by date and calculate daily totals
    const dailyTotals: Record<string, number> = {};
    sessions.forEach(session => {
      const date = session.date;
      if (!dailyTotals[date]) {
        dailyTotals[date] = 0;
      }
      dailyTotals[date] += session.ayat_count || 0;
    });

    console.log('[CheckinSync] Daily totals from sessions:', dailyTotals);

    // Get current checkins for the same period
    const { data: currentCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (checkinsError) {
      console.error('[CheckinSync] Error fetching checkins:', checkinsError);
      return;
    }

    // Create a map of existing checkins
    const existingCheckins: Record<string, number> = {};
    currentCheckins?.forEach(checkin => {
      existingCheckins[checkin.date] = checkin.ayat_count;
    });

    // Find dates that need checkins or have different totals
    const checkinsToUpsert: Array<{
      user_id: string;
      date: string;
      ayat_count: number;
      created_at: string;
    }> = [];

    Object.keys(dailyTotals).forEach(date => {
      const sessionTotal = dailyTotals[date];
      const checkinTotal = existingCheckins[date] || 0;

      if (sessionTotal !== checkinTotal) {
        checkinsToUpsert.push({
          user_id: userId,
          date: date,
          ayat_count: sessionTotal,
          created_at: new Date(date + 'T08:00:00Z').toISOString(),
        });
      }
    });

    // Upsert checkins
    if (checkinsToUpsert.length > 0) {
      console.log('[CheckinSync] Upserting checkins:', checkinsToUpsert);

      const { error: upsertError } = await supabase
        .from('checkins')
        .upsert(checkinsToUpsert, {
          onConflict: 'user_id,date',
        });

      if (upsertError) {
        console.error('[CheckinSync] Error upserting checkins:', upsertError);
        return;
      }

      console.log('[CheckinSync] ✅ Checkins synced successfully');

      // Recalculate and update streak
      await updateStreakFromCheckins(userId);
    } else {
      console.log('[CheckinSync] No checkins need updating');
    }
  } catch (error) {
    console.error('[CheckinSync] Error in sync process:', error);
  }
}

async function updateStreakFromCheckins(userId: string) {
  try {
    console.log('[CheckinSync] Updating streak from checkins...');

    // Get all checkins for this user
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('date, ayat_count')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (checkinsError) {
      console.error(
        '[CheckinSync] Error fetching checkins for streak:',
        checkinsError
      );
      return;
    }

    if (!checkins || checkins.length === 0) {
      // No checkins, set streak to 0
      await supabase.from('streaks').upsert(
        {
          user_id: userId,
          current: 0,
          longest: 0,
          last_date: null,
        },
        {
          onConflict: 'user_id',
        }
      );
      return;
    }

    // Calculate current streak - start from day 1
    let currentStreak = 0;
    let lastDate = null;

    const sortedCheckins = checkins.sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    if (sortedCheckins.length === 0) {
      currentStreak = 0;
    } else {
      // Start from most recent checkin - day 1 counts as streak 1
      let tempDate = new Date(sortedCheckins[0].date);
      currentStreak = 1; // First day always counts as streak 1
      lastDate = tempDate;

      // Check consecutive days backwards
      for (let i = 1; i < sortedCheckins.length; i++) {
        const checkinDate = new Date(sortedCheckins[i].date);
        const daysDiff = Math.floor(
          (tempDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          currentStreak++;
          tempDate = checkinDate;
        } else {
          // Streak broken, stop counting
          break;
        }
      }
    }

    // Get current longest streak
    const { data: currentStreakData } = await supabase
      .from('streaks')
      .select('longest')
      .eq('user_id', userId)
      .single();

    const longestStreak = Math.max(
      currentStreakData?.longest || 0,
      currentStreak
    );

    // Update streaks table
    const { error: streakError } = await supabase.from('streaks').upsert(
      {
        user_id: userId,
        current: currentStreak,
        longest: longestStreak,
        last_date: lastDate?.toISOString().split('T')[0] || null,
      },
      {
        onConflict: 'user_id',
      }
    );

    if (streakError) {
      console.error('[CheckinSync] Error updating streak:', streakError);
    } else {
      console.log('[CheckinSync] ✅ Streak updated:', currentStreak, 'days');
    }
  } catch (error) {
    console.error('[CheckinSync] Error updating streak:', error);
  }
}
