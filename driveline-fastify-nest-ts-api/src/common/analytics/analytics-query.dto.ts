import { IsDateString, IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyticsQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  includeMetadata?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  limit?: number = 100;
}

export class DeleteAnalyticsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  table?: 'http_requests' | 'user_activities' | 'error_logs' | 'all';

  @IsOptional()
  @IsBoolean()
  confirm?: boolean; // must be 'true' to proceed
}

export interface ClickHouseConfig {
  url: string;
  database: string;
  username?: string;
  password?: string;
  //requestTimeout: number;
  //maxOpenConnections: number;
  compressionEnabled: boolean;
  batchSize: number;
  flushIntervalMs: number;
}

export interface HttpRequestEvent {
  request_id: string;
  event_time: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  user_id?: string;
  user_agent?: string;
  ip_address?: string;
  country_code?: string;
  request_size?: number;
  response_size?: number;
  error_message?: string;
  endpoint_version?: string;
  cache_hit?: boolean;
}

export interface UserActivityEvent {
  user_id: string;
  event_time: string;
  activity_type: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: string;
}

export interface ErrorLogEvent {
  event_time: string;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  request_id?: string;
  user_id?: string;
  endpoint?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// --- Analytics summary DTOs ---
export interface DailySummary {
  total_requests: number;
  unique_users: number;
  days: number;
  avg_response_time?: number;
  p95_response_time?: number;
  error_5xx_count?: number;
  error_4xx_count?: number;
  success_2xx_count?: number;
}

export interface TrafficSummary {
  peak_hour?: { hour: string; request_count: number } | null;
  avg_requests_per_hour: number;
}

export interface EndpointItem {
  path: string;
  request_count: number;
}

export interface SlowEndpointItem {
  path: string;
  p95: number;
  request_count: number;
}

export interface EndpointsSummary {
  unique_endpoints: number;
  top_by_traffic: EndpointItem[];
  slowest_by_p95: SlowEndpointItem[];
}

export interface CacheTopItem {
  path: string;
  total_requests: number;
  cache_hits: number;
  cache_hit_rate_percent: number;
}

export interface CacheSummary {
  overall_cache_hit_rate_percent?: number | null;
  top_by_cache_hit: CacheTopItem[];
}

export interface ErrorSeverityItem {
  severity: string;
  count: number;
}

export interface ErrorsSummary {
  summary: { total_errors?: number; affected_users?: number };
  by_severity: ErrorSeverityItem[];
}

export interface TopUserItem {
  user_id: string;
  activity_count: number;
}

export interface UserActivitiesSummary {
  summary: { total_activities?: number; unique_users?: number; unique_activity_types?: number };
  top_users: TopUserItem[];
}

export interface GeoCountryItem {
  country_code: string;
  request_count: number;
}

export interface GeoSummary {
  top_countries: GeoCountryItem[];
}

export interface AnalyticsSummaryDto {
  dailySummary: DailySummary;
  traffic: TrafficSummary;
  endpoints: EndpointsSummary;
  cache: CacheSummary;
  errors: ErrorsSummary;
  userActivities: UserActivitiesSummary;
  geo: GeoSummary;
}
