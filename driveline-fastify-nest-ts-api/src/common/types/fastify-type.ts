import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OutgoingMessage, IncomingMessage, ServerResponse } from 'http';
import { Http2ServerResponse } from 'http2';
import { Http2ServerRequest } from 'http2';
import { BaseSuccess } from 'src/common/utils/mongo-helper';
import { Const } from 'src/common/utils/Const';
import { ClientIPUtils } from 'src/common/utils/getClientIP';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export type APIRequest = FastifyRequest | IncomingMessage | Http2ServerRequest;

export type APIResponse = FastifyReply | ServerResponse | Http2ServerResponse;

/**
 * Custom Query Decorator that only performs transformation
 * Optimized for Fastify and strict type safety.
 */
export const TransformedQuery = createParamDecorator(<T>(cls: ClassConstructor<T>, ctx: ExecutionContext): T => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();

  // Fastify provides the query as a plain object
  const query = request.query as Record<string, any>;

  if (!cls) {
    return query as unknown as T;
  }
  // We use plainToInstance to trigger the @Transform decorators in your DTO
  // enableImplicitConversion: true is often helpful for query params (strings to numbers)
  return plainToInstance(cls, query, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
  });
});

export const TransformedHeader = createParamDecorator(<T>(cls: ClassConstructor<T>, ctx: ExecutionContext): T => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();
  const headers = request.headers;

  if (!cls) {
    return headers as unknown as T;
  }
  // request.headers in Fastify is a IncomingHttpHeaders object (all keys lowercase)

  return plainToInstance(cls, headers, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
  });
});

/**
 * @deprecated No need for, .proto files already define types.
 *
 * ```typescript
 * @GrpcMethod(SERVICE_NAME, METHOD_NAME)
 * async methodName(@ValidatedGrpcPayload(DtoClass) data: DtoClass) {
 *   // data is validated at this point
 * }
 * ```
 */
export const TransformedGrpcPayload = createParamDecorator(async <T>(cls: ClassConstructor<T>, ctx: ExecutionContext): Promise<T | undefined> => {
  const data = ctx.switchToRpc().getData<T>();

  if (!cls) {
    return data;
  }

  try {
    const dtoInstance = plainToInstance(cls, data);
    await validateOrReject(dtoInstance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
    });
    return dtoInstance;
  } catch {
    // Return undefined on validation failure (optional validation)
    return undefined;
  }
});

// API Request and Response Helpers

export interface APIRequestData {
  method: string;
  url: string;
  ip: string;
  headers: Record<string, string | string[] | number | undefined>;
}

export interface APIResponseData {
  statusCode: number;
  headers: Record<string, string | string[] | number | undefined>;
}

function isFastifyRequest(req: APIRequest): req is FastifyRequest {
  return typeof (req as FastifyRequest).raw === 'object' && 'id' in (req as FastifyRequest);
}

function isHttp2ServerRequest(req: APIRequest): req is Http2ServerRequest {
  return 'stream' in req && typeof req.headers === 'object';
}

function isIncomingMessage(req: APIRequest): req is IncomingMessage {
  return 'socket' in req && !('stream' in req) && !('raw' in req);
}

function isFastifyReply(res: APIResponse): res is FastifyReply {
  return typeof (res as FastifyReply).header === 'function';
}

function isHttp2ServerResponse(res: APIResponse): res is Http2ServerResponse {
  return 'stream' in res && typeof (res as Http2ServerResponse).setHeader === 'function';
}

function isServerResponse(res: APIResponse): res is ServerResponse {
  return typeof (res as OutgoingMessage).setHeader === 'function' && !isHttp2ServerResponse(res);
}

export function setHeadersForRequest(req: APIRequest, headers: Record<string, string>): void {
  //res.header(Const.XRequestIdKey, requestId);
  //res.header(Const.XIPKey, clientIp);
  if (isFastifyRequest(req)) {
    for (const [key, value] of Object.entries(headers)) {
      req.headers[key] = value;
      req.raw.headers[key] = value;
    }
    return;
  }

  if (isHttp2ServerRequest(req)) {
    for (const [key, value] of Object.entries(headers)) {
      req.headers[key] = value;
      req.rawHeaders.push(key, value);
    }
    return;
  }

  if (isIncomingMessage(req)) {
    for (const [key, value] of Object.entries(headers)) {
      req.headers[key] = value;
      req.rawHeaders.push(key, value);
    }
  }
}

export function setHeaders(res: APIResponse, headers: Record<string, string>): void {
  //res.header(Const.XRequestIdKey, requestId);
  //res.header(Const.XIPKey, clientIp);
  if (isFastifyReply(res)) {
    for (const [key, value] of Object.entries(headers)) {
      res.header(key, value);
    }
    return;
  }

  if (isHttp2ServerResponse(res)) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
    return;
  }

  if (isServerResponse(res)) {
    for (const [key, value] of Object.entries(headers)) {
      res.setHeader(key, value);
    }
  }
}

