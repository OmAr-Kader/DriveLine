import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { transactionFullHandler, trimLastMessage } from 'src/controllers/helper';
import { AiMessage } from 'src/schema/aiMessage.schema';
import { AiSession } from 'src/schema/aiSession.schema';

@Injectable()
export class AiMessageService {
  constructor(
    @InjectModel(AiMessage.name) private aiMessageModel: Model<AiMessage>,
    @InjectModel(AiSession.name) private aiSessionModel: Model<AiSession>,
  ) {}

  async createMessage(sessionId: Types.ObjectId, text: string, isUser: boolean): Promise<AiMessage> {
    const messageDoc = await transactionFullHandler(async (session) => {
      const sessionDoc = await this.aiSessionModel.findById(sessionId).session(session);
      if (!sessionDoc) throw new NotFoundException('Session not found');

      const [messageDoc] = await this.aiMessageModel.create([{ sessionId, text, isUser }], { session });
      sessionDoc.lastMessage = this.trimLastMessage(text);
      await sessionDoc.save({ session });
      return messageDoc;
    }, this.aiSessionModel.db);

    return messageDoc;
  }

  async createMessageFromServer(sessionId: Types.ObjectId, question: string, answer: string | undefined, saveQuestion: boolean): Promise<AiMessage> {
    if (typeof question !== 'string' || typeof answer !== 'string') {
      throw new Error('sessionId and text are required for createMessageFromServer');
    }

    // optional: basic validation/sanitization
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      throw new Error('text must not be empty');
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
      throw new Error('Nothing To Save');
    }
    const lastTxt = list[list.length - 1].text;
    if (!lastTxt) {
      throw new Error('Nothing To Save');
    }
    const createdMessage: AiMessage | null = await transactionFullHandler(async (session) => {
      let createdMessage: object | undefined = undefined;
      const sessionDoc = session ? await this.aiSessionModel.findById(sessionId).session(session) : await this.aiSessionModel.findById(sessionId);

      if (!sessionDoc) throw new Error('Session not found');

      // Create message inside transaction
      // Passing an array and session returns an array of created docs

      const created = await this.aiMessageModel.insertMany(list, session ? { session, ordered: true } : { ordered: true });
      createdMessage = Array.isArray(created) ? created[created.length - 1] : created;

      // Update the parent session inside the same transaction
      sessionDoc.lastMessage = trimLastMessage(lastTxt);
      await sessionDoc.save(session ? { session } : undefined);
      return createdMessage as AiMessage;
    }, this.aiSessionModel.db);
    return createdMessage;
  }

  async getMessage(id: Types.ObjectId): Promise<AiMessage> {
    const message = await this.aiMessageModel.findById(id).lean<AiMessage>().exec();
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async getMessagesBySession(sessionId: Types.ObjectId, limit = 100, sort: 'asc' | 'desc' = 'desc'): Promise<AiMessage[]> {
    const sortDir = sort === 'desc' ? -1 : 1;
    return await this.aiMessageModel.find({ sessionId }).sort({ createdAt: sortDir }).limit(limit);
  }

  async updateMessage(id: Types.ObjectId, text?: string, isUser?: boolean): Promise<AiMessage> {
    const message = await transactionFullHandler(async (session) => {
      const message = await this.aiMessageModel.findById(id).session(session);
      if (!message) throw new NotFoundException('Message not found');
      if (text !== undefined) message.text = text;
      if (isUser !== undefined) message.isUser = isUser;
      await message.save({ session });
      await this.updateLastMessage(message.sessionId, session);
      return message;
    }, this.aiSessionModel.db);
    return message;
  }

  async deleteMessage(ids: Types.ObjectId[]): Promise<void> {
    await transactionFullHandler(async (session) => {
      const messages = await this.aiMessageModel.find({ _id: { $in: ids } }).session(session);
      if (!messages.length) throw new NotFoundException('No messages found');
      await this.aiMessageModel.deleteMany({ _id: { $in: ids } }).session(session);

      for (const sessionId of ids) {
        await this.updateLastMessage(sessionId, session);
      }
    }, this.aiSessionModel.db);
    return;
  }

  async updateLastMessage(sessionId: Types.ObjectId, session: ClientSession | null) {
    const latest = await this.aiMessageModel.findOne({ sessionId }).sort({ createdAt: -1 }).session(session);
    const lastMessage = this.trimLastMessage(latest?.text || '');
    await this.aiSessionModel.findByIdAndUpdate(sessionId, { lastMessage }).session(session);
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
