// routes/courseRoutes.ts
import express from 'express';
import {
    createCourse,
    updateCourse,
    getCourseById,
    getCoursesByCourseAdminId,
    getCoursesByTech,
} from '../controllers/courseController';
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = express.Router();


/**
 * Routes:
 * POST   /courses                      -> create ProvideNewCourseRequest
 * PATCH  /courses/:id                  -> update UpdateProvidedCourseRequest
 * GET    /courses/:id                  -> get single GetACourseRespond (tech populated)
 * GET    /courses                      -> get list by courseId & isActive (query)
 * GET    /tech/:techId/courses         -> getCoursesByTech
 */

// Create
router.post('/courses', verifyJWTtoken, verifyApiKey, createCourse);

// Partial update
router.patch('/courses/:id', verifyJWTtoken, verifyApiKey, updateCourse);

// Get single (with tech)
router.get('/courses/:id', verifyJWTtoken, verifyApiKey, getCourseById);

// List by courseAdminId + isActive
// Example: GET /courses?courseAdminId=cleaning-basic&isActive=true&page=1&limit=20
router.get('/courses', verifyJWTtoken, verifyApiKey, getCoursesByCourseAdminId);

// Get courses for a tech
router.get('/tech/:techId/courses',  verifyJWTtoken, verifyApiKey, getCoursesByTech);

export default router;