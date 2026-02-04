import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common/pipes';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { BadRequestException, ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { AppConfigService } from './common/utils/AppConfigService';
import { GracefulShutdownService } from './rest/flow-control/services/shutdown-service';
import { GlobalExceptionFilter } from './rest/flow-control/filters/global-exception.filter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import { constants as zlibConstants } from 'zlib';
import type { FastifyRequest } from 'fastify';
import { WebHookModule } from './rest/webhook/webhook.module';
import { QueueService } from './common/rabbitMQ/QueueService';

// stripe listen --forward-to https://localhost:3000/webhook/v1/stripe
async function bootstrap() {
  // Fastify adapter with HTTP/2 and Stripe webhook optimizations

  const fastifyAdapter = new FastifyAdapter({
    logger: false,
    trustProxy: true,

    // Stripe webhook timeout requirements (Stripe expects response within 30s)
    connectionTimeout: 30000, // 30s for Stripe
    keepAliveTimeout: 305000, // 305s (> NGINX 300s)

    // Stripe webhook body size (typically small, but allow up to 1MB)
    bodyLimit: 1048576, // 1MB
    routerOptions: {
      maxParamLength: 500,
      caseSensitive: false,
      ignoreTrailingSlash: true,
    },

    // HTTP/2 session management
    http2SessionTimeout: 300000,

    // Security
    onProtoPoisoning: 'remove',
    onConstructorPoisoning: 'remove',

    // Request tracking
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    genReqId: () => `stripe-${Date.now()}-${Math.random().toString(36).substring(7)}`,

    disableRequestLogging: true,
  });
  const app = await NestFactory.create<NestFastifyApplication>(WebHookModule, fastifyAdapter, {
    bodyParser: false, // Custom raw body parser for Stripe
  });

  const config = app.get(AppConfigService);

  // Security Headers (OWASP Recommended for webhook endpoints)
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
    noSniff: true,
    originAgentCluster: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  });

  // Compression (light for webhooks, as responses are typically small)
  await app.register(fastifyCompress, {
    global: true,
    threshold: 1024,
    encodings: ['br', 'gzip', 'deflate'],
    zlibOptions: {
      level: 6,
    },
    brotliOptions: {
      params: {
        [zlibConstants.BROTLI_PARAM_MODE]: zlibConstants.BROTLI_MODE_TEXT,
        [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
      },
    },
    customTypes: /^text\/|application\/(json|javascript)$/,
    inflateIfDeflated: true,
  });

  // Custom content type parser for Stripe webhooks
  // Stripe requires raw body buffer for signature verification
  app
    .getHttpAdapter()
    .getInstance()
    .addContentTypeParser('application/json', { parseAs: 'buffer' }, (req: FastifyRequest, body: Buffer) => {
      // Store raw body for Stripe signature verification
      if (req.url?.startsWith('/webhook/v1/stripe')) {
        return body;
      }
      // Parse JSON for other routes
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(body.toString('utf-8'));
      } catch {
        throw new BadRequestException('Invalid JSON payload');
      }
    });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'webhook/v',
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
        enableImplicitConversion: false, // Security: Explicit only
      },
      forbidNonWhitelisted: false,
      disableErrorMessages: !config.isDebug,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector), {
      excludePrefixes: ['_', '__'], // Exclude private fields
    }),
  );

  // CORS disabled for webhook endpoint (Stripe doesn't need CORS)
  // Webhooks are server-to-server, not browser-based

  // Socket.IO adapter (if needed for webhook event broadcasting)
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = config.stringValue('PORT_WEBHOOK') || 3003;

  // Graceful Shutdown
  app.enableShutdownHooks();
  const shutdownService = app.get(GracefulShutdownService);
  const queueService = app.get(QueueService);
  const server = app.getHttpServer();

  shutdownService.initialize(server, {
    drainTimeout: 30000,
    checkInterval: 100,
    preShutdownDelay: 5000,
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter(config, queueService));

  // Start server (bind based on environment)
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  await app.listen(port, host);

  console.log(`✅ Webhook Server (Fastify + HTTP/2) running on http://${host}:${port}`);
  console.log(`⚡ Stripe webhook ready with raw body parsing`);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});
