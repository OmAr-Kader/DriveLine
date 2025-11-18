import express from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  getProfileById,
  updateUser,
  patchUser,
  deleteUser,
} from '../controllers/userController';
import { verifyApiKey } from '../utils/verification';
import { verifyJWTtoken } from '../utils/verifyJWTtoken';

const router = express.Router();

// CRUD Routes
router.post('/', verifyJWTtoken, verifyApiKey, createUser);      // Create
router.get('/', verifyJWTtoken, verifyApiKey, getUsers);         // Read All
router.get('/:id', verifyJWTtoken, verifyApiKey, getUserById);   // Read One
router.get('/profile/:id', verifyJWTtoken, verifyApiKey, getProfileById); // Read One with related data
router.put('/:id', verifyJWTtoken, verifyApiKey, updateUser);    // Update
router.patch('/:id', verifyJWTtoken, verifyApiKey, patchUser);    // Update
router.delete('/:id', verifyJWTtoken, verifyApiKey, deleteUser); // Delete

export default router;