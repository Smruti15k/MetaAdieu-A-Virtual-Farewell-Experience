import express from 'express';
import { createPost, getPosts } from '../controllers/postController';
import { protect, optionalAuth } from '../middleware/authMiddleware';
import multer from 'multer';

// Use same multer config as upload routes or separate
const storage = multer.memoryStorage();
const postUpload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for video uploads
}).single('file');

const router = express.Router();

// Routes
// POST /api/posts - Create new post (supports both authenticated users and guests)
router.post('/', optionalAuth, postUpload, createPost);

// GET /api/posts/event/:eventId - Get posts for an event (Public/Protected)
router.get('/event/:eventId', getPosts);

export default router;
