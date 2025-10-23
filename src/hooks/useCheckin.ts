import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { upsertCheckin, getTodayCheckin, getCurrentStreak } from '@/services/checkins';
import { queueCheckin, cacheCheckin } from '@/lib/sqlite';
import { getTodayDate } from '@/utils/time';
import { isOnline, syncPendingCheckins } from '@/utils/sync';
import { posthog, EVENTS } from '@/config/posthog';
import { getProfileTimezone } from '@/services/profile';
import { useState } from 'react';

export function useCheckin() {
  const qc = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user timezone for consistent date calculation
  const { data: userTimezone } = useQuery({
    queryKey: ['profile', 'timezone'],
    queryFn: getProfileTimezone,
    staleTime: 300_000, // 5 minutes
  });

  const todayQ = useQuery({
    queryKey: ['checkin', 'today'],
    queryFn: () => getTodayCheckin(userTimezone || 'Asia/Jakarta'),
    staleTime: 30_000,
    enabled: !!userTimezone,
  });
  const streakQ = useQuery({
    queryKey: ['streak', 'current'],
    queryFn: getCurrentStreak,
    staleTime: 10_000, // Reduced to 10 seconds for faster updates
    refetchOnWindowFocus: true,
    refetchInterval: 30_000, // Auto-refetch every 30 seconds
  });

  const mutation = useMutation({
    mutationFn: async (ayatCount: number) => {
      setIsSubmitting(true);
      const timezone = userTimezone || 'Asia/Jakarta';
      const payload = { date: getTodayDate(timezone), ayat_count: ayatCount };
      const online = await isOnline();

      if (online) {
        const res = await upsertCheckin(payload, timezone);
        cacheCheckin((res as any).user_id, (res as any).date, (res as any).ayat_count);
        posthog?.capture(EVENTS.CHECKIN_SUBMITTED, {
          ...payload,
          online: true,
        });

        // Trigger real-time updates
        console.log('[useCheckin] Checkin submitted, triggering real-time updates...');
        qc.invalidateQueries({ queryKey: ['checkin'] });
        qc.invalidateQueries({ queryKey: ['streak'] });
        qc.invalidateQueries({ queryKey: ['families'] });
        qc.invalidateQueries({ queryKey: ['reading'] });
        qc.invalidateQueries({ queryKey: ['khatam'] });
        qc.refetchQueries({ queryKey: ['checkin', 'today'] });
        qc.refetchQueries({ queryKey: ['streak', 'current'] });
        qc.refetchQueries({ queryKey: ['reading', 'today'] });
        qc.refetchQueries({ queryKey: ['khatam', 'progress'] });
        console.log('[useCheckin] Real-time updates triggered');

        return res;
      } else {
        queueCheckin(payload);
        posthog?.capture(EVENTS.CHECKIN_FAILED_OFFLINE, payload);
        qc.setQueryData(['checkin', 'today'], {
          user_id: 'local',
          date: payload.date,
          ayat_count: payload.ayat_count,
          created_at: new Date().toISOString(),
        } as any);
        return {
          user_id: 'local',
          date: payload.date,
          ayat_count: payload.ayat_count,
          created_at: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin', 'today'] });
      qc.invalidateQueries({ queryKey: ['streak', 'current'] });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const triggerSync = async () => {
    if (!(await isOnline())) return { synced: 0, failed: 0 };
    const res = await syncPendingCheckins();
    if (res.synced > 0) {
      qc.invalidateQueries({ queryKey: ['checkin'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
      qc.invalidateQueries({ queryKey: ['reading'] });
      qc.invalidateQueries({ queryKey: ['khatam'] });

      // Force refetch all critical data
      qc.refetchQueries({ queryKey: ['checkin', 'today'] });
      qc.refetchQueries({ queryKey: ['streak', 'current'] });
      qc.refetchQueries({ queryKey: ['reading', 'today'] });
      qc.refetchQueries({ queryKey: ['khatam', 'progress'] });
    }
    return res;
  };

  return {
    todayCheckin: todayQ.data,
    streak: streakQ.data,
    hasCheckedInToday: !!todayQ.data,
    isLoading: todayQ.isLoading || streakQ.isLoading,
    isSubmitting,
    submitCheckin: (n: number) => mutation.mutate(n),
    triggerSync,
  };
}
