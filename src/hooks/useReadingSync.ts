import { useEffect } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthSession } from '@/hooks/useAuth';

export function useReadingSync() {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();

  useEffect(() => {
    if (!session?.user) {
      console.log('[ReadingSync] No session, skipping real-time setup');
      return;
    }

    console.log('[ReadingSync] Setting up real-time subscriptions for user:', session.user.id);

    // Subscribe to reading_sessions changes
    const readingSessionsChannel = supabase
      .channel('reading_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_sessions',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log(
            '[ReadingSync] 🔥 Reading sessions changed:',
            payload.eventType,
            payload.new || payload.old
          );

          const newRow: any = payload?.new || {};
          const sessionDate: string | undefined = newRow?.date;
          const sessionAyat: number = Number(newRow?.ayat_count || 0);
          const monthKeyFromSession = sessionDate
            ? format(new Date(sessionDate), 'yyyy-MM')
            : format(new Date(), 'yyyy-MM');

          // Optimistic cache updates for Progress screen
          try {
            // Update recent-reading-sessions grouped data
            queryClient.setQueryData<any[]>(['recent-reading-sessions'], (prev) => {
              if (!Array.isArray(prev)) return prev;
              if (!sessionDate) return prev;
              // Clone
              const copy = [...prev];
              const idx = copy.findIndex((d) => d?.date === sessionDate);
              if (idx >= 0) {
                const day = copy[idx];
                const updated = {
                  ...day,
                  ayat_count: (Number(day?.ayat_count) || 0) + sessionAyat,
                  session_count: (Number(day?.session_count) || 0) + 1,
                  sessions: [...(day?.sessions || []), newRow],
                };
                copy[idx] = updated;
                return copy;
              }
              // Not found -> prepend new day
              return [
                {
                  date: sessionDate,
                  ayat_count: sessionAyat,
                  session_count: 1,
                  sessions: [newRow],
                  surah_name: newRow?.surah_number
                    ? `Surah ${newRow?.surah_number}`
                    : 'Surah tidak diketahui',
                  ayat_start: newRow?.ayat_start || 1,
                  ayat_end: newRow?.ayat_end || sessionAyat || 1,
                },
                ...copy,
              ];
            });

            // Update calendar month map
            queryClient.setQueryData<any[]>(['checkin-data', monthKeyFromSession], (prev) => {
              if (!Array.isArray(prev)) return prev;
              if (!sessionDate) return prev;
              const copy = [...prev];
              const idx = copy.findIndex((d) => d?.date === sessionDate);
              if (idx >= 0) {
                copy[idx] = {
                  ...copy[idx],
                  ayat_count: (Number(copy[idx]?.ayat_count) || 0) + sessionAyat,
                };
                return copy;
              }
              return [...copy, { date: sessionDate, ayat_count: sessionAyat }];
            });
          } catch (e) {
            console.warn('[ReadingSync] Optimistic cache update failed:', e);
          }

          // Invalidate all reading-related queries with more specific keys
          queryClient.invalidateQueries({ queryKey: ['reading'] });
          queryClient.invalidateQueries({ queryKey: ['khatam'] });
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.invalidateQueries({ queryKey: ['checkin'] });
          queryClient.invalidateQueries({ queryKey: ['families'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'history'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'stats'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'calendar'] });
          // Progress screen specific keys
          queryClient.invalidateQueries({ queryKey: ['reading-stats'] });
          queryClient.invalidateQueries({ queryKey: ['checkin-data'] });
          queryClient.invalidateQueries({ queryKey: ['recent-reading-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['hasanat'] });

          // Force refetch critical data immediately
          queryClient.refetchQueries({ queryKey: ['reading', 'progress'] });
          queryClient.refetchQueries({ queryKey: ['reading', 'today'] });
          queryClient.refetchQueries({ queryKey: ['khatam', 'progress'] });
          queryClient.refetchQueries({ queryKey: ['hasanat', 'stats'] });
          queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
          queryClient.refetchQueries({ queryKey: ['checkin', 'today'] });
          // Progress screen specific keys (use current month)
          const currentMonthKey = format(new Date(), 'yyyy-MM');
          queryClient.refetchQueries({ queryKey: ['reading-stats'] });
          queryClient.refetchQueries({ queryKey: ['checkin-data', currentMonthKey] });
          queryClient.refetchQueries({ queryKey: ['recent-reading-sessions'] });
        }
      )
      .subscribe();

    // Subscribe to reading_progress changes
    const readingProgressChannel = supabase
      .channel('reading_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_progress',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log(
            '[ReadingSync] 📊 Reading progress changed:',
            payload.eventType,
            payload.new || payload.old
          );

          // Invalidate progress-related queries
          queryClient.invalidateQueries({ queryKey: ['reading', 'progress'] });
          queryClient.invalidateQueries({ queryKey: ['khatam', 'progress'] });
        }
      )
      .subscribe();

    // Subscribe to checkins changes (for streak updates)
    const checkinsChannel = supabase
      .channel('checkins_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log(
            '[ReadingSync] 🔥 Checkins changed:',
            payload.eventType,
            payload.new || payload.old
          );

          // Invalidate streak and family data
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.invalidateQueries({ queryKey: ['checkin'] });
          queryClient.invalidateQueries({ queryKey: ['families'] });

          // Force refetch streak data
          queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
          queryClient.refetchQueries({ queryKey: ['checkin', 'today'] });
        }
      )
      .subscribe();

    return () => {
      console.log('[ReadingSync] Cleaning up real-time subscriptions');
      readingSessionsChannel.unsubscribe();
      readingProgressChannel.unsubscribe();
      checkinsChannel.unsubscribe();
    };
  }, [session?.user, queryClient]);
}
