// store/useUserStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/config';
import type { GetProfileByIdResponse, UserProfile } from '../../../dto/UserProfile';

interface UserStore {
    profile: UserProfile;
    loading: boolean;
    error: string | null;
    fetchProfile: (userId: string) => void;
    clearStore: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useUserStore = create<UserStore>()(
  persist( // This adds localStorage persistence automatically
    (set) => ({
      profile: { user: null, services: [], courses: [], shorts: [] },
      loading: true,
      error: null,
      fetchProfile: async (userId) => {
        try {
          const data = (await apiClient.get<GetProfileByIdResponse>(ENDPOINTS.users.profile(userId))).profile;
            set({ profile: data, loading: false, error: null });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
          set({ profile: { user: null, services: [], courses: [], shorts: [] }, loading: false, error: 'Failed to load profile' });
            return null;
        }
      },
      clearStore: () => {
        set({ profile: { user: null, services: [], courses: [], shorts: [] }, loading: false, error: null });
      },
      setError: (error: string | null) => set({ error }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'profile-storage', // localStorage key
    }
  )
);
