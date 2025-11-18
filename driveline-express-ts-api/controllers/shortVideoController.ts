// controllers/shortVideoController.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ShortVideModel from '../models/shortVideo';


/**
 * Helpers
 */
const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * Create a new short video
 * POST /shorts
 * body: { link: string, tags?: number[] }
 */
export const createShortVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, link, tags, thumbImageName } = req.body;
        const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client

        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid or missing userId' });
        }
        if (!title || !thumbImageName) {
            return res.status(400).json({ message: 'Missing Details' });
        }
        if (!link || typeof link !== 'string') {
            return res.status(400).json({ message: 'Missing or invalid link' });
        }

        const normalizedTags = Array.isArray(tags)
            ? Array.from(new Set(tags.map((t: any) => Number(t)).filter(Number.isFinite)))
            : [];

        const created = await ShortVideModel.create({
            userId,
            title,
            link,
            thumbImageName,
            tags: normalizedTags,
        });

        return res.status(201).json(created);
    } catch (err) {
        next(err);
    }
};

/**
 * Get paginated short videos for a user
 * GET /user/:userId/shorts
 * query: page=1, limit=20, sortBy=createdAt|views, order=asc|desc
 */
export const getShortVideosByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid userId' });

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20)); // cap limit for safety
        const skip = (page - 1) * limit;

        const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

        // Use lean() for better performance; project only needed fields if desired
        const [items, total] = await Promise.all([
            ShortVideModel.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            ShortVideModel.countDocuments({ userId }),
        ]);

        return res.status(200).json({
            data: items,
            meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Get videos filtered by tag
 * GET /tags/:tag/shorts
 * query: page=1, limit=20
 */
export const fetchVideosByTag = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // keep backward-compatible behavior: accept numeric or string tags
        const rawTag = req.params.tag;
        const maybeNumber = Number(rawTag);
        const tag = Number.isFinite(maybeNumber) ? maybeNumber : rawTag;

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Build pipeline
        const pipeline: any[] = [
            // match videos that include the tag in the tags array
            { $match: { tags: tag } },

            // sort before pagination
            { $sort: { createdAt: -1 } },

            // split into paginated data and total count
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },

                        // Lookup user (replace 'users' with the actual users collection name if different)
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',    // field in ShortVideo
                                foreignField: '_id',    // field in users
                                as: 'user',
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            name: 1,
                                            role: 1,
                                            image: 1,
                                        },
                                    },
                                ],
                            },
                        },
                        // If you prefer a single object instead of array
                        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

                        // remove internal fields you don't want returned
                        { $project: { __v: 0 /* , anyOtherFieldsToHide: 0 */ } },
                    ],
                    meta: [
                        { $count: 'total' }
                    ],
                },
            },

            // unwind meta to make it easier to parse (if no docs, provide 0)
            {
                $unwind: {
                    path: '$meta',
                    preserveNullAndEmptyArrays: true
                }
            },

            // reshape result (optional, makes downstream code simpler)
            {
                $project: {
                    data: 1,
                    total: { $ifNull: ['$meta.total', 0] }
                }
            }
        ];

        const aggResult = await ShortVideModel.aggregate(pipeline).exec();
        // aggregation returns an array; we expect one element because of the final $project
        const result = aggResult[0] || { data: [], total: 0 };
        const items = result.data || [];
        const total = result.total || 0;
        const pages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            data: items,
            meta: { page, limit, total, pages },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Fetch last 50 uploaded short videos across all users
 * GET /shorts/latest
 */
export const fetchLast50Videos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pipeline: any[] = [
            { $sort: { createdAt: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                role: 1,
                                image: 1,
                            },
                        },
                    ],
                },
            },

            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: { __v: 0, userId: 0 } }, // remove unnecessary fields
        ];
        

        const items = await ShortVideModel.aggregate(pipeline).exec();

        return res.status(200).json({ data: items });
    } catch (err) {
        process.env.DEBUG === 'true' && console.error('fetchLast50Videos error:', err);
        next(err);
    }
};

/**
 * Get a single short video by id
 * GET /shorts/:id
 */
export const getShortVideoById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

        const item = await ShortVideModel.findById(id).sort({ createdAt: -1 }).lean().exec();
        if (!item) return res.status(404).json({ message: 'Short video not found' });

        return res.status(200).json(item);
    } catch (err) {
        next(err);
    }
};

/**
 * Increase views by 1 (atomic & concurrency-safe)
 * POST /shorts/:id/views/increment
 *
 * NOTES:
 * - Uses MongoDB atomic $inc to avoid race conditions.
 * - Returns the new views count (if requested).
 * - For high QPS, consider rate-limiting per-IP or using Redis to debounce/batch updates.
 */
export const increaseViews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

        // Atomic increment
        // Optionally include a projection to only return views
        const updated = await ShortVideModel.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true, select: 'views' } // return only views to reduce payload
        ).lean().exec();

        if (!updated) return res.status(404).json({ message: 'Short video not found' });

        return res.status(200).json({ views: updated.views });
    } catch (err) {
        next(err);
    }
};

/**
 * Update tags for a short video
 * PATCH /shorts/:id/tags
 * body: { tags: number[] }
 */
export const updateShortVideoTags = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client

        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

        const tags = req.body.tags;
        if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags must be an array' });

        const normalizedTags = Array.from(new Set(tags.map((t: any) => Number(t)).filter(Number.isFinite)));

        const updated = await ShortVideModel.findByIdAndUpdate(
            { _id: id, userId },                        // <— Ownership enforced HERE
            { $set: { tags: normalizedTags } },
            { new: true, runValidators: true }
        ).exec();

        if (!updated) return res.status(404).json({ message: 'Short video not found or You do not own this video' });

        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

/**
 * Delete a short video
 * DELETE /shorts/:id
 */
export const deleteVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = typeof req.get('userId') === 'string' ? req.get('userId')!.trim() : undefined; // 👈 you’ll send this from your client

        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });

        const removed = await ShortVideModel.findOneAndDelete({
            _id: id,
            userId                                       // <— Ownership enforced HERE
        }).exec();
        if (!removed) return res.status(404).json({ message: 'Short video not found or You do not own this video' });

        return res.status(200).json({ message: 'Deleted successfully', id: removed._id });
    } catch (err) {
        next(err);
    }
};

export default {
    createShortVideo,
    getShortVideosByUserId,
    getShortVideoById,
    fetchVideosByTag,
    fetchLast50Videos,
    updateShortVideoTags,
    increaseViews,
    deleteVideo,
};