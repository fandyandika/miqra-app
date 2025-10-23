import { useEffect } from 'react';
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

          // Invalidate all reading-related queries with more specific keys
          queryClient.invalidateQueries({ queryKey: ['reading'] });
          queryClient.invalidateQueries({ queryKey: ['khatam'] });
          queryClient.invalidateQueries({ queryKey: ['streak'] });
          queryClient.invalidateQueries({ queryKey: ['checkin'] });
          queryClient.invalidateQueries({ queryKey: ['families'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'history'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'stats'] });
          queryClient.invalidateQueries({ queryKey: ['reading', 'calendar'] });

          // Force refetch critical data immediately
          queryClient.refetchQueries({ queryKey: ['reading', 'progress'] });
          queryClient.refetchQueries({ queryKey: ['reading', 'today'] });
          queryClient.refetchQueries({ queryKey: ['khatam', 'progress'] });
          queryClient.refetchQueries({ queryKey: ['streak', 'current'] });
          queryClient.refetchQueries({ queryKey: ['checkin', 'today'] });
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
