import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

// Load Firebase service account credentials with multiple fallbacks:
// 1. FIREBASE_SERVICE_ACCOUNT env var (base64-encoded JSON string) — best for cloud deployments
// 2. SERVICE_ACCOUNT_KEY_PATH env var (path to JSON file) — for Render secret files
// 3. Local serviceAccountKey.json file — for local development
// 4. Local serviceAccountKey.b64 file — alternative local format
// 5. Application default credentials — last resort

let serviceAccount: any;
try {
    // Option 1: Base64-encoded JSON string in env var (best for Render/Vercel/Railway)
    const b64EnvVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64EnvVar) {
        serviceAccount = JSON.parse(Buffer.from(b64EnvVar, 'base64').toString('utf8'));
        console.log("Loaded service account from FIREBASE_SERVICE_ACCOUNT env var (base64)");
    }

    // Option 2: Path to JSON file in env var (Render secret files)
    if (!serviceAccount) {
        const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
        if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            console.log("Loaded service account from SERVICE_ACCOUNT_KEY_PATH:", serviceAccountPath);
        }
    }

    // Option 3 & 4: Local files (for development)
    if (!serviceAccount) {
        // Try paths relative to both compiled dist/ and source src/ locations
        const searchPaths = [
            path.resolve(__dirname, '../../serviceAccountKey.json'),       // from dist/config/
            path.resolve(__dirname, '../../../serviceAccountKey.json'),     // from server root
            path.resolve(process.cwd(), 'serviceAccountKey.json'),         // from CWD
        ];
        const b64SearchPaths = [
            path.resolve(__dirname, '../../serviceAccountKey.b64'),
            path.resolve(__dirname, '../../../serviceAccountKey.b64'),
            path.resolve(process.cwd(), 'serviceAccountKey.b64'),
        ];

        for (const localPath of searchPaths) {
            if (fs.existsSync(localPath)) {
                serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
                console.log("Loaded serviceAccountKey.json from:", localPath);
                break;
            }
        }

        if (!serviceAccount) {
            for (const b64Path of b64SearchPaths) {
                if (fs.existsSync(b64Path)) {
                    const b64Content = fs.readFileSync(b64Path, 'utf8').trim();
                    serviceAccount = JSON.parse(Buffer.from(b64Content, 'base64').toString('utf8'));
                    console.log("Loaded serviceAccountKey from base64 file:", b64Path);
                    break;
                }
            }
        }
    }

    if (!serviceAccount) {
        console.warn("⚠️ No Firebase service account credentials found. Falling back to application default credentials.");
        console.warn("Set FIREBASE_SERVICE_ACCOUNT env var (base64) or SERVICE_ACCOUNT_KEY_PATH for production.");
    }
} catch (error) {
    console.error("Failed to load service account key:", error);
}

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        });
        console.log("✅ Firebase Admin initialized successfully" + (serviceAccount ? " (with service account)" : " (with default credentials)"));
    } catch (e) {
        console.error("❌ Firebase Admin initialization failed:", e);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
