import { create } from 'zustand';
import * as repo from '../db/limitsRepo';
import type { AppLimit } from '../db/limitsRepo';

interface LimitsState {
  limits: AppLimit[];
  loading: boolean;
  load: () => Promise<void>;
  save: (input: {
    packageName: string;
    appLabel: string;
    allowanceSeconds: number;
    lockSeconds: number;
  }) => Promise<void>;
  toggle: (packageName: string, active: boolean) => Promise<void>;
  remove: (packageName: string) => Promise<void>;
  byPackage: (packageName: string) => AppLimit | undefined;
}

export const useLimitsStore = create<LimitsState>((set, get) => ({
  limits: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      set({ limits: await repo.getAllLimits() });
    } finally {
      set({ loading: false });
    }
  },

  save: async input => {
    await repo.upsertLimit(input);
    await get().load();
  },

  toggle: async (packageName, active) => {
    await repo.setActive(packageName, active);
    await get().load();
  },

  remove: async packageName => {
    await repo.deleteLimit(packageName);
    await get().load();
  },

  byPackage: packageName =>
    get().limits.find(l => l.packageName === packageName),
}));