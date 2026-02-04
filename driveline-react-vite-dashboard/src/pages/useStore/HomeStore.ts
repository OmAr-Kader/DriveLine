// store/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import type { HomeStats } from '../../dto/HomeStats';
import type { AnalyticsSummaryDto } from '../../dto/Analytics';

interface HomeStore {
  stats: HomeStats;
    // future: databasesCount, paymentsCount, etc.
  loading: boolean;
  summary: AnalyticsSummaryDto | null;
  fetchStats: (force?: boolean) => Promise<void>;
  fetchSummary: (startDate?: string, endDate?: string, signal?: AbortSignal) => Promise<void>;
  setStats: (stats: HomeStats) => void;
  setLoading: (loading: boolean) => void;
}

export const useHomeStore = create<HomeStore>()(
  persist( // This adds localStorage persistence automatically
    (set, get) => ({
      stats: {users: 0, fixServices: 0, courses: 0, shortVideos: 0},
      loading: false,
      summary: null,
      fetchStats: async (force = false) => {
        if (force && get().stats.users == 0) {
            set({ loading: true });
        }
        try {
            const stats = (await apiClient.get<HomeStats>(ENDPOINTS.stats.counts));
            set({ stats, loading: false });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            set({ loading: false });
        }
      },
      fetchSummary: async (startDate?: string, endDate?: string, signal?: AbortSignal) => {
        set({ loading: true });
        try {
            const now = new Date();
            const defEnd = endDate ?? now.toISOString();
            const defStart = startDate ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0).toISOString();
            const url = ENDPOINTS.analytics.summary(defStart, defEnd);
            const data = await apiClient.get<AnalyticsSummaryDto>(url, { signal });
            set({ summary: data, loading: false });
        } catch (err: unknown) {
            if (err && ((err as { name: string | undefined }).name === 'CanceledError' || (err as { code: string | undefined }).code === 'ERR_CANCELED' || (err as { name: string | undefined }).name === 'AbortError')) {
                console.warn('fetchSummary canceled');
                set({ loading: false });
                return;
            }
            console.error('Failed to fetch analytics summary:', err);
            set({ loading: false });
        }
      },
      setStats: (stats) => set({ stats }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'home-storage', // localStorage key
    }
  )
);