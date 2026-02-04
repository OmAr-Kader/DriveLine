import { Prop, Schema } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ toObject: { getters: true }, toJSON: { getters: true } })
export class MongooseMeta {
  id: string;

  @Prop({
    type: Date,
    get: (v: Date): string => v.toISOString(),
  })
  createdAt?: Date;

  @Prop({
    type: Date,
    get: (v: Date): string => v.toISOString(),
  })
  updatedAt?: Date;
}

export function baseTransform<T extends Document>(_doc: HydratedDocument<T>, ret: Record<string, unknown>) {
  if (!ret || typeof ret !== 'object') return ret;
  const candidateId = (ret as { _id?: unknown })._id;
  if (candidateId instanceof Types.ObjectId) {
    const out = { ...ret } as Record<string, unknown> & { _id?: string };
    out._id = candidateId.toHexString();
    return out;
  }
  return ret;
}

/**
 * @deprecated Can't Hold under the heavy load
 */
export function removeKey<T, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const cloned = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  const keys = Object.keys(cloned);
  let result: Record<string, unknown> = {};
  for (const k of keys) {
    // recreate the whole object on each iteration
    result = Object.assign({}, result, { [k]: cloned[k] });
    if (k === (key as string)) {
      delete result[k];
    }
  }
  return result as Omit<T, K>;
}
