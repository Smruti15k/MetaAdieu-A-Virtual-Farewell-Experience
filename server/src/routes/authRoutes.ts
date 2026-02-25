import express from 'express';
import { register, login } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
// getProfile not yet implemented in controller fully, just mock it or wait
import { getProfile } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/debug-firebase', async (req, res) => {
    try {
        const { authMethodLogs, db } = require('../config/firebase');

        // Live Test: Try to write to a test collection
        let firestoreTest = "Running...";
        try {
            const testDoc = db.collection('_debug_').doc('connection_test');
            await testDoc.set({
                last_check: new Date().toISOString(),
                status: 'alive'
            });
            firestoreTest = "✅ Write Successful!";
        } catch (e: any) {
            firestoreTest = `❌ Write Failed: ${e.message}`;
            console.error("Firestore Debug Test Failed:", e);
            // Attach full error details for debugging
            // @ts-ignore
            res._debugError = { name: e.name, code: e.code, details: e.details, stack: e.stack };
        }

        res.json({
            status: "Online",
            serverTime: new Date().toISOString(),
            firestoreLiveTest: firestoreTest,
            debugDetails: (res as any)._debugError || null,
            config: {
                projectId: db.projectId,
                initMethod: authMethodLogs[authMethodLogs.length - 1],
                allLogs: authMethodLogs
            },
            envCheck: {
                HAS_SA_VAR: !!process.env.FIREBASE_SERVICE_ACCOUNT,
                HAS_SA_PATH: !!process.env.SERVICE_ACCOUNT_KEY_PATH
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
