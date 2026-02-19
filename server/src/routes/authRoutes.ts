import express from 'express';
import { register, login } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
// getProfile not yet implemented in controller fully, just mock it or wait
import { getProfile } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

export default router;
