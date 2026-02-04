import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientGrpcProxy, ClientProxyFactory } from '@nestjs/microservices';
import { Observable, catchError, firstValueFrom, retry, timeout } from 'rxjs';
import { ConstGRPC } from 'src/common/utils/Const';
import {
  AiMessageGrpc,
  AiSessionGrpc,
  AuthGrpc,
  CourseGrpc,
  FixServiceGrpc,
  GeminiGrpc,
  ShortVideoService,
  StatsGrpc,
  UserService,
} from 'src/rest/gRPC-Clients';
import { exceptionForMicroservice } from 'src/common/utils/ExceptionGrpc';
import { GrpcClientConfig } from 'src/common/utils/ConstConfig';
import { ConsoleKit } from 'src/common/utils/LogKit';

@Injectable()
export class GrpcClientService implements OnModuleInit, OnModuleDestroy {
  private client: ClientGrpc & ClientGrpcProxy; // ClientGrpc

  private _userGrpc!: UserService;
  get user(): UserService {
    return this._userGrpc;
  }

  private _shortVideoGrpc!: ShortVideoService;
  get shortVideo(): ShortVideoService {
    return this._shortVideoGrpc;
  }

  private _aiMessageGrpc!: AiMessageGrpc;
  get aiMessage(): AiMessageGrpc {
    return this._aiMessageGrpc;
  }

  private _aiSessionGrpc!: AiSessionGrpc;
  get aiSession(): AiSessionGrpc {
    return this._aiSessionGrpc;
  }

  private _geminiGrpc!: GeminiGrpc;
  get gemini(): GeminiGrpc {
    return this._geminiGrpc;
  }

  private _authGrpc!: AuthGrpc;
  get auth(): AuthGrpc {
    return this._authGrpc;
  }

  private _courseGrpc!: CourseGrpc;
  get course(): CourseGrpc {
    return this._courseGrpc;
  }

  private _fixServiceGrpc!: FixServiceGrpc;
  get fixService(): FixServiceGrpc {
    return this._fixServiceGrpc;
  }

  private _statsGrpc!: StatsGrpc;
  get stats(): StatsGrpc {
    return this._statsGrpc;
  }

  onModuleInit() {
    // Create a GRPC client proxy that mirrors the server configuration
    const grpcPort = process.env.GRPC_PORT || '50051';
    const grpcConfig = GrpcClientConfig(grpcPort);
    this.client = ClientProxyFactory.create(grpcConfig) as ClientGrpc & ClientGrpcProxy;

    try {
      this._userGrpc = this.client.getService<UserService>(ConstGRPC.USER_SERVICE);
      this._shortVideoGrpc = this.client.getService<ShortVideoService>(ConstGRPC.SHORT_VIDEO_SERVICE);
      this._aiMessageGrpc = this.client.getService<AiMessageGrpc>(ConstGRPC.AI_MESSAGE_SERVICE);
      this._aiSessionGrpc = this.client.getService<AiSessionGrpc>(ConstGRPC.AI_SESSION_SERVICE);
      this._geminiGrpc = this.client.getService<GeminiGrpc>(ConstGRPC.GEMINI_SERVICE);
      this._authGrpc = this.client.getService<AuthGrpc>(ConstGRPC.AUTH_SERVICE);
      this._courseGrpc = this.client.getService<CourseGrpc>(ConstGRPC.COURSE_SERVICE);
      this._fixServiceGrpc = this.client.getService<FixServiceGrpc>(ConstGRPC.FIX_SERVICE_SERVICE);
      this._statsGrpc = this.client.getService<StatsGrpc>(ConstGRPC.STATS_SERVICE);
    } catch (error) {
      ConsoleKit.errorKit('Failed to initialize services:', error);
    }
  }

  getService<T extends object = object>(serviceName: string): T {
    // ClientProxy created by ClientProxyFactory implements getService via underlying ClientGrpc
    return this.client.getService<T>(serviceName);
  }

  private async runServiceOnce<T extends object = object, R extends object = object>(
    serviceName: string,
    operation: (service: T) => Observable<R>,
  ): Promise<R> {
    return await firstValueFrom(
      operation(this.client.getService<T>(serviceName)).pipe(
        timeout(30000),
        catchError((err: { code?: number; details?: string; message?: string } & Error) => exceptionForMicroservice(err)),
      ),
    );
  }

  async runThisServiceOnce<R extends object = object>(observable: Observable<R>): Promise<R> {
    return await firstValueFrom(
      observable.pipe(
        timeout(30000),
        catchError((err: { code?: number; details?: string; message?: string } & Error) => exceptionForMicroservice(err)),
      ),
    );
  }

  private async runServiceRetry<T extends object = object, R extends object = object>(
    serviceName: string,
    operation: (service: T) => Observable<R>,
    retryCount: number = 2,
    retryDelayMs: number = 1000,
  ): Promise<R> {
    return await firstValueFrom(
      operation(this.client.getService<T>(serviceName)).pipe(
        timeout(30000),
        retry({ count: retryCount, delay: retryDelayMs }),
        catchError((err: { code?: number; details?: string; message?: string } & Error) => exceptionForMicroservice(err)),
      ),
    );
  }

  async runThisServiceRetry<R extends object = object>(observable: Observable<R>, retryCount: number = 2, retryDelayMs: number = 1000): Promise<R> {
    return await firstValueFrom(
      observable.pipe(
        timeout(30000),
        retry({ count: retryCount, delay: retryDelayMs }),
        catchError((err: { code?: number; details?: string; message?: string } & Error) => exceptionForMicroservice(err)),
      ),
    );
  }

  onModuleDestroy() {
    try {
      this.client.close?.();
    } catch {
      /* ignore */
    }
  }
}
