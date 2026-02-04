// store/useUsersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FullUser, GetAllUsersResponse, GetUserByIdResponse, User } from '../../dto/User';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';

interface UserStore {
  users: User[];
  loading: boolean;
  // returns true if new items were loaded, false if none / end reached
  fetchUsers: (search?: string, force?: boolean) => Promise<boolean>;
  fetchUser: (userId: string) => Promise<FullUser | null>;
  setUsers: (users: User[]) => void;
  clearStore: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUsersStore = create<UserStore>()(
  persist( // This adds localStorage persistence automatically
    (set, get) => ({
      users: [],
      loading: true,
      fetchUsers: async (search?: string, force = false) => {
          if (get().loading) return false;
          const isInitialFetch = get().users.length === 0;
          if (isInitialFetch || force) {
            set({ loading: true });
          }
          try {
            const skip = get().users.length;
            const data = (await apiClient.get<GetAllUsersResponse>(ENDPOINTS.users.getAll(search, 200, skip))).users;
            const usersMerge = get().users.concat(data)//.sort((a, b) => a.name.localeCompare(b.name));
            const users = Array.from(
              new Map(usersMerge.map(item => [item.id, item])).values()
            );
            set({ users, loading: false });
            return true;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            set({ loading: false });
            return false;
        }
      },
      fetchUser: async (userId) => {
        set({ loading: true });
        try {
            const data = (await apiClient.get<GetUserByIdResponse>(ENDPOINTS.users.getById(userId))).user;
            set({ loading: false });
            return data;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            set({ loading: false });
            return null;
        }
      },
      clearStore: () => {
        set({ users: [], loading: false });
      },
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'users-storage', // localStorage key
    }
  )
);