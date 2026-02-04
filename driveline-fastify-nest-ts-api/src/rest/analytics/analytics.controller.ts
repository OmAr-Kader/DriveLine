import { BadRequestException, Body, Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import {
  AnalyticsQueryDto,
  AnalyticsSummaryDto,
  CacheTopItem,
  DailySummary,
  DeleteAnalyticsDto,
  EndpointItem,
  ErrorSeverityItem,
  GeoCountryItem,
  SlowEndpointItem,
  TopUserItem,
} from '../../common/analytics/analytics-query.dto';
import { JwtAuthGuard } from 'src/common/utils/verifyJWTtoken';
import { EditAccessGuard } from 'src/common/utils/editGuard';
import { ApiKeyGuard } from 'src/common/utils/verification';
import { SkipAnalytics } from './analytics.interceptor';
import { SkipFlowControl } from 'src/rest/flow-control/decorators/priority.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@SkipAnalytics()
@SkipFlowControl()
@UseGuards(ApiKeyGuard, JwtAuthGuard, EditAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummaryStats(@Query() query: AnalyticsQueryDto): Promise<AnalyticsSummaryDto> {
    const { startDate, endDate, endpoint } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const params: Record<string, any> = { start_time: startDT, end_time: endDT };

    // Optional endpoint filter (sanitized)
    let endpointClause = '';
    if (endpoint) {
      endpointClause = ' AND path = {endpoint:String}';
      params.endpoint = this.sanitizePath(endpoint);
    }

    // Core summary: totals and high-level response metrics
    const requestSql = `
      SELECT
        count() AS total_requests,
        uniq(user_id) AS unique_users,
        uniq(toDate(event_time)) AS days,
        avg(response_time_ms) AS avg_response_time,
        quantile(0.95)(response_time_ms) AS p95_response_time,
        countIf(status_code >= 500) AS error_5xx_count,
        countIf(status_code >= 400 AND status_code < 500) AS error_4xx_count,
        countIf(status_code >= 200 AND status_code < 300) AS success_2xx_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
    `;

    // Traffic - peak hour and average per hour
    const peakHourSql = `
      SELECT toStartOfHour(event_time) AS hour, count() AS request_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
      GROUP BY hour
      ORDER BY request_count DESC
      LIMIT 1
    `;

    const avgPerHourSql = `
      SELECT round(count() / uniq(toStartOfHour(event_time)), 2) AS avg_requests_per_hour
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
    `;

    // Endpoints: top by traffic and slowest by p95
    const endpointTopSql = `
      SELECT path, count() AS request_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
      GROUP BY path
      ORDER BY request_count DESC
      LIMIT 5
    `;

    const slowestEndpointSql = `
      SELECT path, quantile(0.95)(response_time_ms) AS p95, count() AS request_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
      GROUP BY path
      ORDER BY p95 DESC
      LIMIT 5
    `;

    const uniqueEndpointsSql = `
      SELECT uniq(path) AS unique_endpoints
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
    `;

    // Cache overview
    const cacheOverallSql = `
      SELECT round(countIf(cache_hit = 1) / count() * 100, 2) AS overall_cache_hit_rate_percent
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${endpointClause}
    `;

    const cacheTopSql = `
      SELECT path, count() AS total_requests, countIf(cache_hit = 1) AS cache_hits, round(countIf(cache_hit = 1) / count() * 100, 2) AS cache_hit_rate_percent
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY path
      HAVING count() > 10
      ORDER BY cache_hit_rate_percent DESC
      LIMIT 5
    `;

    // Errors
    const errorSummarySql = `
      SELECT count() AS total_errors, uniq(user_id) AS affected_users
      FROM analytics.error_logs
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
    `;

    const errorBySeveritySql = `
      SELECT severity, count() AS count
      FROM analytics.error_logs
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY severity
      ORDER BY count DESC
    `;

    // User activity
    const userActivitySummarySql = `
      SELECT count() AS total_activities, uniq(user_id) AS unique_users, uniq(activity_type) AS unique_activity_types
      FROM analytics.user_activities
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
    `;

    const topUsersSql = `
      SELECT user_id, count() AS activity_count
      FROM analytics.user_activities
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY user_id
      ORDER BY activity_count DESC
      LIMIT 5
    `;

    // Geo
    const geoTopSql = `
      SELECT country_code, count() AS request_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
        AND country_code != ''
      GROUP BY country_code
      ORDER BY request_count DESC
      LIMIT 5
    `;

    // Run queries in parallel (typed)
    const [
      reqRes,
      peakRes,
      avgHourRes,
      endpointTopRes,
      slowestRes,
      uniqueEndpointsRes,
      cacheOverallRes,
      cacheTopRes,
      errorSumRes,
      errorSeverityRes,
      userActRes,
      topUsersRes,
      geoTopRes,
    ] = await Promise.all([
      this.analyticsService.query<DailySummary>(requestSql, params),
      this.analyticsService.query<{ hour: string; request_count: number }>(peakHourSql, params),
      this.analyticsService.query<{ avg_requests_per_hour: number }>(avgPerHourSql, params),
      this.analyticsService.query<EndpointItem>(endpointTopSql, params),
      this.analyticsService.query<SlowEndpointItem>(slowestEndpointSql, params),
      this.analyticsService.query<{ unique_endpoints: number }>(uniqueEndpointsSql, params),
      this.analyticsService.query<{ overall_cache_hit_rate_percent: number }>(cacheOverallSql, params),
      this.analyticsService.query<CacheTopItem>(cacheTopSql, params),
      this.analyticsService.query<{ total_errors: number; affected_users: number }>(errorSummarySql, params),
      this.analyticsService.query<ErrorSeverityItem>(errorBySeveritySql, params),
      this.analyticsService.query<{ total_activities: number; unique_users: number; unique_activity_types: number }>(userActivitySummarySql, params),
      this.analyticsService.query<TopUserItem>(topUsersSql, params),
      this.analyticsService.query<GeoCountryItem>(geoTopSql, params),
    ]);

    const summary: AnalyticsSummaryDto = {
      dailySummary: reqRes[0] || ({ total_requests: 0, unique_users: 0, days: 0 } as DailySummary),
      traffic: {
        peak_hour: peakRes[0] || null,
        avg_requests_per_hour: avgHourRes[0]?.avg_requests_per_hour ?? 0,
      },
      endpoints: {
        unique_endpoints: uniqueEndpointsRes[0]?.unique_endpoints ?? 0,
        top_by_traffic: endpointTopRes ?? [],
        slowest_by_p95: slowestRes ?? [],
      },
      cache: {
        overall_cache_hit_rate_percent: cacheOverallRes[0]?.overall_cache_hit_rate_percent ?? null,
        top_by_cache_hit: cacheTopRes ?? [],
      },
      errors: {
        summary: errorSumRes[0] || { total_errors: 0, affected_users: 0 },
        by_severity: errorSeverityRes ?? [],
      },
      userActivities: {
        summary: userActRes[0] || { total_activities: 0, unique_users: 0, unique_activity_types: 0 },
        top_users: topUsersRes ?? [],
      },
      geo: {
        top_countries: geoTopRes ?? [],
      },
    };

    return summary;
  }
  /**
   * Get endpoint performance statistics
   * GET /analytics/endpoint-stats?startDate=2026-01-01&endDate=2026-01-12&endpoint=/api/users&limit=50
   */
  @Get('endpoint-stats')
  async getEndpointStats(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, endpoint, limit = 100 } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    // SECURITY FIX: Use parameterized query
    const params: Record<string, any> = {
      start_time: startDT,
      end_time: endDT,
      limit_val: Math.min(limit, 1000),
    };

    let whereClause = '';
    if (endpoint) {
      const sanitizedEndpoint = this.sanitizePath(endpoint);
      whereClause = ' AND path = {endpoint:String}';
      params.endpoint = sanitizedEndpoint;
    }

    const sql = `
      SELECT 
        path,
        method,
        count() AS request_count,
        avg(response_time_ms) AS avg_response_time,
        quantile(0.50)(response_time_ms) AS p50_response_time,
        quantile(0.95)(response_time_ms) AS p95_response_time,
        quantile(0.99)(response_time_ms) AS p99_response_time,
        min(response_time_ms) AS min_response_time,
        max(response_time_ms) AS max_response_time,
        countIf(status_code >= 500) AS error_5xx_count,
        countIf(status_code >= 400 AND status_code < 500) AS error_4xx_count,
        countIf(status_code >= 200 AND status_code < 300) AS success_2xx_count,
        countIf(cache_hit = 1) AS cache_hit_count,
        sum(request_size) AS total_request_size,
        sum(response_size) AS total_response_size
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})${whereClause}
      GROUP BY path, method
      ORDER BY request_count DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, params);
  }

  /**
   * Get hourly traffic trends
   */
  @Get('hourly-traffic')
  async getHourlyTraffic(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        toStartOfHour(event_time) AS hour,
        count() AS request_count,
        avg(response_time_ms) AS avg_response_time,
        countIf(status_code >= 500) AS error_5xx_count,
        countIf(status_code >= 400 AND status_code < 500) AS error_4xx_count,
        countIf(status_code >= 200 AND status_code < 300) AS success_2xx_count
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 168
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
    });
  }

  /**
   * Get user activity statistics
   */
  @Get('user-activities')
  async getUsersActivities(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 100, includeMetadata } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT) {
      throw new BadRequestException('Invalid startDate');
    }

    const params: Record<string, any> = {
      start_time: startDT,
      limit_val: Math.min(limit, 1000),
    };

    let whereClause = 'WHERE event_time >= parseDateTimeBestEffort({start_time:String})';

    if (endDT) {
      whereClause += ' AND event_time <= parseDateTimeBestEffort({end_time:String})';
      params.end_time = endDT;
    }

    // OPTIMIZATION: Only aggregate metadata if explicitly requested
    let metadataSelect = '';
    if (includeMetadata === 'true') {
      metadataSelect = `, arrayFilter(x -> x != '', arrayMap(t -> concat('{"event_time":"', toString(tupleElement(t,1)), '","metadata":', tupleElement(t,2), '}'), arraySort(groupArray(tuple(event_time, metadata))))) AS metadata_list`;
    }

    const sql = `
      SELECT 
        activity_type,
        resource_type,
        count() AS activity_count,
        uniq(user_id) AS unique_users,
        max(event_time) AS last_event_time
        ${metadataSelect}
      FROM analytics.user_activities
      ${whereClause}
      GROUP BY activity_type, resource_type
      ORDER BY activity_count DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, params);
  }

  /**
   * Get single user activities
   */
  @Get('single-user-activities')
  async getUserActivities(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { userId, startDate, endDate, limit = 100, includeMetadata } = query;

    if (!userId) {
      throw new BadRequestException('userId parameter is required');
    }

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT) {
      throw new BadRequestException('Invalid startDate');
    }

    const params: Record<string, any> = {
      user_id: userId,
      start_time: startDT,
      limit_val: Math.min(limit, 1000),
    };

    let whereClause = `WHERE event_time >= parseDateTimeBestEffort({start_time:String}) AND user_id = {user_id:String}`;

    if (endDT) {
      whereClause += ' AND event_time <= parseDateTimeBestEffort({end_time:String})';
      params.end_time = endDT;
    }

    let metadataSelect = '';
    if (includeMetadata === 'true') {
      metadataSelect = `, arrayFilter(x -> x != '', arrayMap(t -> concat('{"event_time":"', toString(tupleElement(t,1)), '","metadata":', tupleElement(t,2), '}'), arraySort(groupArray(tuple(event_time, metadata))))) AS metadata_list`;
    }

    const sql = `
      SELECT 
        activity_type,
        resource_type,
        count() AS activity_count,
        min(event_time) AS first_event,
        max(event_time) AS last_event
        ${metadataSelect}
      FROM analytics.user_activities
      ${whereClause}
      GROUP BY activity_type, resource_type
      ORDER BY last_event DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, params);
  }

  /**
   * Get user activities with metadata
   */
  @Get('single-user-activities-with-metadata')
  async getUserActivitiesByMetadata(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { userId, startDate, endDate, limit = 100 } = query;

    if (!userId) {
      throw new BadRequestException('userId parameter is required');
    }

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT) {
      throw new BadRequestException('Invalid startDate');
    }

    const params: Record<string, any> = {
      user_id: userId,
      start_time: startDT,
      limit_val: Math.min(limit, 1000),
    };

    let whereClause = `WHERE event_time >= parseDateTimeBestEffort({start_time:String}) AND user_id = {user_id:String}`;

    if (endDT) {
      whereClause += ' AND event_time <= parseDateTimeBestEffort({end_time:String})';
      params.end_time = endDT;
    }

    const sql = `
      SELECT 
        activity_type,
        resource_type,
        count() AS activity_count,
        event_time AS date,
        metadata
      FROM analytics.user_activities
      ${whereClause}
      GROUP BY activity_type, resource_type, metadata, date
      ORDER BY date DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, params);
  }

  /**
   * Get most active users
   */
  @Get('top-users')
  async getTopUsers(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 50 } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        user_id,
        count() AS activity_count,
        uniq(activity_type) AS unique_activity_types,
        min(event_time) AS first_activity,
        max(event_time) AS last_activity
      FROM analytics.user_activities
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
        AND user_id != ''
      GROUP BY user_id
      ORDER BY activity_count DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
      limit_val: Math.min(limit, 1000),
    });
  }

  /**
   * Get error logs with severity
   */
  @Get('errors')
  async getErrors(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 100 } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        event_time,
        error_type,
        error_message,
        endpoint,
        severity,
        user_id,
        request_id
      FROM analytics.error_logs
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      ORDER BY event_time DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
      limit_val: Math.min(limit, 1000),
    });
  }

  /**
   * Get error statistics grouped by type
   */
  @Get('error-stats')
  async getErrorStats(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        error_type,
        severity,
        count() AS error_count,
        uniq(user_id) AS affected_users,
        uniq(endpoint) AS affected_endpoints
      FROM analytics.error_logs
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY error_type, severity
      ORDER BY error_count DESC
      LIMIT 100
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
    });
  }

  /**
   * Get response time percentiles by endpoint
   */
  @Get('performance')
  async getPerformance(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 50 } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        path,
        count() AS request_count,
        quantile(0.50)(response_time_ms) AS p50,
        quantile(0.75)(response_time_ms) AS p75,
        quantile(0.90)(response_time_ms) AS p90,
        quantile(0.95)(response_time_ms) AS p95,
        quantile(0.99)(response_time_ms) AS p99,
        avg(response_time_ms) AS avg_response_time
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY path
      ORDER BY request_count DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
      limit_val: Math.min(limit, 1000),
    });
  }

  /**
   * Get cache hit rate statistics
   */
  @Get('cache-stats')
  async getCacheStats(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        path,
        count() AS total_requests,
        countIf(cache_hit = 1) AS cache_hits,
        round(countIf(cache_hit = 1) / count() * 100, 2) AS cache_hit_rate_percent,
        avg(response_time_ms) AS avg_response_time
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY path
      HAVING total_requests > 10
      ORDER BY cache_hit_rate_percent DESC
      LIMIT 100
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
    });
  }

  /**
   * Get traffic by country
   */
  @Get('geo-stats')
  async getGeoStats(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate, limit = 50 } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        country_code,
        count() AS request_count,
        uniq(user_id) AS unique_users,
        avg(response_time_ms) AS avg_response_time
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
        AND country_code != ''
      GROUP BY country_code
      ORDER BY request_count DESC
      LIMIT {limit_val:UInt32}
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
      limit_val: Math.min(limit, 1000),
    });
  }

  /**
   * Get daily summary statistics
   */
  @Get('daily-summary')
  async getDailySummary(@Query() query: AnalyticsQueryDto): Promise<any[]> {
    const { startDate, endDate } = query;

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT || !endDT) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    const sql = `
      SELECT 
        date,
        count() AS total_requests,
        uniq(user_id) AS unique_users,
        avg(response_time_ms) AS avg_response_time,
        quantile(0.95)(response_time_ms) AS p95_response_time,
        countIf(status_code >= 500) AS error_5xx_count,
        countIf(status_code >= 400 AND status_code < 500) AS error_4xx_count,
        countIf(status_code >= 200 AND status_code < 300) AS success_2xx_count,
        round(countIf(status_code >= 200 AND status_code < 300) / count() * 100, 2) AS success_rate_percent,
        sum(request_size) AS total_request_size,
        sum(response_size) AS total_response_size
      FROM analytics.http_requests
      WHERE event_time >= parseDateTimeBestEffort({start_time:String})
        AND event_time <= parseDateTimeBestEffort({end_time:String})
      GROUP BY date
      ORDER BY date DESC
    `;

    return await this.analyticsService.query(sql, {
      start_time: startDT,
      end_time: endDT,
    });
  }

  /**
   * SECURITY FIX: Secured delete with parameterized queries
   */
  @Delete('drop-analytics')
  async dropAnalytics(@Body() query: DeleteAnalyticsDto): Promise<any> {
    const { startDate, endDate, table, confirm } = query;

    if (confirm !== true) {
      throw new BadRequestException('Dangerous operation - set confirm=true to proceed');
    }
    if (!table) {
      throw new BadRequestException('Table parameter is required');
    }

    const startDT = this.sanitizeDatetimeInput(startDate);
    const endDT = this.sanitizeDatetimeInput(endDate);

    if (!startDT && !endDT) {
      throw new BadRequestException('startDate or endDate is required');
    }

    const allowedTables: Record<string, string> = {
      http_requests: 'analytics.http_requests',
      user_activities: 'analytics.user_activities',
      error_logs: 'analytics.error_logs',
    };

    const targets = table === 'all' ? Object.values(allowedTables) : allowedTables[table] ? [allowedTables[table]] : null;

    if (!targets) {
      throw new BadRequestException('Invalid table. Allowed: http_requests, user_activities, error_logs, all');
    }

    const whereParts: string[] = [];
    const params: Record<string, any> = {};

    if (startDT) {
      whereParts.push('event_time >= parseDateTimeBestEffort({start_time:String})');
      params.start_time = startDT;
    }
    if (endDT) {
      whereParts.push('event_time <= parseDateTimeBestEffort({end_time:String})');
      params.end_time = endDT;
    }

    const whereClause = whereParts.join(' AND ');

    const results: { table: string; sql: string }[] = [];

    for (const t of targets) {
      // ClickHouse ALTER TABLE DELETE doesn't support query parameters in WHERE clause
      // So we need to build the query safely
      const safeSql = `ALTER TABLE ${t} DELETE WHERE ${whereClause}`;

      // Execute the mutation (async in ClickHouse)
      // Use strictly-validated datetime strings and escape quotes as a defense-in-depth measure.
      const safeStart = startDT ? this.escapeString(startDT) : null;
      const safeEnd = endDT ? this.escapeString(endDT) : null;
      let finalSql = safeSql;
      if (safeStart) finalSql = finalSql.replace(/{start_time:String}/g, `'${safeStart}'`);
      if (safeEnd) finalSql = finalSql.replace(/{end_time:String}/g, `'${safeEnd}'`);

      await this.analyticsService.query(finalSql);

      results.push({ table: t, sql: safeSql });
    }

    return {
      ok: true,
      message: 'Delete mutations submitted (async operation)',
      details: results,
      note: 'Check system.mutations table for progress',
    };
  }

  /**
   * SECURITY FIX: Sanitize and validate datetime input
   *
   * Returns a strictly-formatted UTC datetime string: "YYYY-MM-DD HH:mm:ss".
   * This avoids milliseconds and timezone markers and is validated by a
   * conservative regex to minimize injection risk when used in DDL strings.
   */
  private sanitizeDatetimeInput(dt?: string): string | null {
    if (!dt) return null;
    const d = new Date(dt);
    if (isNaN(d.getTime())) return null;

    // Use ISO and trim milliseconds & timezone: YYYY-MM-DD HH:mm:ss
    const formatted = d.toISOString().slice(0, 19).replace('T', ' ');

    // Strict validation: only digits, hyphen, space, colon (no quotes, letters, etc.)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(formatted)) {
      return null;
    }

    return formatted;
  }

  /**
   * SECURITY FIX: Escape string literals for ClickHouse
   * ClickHouse uses single quotes, escape them by doubling
   */
  private escapeString(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * SECURITY FIX: Validate path/endpoint to prevent injection
   */
  private sanitizePath(path: string): string {
    // Only allow: alphanumeric, forward slash, dash, underscore
    // Note: ":" (colon) intentionally disallowed to reduce attack surface
    const sanitized = path.replace(/[^a-zA-Z0-9/_-]/g, '');
    if (sanitized.length > 200) {
      throw new BadRequestException('Path too long');
    }
    return sanitized;
  }
}
