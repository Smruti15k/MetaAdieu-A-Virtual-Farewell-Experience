import express from 'express';
import { handleFileUpload, upload } from '../controllers/uploadController';

const router = express.Router();

// POST /api/upload
router.post('/', upload, handleFileUpload);

export default router;
