import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerKit } from 'src/common/utils/LogKit';
import { Const, DecorationKeys } from 'src/common/utils/Const';
import { Reflector } from '@nestjs/core';
import type { ErrorLogEvent, HttpRequestEvent } from '../../common/analytics/analytics-query.dto';
import {
  APIRequest,
  APIRequestData,
  APIResponse,
  APIResponseData,
  fetchRequestData,
  fetchRequestTimestampFromHeaders,
  fetchResponseData,
  setHeaders,
} from 'src/common/types/fastify-type';
import { QueueService } from 'src/common/rabbitMQ/QueueService';

export const SkipAnalytics = () => SetMetadata(DecorationKeys.SKIP_ANALYTICS_KEY, true);

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  private readonly logger = LoggerKit.create(AnalyticsInterceptor.name);

  private readonly analyticsHelper: AnalyticsHelper = AnalyticsHelper.create();

  constructor(
    private readonly reflector: Reflector,
    private readonly queueService: QueueService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipAnalytics = this.reflector.getAllAndOverride<boolean>(DecorationKeys.SKIP_ANALYTICS_KEY, [context.getHandler(), context.getClass()]);
    const response = context.switchToHttp().getResponse<APIResponse>();

    if (skipAnalytics) {
      this.logger?.log('Skipping analytics for this request as per decorator');
      setHeaders(response, {
        'x-internal-no-analytics': 'true',
      });
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<APIRequest>();
    const requestData = fetchRequestData(request);
    const responseData = fetchResponseData(response);

    return next.handle().pipe(
      tap({
        next: () => {
          const track = this.analyticsHelper.generateSuccessTrack(requestData, responseData, this.queueService.generateEventTimestamp);
          this.logger?.debug(`Endpoint statusCode: ${track?.status_code}`);
          if (!track) return;
          this.logger?.log(
            `Tracked request ${requestData.method} - ${requestData.ip} ${requestData.url} - ${track.status_code} - ${track.request_id} in ${track.response_time_ms}ms`,
          );
          this.queueService.trackHttpRequest(track);
        },
      }),
    );
  }
}

export class AnalyticsHelper {
  public static create(): AnalyticsHelper {
    return new AnalyticsHelper();
  }

