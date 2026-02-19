import express from 'express';
import { createEvent, getMyEvents, getEventById } from '../controllers/eventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Routes
// POST /api/events - Create new event (Protected)
router.post('/', protect, createEvent);

// GET /api/events/my-events - Get events created by logged-in user (Protected)
router.get('/my-events', protect, getMyEvents);

// GET /api/events/:id - Get event details (Public if link shared, or protected)
// For now, allow public read of event details if they have the ID
router.get('/:id', getEventById);

export default router;
