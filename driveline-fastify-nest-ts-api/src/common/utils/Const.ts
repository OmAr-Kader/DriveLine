export const Const = {
  Token: 'token',
  UserID: 'user-id',
  SignKey: 'sign-key',
  AdminKey: 'admin-key',
  NoCacheKey: 'x-no-cache-client',
  NoAnalyticsKey: 'x-no-analytics',
  XCryptoKey: 'x-crypto',
  XRequestIdKey: 'x-request-id-server',
  XIPKey: 'x-ip-address-server',
  XStartTimeKey: 'x-request-timestamp',
  XInternalNoAnalytics: 'x-internal-no-analytics',
  QNeedTimestamp: 'need_timestamp',
  ClientKeyBase64: 'x-client-key-base64',
} as const;

export const ConstPrefix = {
  VIDEO: 'video',
  COURSE: 'course',
  FIX_SERVICE: 'fix-service',
  SCHOOL: 'school',
  ANALYTICS: 'analytics',
  AI_MESSAGE: 'ai-message',
  AI_SESSION: 'ai-session',
  USER: 'user',
  USER_STRIPE: 'user-stripe',
  AUTH: 'auth',
  AI: 'ai',
  GEMINI: 'gemini',
  STATS: 'stats',
  HEALTH: 'health',
  CHAT: 'chat',
} as const;

export const CryptoMode = {
  DoubleCrypto: 'x-double-crypto',
  SendOnly: 'x-send-crypto',
  ReceiveOnly: 'x-receive-crypto',
} as const;

export const DecorationKeys = {
  RETRYABLE: 'retryable_key',
  PRIORITY_KEY: 'flow_control_priority',
  SKIP_FLOW_CONTROL_KEY: 'skip_flow_control',
  SKIP_ANALYTICS_KEY: 'skip_analytics',
  CUSTOM_RATE_LIMIT_KEY: 'custom_rate_limit',
  WS_THROTTLE_KEY: 'ws-throttle',
  CACHE_KEY: 'cache_key',
  MICROSERVICE_RETRYABLE: 'microservice_retryable_key',
} as const;

export const ConstCacheKey = {
  CACHE_STORE: 'CACHE_STORE',
  CACHE_KEY_TEMP: 'cache_temp_key',
  CACHE_KEY_ID: 'CACHE_key_id',
  CACHE_KEY_ID_QUERY_COLUMNS: 'CACHE_key_id_query_columns', // columns
  CACHE_KEY_ID_QUERY_CACHE_COLUMNS: 'CACHE_key_id_query_cache_columns', // cache_columns
  CACHE_KEY_USER_ID_HEADER: 'CACHE_key_user_id_header',
  CACHE_KEY_USER_ID_HEADER_QUERY_COLUMNS: 'CACHE_key_user_id_header_query_columns', // columns
  CACHE_KEY_USER_ID_HEADER_QUERY_CACHE_COLUMNS: 'CACHE_key_user_id_header_query_cache_columns', // cache_columns
} as const;

export type CacheKeyValue = (typeof ConstCacheKey)[keyof typeof ConstCacheKey];

export const QUEUE_NAMES = {
  GEMINI_QUEUE: 'gemini_generate_queue',
  PAYMENT_QUEUE: 'payment_processing_queue',
} as const;

export const ConstGRPC = {
  USER_SERVICE: 'UserService',
  SHORT_VIDEO_SERVICE: 'ShortVideoService',
  AI_MESSAGE_SERVICE: 'AiMessageService',
  AI_SESSION_SERVICE: 'AiSessionService',
  GEMINI_SERVICE: 'GeminiService',
  AUTH_SERVICE: 'AuthService',
  COURSE_SERVICE: 'CourseService',
  FIX_SERVICE_SERVICE: 'FixServiceService',
  STATS_SERVICE: 'StatsService',
} as const;

export const Const_GRPC_User = {
  FindAll: 'FindAll',
  GetProfileById: 'GetProfileById',
  FindById: 'FindById',
  Update: 'Update',
  Delete: 'Delete',
} as const;

export const Const_GRPC_ShortVideo = {
  Create: 'Create',
  GetByUserId: 'GetByUserId',
  GetById: 'GetById',
  FetchByTag: 'FetchByTag',
  FetchLatest: 'FetchLatest',
  IncrementViews: 'IncrementViews',
  UpdateTags: 'UpdateTags',
  Delete: 'Delete',
  GetAll: 'GetAll',
} as const;

export const Const_GRPC_AIMessage = {
  CreateMessage: 'CreateMessage',
  GetMessage: 'GetMessage',
  GetMessagesBySession: 'GetMessagesBySession',
  UpdateMessage: 'UpdateMessage',
  DeleteMessage: 'DeleteMessage',
  CreateMessageFromServer: 'CreateMessageFromServer',
} as const;

export const Const_GRPC_AISession = {
  CreateSessionAndAddFirstMessage: 'CreateSessionAndAddFirstMessage',
  CreateSession: 'CreateSession',
  ListSessions: 'ListSessions',
  UpdateSessionTitle: 'UpdateSessionTitle',
  DeleteSession: 'DeleteSession',
} as const;

export const Const_GRPC_Auth = {
  Register: 'Register',
  Login: 'Login',
  shakeHand: 'ShakeHand',
} as const;

export const Const_GRPC_Gemini = {
  GenerateContent: 'GenerateContent',
} as const;

export const Const_GRPC_Course = {
  Create: 'Create',
  Update: 'Update',
  GetCourseById: 'GetCourseById',
  GetCoursesByCourseAdminId: 'GetCoursesByCourseAdminId',
  ListByTech: 'ListByTech',
  GetAllCourses: 'GetAllCourses',
  Delete: 'Delete',
} as const;

export const Const_GRPC_FixService = {
  Create: 'Create',
  Update: 'Update',
  GetServiceById: 'GetServiceById',
  GetServicesByServiceAdminId: 'GetServicesByServiceAdminId',
  ListByTech: 'ListByTech',
  GetAllServices: 'GetAllServices',
  Delete: 'Delete',
} as const;

export const Const_GRPC_Stats = {
  CountUsers: 'CountUsers',
  CountFixServices: 'CountFixServices',
  CountCourses: 'CountCourses',
  CountShortVideos: 'CountShortVideos',
  GetAllCounts: 'GetAllCounts',
} as const;
