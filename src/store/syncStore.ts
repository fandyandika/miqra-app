import { create } from 'zustand';

interface SyncStore {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  setIsSyncing: (v: boolean) => void;
  setLastSyncAt: (iso: string) => void;
  setPendingCount: (n: number) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  setIsSyncing: (v) => set({ isSyncing: v }),
  setLastSyncAt: (iso) => set({ lastSyncAt: iso }),
  setPendingCount: (n) => set({ pendingCount: n }),
}));
