import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    getParams(): Record<string, string>;
    getQuery(): Record<string, string>;
    getParam(key: string): string | undefined;
    getQueryParam(key: string): string | undefined;
  }
}

declare module 'http' {
  interface IncomingMessage {
    getParams(): Record<string, string>;
    getQuery(): Record<string, string>;
    getParam(key: string): string | undefined;
    getQueryParam(key: string): string | undefined;
  }
}

// augment http2 server request
declare module 'http2' {
  interface Http2ServerRequest {
    getParams(): Record<string, string>;
    getQuery(): Record<string, string>;
    getParam(key: string): string | undefined;
    getQueryParam(key: string): string | undefined;
  }
}
