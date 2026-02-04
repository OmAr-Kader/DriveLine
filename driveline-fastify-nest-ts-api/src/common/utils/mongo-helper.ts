import { ServiceUnavailableException } from '@nestjs/common';
import mongoose, { Connection } from 'mongoose';
import { APIResponse, sendApiResponse } from 'src/common/types/fastify-type';
import { ConsoleKit } from 'src/common/utils/LogKit';

export type ClientSession = mongoose.mongo.ClientSession;
type TransactionOptions = mongoose.mongo.TransactionOptions;

export const defaultTxnOptions: TransactionOptions = {
  readPreference: 'primary',
  readConcern: { level: 'local' },
  writeConcern: { w: 'majority' },
};

export class BaseSuccess {
  json: object;
  status: number;

  constructor(status: number, json: object) {
    this.json = json;
    this.status = status;
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export async function baseFunction(reply: APIResponse, callback: () => Promise<BaseSuccess>) {
  try {
    const response = await callback();
    return sendApiResponse(reply, response.status, response.json);
  } catch (err: any) {
    if (err instanceof HttpError) {
      return sendApiResponse(reply, err.status, { error: err.message });
    }
    ConsoleKit.errorKit('createMessage error:', err);
    return sendApiResponse(reply, 500, { error: 'Internal server error' });
  }
}

/**
 * Create a new session AND first message atomically.
 * Body: { title: string; text: string; isUser: boolean }
 * Returns: { session, message }
 */
async function supportsTransactions(): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      ConsoleKit.warnKit('MongoDB connection not ready yet. Assuming transactions are not supported.');
      return false;
    }

    const admin = db.admin();
    // prefer "hello" (modern), fallback to "isMaster"
    let info: {
      logicalSessionTimeoutMinutes?: number;
      setName?: string;
      msg?: string;
    };
    try {
      info = await admin.command({ hello: 1 });
    } catch {
      info = await admin.command({ isMaster: 1 });
    }

    // logicalSessionTimeoutMinutes is required for sessions (and thus transactions)
    const hasLogicalSession = typeof info.logicalSessionTimeoutMinutes === 'number' && info.logicalSessionTimeoutMinutes > 0;
    const isReplicaSet = !!info.setName; // replica set
    const isMongos = !!info.msg && info.msg === 'isdbgrid'; // mongos

    // Transactions require replica set members (or sharded cluster with replica sets).
    // For sharded cluster, the router (mongos) will return isMaster/hello info with msg === 'isdbgrid'
    if (!hasLogicalSession) {
      ConsoleKit.warnKit('MongoDB logical sessions not available; transactions are not supported on this deployment.');
      return false;
    }

    // If replica set or mongos (sharded), we treat as transaction-capable
    return isReplicaSet || isMongos;
  } catch (err) {
    ConsoleKit.warnKit('Failed to detect transactions support; assuming not supported.', err);
    return false;
  }
}

export function trimLastMessage(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;

  // Take the first maxLength characters
  let truncated = text.slice(0, maxLength);

  // Remove partial last word
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated;
}

/**
 * Run the provided async callback inside a Mongoose transaction.
 * Centralizes session lifecycle (start / withTransaction / end).
 *
 * The callback receives the active ClientSession and should use it for all DB ops.
 */
export async function withDbTransaction<T>(callback: (session: ClientSession) => Promise<T>, options?: TransactionOptions): Promise<T> {
  const session: ClientSession = await mongoose.startSession();
  try {
    let result: T | undefined = undefined;
    await session.withTransaction(async () => {
      result = await callback(session);
    }, options);
    if (result === undefined) {
      throw new ServiceUnavailableException('Transaction did not return a result.');
    }
    // result is assigned inside the transaction callback
    return result as T;
  } finally {
    await session.endSession();
  }
}

/**
 * 
 * ```ts
 * const response = await transactionFullHandler(
         async (session) => {
         },
         {
             readPreference: 'primary',
             readConcern: { level: 'local' },
             writeConcern: { w: 'majority' },
         }
     );
 * ```
 */
export async function transactionFullHandler<T>(
  callback: (session: ClientSession | null) => Promise<T>,
  db?: Connection,
  options: TransactionOptions = defaultTxnOptions,
): Promise<T> {
  const canUseTransactions = await supportsTransactions();
  if (!canUseTransactions) {
    ConsoleKit.warnKit('⚠️ MongoDB transactions not supported; running without session.');
    return callback(null);
  }

  const session: ClientSession = db ? await db.startSession() : await mongoose.startSession();
  try {
    // Capture the result from the transaction callback. Some drivers don't propagate return value,
    // so we capture it in an outer variable to be safe.
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await callback(session);
      // returning result inside doesn't hurt, but not all wrappers forward it, so we use the outer var.
      return result;
    }, options);

    if (typeof result === 'undefined') {
      throw new ServiceUnavailableException('Transaction callback did not return a result.');
    }
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}
