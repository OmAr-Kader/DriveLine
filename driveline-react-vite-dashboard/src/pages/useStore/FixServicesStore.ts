// store/useUsersStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import type { FixService, GetServicesResponse } from '../../dto/FixService';

interface FixServicesStore {
  fixServices: FixService[];
  loading: boolean;
  // returns true if new items were loaded, false if none / end reached
  fetchFixServices: (force?: boolean) => Promise<boolean>;
  fetchService: (id: string) => Promise<FixService | null>;
  deleteFixService: (id: string) => Promise<void>;
  clearStore: () => void;
  setLoading: (loading: boolean) => void;
}

export const useFixServicesStore = create<FixServicesStore>()(
  persist( // This adds localStorage persistence automatically
    (set, get) => ({
      fixServices: [],
      loading: true,
      fetchFixServices: async (force = false) => {
          if (get().loading) return false;
          const isInitialFetch = get().fixServices.length === 0;
          if (isInitialFetch || force) {
            set({ loading: true });
          }
          try {
            const skip = get().fixServices.length;
            console.log('Fetching fix services with skip:', skip);
            const data = (await apiClient.get<GetServicesResponse>(ENDPOINTS.fixServices.getAll(200, skip))).data;
            const servicesMerge = get().fixServices.concat(data);
            const services = Array.from(
              new Map(servicesMerge.map(item => [item.id, item])).values()
            );
            set({ fixServices: services, loading: false });
            return true;
        } catch (error) {
            console.error('Failed to fetch fix services:', error);
            set({ loading: false });
            return false;
        }
      },
      fetchService: async (id: string) => {
        // There is no dedicated getById endpoint for services in the API config,
        // so attempt to locate the item from the cached list.
        set({ loading: true });
        try {
          const found = get().fixServices.find(s => s.id === id) ?? null;
          set({ loading: false });
          return found;
        } catch (error) {
          console.error('Failed to fetch fix service from cache:', error);
          set({ loading: false });
          return null;
        }
      },
      deleteFixService: async (id: string) => {
        set({ loading: true });
        try {
            await apiClient.delete(ENDPOINTS.fixServices.delete(id));
            const updatedServices = get().fixServices.filter(service => service.id !== id);
            set({ fixServices: updatedServices, loading: false });
        } catch (error) {
            console.error('Failed to delete fix service:', error);
            set({ loading: false });
        }
      },
      clearStore: () => {
        set({ fixServices: [], loading: false });
      },
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'fix-services-storage', // localStorage key
    }
  )
);