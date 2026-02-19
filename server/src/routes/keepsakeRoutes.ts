import { Router } from 'express';
import { generateKeepsake } from '../controllers/keepsakeController';

const router = Router();

// GET /api/keepsake/:eventId
router.get('/:eventId', generateKeepsake);

export default router;
