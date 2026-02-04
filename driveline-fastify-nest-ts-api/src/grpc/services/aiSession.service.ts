import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { transactionFullHandler } from 'src/common/utils/mongo-helper';
import { AiMessage, AiMessageDocument } from 'src/common/schema/aiMessage.schema';
import { AiSession, AiSessionDocument } from 'src/common/schema/aiSession.schema';
import { QueueService } from 'src/common/rabbitMQ/QueueService';

@Injectable()
export class AiSessionService {
  constructor(
    @InjectModel(AiSession.name) private aiSessionModel: Model<AiSessionDocument>,
    @InjectModel(AiMessage.name) private aiMessageModel: Model<AiMessageDocument>,
    private readonly queueService: QueueService,
  ) {}

  async createSessionAndAddFirstMessage(
    userId: Types.ObjectId,
    title: string,
    text: string,
    isUser: boolean,
  ): Promise<{ session: AiSession; message: AiMessage }> {
    const res = await transactionFullHandler(async (session) => {
      const _createdSession = new this.aiSessionModel({ userId, title, lastMessage: '' });
      const createdSessionId = _createdSession._id as string | Types.ObjectId | undefined;
      if (!_createdSession || !createdSessionId || !Types.ObjectId.isValid(createdSessionId)) {
        throw new RpcException({ code: status.FAILED_PRECONDITION, message: 'Failed to create session' });
      }
      const _messageDoc = new this.aiMessageModel({ sessionId: createdSessionId, text, isUser });
      const messageDoc = await _messageDoc.save(session ? { session } : undefined);
      _createdSession.lastMessage = this.trimLastMessage(text);
      const createdSession = await _createdSession.save(session ? { session } : undefined);

      return {
        session: createdSession.toObject(),
        message: messageDoc.toObject(),
      };
    });
    this.queueService.trackActivity(userId.toHexString(), 'ai_session_created_with_message', 'ai_session', res.session.id, { title });
    return res;
  }

  async createSession(userId: Types.ObjectId, title: string): Promise<{ session: AiSession }> {
    const session = new this.aiSessionModel({ userId, title });
    const savedSession = await session.save();
    this.queueService.trackActivity(userId.toHexString(), 'ai_session_created', 'ai_session', session.id, { title });
    return { session: savedSession };
  }

  async listSessions(userId: Types.ObjectId, limit?: number, skip?: number, needTimestamp?: boolean): Promise<{ sessions: AiSession[] }> {
    const sessions = await this.aiSessionModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip ?? 0)
      .limit(limit ?? 0)
      .execLeanObject<AiSession[]>({ timeStamp: needTimestamp ?? undefined });
    this.queueService.trackActivity(userId.toHexString(), 'ai_sessions_listed', 'ai_session', 'list', { count: sessions.length });
    return { sessions };
  }

  async updateSessionTitle(id: Types.ObjectId, title: string, currentUserID: string): Promise<{ session: AiSession }> {
    const session = await this.aiSessionModel.findByIdAndUpdate(id, { title }, { new: true }).execLeanObject<AiSession>();
    if (!session) throw new RpcException({ code: status.NOT_FOUND, message: 'Session not found' });
    this.queueService.trackActivity(currentUserID, 'ai_session_title_updated', 'ai_session', id.toHexString(), { newTitle: title });
    return { session };
  }

  async deleteSession(id: Types.ObjectId, currentUserID: string): Promise<void> {
    await transactionFullHandler(async (session) => {
      const aiSession = await this.aiSessionModel.findById(id).session(session).lean().exec();
      if (!aiSession) throw new RpcException({ code: status.NOT_FOUND, message: 'Session not found' });
      await this.aiMessageModel.deleteMany({ sessionId: id }).session(session); // <== add await
      await this.aiSessionModel.findByIdAndDelete(id).session(session); // <== add await
    }, this.aiSessionModel.db);
    this.queueService.trackActivity(currentUserID, 'ai_session_deleted', 'ai_session', id.toHexString(), {});
    return;
  }

  private trimLastMessage(text: string, maxLength = 100): string {
    if (text.length <= maxLength) return text;
    let truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.slice(0, lastSpace);
    }
    return truncated;
  }
}
