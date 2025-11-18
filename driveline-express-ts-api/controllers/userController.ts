import { Request, Response } from 'express';
import User from '../models/User';
import { projectionFromRequest } from '../utils/projection';
import { ServiceModel } from '../models/fixService';
import { CourseModel } from '../models/course';
import { ShortVideModel } from '../models/shortVideo';
import mongoose, { Types } from 'mongoose';

// ✅ CREATE a new user
export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// ✅ READ all users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {

        const runtimeExcludes: string[] = ['password']; // e.g. ['email'] or [], pass dynamic based on route or role

        // You can override defaults via opts if needed
        const projection = projectionFromRequest(req, runtimeExcludes, { maxFields: 200 });

        // Use projection as second arg; use lean() for performance
        const users = await User.find({}, projection).lean().exec();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ READ one user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }

        const runtimeExcludes: string[] = ['password']; // e.g. ['email'] or [], pass dynamic based on route or role

        // You can override defaults via opts if needed
        const projection = projectionFromRequest(req, runtimeExcludes, { maxFields: 200 });

        const user = await User.findById(id, projection).lean().exec();

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json(user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// =========================================================
//  GET USER + SERVICES + COURSES IN ONE FAST ENDPOINT
// =========================================================

export const getProfileById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid id" });
        }

        // Runtime exclude list
        const runtimeExcludes: string[] = ["password"];

        // Dynamic projection
        const userProjection = projectionFromRequest(req, runtimeExcludes, { maxFields: 200 });


        const filter: any = { techId: new Types.ObjectId(id) };
        const filterUser: any = { userId: new Types.ObjectId(id) };

        // =========================================================
        //  Run all 4 queries in parallel (FASTEST)
        // =========================================================

        const [user, services, courses, shorts] = await Promise.all([
            User.findById(id, userProjection).lean().exec(),
            ServiceModel.find(filter)
                .select({ __v: 0 })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            CourseModel.find(filter)
                .select({ __v: 0 })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            ShortVideModel.find(filterUser)
                .select({ __v: 0 })
                .sort({ createdAt: -1 })
                .lean()
                .exec()
        ]);

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({
            user,
            services,
            courses,
            shorts
        });

    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};


// ✅ UPDATE user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const headerUserId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client
        if (!headerUserId || id != headerUserId) {
            res.status(403).json({ message: 'User identity mismatch' });
            return;
        }

        const updates = req.body;

        // Optional: prevent updating sensitive fields directly
        const excludedFields = ["_id", "password", "__v", "email"];
        excludedFields.forEach((field) => delete (updates as any)[field]);

        const updatedUser = await User.findByIdAndUpdate(id, updates, {
            new: true,       // Return updated document
            runValidators: true // Re-run model validators
        }).select("-password");

        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "✅ User updated successfully",
            user: updatedUser
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const patchUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const headerUserId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client
        if (!headerUserId || id != headerUserId) {
            res.status(403).json({ message: 'User identity mismatch' });
            return;
        }
        
        const updates = { ...req.body };
        
        // Do NOT allow updating the password here
        delete (updates as any).password;
        delete (updates as any)._id;
        delete (updates as any).email;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true,
                strict: false    // allow adding fields not in schema
            }
        ).select("-password");   // ❗ ensure password is NOT returned

        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.status(200).json({
            message: "User patched successfully",
            user: updatedUser
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// ✅ DELETE user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const headerUserId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client
        if (!headerUserId || id != headerUserId) {
            res.status(403).json({ message: 'User identity mismatch' });
            return;
        }
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};