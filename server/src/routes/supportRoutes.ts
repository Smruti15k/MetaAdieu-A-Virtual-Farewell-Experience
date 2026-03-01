import express from 'express';
import { handleChat } from '../controllers/supportController';

const router = express.Router();

router.post('/chat', handleChat);

export default router;