  generateSuccessTrack(request: APIRequestData, response: APIResponseData, event_time: string): HttpRequestEvent | undefined {
    try {
      const startTime = fetchRequestTimestampFromHeaders(request.headers);
      const dif = startTime ? Date.now() - startTime : 0;
      const responseTimeMs = dif > 0 ? dif : 0;
      const respStatus = typeof response?.statusCode === 'number' ? response.statusCode : undefined;
      const statusCode = typeof respStatus === 'number' ? respStatus : 200;

      // Extract user ID from headers (adjust based on your auth implementation)
      const userId = (request.headers['x-user-id'] as string) || '';
      const requestId = (request.headers[Const.XRequestIdKey] as string | undefined) || 'unknown';

      // Get request/response sizes (approximation)
      const requestSize = request.headers['content-length'] ? parseInt((request.headers['content-length'] as string | undefined) ?? '0', 10) : 0;
      const responseSize = response.headers['content-length'] ? parseInt((response.headers['content-length'] as string | undefined) ?? '0', 10) : 0;

      // Check if cache was hit (from your cache interceptor)
      const cacheHit = response.headers['x-cache-hit'] === 'true';

      // Extract version from URL (e.g., /api/v1/users -> v1)
      const versionMatch = request.url.match(/\/api\/v(\d+)\//);
      const endpointVersion = versionMatch ? `v${versionMatch[1]}` : '';

      return {
        request_id: requestId,
        event_time: event_time, //this.clickhouseService.generateEventTimestamp
        method: request.method,
        path: this.sanitizePath(request.url),
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        user_id: userId,
        user_agent: (request.headers['user-agent'] as string | undefined) || '',
        ip_address: this.extractIpAddress(request),
        country_code: (request.headers['cf-ipcountry'] as string) || '', // Cloudflare country header
        request_size: requestSize,
        response_size: responseSize,
        endpoint_version: endpointVersion,
        cache_hit: cacheHit,
      };
    } catch {
      // Silent fail - never crash the app for analytics
      return undefined;
    }
  }

  generateErrorTrack(
    request: APIRequestData,
    response: APIResponseData,
    event_time: string,
    error: Error,
  ): { http: HttpRequestEvent | undefined; error: ErrorLogEvent | undefined } {
    try {
      const startTime = fetchRequestTimestampFromHeaders(request.headers);

      const dif = startTime ? Date.now() - startTime : 0;
      const responseTimeMs = dif > 0 ? dif : 0;

      let statusCode: number;
      if (error) {
        if (error instanceof HttpException) {
          statusCode = error.getStatus();
        } else {
          // If response was already set to a non-200, prefer it; otherwise default to 500
          const respStatus = typeof response?.statusCode === 'number' ? response.statusCode : undefined;
          statusCode = typeof respStatus === 'number' && respStatus !== 200 ? respStatus : 500;
        }
      } else {
        const respStatus = typeof response?.statusCode === 'number' ? response.statusCode : undefined;
        statusCode = typeof respStatus === 'number' ? respStatus : 200;
      }

      // Extract user ID from headers (adjust based on your auth implementation)
      const userId = (request.headers['x-user-id'] as string | undefined) || '';
      const requestId = (request.headers[Const.XRequestIdKey] as string | undefined) || 'unknown';

      // Get request/response sizes (approximation)
      const requestSize = request.headers['content-length'] ? parseInt((request.headers['content-length'] as string | undefined) ?? '0', 10) : 0;
      const responseSize = response.headers['content-length'] ? parseInt(response.headers['content-length'] as string, 10) : 0;

      // Check if cache was hit (from your cache interceptor)
      const cacheHit = response.headers['x-cache-hit'] === 'true';

      // Extract version from URL (e.g., /api/v1/users -> v1)
      const versionMatch = request.url.match(/\/api\/v(\d+)\//);
      const endpointVersion = versionMatch ? `v${versionMatch[1]}` : '';

      return {
        http: {
          request_id: requestId,
          event_time: event_time,
          method: request.method,
          path: this.sanitizePath(request.url),
          status_code: statusCode,
          response_time_ms: responseTimeMs,
          user_id: userId,
          user_agent: (request.headers['user-agent'] as string | undefined) || '',
          ip_address: this.extractIpAddress(request),
          country_code: (request.headers['cf-ipcountry'] as string) || '', // Cloudflare country header
          request_size: requestSize,
          response_size: responseSize,
          error_message: error ? error.message : '',
          endpoint_version: endpointVersion,
          cache_hit: cacheHit,
        },
        error: {
          error_type: error.name,
          event_time: event_time,
          error_message: error.message,
          stack_trace: error.stack || '',
          request_id: requestId,
          user_id: userId,
          endpoint: `${request.method} ${this.sanitizePath(request.url)}`,
          severity: statusCode >= 500 ? 'critical' : 'high',
        },
      };
    } catch {
      // Silent fail - never crash the app for analytics
      return { http: undefined, error: undefined };
    }
  }

  private sanitizePath(url: string): string {
    try {
      // Remove query parameters
      const urlObj = new URL(url, 'http://localhost');
      let path = urlObj.pathname;

      // Replace UUIDs and ObjectIds with placeholders to reduce cardinality
      path = path.replace(/[0-9a-f]{24}/gi, ': id'); // MongoDB ObjectId
      path = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid'); // UUID

      return path;
    } catch {
      return url.split('?')[0];
    }
  }

  private extractIpAddress(request: APIRequestData): string {
    // Check common proxy headers
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    return request.ip || '';
  }
}
