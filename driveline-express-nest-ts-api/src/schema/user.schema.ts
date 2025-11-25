import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

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
  strict: true,
  minimize: true,
  id: false,
  toObject: { getters: false },
  toJSON: { getters: false },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ default: null })
  image: string;

  @Prop()
  age?: number;

  @Prop({ enum: ['user', 'tech'], default: 'user' })
  role: 'user' | 'tech';

  @Prop({ type: Location })
  location?: Location;
}

export const UserSchema = SchemaFactory.createForClass(User);
