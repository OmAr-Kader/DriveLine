import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Types } from 'mongoose';
import { CreateSessionRequest, ListSessionsRequest } from 'src/common/dto/aiSession.dto';
import { AiSessionService } from 'src/grpc/services/aiSession.service';
import { Const_GRPC_AISession, ConstGRPC } from 'src/common/utils/Const';
import { AiMessage } from 'src/common/schema/aiMessage.schema';
import { AiSession } from 'src/common/schema/aiSession.schema';

@Controller()
export class AiSessionController {
  constructor(private readonly aiSessionService: AiSessionService) {}

  @GrpcMethod(ConstGRPC.AI_SESSION_SERVICE, Const_GRPC_AISession.CreateSessionAndAddFirstMessage)
  async CreateSessionAndAddFirstMessage(data: {
    payload: { userId: string; title: string; text: string; isUser: boolean };
  }): Promise<{ session: AiSession; message: AiMessage }> {
    return await this.aiSessionService.createSessionAndAddFirstMessage(
      new Types.ObjectId(data.payload.userId),
      data.payload.title,
      data.payload.text,
      data.payload.isUser,
    );
  }

  @GrpcMethod(ConstGRPC.AI_SESSION_SERVICE, Const_GRPC_AISession.CreateSession)
  async CreateSession(data: CreateSessionRequest): Promise<{ session: AiSession }> {
    return await this.aiSessionService.createSession(new Types.ObjectId(data.userId), data.payload.title);
  }

  @GrpcMethod(ConstGRPC.AI_SESSION_SERVICE, Const_GRPC_AISession.ListSessions)
  async ListSessions(data: ListSessionsRequest): Promise<{ sessions: AiSession[] }> {
    return await this.aiSessionService.listSessions(
      new Types.ObjectId(data.headers.currentUserId),
      data.queries.limit,
      data.queries.skip,
      data.queries.needTimestamp,
    );
  }

  @GrpcMethod(ConstGRPC.AI_SESSION_SERVICE, Const_GRPC_AISession.UpdateSessionTitle)
  async updateSessionTitleUpdateSessionTitle(data: { id: string; title: string; currentUserID: string }): Promise<{ session: AiSession }> {
    return await this.aiSessionService.updateSessionTitle(new Types.ObjectId(data.id), data.title, data.currentUserID);
  }

  @GrpcMethod(ConstGRPC.AI_SESSION_SERVICE, Const_GRPC_AISession.DeleteSession)
  async deleteSessionDeleteSession(data: { id: string; currentUserID: string }): Promise<void> {
    await this.aiSessionService.deleteSession(new Types.ObjectId(data.id), data.currentUserID);
  }
}
