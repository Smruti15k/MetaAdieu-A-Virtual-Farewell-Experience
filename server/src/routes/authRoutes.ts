import express from 'express';
import { register, login } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
// getProfile not yet implemented in controller fully, just mock it or wait
import { getProfile } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/debug-firebase', (req, res) => {
    const { authMethodLogs } = require('../config/firebase');
    const { db } = require('../config/firebase');
    res.json({
        initialized: true,
        methodLogs: authMethodLogs,
        projectId: db.projectId,
        envVarsPresent: {
            FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT,
            SERVICE_ACCOUNT_KEY_PATH: !!process.env.SERVICE_ACCOUNT_KEY_PATH,
            FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET
        }
    });
});

export default router;
