// routes/serviceRoutes.ts
import express from 'express';
import {
    createService,
    updateService,
    getServiceById,
    getServicesByServiceAdminId,
    getServicesByTech,
} from '../controllers/fixServiceController';
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = express.Router();


/**
 * Routes:
 * POST   /services                      -> create ProvideNewServiceRequest
 * PATCH  /services/:id                  -> update UpdateProvidedServiceRequest
 * GET    /services/:id                  -> get single GetAServiceRespond (tech populated)
 * GET    /services                      -> get list by serviceId & isActive (query)
 * GET    /tech/:techId/services         -> getServicesByTech
 */

// Create
router.post('/services', verifyJWTtoken, verifyApiKey, createService);

// Partial update
router.patch('/services/:id', verifyJWTtoken, verifyApiKey, updateService);

// Get single (with tech)
router.get('/services/:id', verifyJWTtoken, verifyApiKey, getServiceById);

// List by serviceAdminId + isActive
// Example: GET /services?serviceAdminId=cleaning-basic&isActive=true&page=1&limit=20
router.get('/services', verifyJWTtoken, verifyApiKey, getServicesByServiceAdminId);

// Get services for a tech
router.get('/tech/:techId/services', verifyJWTtoken, verifyApiKey, getServicesByTech);

export default router;