export function fetchResponseData(res: APIResponse): APIResponseData {
  // FastifyReply exposes `statusCode` and `getHeaders()` per fastify types
  if (isFastifyReply(res)) {
    try {
      const status =
        typeof res.statusCode === 'number'
          ? res.statusCode
          : res.raw && typeof (res.raw as ServerResponse).statusCode === 'number'
            ? (res.raw as ServerResponse).statusCode
            : 200;
      const headers = typeof (res as FastifyReply).getHeaders === 'function' ? (res as FastifyReply).getHeaders() : {};
      return {
        statusCode: status,
        headers: headers as Record<string, string | string[] | number | undefined>,
      };
    } catch {
      return { statusCode: 200, headers: {} };
    }
  }

  // HTTP/2 response
  if (isHttp2ServerResponse(res)) {
    try {
      const status =
        typeof (res as Http2ServerResponse & { statusCode?: number }).statusCode === 'number'
          ? (res as Http2ServerResponse & { statusCode?: number }).statusCode
          : 200;
      // Try common getter, fall back to empty
      const getter = res as unknown as { getHeaders?: () => Record<string, any> };
      const headers = typeof getter.getHeaders === 'function' ? getter.getHeaders() : {};
      return { statusCode: status, headers };
    } catch {
      return { statusCode: 200, headers: {} };
    }
  }

  // Node HTTP/1 ServerResponse
  if (isServerResponse(res)) {
    try {
      const sr = res as ServerResponse;
      const status = typeof sr.statusCode === 'number' ? sr.statusCode : 200;
      const headers = typeof sr.getHeaders === 'function' ? sr.getHeaders() : {};
      return { statusCode: status, headers: headers as Record<string, string | string[] | number | undefined> };
    } catch {
      return { statusCode: 200, headers: {} };
    }
  }

  return { statusCode: 200, headers: {} };
}

export function fetchRequestData(req: APIRequest): APIRequestData {
  // FastifyRequest has `headers` and `raw`; Http2ServerRequest has `headers` and `stream`.
  try {
    if (isFastifyRequest(req)) {
      const headers = (req.headers || {}) as Record<string, string | string[] | number | undefined>;
      return {
        method: req.method,
        url: req.url,
        ip: (headers[Const.XIPKey] as string | undefined) || ClientIPUtils.extractClientIp(req) || req.ip || '',
        headers,
      };
    }

    if (isHttp2ServerRequest(req)) {
      // http2 request headers may include numeric pseudo-headers; return as-is
      const headers = (req.headers || {}) as Record<string, string | string[] | number | undefined>;
      return {
        method: req.method,
        url: req.url,
        ip: (headers[Const.XIPKey] as string | undefined) || ClientIPUtils.extractClientIp(req) || req.socket?.remoteAddress || '',
        headers,
      };
    }

    // IncomingMessage (HTTP/1)
    if (isIncomingMessage(req)) {
      const headers = (req.headers || {}) as Record<string, string | string[] | number | undefined>;
      return {
        method: req.method || '',
        url: req.url || '',
        ip: (headers[Const.XIPKey] as string | undefined) || ClientIPUtils.extractClientIp(req) || req.socket?.remoteAddress || '',
        headers,
      };
    }
  } catch {
    // fall through to empty
  }

  return {
    method: '',
    url: '',
    ip: '',
    headers: {},
  };
}

export function sendApiResponse(res: APIResponse, status: number, payload: object): BaseSuccess {
  if (isFastifyReply(res)) {
    res.code(status).send(payload);
    return {
      status: status,
      json: payload,
    };
  }

  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);

  if (isHttp2ServerResponse(res)) {
    try {
      res.setHeader('content-type', 'application/json');
    } catch {
      /* empty */
    }

    try {
      res.statusCode = status;
    } catch {
      /* empty */
    }

    try {
      res.end(body);
    } catch {
      /* empty */
    }

    return {
      status,
      json: payload,
    };
  }

  if (isServerResponse(res)) {
    res.statusCode = status;
    try {
      res.setHeader('content-type', 'application/json');
    } catch {
      /* empty */
    }
    res.end(body);
    return {
      status,
      json: payload,
    };
  }
  return {
    status: -1,
    json: payload,
  };
}

export const RequestTimestamp = createParamDecorator((data: unknown, ctx: ExecutionContext): number | undefined => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();
  return fetchRequestTimestamp(request);
});

export function fetchRequestTimestamp(request: FastifyRequest): number | undefined {
  const timestamp = request.headers['x-request-timestamp'];

  if (!timestamp || typeof timestamp !== 'string') {
    return undefined;
  }

  const seconds = parseFloat(timestamp);

  if (isNaN(seconds)) {
    return undefined;
  }

  return Math.floor(seconds * 1000);
}

export function fetchRequestTimestampFromHeaders(headers: Record<string, string | string[] | number | undefined>): number | undefined {
  const timestamp = headers['x-request-timestamp'];

  if (!timestamp || typeof timestamp !== 'string') {
    return undefined;
  }

  const seconds = parseFloat(timestamp);

  if (isNaN(seconds)) {
    return undefined;
  }

  return Math.floor(seconds * 1000);
}
