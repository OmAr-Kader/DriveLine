import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    building?: string;
    floor?: string;
    unit?: string;
    postal_code?: string;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string; // stored, but select:false
    phone: string;
    image: string;
    age?: number;
    role: 'user' | 'tech';
    location?: ILocation;
    createdAt?: Date;
    updatedAt?: Date;
}

const LocationSchema = new Schema<ILocation>(
    {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        street: { type: String },
        building: { type: String },
        floor: { type: String },
        unit: { type: String },
        postal_code: { type: String }
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        image: { type: String, default: null },
        age: { type: Number },
        role: { type: String, enum: ['user', 'tech'], default: 'user' },
        location: { type: LocationSchema, default: {} }
    },
    { timestamps: true }
);

// helpful index if you query by email frequently
//UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);