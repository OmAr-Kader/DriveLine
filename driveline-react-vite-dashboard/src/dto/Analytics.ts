export interface EndpointStatsRow {
  path: string;
  method: string;
  request_count: number;
  avg_response_time: number;
  p50_response_time?: number;
  p95_response_time?: number;
  p99_response_time?: number;
  min_response_time?: number;
  max_response_time?: number;
  error_5xx_count?: number;
  error_4xx_count?: number;
  success_2xx_count?: number;
  cache_hit_count?: number;
  total_request_size?: number;
  total_response_size?: number;
}

export interface HourlyTrafficRow {
  hour: string;
  request_count: number;
  avg_response_time: number;
  error_5xx_count?: number;
  error_4xx_count?: number;
  success_2xx_count?: number;
}

export interface UserActivitiesRow {
  activity_type: string;
  resource_type: string;
  activity_count: number;
  unique_users?: number;
  last_event_time?: string;
  metadata_list?: string[];
}

export interface SingleUserActivityRow {
  activity_type: string;
  resource_type: string;
  activity_count: number;
  first_event?: string;
  last_event?: string;
  date?: string;
  metadata?: string;
  metadata_list?: string[];
}

export interface TopUsersRow {
  user_id: string;
  activity_count: number;
  unique_activity_types?: number;
  first_activity?: string;
  last_activity?: string;
}

export interface ErrorRow {
  event_time: string;
  error_type: string;
  error_message: string;
  endpoint: string;
  severity: string;
  user_id?: string;
  request_id?: string;
}

export interface ErrorStatsRow {
  error_type: string;
  severity: string;
  error_count: number;
  affected_users?: number;
  affected_endpoints?: string[];
}

export interface PerformanceRow {
  path: string;
  request_count: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  avg_response_time?: number;
}

export interface CacheStatsRow {
  path: string;
  total_requests: number;
  cache_hits: number;
  cache_hit_rate_percent?: number;
  avg_response_time?: number;
}

export interface GeoStatsRow {
  country_code: string;
  request_count: number;
  unique_users?: number;
  avg_response_time?: number;
}

export interface DailySummaryRow {
  date: string;
  total_requests: number;
  unique_users: number;
  avg_response_time: number;
  p95_response_time?: number;
  error_5xx_count?: number;
  error_4xx_count?: number;
  success_2xx_count?: number;
  success_rate_percent?: number;
  total_request_size?: number;
  total_response_size?: number;
}

export interface AnalyticsSummaryTraffic {
  peak_hour: { hour: string; request_count: number } | null;
  avg_requests_per_hour: number;
}

export interface AnalyticsSummaryEndpoints {
  unique_endpoints: number;
  top_by_traffic: { path: string; request_count: number }[];
  slowest_by_p95: { path: string; p95: number; request_count: number }[];
}

export interface AnalyticsSummaryCache {
  overall_cache_hit_rate_percent: number;
  top_by_cache_hit: { path: string; total_requests: number; cache_hits: number; cache_hit_rate_percent: number }[];
}

export interface AnalyticsSummaryErrors {
  summary: { total_errors: number; affected_users: number };
  by_severity: { severity: string; count: number }[];
}

export interface AnalyticsSummaryUserActivities {
  summary: { total_activities: number; unique_users: number; unique_activity_types: number };
  top_users: { user_id: string; activity_count: number }[];
}

export interface AnalyticsSummaryGeo {
  top_countries: { country_code: string; request_count: number }[];
}

export interface AnalyticsSummaryDto {
  dailySummary: { total_requests: number; unique_users: number; days: number; avg_response_time: number; p95_response_time?: number };
  traffic: AnalyticsSummaryTraffic;
  endpoints: AnalyticsSummaryEndpoints;
  cache: AnalyticsSummaryCache;
  errors: AnalyticsSummaryErrors;
  userActivities: AnalyticsSummaryUserActivities;
  geo: AnalyticsSummaryGeo;
} 
