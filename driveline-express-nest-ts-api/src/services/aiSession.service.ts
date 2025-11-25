/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { transactionFullHandler } from 'src/controllers/helper';
import { AiMessage } from 'src/schema/aiMessage.schema';
import { AiSession } from 'src/schema/aiSession.schema';

@Injectable()
export class AiSessionService {
  constructor(
    @InjectModel(AiSession.name) private aiSessionModel: Model<AiSession>,
    @InjectModel(AiMessage.name) private aiMessageModel: Model<AiMessage>,
  ) {}

  async createSessionAndAddFirstMessage(userId: Types.ObjectId, title: string, text: string, isUser: boolean): Promise<object> {
    const res = await transactionFullHandler(async (session) => {
      const sessionDoc = await this.aiSessionModel.create([{ userId, title, lastMessage: '' }], session ? { session } : undefined);
      const messageDoc = await this.aiMessageModel.create([{ sessionId: sessionDoc[0]._id, text, isUser }], session ? { session } : undefined);
      sessionDoc[0].lastMessage = this.trimLastMessage(text);
      await sessionDoc[0].save(session ? { session } : undefined);
      return { session: sessionDoc[0], message: messageDoc[0] };
    });
    return res;
  }

  async createSession(userId: Types.ObjectId, title: string): Promise<AiSession> {
    const session = new this.aiSessionModel({ userId, title });
    return await session.save();
  }

  async listSessions(userId: Types.ObjectId, limit = 50, skip = 0): Promise<AiSession[]> {
    return this.aiSessionModel.find({ userId }).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean<AiSession[]>().exec();
  }

  async updateSessionTitle(id: Types.ObjectId, title: string): Promise<AiSession> {
    const updated = await this.aiSessionModel.findByIdAndUpdate(id, { title }, { new: true }).lean<AiSession>().exec();
    if (!updated) throw new NotFoundException('Session not found');
    return updated;
  }

  async deleteSession(id: Types.ObjectId): Promise<void> {
    await transactionFullHandler(async (session) => {
      const aiSession = await this.aiSessionModel.findById(id).session(session).lean();
      if (!aiSession) throw new NotFoundException('Session not found');
      await this.aiMessageModel.deleteMany({ sessionId: id }).session(session); // <== add await
      await this.aiSessionModel.findByIdAndDelete(id).session(session); // <== add await
    }, this.aiSessionModel.db);
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
}
