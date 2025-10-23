import { supabase } from '@/lib/supabase';
import { useSyncStore } from '@/store/syncStore';
import {
  countPending,
  popPending,
  deletePending,
  cacheCheckin,
} from '@/lib/sqlite';
import { upsertCheckin, CheckinPayload } from '@/services/checkins';
import { setKV, getKV } from '@/lib/storage';

const LAST_SYNC_KEY = 'last_sync_at';

export async function syncPendingCheckins() {
  const store = useSyncStore.getState();

  // if not authenticated, do nothing quietly
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) {
    store.setIsSyncing(false);
    store.setPendingCount(countPending());
    return { synced: 0, failed: 0, skipped: 'no-session' } as any;
  }

  const pending = countPending();
  store.setPendingCount(pending);
  if (pending === 0) {
    // no work; don't flash the spinner
    store.setIsSyncing(false);
    return { synced: 0, failed: 0 };
  }

  store.setIsSyncing(true);
  const batch = popPending(10);
  let synced = 0,
    failed = 0;
  for (const row of batch) {
    try {
      const payload = JSON.parse(row.payload_json);
      const res = await upsertCheckin(payload);
      cacheCheckin(res.user_id, res.date, res.ayat_count);
      deletePending(row.id);
      synced++;
    } catch (e) {
      console.error('[Sync] ❌', e);
      failed++;
    }
  }

  const now = new Date().toISOString();
  setKV(LAST_SYNC_KEY, now);
  store.setLastSyncAt(now);
  store.setPendingCount(countPending());
  store.setIsSyncing(false);
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

export async function getLastSyncTime(): Promise<string | null> {
  return (await getKV(LAST_SYNC_KEY)) ?? null;
}
