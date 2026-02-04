// store/useUsersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import type { GetShortVideosResponse, ShortVideo } from '../../dto/ShortVideo';

interface ShortVideosStore {
  shortVideos: ShortVideo[];
  loading: boolean;
  // returns true if new items were loaded, false if none / end reached
  fetchShortVideos: (force?: boolean) => Promise<boolean>;
  fetchShortVideo: (id: string) => Promise<ShortVideo | null>;
  clearStore: () => void;
  setLoading: (loading: boolean) => void;
  deleteShortVideo: (id: string) => Promise<void>;
}

export const useShortVideosStore = create<ShortVideosStore>()(
  persist( // This adds localStorage persistence automatically
    (set, get) => ({
      shortVideos: [],
      isInitialFetch: false,
      loading: false,
      fetchShortVideos: async (force = false) => {
        console.log('fetchShortVideos called with get().loading=', get().loading);
          if (get().loading) return false;
          const isInitialFetch = get().shortVideos.length === 0;
          if (isInitialFetch || force) {
            set({ loading: true });
          }
          try {
            const skip = get().shortVideos.length;
            console.log('Fetching short videos with skip:', skip);
            const data = (await apiClient.get<GetShortVideosResponse>(ENDPOINTS.shorts.getAll(200, skip))).data.videos;
            const coursesMerge = get().shortVideos.concat(data);
            const shortVideos = Array.from(
              new Map(coursesMerge.map(item => [item.id, item])).values()
            );
            set({ shortVideos, loading: false });
            return true;
          } catch (error) {
              console.error('Failed to fetch short videos:', error);
              set({ loading: false });
              return false;
          }
      },
      fetchShortVideo: async (id: string) => {
        set({ loading: true });
        try {
          const found = get().shortVideos.find(v => v.id === id) ?? null;
          set({ loading: false });
          return found;
        } catch (error) {
          console.error('Failed to fetch short video from cache:', error);
          set({ loading: false });
          return null;
        }
      },
      deleteShortVideo: async (id: string) => {
        set({ loading: true });
        try {
            await apiClient.delete(ENDPOINTS.shorts.delete(id));
            const updatedVideos = get().shortVideos.filter(video => video.id !== id);
            set({ shortVideos: updatedVideos, loading: false });
        } catch (error) {
            console.error('Failed to delete short video:', error);
            set({ loading: false });
        }
      },
      clearStore: () => {
        set({ shortVideos: [], loading: false });
      },
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'shortVideos-storage', // localStorage key
    }
  )
);