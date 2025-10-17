import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { upsertCheckin, getTodayCheckin, getCurrentStreak } from '@/services/checkins';
import { queueCheckin, cacheCheckin } from '@/lib/sqlite';
import { getTodayDate } from '@/utils/time';
import { isOnline, syncPendingCheckins } from '@/utils/sync';
import { posthog, EVENTS } from '@/config/posthog';
import { useState } from 'react';

export function useCheckin() {
  const qc = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayQ = useQuery({ queryKey: ['checkin','today'], queryFn: getTodayCheckin, staleTime: 60_000 });
  const streakQ = useQuery({ queryKey: ['streak','current'], queryFn: getCurrentStreak, staleTime: 60_000 });

  const mutation = useMutation({
    mutationFn: async (ayatCount: number) => {
      setIsSubmitting(true);
      const payload = { date: getTodayDate(), ayat_count: ayatCount };
      const online = await isOnline();

      if (online) {
        const res = await upsertCheckin(payload);
        cacheCheckin((res as any).user_id, (res as any).date, (res as any).ayat_count);
        posthog?.capture(EVENTS.CHECKIN_SUBMITTED, { ...payload, online: true });
        return res;
      } else {
        queueCheckin(payload);
        posthog?.capture(EVENTS.CHECKIN_FAILED_OFFLINE, payload);
        qc.setQueryData(['checkin','today'], { user_id: 'local', date: payload.date, ayat_count: payload.ayat_count, created_at: new Date().toISOString() } as any);
        return { user_id: 'local', date: payload.date, ayat_count: payload.ayat_count, created_at: new Date().toISOString() };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkin','today'] });
      qc.invalidateQueries({ queryKey: ['streak','current'] });
    },
    onSettled: () => { setIsSubmitting(false); },
  });

  const triggerSync = async () => {
    if (!(await isOnline())) return { synced:0, failed:0 };
    const res = await syncPendingCheckins();
    if (res.synced > 0) {
      qc.invalidateQueries({ queryKey: ['checkin'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
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


