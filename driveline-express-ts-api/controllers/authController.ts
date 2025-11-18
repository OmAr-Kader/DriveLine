// src/controllers/authController.ts
import { Request, Response } from 'express';
import { scryptSync, timingSafeEqual, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { projectionFromRequest } from '../utils/projection';

// use env var for secret, fallback for dev
const JWT_SECRET = process.env.JWT_SECRET || 'jwt';

/**
 * ✅ REGISTER
 * Creates a user safely, hashes password, and applies projection/excludes.
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, phone, role, password } = req.body;
        if (!name || !email || !password || !phone) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        const hashedPassword = await hashPassword(password);
        const user = await User.create({ name, email, phone, role, password: hashedPassword });

        // exclude password always, even if requested
        const projection = projectionFromRequest(req, [], {
            forceExclude: ['password'],
        });

        const safeUser = await User.findById(user._id).select(projection);

        res.status(201).json({
            message: '✅ User registered successfully',
            user: safeUser,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * ✅ LOGIN
 * Verifies credentials, returns JWT, and applies projection rules.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        // Explicitly include password only here
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password--' });
            return;
        }

        process.env.DEBUG === 'true' && console.log('incoming password raw:', JSON.stringify(password));
        process.env.DEBUG === 'true' && console.log('stored hash:', user ? user.password : 'NO_HASH');

        const isMatch = await verifyPassword(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET,);//{ expiresIn: "7d" }

        // Use projection logic for consistent field visibility
        const projection = projectionFromRequest(req, [], {
            forceExclude: ['password'],
        });

        const safeUser = await User.findById(user._id).select(projection);

        res.status(200).json({
            message: '✅ Login successful',
            token,
            user: safeUser,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    const hashVerify = scryptSync(password, salt, 64).toString('hex');
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashVerify, 'hex'));
}