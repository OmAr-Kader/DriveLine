import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Types } from 'mongoose';
import { CreateAIMessage, GetMessagesBySessionRequest } from 'src/common/dto/aiMessage.dto';
import { AiMessageService } from 'src/grpc/services/aiMessage.service';
import { Const_GRPC_AIMessage, ConstGRPC } from 'src/common/utils/Const';
import { AiMessage } from 'src/common/schema/aiMessage.schema';

@Controller()
export class AiMessageController {
  constructor(private readonly aiMessageService: AiMessageService) {}

  @GrpcMethod(ConstGRPC.AI_MESSAGE_SERVICE, Const_GRPC_AIMessage.CreateMessage)
  async createMessageCreateMessage(data: { payload: CreateAIMessage; currentUserId?: string }): Promise<{ message: AiMessage | undefined }> {
    const { sessionId, text, isUser } = data.payload ?? {};
    return await this.aiMessageService.createMessage(new Types.ObjectId(sessionId), text, isUser, data.currentUserId ?? '');
  }

  @GrpcMethod(ConstGRPC.AI_MESSAGE_SERVICE, Const_GRPC_AIMessage.GetMessage)
  async GetMessage(data: { id: string; currentUserID: string }): Promise<{ message: AiMessage }> {
    return await this.aiMessageService.getMessage(new Types.ObjectId(data.id), data.currentUserID);
  }

  @GrpcMethod(ConstGRPC.AI_MESSAGE_SERVICE, Const_GRPC_AIMessage.UpdateMessage)
  async UpdateMessage(data: { id: string; currentUserID: string; text?: string; isUser?: boolean }): Promise<{ message: AiMessage }> {
    return await this.aiMessageService.updateMessage(new Types.ObjectId(data.id), data.currentUserID, data.text, data.isUser);
  }

  @GrpcMethod(ConstGRPC.AI_MESSAGE_SERVICE, Const_GRPC_AIMessage.GetMessagesBySession)
  async getMessagesBySession(data: GetMessagesBySessionRequest): Promise<{ messages: AiMessage[] }> {
    return await this.aiMessageService.getMessagesBySession(
      new Types.ObjectId(data.sessionId),
      data.headers.currentUserId,
      data.queries.limit,
      data.queries.sort,
      data.queries.skip,
      data.queries.needTimestamp,
    );
  }

  @GrpcMethod(ConstGRPC.AI_MESSAGE_SERVICE, Const_GRPC_AIMessage.DeleteMessage)
  async DeleteMessage(data: { ids: string[]; currentUserID: string }): Promise<{ message: string }> {
    const objectIds = data.ids.map((i) => new Types.ObjectId(i));
    const res = await this.aiMessageService.deleteMessage(objectIds, data.currentUserID);
    return res;
  }
}
