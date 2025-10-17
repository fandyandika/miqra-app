import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncPendingCheckins } from '@/utils/sync';
import { useSyncStore } from '@/store/syncStore';
import { useQueryClient } from '@tanstack/react-query';

export function useSyncManager() {
  const qc = useQueryClient();
  const { isSyncing } = useSyncStore();

  useEffect(() => {
    // initial kick
    syncPendingCheckins().then((r) => {
      if (r.synced > 0) {
        qc.invalidateQueries({ queryKey: ['checkin'] });
        qc.invalidateQueries({ queryKey: ['streak'] });
      }
    });

    // 1) Foreground sync
    const appSub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') {
        console.log('[SyncManager] App foregrounded - syncing');
        syncPendingCheckins().then((r) => {
          if (r.synced > 0) {
            qc.invalidateQueries({ queryKey: ['checkin'] });
            qc.invalidateQueries({ queryKey: ['streak'] });
          }
        });
      }
    });

    // 2) Network restored
    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[SyncManager] Network connected - syncing');
        syncPendingCheckins().then((r) => {
          if (r.synced > 0) {
            qc.invalidateQueries({ queryKey: ['checkin'] });
            qc.invalidateQueries({ queryKey: ['streak'] });
          }
        });
      }
    });

    // 3) Background interval (2 min)
    const id = setInterval(() => {
      console.log('[SyncManager] Interval sync');
      syncPendingCheckins();
    }, 2 * 60 * 1000);

    return () => {
      appSub.remove();
      netSub();
      clearInterval(id);
    };
  }, [qc]);

  return { isSyncing };
}
