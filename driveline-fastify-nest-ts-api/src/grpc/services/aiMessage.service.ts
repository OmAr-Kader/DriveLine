import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientSession, transactionFullHandler, trimLastMessage } from 'src/common/utils/mongo-helper';
import { AiMessage } from 'src/common/schema/aiMessage.schema';
import { AiSession } from 'src/common/schema/aiSession.schema';
import { QueueService } from 'src/common/rabbitMQ/QueueService';
import { GetAIMessageResponse, GetAIMessagesBySessionResponse } from 'src/common/dto/aiMessage.dto';

@Injectable()
export class AiMessageService {
  constructor(
    @InjectModel(AiMessage.name) private aiMessageModel: Model<AiMessage>,
    @InjectModel(AiSession.name) private aiSessionModel: Model<AiSession>,
    private readonly queueService: QueueService,
  ) {}

  async createMessage(sessionId: Types.ObjectId, text: string, isUser: boolean, currentUserID: string): Promise<{ message: AiMessage | undefined }> {
    const messageDoc = await transactionFullHandler(async (session) => {
      const sessionDoc = await this.aiSessionModel.findById(sessionId).session(session);
      if (!sessionDoc) throw new RpcException({ code: status.NOT_FOUND, message: 'Session not found' });

      const [messageDoc] = await this.aiMessageModel.create([{ sessionId, text, isUser }], { session });
      sessionDoc.lastMessage = this.trimLastMessage(text);
      await sessionDoc.save({ session });
      return messageDoc.toObject();
    }, this.aiSessionModel.db);
    this.queueService.trackActivity(currentUserID, 'ai_message_created', 'ai_message', messageDoc.id, {
      sessionId: sessionId.toHexString(),
    });
    return { message: messageDoc };
  }

  async getMessage(id: Types.ObjectId, currentUserID: string): Promise<GetAIMessageResponse> {
    const message = await this.aiMessageModel.findById(id).execLeanObject<AiMessage>();
    if (!message) throw new RpcException({ code: status.NOT_FOUND, message: 'Message not found' });
    this.queueService.trackActivity(currentUserID, 'ai_message_viewed', 'ai_message', id.toHexString(), {
      sessionId: message.sessionId.toHexString(),
    });
    return { message };
  }

  async getMessagesBySession(
    sessionId: Types.ObjectId,
    currentUserID: string,
    limit = 100,
    sort?: string,
    skip?: number,
    needTimestamp?: boolean,
  ): Promise<GetAIMessagesBySessionResponse> {
    const sortDir = (sort ? sort : 'desc') === 'desc' ? -1 : 1;
    const messages = await this.aiMessageModel
      .find({ sessionId })
      .sort({ createdAt: sortDir })
      .limit(limit)
      .execLeanObject<AiMessage[]>({ timeStamp: needTimestamp ?? undefined });
    this.queueService.trackActivity(currentUserID, 'ai_messages_viewed', 'ai_message', sessionId.toHexString(), { limit, sort });
    return { messages };
  }

  async updateMessage(id: Types.ObjectId, currentUserID: string, text?: string, isUser?: boolean): Promise<{ message: AiMessage }> {
    const message = await transactionFullHandler(async (session) => {
      const message = await this.aiMessageModel.findById(id).session(session);
      if (!message) throw new RpcException({ code: status.NOT_FOUND, message: 'Message not found' });
      if (text !== undefined) message.text = text;
      if (isUser !== undefined) message.isUser = isUser;
      await message.save({ session });
      await this.updateLastMessage(message.sessionId, session);
      return message.toObject();
    }, this.aiSessionModel.db);
    this.queueService.trackActivity(currentUserID, 'ai_message_updated', 'ai_message', id.toHexString(), {
      textChanged: text !== undefined,
      isUserChanged: isUser !== undefined,
    });
    return { message };
  }

  async deleteMessage(ids: Types.ObjectId[], currentUserID: string): Promise<{ message: string }> {
    await transactionFullHandler(async (session) => {
      await this.aiMessageModel
        .deleteMany({ _id: { $in: ids } })
        .session(session)
        .lean()
        .exec();

      for (const sessionId of ids) {
        await this.updateLastMessage(sessionId, session);
      }
    }, this.aiSessionModel.db);
    this.queueService.trackActivity(currentUserID, 'ai_message_deleted', 'ai_message', '', { ids: ids.map((id) => id.toHexString()).join(',') });
    return { message: 'Deleted successfully' };
  }

  async updateLastMessage(sessionId: Types.ObjectId, session: ClientSession | null) {
    const latest = await this.aiMessageModel.findOne({ sessionId }).sort({ createdAt: -1 }).session(session).execLeanObject<AiMessage>();
    const lastMessage = this.trimLastMessage(latest?.text || '');
    await this.aiSessionModel.findByIdAndUpdate(sessionId, { lastMessage }).session(session).lean().exec();
  }

  trimLastMessage(text: string, maxLength = 100): string {
    if (text.length <= maxLength) return text;
    let truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
    return truncated;
  }

  async createMessageFromServer(sessionId: Types.ObjectId, question: string, answer: string | undefined, saveQuestion: boolean): Promise<AiMessage> {
    if (typeof question !== 'string' || typeof answer !== 'string') {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'sessionId and text are required for createMessageFromServer' });
    }

    // optional: basic validation/sanitization
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'text must not be empty' });
    }

    const addSeconds = (seconds: number): Date => {
      const now = new Date();
      return new Date(now.getTime() + seconds * 1000);
    };
    const getList = () => {
      let list: {
        sessionId: Types.ObjectId;
        text: string;
        isUser: boolean;
        createdAt: Date;
        updatedAt: Date;
      }[] = [];
      const q = new Date();
      const a = addSeconds(1);
      if (saveQuestion) {
        if (answer != undefined) {
          list = [
            {
              sessionId,
              text: trimmedQuestion,
              isUser: true,
              createdAt: q,
              updatedAt: q,
            },
            {
              sessionId,
              text: answer.trim(),
              isUser: false,
              createdAt: a,
              updatedAt: a,
            },
          ];
        } else {
          list = [
            {
              sessionId,
              text: trimmedQuestion,
              isUser: true,
              createdAt: q,
              updatedAt: q,
            },
          ];
        }
      } else {
        if (answer != undefined) {
          list = [
            {
              sessionId,
              text: answer.trim(),
              isUser: false,
              createdAt: q,
              updatedAt: q,
            },
          ];
        }
      }
      return list;
    };

    const list = getList();
    if (list.length == 0) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Nothing To Save' });
    }
    const lastTxt = list[list.length - 1].text;
    if (!lastTxt) {
      throw new RpcException({ code: status.INVALID_ARGUMENT, message: 'Nothing To Save' });
    }
    const createdMessage = await transactionFullHandler(async (session) => {
      const sessionDoc = session ? await this.aiSessionModel.findById(sessionId).session(session) : await this.aiSessionModel.findById(sessionId);

      if (!sessionDoc) throw new RpcException({ code: status.NOT_FOUND, message: 'Session not found' });

      // Create message inside transaction
      // Passing an array and session returns an array of created docs

      const created = await this.aiMessageModel.insertMany(list, session ? { session, ordered: true } : { ordered: true });
      const createdMessage = Array.isArray(created) ? created[created.length - 1] : created;

      // Update the parent session inside the same transaction
      sessionDoc.lastMessage = trimLastMessage(lastTxt);
      await sessionDoc.save(session ? { session } : undefined);
      return createdMessage.toObject();
    }, this.aiSessionModel.db);
    return createdMessage;
  }
}
