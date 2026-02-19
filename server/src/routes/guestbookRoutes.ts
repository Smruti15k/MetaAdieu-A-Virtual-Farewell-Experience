import express from 'express';
import { addEntry, getEntries } from '../controllers/guestbookController';

const router = express.Router();

// Public routes for guest access - no 'protect' middleware enforced
// In production, might want basic captcha or rate limiting
router.post('/', addEntry);
router.get('/event/:eventId', getEntries);

export default router;
