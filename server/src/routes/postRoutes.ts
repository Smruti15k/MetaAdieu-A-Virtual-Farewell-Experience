import express from 'express';
import { createPost, getPosts } from '../controllers/postController';
import { protect } from '../middleware/authMiddleware';
import multer from 'multer';

// Use same multer config as upload routes or separate
const storage = multer.memoryStorage();
const postUpload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('file');

const router = express.Router();

// Routes
// POST /api/posts - Create new post (Protected, supports file upload)
router.post('/', protect, postUpload, createPost);

// GET /api/posts/event/:eventId - Get posts for an event (Public/Protected)
router.get('/event/:eventId', getPosts);

export default router;
