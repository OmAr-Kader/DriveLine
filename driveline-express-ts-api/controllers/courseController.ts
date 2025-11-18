
import { Request, Response, NextFunction } from 'express';
import CourseModel from '../models/course';
import { AvailabilityInterval } from '../models/helper';
import { Types } from 'mongoose';

/**
 * DTO types (lightweight) - you can move these to a shared types file
 */
export type ProvideNewCourseRequest = {
    courseAdminId: number;
    techId: string;

    description?: string;
    price: string;
    currency?: string;
    sessions?: number;
    isActive: boolean;
    images: string[];

    monday?: AvailabilityInterval;
    tuesday?: AvailabilityInterval;
    wednesday?: AvailabilityInterval;
    thursday?: AvailabilityInterval;
    friday?: AvailabilityInterval;
    saturday?: AvailabilityInterval;
    sunday?: AvailabilityInterval;
};

export type UpdateProvidedCourseRequest = Partial<ProvideNewCourseRequest>;

const courseProjection = {
    __v: 0,
    // you can exclude metadata if heavy; include if needed
};
/**
 * CREATE: ProvideNewCourseRequest
 * POST /courses
 */
export async function createCourse(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body as ProvideNewCourseRequest;

        // Basic validation (extend with Joi/Zod in real app)
        if (!body.techId || body.courseAdminId ||  !body.description || !body.price || !body.currency || !body.sessions) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Ensure valid ObjectId
        if (!Types.ObjectId.isValid(body.techId)) {
            return res.status(400).json({ message: 'Invalid techId' });
        }

        const doc = await CourseModel.create({
            courseAdminId: body.courseAdminId,
            techId: new Types.ObjectId(body.techId),

            description: body.description,
            price: body.price,
            currency: body.currency ?? 'USD',
            sessions: body.sessions ?? 60,
            isActive: body.isActive ?? false,
            images: body.images || [],
            monday: body.monday,
            tuesday: body.tuesday,
            wednesday: body.wednesday,
            thursday: body.thursday,
            friday: body.friday,
            saturday: body.saturday,
            sunday: body.sunday,  // FIX: sunday
        });

        // Return minimal created response
        const payload = await CourseModel.findById(doc._id, courseProjection).lean();
        return res.status(201).json(payload);
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH update (UpdateProvidedCourseRequest)
 * PATCH /courses/:id
 * Partial update. Returns updated doc.
 */
export async function updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const update = req.body as UpdateProvidedCourseRequest;
        // whitelist allowed fields for update
        const allowed: (keyof UpdateProvidedCourseRequest)[] = [
            'description',
            'price',
            'currency',
            'sessions',
            'isActive',
            'images',

            // NEW: weekly availability
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
        ];

        const payload: any = {};
        for (const k of allowed) {
            if (update[k] !== undefined) {
                // if techId provided, validate
                if (k === 'techId' && update[k] && !Types.ObjectId.isValid(update[k] as string)) {
                    return res.status(400).json({ message: 'Invalid techId' });
                }
                payload[k] = update[k];
            }
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ message: 'No valid update fields provided' });
        }

        // Use findByIdAndUpdate with {new:true} and lean() after to return plain object
        const updated = await CourseModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
            context: 'query',
        })
            .select(courseProjection)
            .lean();

        if (!updated) return res.status(404).json({ message: 'Course not found' });

        return res.json(updated);
    } catch (err) {
        next(err);
    }
}

/**
 * GET single course (GetACourseRespond)
 * GET /courses/:id
 *
 * NOTE: When returning this single course, the techId should be replaced
 * with required tech data from User. We do a limited populate.
 */
export async function getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        // Choose which fields to pull from User model (minimal)
        const techSelect = 'name email phone avatar role'; // adjust to your User schema

        // lean + populate + projection -> combined approach:
        // Mongoose .populate() doesn't support lean directly, so we query then use .lean() + populate via aggregation or use populate then toObject
        // Use an aggregation pipeline for best performance and to allow lean population.
        const pipeline = [
            { $match: { _id: new Types.ObjectId(id) } },
            {
                $project: {
                    __v: 0,
                },
            },
            // lookup tech (User) and only include required fields
            {
                $lookup: {
                    from: 'users', // collection name of users (lowercase plural by default)
                    localField: 'techId',
                    foreignField: '_id',
                    as: 'techDoc',
                    pipeline: [
                        { 
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1,
                                phone: 1,
                                role: 1,
                                age: 1,
                                image: 1,
                                location: 1,
                            },
                        },
                    ],
                },
            },
            // unwind techDoc to an object (if tech exists)
            { $unwind: { path: '$techDoc', preserveNullAndEmptyArrays: true } },
            // replace techId with techDoc (rename)
            {
                $addFields: {
                    tech: '$techDoc',
                },
            },
            {
                $project: { techDoc: 0 }, // drop temp
            },
        ];

        const aggResult = await CourseModel.aggregate(pipeline).allowDiskUse(false).exec();

        if (!aggResult || aggResult.length === 0) return res.status(404).json({ message: 'Course not found' });

        const result = aggResult[0];

        return res.json(result);
    } catch (err) {
        next(err);
    }
}

/**
 * GET list by courseAdminId and isActive
 * GET /courses?courseAdminId=...&isActive=true&page=1&limit=20
 *
 * Returns array of GetACourseRespond (tech data populated)
 */
export function getCoursesByCourseAdminId(req: Request, res: Response, next: NextFunction) {
    // Step 1: Extract and normalize query params
    const courseAdminRaw = req.query.courseAdminId;
    if (!courseAdminRaw) return res.status(400).json({ message: 'courseAdminId query required' });

    const courseAdminId: number | string = !isNaN(Number(courseAdminRaw))
        ? Number(courseAdminRaw)
        : String(courseAdminRaw);

    const isActive = req.query.isActive === 'true' || req.query.isActive === 'true';

    const match: any = { courseAdminId, isActive };

    // Step 2: Aggregation pipeline
    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: 'users', // collection name of User model
                localField: 'techId',
                foreignField: '_id',
                as: 'tech',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            role: 1,
                            age: 1,
                            image: 1,
                            location: 1,
                        },
                    },
                ],
            },
        },
        { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
        { $project: { __v: 0, techId: 0 } }, // remove unnecessary fields
    ];

    // Step 3: Execute aggregation (non-async)
    CourseModel.aggregate(pipeline)
        .exec()
        .then((courses) => {
            res.json({ data: courses });
        })
        .catch((err) => {
            process.env.DEBUG === 'true' && console.error('Aggregation error:', err);
            next(err);
        });
}

/**
 * GET courses by tech id
 * GET /tech/:techId/courses
 */
export async function getCoursesByTech(req: Request, res: Response, next: NextFunction) {
    try {
        const techId = req.params.techId;
        if (!Types.ObjectId.isValid(techId)) return res.status(400).json({ message: 'Invalid techId' });

        // Only return active courses by default (optionally support query param)
        const includeInactive = req.query.includeInactive === 'true';

        const filter: any = { techId: new Types.ObjectId(techId) };
        if (!includeInactive) filter.isActive = true;

        // lean + projection for performance
        const items = await CourseModel.find(filter)
            .select(courseProjection)
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.json({ data: items });
    } catch (err) {
        next(err);
    }
}