import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MongoMeta, MongoMetaObject } from '../types/mongoose-extensions';

export type UserDocument = HydratedDocument<User> & MongoMeta;

export class Location {
  @Prop() country?: string;
  @Prop() state?: string;
  @Prop() city?: string;
  @Prop() street?: string;
  @Prop() building?: string;
  @Prop() floor?: string;
  @Prop() unit?: string;
  @Prop() postal_code?: string;
}

@Schema({
  timestamps: true,
  versionKey: false,
  id: true,
  toObject: {
    getters: true,
    versionKey: false,
    virtuals: true,
    aliases: false,
    flattenObjectIds: true,
    schemaFieldsOnly: true,
  },
  toJSON: { getters: true },
})
export class User extends MongoMetaObject {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ type: String, trim: true, default: null, sparse: true, unique: true })
  stripeId?: string | null;

  @Prop({ type: String, trim: true, default: null, sparse: true, unique: true })
  stripeGatewayId?: string | null;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password?: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ type: String, default: null })
  image?: string | null;

  @Prop()
  age?: number;

  @Prop({ enum: ['user', 'tech'], default: 'user' })
  role: 'user' | 'tech';

  @Prop({ type: Location })
  location?: Location;
}

export const UserSchema = SchemaFactory.createForClass(User);
