import { NestFactory, Reflector } from '@nestjs/core';
import { APIModule } from './rest/api.module';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './rest/flow-control/filters/global-exception.filter';
import { GracefulShutdownService } from './rest/flow-control/services/shutdown-service';
import { CircuitBreakerService } from './rest/flow-control/services/circuit-breaker.service';
import { AppConfigService } from './common/utils/AppConfigService';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import { constants as zlibConstants } from 'zlib';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { randomUUID } from 'crypto';
import { QueueService } from './common/rabbitMQ/QueueService';

async function bootstrap() {
  // Fastify adapter with optimized settings for HTTP/2

  const fastifyAdapter = new FastifyAdapter({
    logger: false, // Use NestJS logger instead
    trustProxy: true, // Trust NGINX reverse proxy

    // Connection timeouts (aligned with your previous config)
    connectionTimeout: 120000, // 120s
    keepAliveTimeout: 305000, // 305s (> NGINX 300s)

    // Request limits
    bodyLimit: 1048576, // 1MB (1024 * 1024)
    //bodyLimit: ConstGRPC ? ConstGRPC.REST_BODY_LIMIT_BYTES : 1048576, // from constants (1MB default)
    routerOptions: {
      maxParamLength: 1000,
      caseSensitive: false,
      ignoreTrailingSlash: true,
    },

    // HTTP/2 specific optimizations
    http2SessionTimeout: 300000, // 300s session timeout

    // Faster JSON parsing
    onProtoPoisoning: 'remove',
    onConstructorPoisoning: 'remove',

    // Request ID generation for tracing
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: () => `${randomUUID()}`,

    // HTTP/2 Server Push disabled (NGINX handles this)
    disableRequestLogging: true, // Better performance, use custom logger if needed
  });

  const app = await NestFactory.create<NestFastifyApplication>(APIModule, fastifyAdapter, {
    bodyParser: false, // Fastify handles parsing
  });

  const config = app.get(AppConfigService);
  const queueService = app.get(QueueService);
  console.log('Initializing MongoDB connection... ');

  // Security Headers with @fastify/helmet
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    hsts: false, // NGINX handles HSTS
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
    //expectCt: false,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // Compression with @fastify/compress (brotli + gzip)
  await app.register(fastifyCompress, {
    global: true,
    threshold: 1024, // Only compress > 1KB
    encodings: ['br', 'gzip', 'deflate'], // Brotli first for best compression
    zlibOptions: {
      level: 6, // Balance speed vs compression
    },
    brotliOptions: {
      params: {
        [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
        [zlibConstants.BROTLI_PARAM_QUALITY]: 4, // 0-11, 4 is fast+efficient
      },
    },
    customTypes: /^text\/|application\/(json|javascript)|image\/svg\+xml$/,
    inflateIfDeflated: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      skipUndefinedProperties: true,
      skipNullProperties: true,
      skipMissingProperties: true,
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      forbidNonWhitelisted: true,
      disableErrorMessages: !config.isDebug,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludePrefixes: ['_', '__'], // Exclude private fields
      enableImplicitConversion: true,
      excludeExtraneousValues: true,
    }),
  );

  const allowedOriginsEnv = config.stringValue('ALLOWED_ORIGINS') || '';
  const allowedOrigins = allowedOriginsEnv
    ? allowedOriginsEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        // sensible development defaults — include both http & https variants you use
        'http://localhost:3020',
        'http://localhost:3000',
        'http://127.0.0.1:3020',
        'https://localhost:3000',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (curl, mobile, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // helpful error message when debugging
      const msg = `CORS origin denied: ${origin}`;
      return callback(new Error(msg), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    //allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-Id'],
    //exposedHeaders: ['X-Request-Id'],
    credentials: true,
    //preflightContinue: false,
    optionsSuccessStatus: 204, // ensure OPTIONS returns 204 OK
    maxAge: 86400,
  });

  // Socket.IO adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = config.stringValue('API_PORT') || config.stringValue('PORT_API') || config.stringValue('PORT') || 3001;

  // Graceful Shutdown
  app.enableShutdownHooks();
  const shutdownService = app.get(GracefulShutdownService);

  const server = app.getHttpServer();

  shutdownService.initialize(server, {
    drainTimeout: 30000,
    checkInterval: 100,
    preShutdownDelay: 5000,
  });

  // Global Exception Filters
  const circuitBreaker = app.get(CircuitBreakerService);
  app.useGlobalFilters(new GlobalExceptionFilter(config, queueService, circuitBreaker));
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('preHandler', (request, reply, done) => {
      request.getParams = () => (request.params ?? {}) as Record<string, string>;
      request.getQuery = () => (request.query ?? {}) as Record<string, string>;
      request.getParam = (key: string) => ((request.params ?? {}) as Record<string, string>)[key];
      request.getQueryParam = (key: string) => ((request.query ?? {}) as Record<string, string>)[key];
      done();
    });

  // Respond to favicon requests to avoid 404/failed requests from browsers
  app
    .getHttpAdapter()
    .getInstance()
    .get('/favicon.ico', (_: any, reply: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      reply.code(204).header('Cache-Control', 'public, max-age=86400').send();
    });
  // Start server (bind to 0.0.0.0 for Kubernetes)
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  await app.listen(port);

  console.log(`✅ NestJS API (Fastify + HTTP/2) running on http://${host}:${port}`);
  console.log(`📡 WebSocket: wss://localhost:3000/socket.io/`);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});
