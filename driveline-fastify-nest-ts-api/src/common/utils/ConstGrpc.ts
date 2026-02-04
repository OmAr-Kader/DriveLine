import { join } from 'path';

const PROTOS_ROOT = 'dist/common/proto' as string;
export const GRPC = {
  PROTO_GLOB: `${PROTOS_ROOT}/*.proto`,
  PACKAGES: ['user', 'auth', 'course', 'fixservice', 'shortvideo', 'aisession', 'aimessage', 'stats', 'gemini'] as string[],
  GRPC_MAX_MESSAGE_BYTES: Number(process.env.GRPC_MAX_MESSAGE || 10485760), // 10MB default
  REST_BODY_LIMIT_BYTES: Number(process.env.REST_BODY_LIMIT || 1048576), // 1MB default
  PROTO_FILES: [
    join(process.cwd(), `${PROTOS_ROOT}/common.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/user.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/auth.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/course.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/fix-service.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/short-video.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/ai-session.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/ai-message.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/stats.proto`),
    join(process.cwd(), `${PROTOS_ROOT}/gemini.proto`),
  ] as string[],
} as const;
