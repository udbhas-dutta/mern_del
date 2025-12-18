import express from 'express';
import { register, login } from '../controllers/authController';
import { getAllUsers } from '../controllers/userController';
import { adminOnly, protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/users', protect, adminOnly, getAllUsers);

export default router;