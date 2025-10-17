import { queueCheckin, popPending, deletePending, cacheCheckin, countPending, peekPending } from '@/lib/sqlite';
import { upsertCheckin, CheckinPayload } from '@/services/checkins';
import { supabase } from '@/lib/supabase';
import { useSyncStore } from '@/store/syncStore';
import { setKV, getKV } from '@/lib/storage';

const LAST_SYNC_KEY = 'last_sync_at';

export async function syncPendingCheckins() {
  const store = useSyncStore.getState();
  store.setIsSyncing(true);
  store.setPendingCount(countPending());

  const batch = popPending(10);
  if (batch.length === 0) {
    console.log('[Sync] No pending check-ins');
    store.setIsSyncing(false);
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Processing ${batch.length} pending check-ins`);
  let synced = 0, failed = 0;

  for (const row of batch) {
    try {
      const payload: CheckinPayload = JSON.parse(row.payload_json);
      const res = await upsertCheckin(payload);
      cacheCheckin(res.user_id, res.date, res.ayat_count);
      deletePending(row.id);
      synced++;
      store.setPendingCount(countPending());
      console.log('[Sync] ✅ Synced', payload.date);
    } catch (e) {
      console.error('[Sync] ❌ Failed', e);
      failed++;
      // keep it for retry (already popped, but failed; optional re-queue logic could be added)
    }
  }

  const now = new Date().toISOString();
  setKV(LAST_SYNC_KEY, now);
  store.setLastSyncAt(now);
  store.setIsSyncing(false);
  store.setPendingCount(countPending());

  console.log(`[Sync] Complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

export async function isOnline(): Promise<boolean> {
  try {
    const { error } = await supabase.from('checkins').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export function getLastSyncTime(): string | null {
  return getKV(LAST_SYNC_KEY) ?? null;
}