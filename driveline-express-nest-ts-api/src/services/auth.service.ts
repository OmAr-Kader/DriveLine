/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '../schema/user.schema';
import { LoginUserDto } from 'src/dto/login.user.dto';
import { RegisterUserDto } from 'src/dto/register.user.dto';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async registerUser(data: RegisterUserDto): Promise<{ message: string; user: Partial<UserDocument> }> {
    const { name, email, phone, role, password } = data;
    if (!name || !email || !password || !phone) {
      throw new Error('All fields are required');
    }

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new Error('Email already registered');

    const hashedPassword = this.hashPassword(password);
    const user = await this.userModel.create({
      name,
      email,
      phone,
      role,
      password: hashedPassword,
    });

    // You may need a projection util here (implementation not shown)
    const safeUser = await this.userModel.findById(user._id).select('-password');

    if (!safeUser) throw new Error('Unable to find registered user');

    return {
      message: '✅ User registered successfully',
      user: safeUser.toObject(), // now _id is ObjectId
    };
  }

  async loginUser(data: LoginUserDto): Promise<{ message: string; token: string; user: Partial<UserDocument> }> {
    const { email, password } = data;
    if (!email || !password) throw new Error('Email and password are required');

    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid email or password');

    const isMatch = this.verifyPassword(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('Server configuration error');

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    const safeUser = await this.userModel.findById(user._id).select('-password');
    if (!safeUser) throw new Error('Unable to find logged-in user');

    return {
      message: '✅ Login successful',
      token,
      user: safeUser.toObject(),
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':');
    const hashVerify = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashVerify, 'hex'));
  }
}
