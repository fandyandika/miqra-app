import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { syncPendingCheckins } from '@/utils/sync';
import { useSyncStore } from '@/store/syncStore';
import { useQueryClient } from '@tanstack/react-query';

// Conditional import for NetInfo
let NetInfo: any = null;
try {
  if (Platform.OS !== 'web') {
    NetInfo = require('@react-native-community/netinfo').default;
  }
} catch (error) {
  console.log('[SyncManager] NetInfo not available');
}

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
    }).catch((error) => {
      console.error('[SyncManager] Initial sync error:', error);
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
        }).catch((error) => {
          console.error('[SyncManager] Foreground sync error:', error);
        });
      }
    });

    // 2) Network restored (only on native)
    let netSub: (() => void) | null = null;
    if (NetInfo) {
      netSub = NetInfo.addEventListener((state: any) => {
        if (state.isConnected && state.isInternetReachable) {
          console.log('[SyncManager] Network connected - syncing');
          syncPendingCheckins().then((r) => {
            if (r.synced > 0) {
              qc.invalidateQueries({ queryKey: ['checkin'] });
              qc.invalidateQueries({ queryKey: ['streak'] });
            }
          }).catch((error) => {
            console.error('[SyncManager] Network sync error:', error);
          });
        }
      });
    }

    // 3) Background interval (2 min)
    const id = setInterval(() => {
      console.log('[SyncManager] Interval sync');
      syncPendingCheckins().catch((error) => {
        console.error('[SyncManager] Interval sync error:', error);
      });
    }, 2 * 60 * 1000);

    return () => {
      appSub.remove();
      if (netSub) netSub();
      clearInterval(id);
    };
  }, [qc]);

  return { isSyncing };
}
