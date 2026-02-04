import { RpcException } from '@nestjs/microservices';
import { Query, Types, Document } from 'mongoose';
import { status } from '@grpc/grpc-js';

export class MongoMetaObject {
  _id: Types.ObjectId;
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MongoMeta {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

declare module 'mongoose' {
  // Extend Query to add a `toObject` helper that executes the query and
  // converts the plain result(s) into class instances using class-transformer.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown, QueryOp = 'find', TDocOverrides = Record<string, never>> {
    /**
     * Execute the query and transform the plain result(s) into class instance(s).
     * - Handles single document, null, and arrays of documents.
     */
    /**
     * Execute the query and return the raw result(s) (no transformation) when
     * called without arguments. Optionally pass a class constructor to convert
     * plain objects to class instances with `class-transformer`.
     */
    execLeanObject<T = ResultType>(
      this: Query<ResultType, DocType, THelpers, RawDocType, QueryOp, TDocOverrides>,
      options?: {
        mongoObject?: boolean;
        timeStamp?: boolean;
      },
    ): Promise<T>;

    execLeanObject<T>(
      this: Query<ResultType, DocType, THelpers, RawDocType, QueryOp, TDocOverrides>,
      options?: {
        mongoObject?: boolean;
        timeStamp?: boolean;
      },
    ): Promise<ResultType extends Array<unknown> ? T[] : ResultType extends null ? null : T>;
  }
}

// Implementation: call `.exec()` and either return the raw result or pass the
// result(s) through `plainToInstance` when a class is supplied.
Query.prototype.execLeanObject = async function <ResultType, DocType, THelpers, RawDocType, QueryOp, TDocOverrides, T = object>(
  this: Query<ResultType, DocType, THelpers, RawDocType, QueryOp, TDocOverrides>,
  options?: {
    mongoObject?: boolean;
    timeStamp?: boolean;
  },
) {
  if (options?.mongoObject === true) {
    const res = await this.exec();
    // Transform into instances using class-transformer
    if (res === null) return null;
    if (Array.isArray(res)) {
      const result = res.map((item: T & Document) => item.toObject<T>());
      return result as unknown as T[];
    }

    return (res as T & Document).toObject<T>() as unknown as T;
  } else {
    const res = await this.lean<T & MongoMeta>().exec();
    // Transform into instances using class-transformer
    if (res === null) return null;
    if (Array.isArray(res)) {
      return toMongoListObject(res, options?.timeStamp) as unknown as T[];
    }

    return toMongoObject(res, options?.timeStamp) as unknown as T;
  }
};

export function toMongoListObject<T extends MongoMeta>(list: T[], timeStamp?: boolean): (T & MongoMetaObject)[] {
  if (!Array.isArray(list) || list.length === 0) return [];

  const haveDateProjection = list[0].createdAt !== undefined;
  const isStringDate = typeof list[0].createdAt === 'string';

  if (haveDateProjection && timeStamp === true) {
    if (isStringDate) {
      for (let i = 0; i < list.length; i++) {
        const obj = list[i];
        const read = obj as unknown as MongoMeta;
        const write = obj as unknown as MongoMetaObject;

        write.id = idToString(read._id);
        write.createdAt = read.createdAt as unknown as string;
        write.updatedAt = read.updatedAt as unknown as string;
      }
      return list as (T & MongoMetaObject)[];
    }
    for (let i = 0; i < list.length; i++) {
      const obj = list[i];
      const read = obj as unknown as MongoMeta;
      const write = obj as unknown as MongoMetaObject;

      write.id = idToString(read._id);
      write.createdAt = read.createdAt?.toISOString();
      write.updatedAt = read.updatedAt?.toISOString();
    }
    return list as (T & MongoMetaObject)[];
  }

  for (let i = 0; i < list.length; i++) {
    const obj = list[i];
    const read = obj as unknown as MongoMeta;
    const write = obj as unknown as MongoMetaObject;

    write.id = idToString(read._id);
    write.createdAt = undefined;
    write.updatedAt = undefined;
  }
  return list as (T & MongoMetaObject)[];
}

export function toMongoObject<T>(obj: T & MongoMeta, timeStamp?: boolean): T & MongoMetaObject {
  const haveDateProjection = obj.createdAt !== undefined;

  if (haveDateProjection && timeStamp === true) {
    const read = obj as unknown as MongoMeta;
    const write = obj as unknown as MongoMetaObject;

    write.id = idToString(read._id);
    write.createdAt = typeof read.createdAt === 'string' ? read.createdAt : read.createdAt?.toISOString();
    write.updatedAt = typeof read.updatedAt === 'string' ? read.updatedAt : read.updatedAt?.toISOString();
    return obj as T & MongoMetaObject;
  }

  const read = obj as unknown as MongoMeta;
  const write = obj as unknown as MongoMetaObject;

  write.id = idToString(read._id);
  write.createdAt = undefined;
  write.updatedAt = undefined;
  return obj as T & MongoMetaObject;
}

export function idToString(id: Types.ObjectId | string | null | undefined): string {
  if (id === null || id === undefined) throw new RpcException({ code: status.NOT_FOUND, message: 'Invalid ID value' });
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null) {
    const anyId = id;
    if (typeof anyId.toHexString === 'function') return anyId.toHexString();
    if (typeof anyId.toString === 'function') return anyId.toString();
  }
  return String(id);
}

export function normalizeObject<T extends object>(obj: T): T {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return normalizeObject(item);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return item;
    }) as T;
  }

  // Handle objects
  const keys = Object.keys(obj);

  // Check if empty object -> convert to null
  if (keys.length === 0) {
    return null as unknown as T;
  }

  const result: Record<string, unknown> = {};
  let hasNonUnderscoreKeys = false;

  for (const key of keys) {
    if (key.startsWith('_')) {
      continue;
    }

    hasNonUnderscoreKeys = true;
    const value = obj[key as keyof T];

    // Handle nested objects
    if (value !== null && value !== undefined && typeof value === 'object') {
      result[key] = normalizeObject(value as object);
    } else {
      result[key] = value;
    }
  }

  // If all keys were underscore-prefixed, treat as empty object -> null
  if (!hasNonUnderscoreKeys) {
    return null as unknown as T;
  }

  return result as T;
}
