// controllers/serviceController.ts
import { Request, Response, NextFunction } from 'express';
import ServiceModel from '../models/fixService';
import { AvailabilityInterval } from '../models/helper';
import { Types } from 'mongoose';

/**
 * DTO types (lightweight) - you can move these to a shared types file
 */
export type ProvideNewServiceRequest = {
    techId: string;
    serviceAdminId: number;
    description?: string;
    price: string;
    currency?: string;
    durationMinutes?: number;
    isActive?: boolean;
    images: string[];
    monday?: AvailabilityInterval;
    tuesday?: AvailabilityInterval;
    wednesday?: AvailabilityInterval;
    thursday?: AvailabilityInterval;
    friday?: AvailabilityInterval;
    saturday?: AvailabilityInterval;
    sunday?: AvailabilityInterval;
};

export type UpdateProvidedServiceRequest = Partial<ProvideNewServiceRequest>;

/**
 * Utility: safe projection for returned service (no heavy fields)
 */
const serviceProjection = { __v: 0 };

/**
 * CREATE: ProvideNewServiceRequest
 * POST /services
 */
export async function createService(req: Request, res: Response, next: NextFunction) {
    try {
        const body = req.body as ProvideNewServiceRequest;

        // Basic validation (extend with Joi/Zod in real app)
        if (!body.techId || body.serviceAdminId ||  !body.description || !body.price || !body.currency || !body.durationMinutes) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Ensure valid ObjectId
        if (!Types.ObjectId.isValid(body.techId)) {
            return res.status(400).json({ message: 'Invalid techId' });
        }

        const doc = await ServiceModel.create({
            serviceAdminId: body.serviceAdminId,
            techId: new Types.ObjectId(body.techId),

            description: body.description,
            price: body.price,
            currency: body.currency ?? 'USD',
            durationMinutes: body.durationMinutes ?? 60,
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
        const payload = await ServiceModel.findById(doc._id, serviceProjection).lean();
        return res.status(201).json(payload);
    } catch (err) {
        next(err);
    }
}

/**
 * PATCH update (UpdateProvidedServiceRequest)
 * PATCH /services/:id
 * Partial update. Returns updated doc.
 */
export async function updateService(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

        const update = req.body as UpdateProvidedServiceRequest;
        // whitelist allowed fields for update
        const allowed: (keyof UpdateProvidedServiceRequest)[] = [
            'description',
            'price',
            'currency',
            'durationMinutes',
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
        const updated = await ServiceModel.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
            context: 'query',
        })
            .select(serviceProjection)
            .lean();

        if (!updated) return res.status(404).json({ message: 'Service not found' });

        return res.json(updated);
    } catch (err) {
        next(err);
    }
}

/**
 * GET single service (GetAServiceRespond)
 * GET /services/:id
 *
 * NOTE: When returning this single service, the techId should be replaced
 * with required tech data from User. We do a limited populate.
 */
export async function getServiceById(req: Request, res: Response, next: NextFunction) {
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

        const aggResult = await ServiceModel.aggregate(pipeline).allowDiskUse(false).exec();

        if (!aggResult || aggResult.length === 0) return res.status(404).json({ message: 'Service not found' });

        const result = aggResult[0];

        return res.json(result);
    } catch (err) {
        next(err);
    }
}

/**
 * GET list by serviceAdminId and isActive
 * GET /services?serviceAdminId=...&isActive=true&page=1&limit=20
 *
 * Returns array of GetAServiceRespond (tech data populated)
 */
export function getServicesByServiceAdminId(req: Request, res: Response, next: NextFunction) {
    // Step 1: Extract and normalize query params
    const serviceAdminRaw = req.query.serviceAdminId;
    if (!serviceAdminRaw) return res.status(400).json({ message: 'serviceAdminId query required' });

    const serviceAdminId: number | string = !isNaN(Number(serviceAdminRaw))
        ? Number(serviceAdminRaw)
        : String(serviceAdminRaw);

    const isActive = req.query.isActive === 'true' || req.query.isActive === 'true';

    const match: any = { serviceAdminId, isActive };

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
    ServiceModel.aggregate(pipeline)
        .exec()
        .then((services) => {
            res.json({ data: services });
        })
        .catch((err) => {
            process.env.DEBUG === 'true' && console.error('Aggregation error:', err);
            next(err);
        });
}

/**
 * GET services by tech id
 * GET /tech/:techId/services
 */
export async function getServicesByTech(req: Request, res: Response, next: NextFunction) {
    try {
        const techId = req.params.techId;
        if (!Types.ObjectId.isValid(techId)) return res.status(400).json({ message: 'Invalid techId' });

        // Only return active services by default (optionally support query param)
        const includeInactive = req.query.includeInactive === 'true';

        const filter: any = { techId: new Types.ObjectId(techId) };
        if (!includeInactive) filter.isActive = true;

        // lean + projection for performance
        const items = await ServiceModel.find(filter)
            .select(serviceProjection)
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return res.json({ data: items });
    } catch (err) {
        next(err);
    }
}