import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Attempt to load service account credentials from a JSON file, OR 
// use a mock during development if credentials are not present, OR use application default.
// Best approach: If SERVICE_ACCOUNT_KEY env is present (base64 or path), use it.

import * as fs from 'fs';
import * as path from 'path';

let serviceAccount: any;
try {
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
    if (serviceAccountPath) {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } else {
        // Try explicit local path in server root
        const localPath = path.resolve(__dirname, '../../serviceAccountKey.json');
        if (fs.existsSync(localPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
            console.log("Loaded serviceAccountKey.json from local path");
        } else {
            console.warn("No SERVICE_ACCOUNT_KEY_PATH provided and local file not found at " + localPath + ". Checking for default credentials...");
        }
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
        console.log("Firebase Admin initialized");
    } catch (e) {
        console.error("Firebase Admin initialization failed:", e);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
