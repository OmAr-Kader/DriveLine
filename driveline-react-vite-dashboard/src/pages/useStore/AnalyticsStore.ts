import { create } from 'zustand';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../api/config';
import type {
  EndpointStatsRow,
  HourlyTrafficRow,
  UserActivitiesRow,
  SingleUserActivityRow,
  TopUsersRow,
  ErrorRow,
  ErrorStatsRow,
  PerformanceRow,
  CacheStatsRow,
  GeoStatsRow,
  DailySummaryRow,
} from '../../dto/Analytics';

interface AnalyticsState {
  // Data caches
  endpointStats: EndpointStatsRow[];
  hourlyTraffic: HourlyTrafficRow[];
  userActivities: UserActivitiesRow[];
  singleUserActivities: SingleUserActivityRow[]; // prepared
  singleUserActivitiesWithMetadata: SingleUserActivityRow[]; // prepared
  topUsers: TopUsersRow[];
  errors: ErrorRow[];
  errorStats: ErrorStatsRow[];
  performance: PerformanceRow[];
  cacheStats: CacheStatsRow[];
  geoStats: GeoStatsRow[];
  dailySummary: DailySummaryRow[];

  // loading + error states
  loading: boolean;
  error: string | null;

  // actions
  fetchEndpointStats: (startDate: string, endDate?: string, endpoint?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchHourlyTraffic: (startDate: string, endDate?: string, signal?: AbortSignal) => Promise<boolean>;
  fetchUserActivities: (startDate: string, endDate?: string, limit?: number, includeMetadata?: boolean, signal?: AbortSignal) => Promise<boolean>;
  fetchSingleUserActivities: (userId: string, startDate: string, endDate?: string, limit?: number, includeMetadata?: boolean, signal?: AbortSignal) => Promise<boolean>;
  fetchSingleUserActivitiesWithMetadata: (userId: string, startDate: string, endDate?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchTopUsers: (startDate: string, endDate?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchErrors: (startDate: string, endDate?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchErrorStats: (startDate: string, endDate?: string, signal?: AbortSignal) => Promise<boolean>;
  fetchPerformance: (startDate: string, endDate?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchCacheStats: (startDate: string, endDate?: string, signal?: AbortSignal) => Promise<boolean>;
  fetchGeoStats: (startDate: string, endDate?: string, limit?: number, signal?: AbortSignal) => Promise<boolean>;
  fetchDailySummary: (startDate: string, endDate?: string, signal?: AbortSignal) => Promise<boolean>;

  clearStore: () => void;
}

const isCanceledError = (err: unknown) => {
  if (!err) return false;
  const e = err as { name?: string; code?: string };
  return e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED' || e?.name === 'AbortError';
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  endpointStats: [],
  hourlyTraffic: [],
  userActivities: [],
  singleUserActivities: [],
  singleUserActivitiesWithMetadata: [],
  topUsers: [],
  errors: [],
  errorStats: [],
  performance: [],
  cacheStats: [],
  geoStats: [],
  dailySummary: [],
  loading: false,
  error: null,

  fetchEndpointStats: async (startDate, endDate, endpoint, limit = 100, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.endpointStats(startDate, endDate, endpoint, limit);
      const data = await apiClient.get<EndpointStatsRow[]>(url, { signal });
        set({ endpointStats: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchEndpointStats canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchEndpointStats failed', err);
      set({ error: msg ?? 'Failed to fetch endpoint stats', loading: false });
      return false;
    }
  },

  fetchHourlyTraffic: async (startDate, endDate, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.hourlyTraffic(startDate, endDate);
      const data = await apiClient.get<HourlyTrafficRow[]>(url, { signal });
      set({ hourlyTraffic: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchHourlyTraffic canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchHourlyTraffic failed', err);
      set({ error: msg ?? 'Failed to fetch hourly traffic', loading: false });
      return false;
    }
  },

  fetchUserActivities: async (startDate, endDate, limit = 100, includeMetadata = false, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.userActivities(startDate, endDate, limit, includeMetadata);
      const data = await apiClient.get<UserActivitiesRow[]>(url, { signal });
      set({ userActivities: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchUserActivities canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchUserActivities failed', err);
      set({ error: msg ?? 'Failed to fetch user activities', loading: false });
      return false;
    }
  },

  fetchSingleUserActivities: async (userId, startDate, endDate, limit = 50, includeMetadata = false, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.singleUserActivities(userId, startDate, endDate, limit, includeMetadata);
      const data = await apiClient.get<SingleUserActivityRow[]>(url, { signal });
      set({ singleUserActivities: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchSingleUserActivities canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchSingleUserActivities failed', err);
      set({ error: msg ?? 'Failed to fetch single user activities', loading: false });
      return false;
    }
  },

  fetchSingleUserActivitiesWithMetadata: async (userId, startDate, endDate, limit = 100, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.singleUserActivitiesWithMetadata(userId, startDate, endDate, limit);
      const data = await apiClient.get<SingleUserActivityRow[]>(url, { signal });
      set({ singleUserActivitiesWithMetadata: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchSingleUserActivitiesWithMetadata canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchSingleUserActivitiesWithMetadata failed', err);
      set({ error: msg ?? 'Failed to fetch single user activities with metadata', loading: false });
      return false;
    }
  },

  fetchTopUsers: async (startDate, endDate, limit = 50, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.topUsers(startDate, endDate, limit);
      const data = await apiClient.get<TopUsersRow[]>(url, { signal });
      set({ topUsers: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchTopUsers canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchTopUsers failed', err);
      set({ error: msg ?? 'Failed to fetch top users', loading: false });
      return false;
    }
  },

  fetchErrors: async (startDate, endDate, limit = 100, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.errors(startDate, endDate, limit);
      const data = await apiClient.get<ErrorRow[]>(url, { signal });
      set({ errors: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchErrors canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchErrors failed', err);
      set({ error: msg ?? 'Failed to fetch errors', loading: false });
      return false;
    }
  },

  fetchErrorStats: async (startDate, endDate, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.errorStats(startDate, endDate);
      const data = await apiClient.get<ErrorStatsRow[]>(url, { signal });
      set({ errorStats: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchErrorStats canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchErrorStats failed', err);
      set({ error: msg ?? 'Failed to fetch error stats', loading: false });
      return false;
    }
  },

  fetchPerformance: async (startDate, endDate, limit = 50, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.performance(startDate, endDate, limit);
      const data = await apiClient.get<PerformanceRow[]>(url, { signal });
      set({ performance: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchPerformance canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchPerformance failed', err);
      set({ error: msg ?? 'Failed to fetch performance', loading: false });
      return false;
    }
  },

  fetchCacheStats: async (startDate, endDate, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.cacheStats(startDate, endDate);
      const data = await apiClient.get<CacheStatsRow[]>(url, { signal });
      set({ cacheStats: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchCacheStats canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchCacheStats failed', err);
      set({ error: msg ?? 'Failed to fetch cache stats', loading: false });
      return false;
    }
  },

  fetchGeoStats: async (startDate, endDate, limit = 50, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.geoStats(startDate, endDate, limit);
      const data = await apiClient.get<GeoStatsRow[]>(url, { signal });
      set({ geoStats: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchGeoStats canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchGeoStats failed', err);
      set({ error: msg ?? 'Failed to fetch geo stats', loading: false });
      return false;
    }
  },

  fetchDailySummary: async (startDate, endDate, signal) => {
    set({ loading: true, error: null });
    try {
      const url = ENDPOINTS.analytics.dailySummary(startDate, endDate);
      const data = await apiClient.get<DailySummaryRow[]>(url, { signal });
      set({ dailySummary: data, loading: false, error: null });
      return true;
    } catch (err: unknown) {
      if (isCanceledError(err)) {
        console.warn('fetchDailySummary canceled');
        set({ loading: false });
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      console.error('fetchDailySummary failed', err);
      set({ error: msg ?? 'Failed to fetch daily summary', loading: false });
      return false;
    }
  },

  clearStore: () => set({
    endpointStats: [],
    hourlyTraffic: [],
    userActivities: [],
    singleUserActivities: [],
    singleUserActivitiesWithMetadata: [],
    topUsers: [],
    errors: [],
    errorStats: [],
    performance: [],
    cacheStats: [],
    geoStats: [],
    dailySummary: [],
    loading: false,
    error: null,
  }),
}));
