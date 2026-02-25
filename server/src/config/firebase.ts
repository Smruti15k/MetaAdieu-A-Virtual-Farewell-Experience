import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

// Load Firebase service account credentials with multiple fallbacks:
let serviceAccount: any = null;
const authMethodLogs: string[] = [];

try {
    // Option 1: Base64-encoded JSON string in env var (best for Render/Vercel/Railway)
    let b64EnvVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (b64EnvVar) {
        b64EnvVar = b64EnvVar.trim();
        // Remove potential quotes if user accidentally added them
        if (b64EnvVar.startsWith('"') && b64EnvVar.endsWith('"')) {
            b64EnvVar = b64EnvVar.slice(1, -1);
        }
        try {
            const decoded = Buffer.from(b64EnvVar, 'base64').toString('utf8');
            serviceAccount = JSON.parse(decoded);
            authMethodLogs.push("Loaded from FIREBASE_SERVICE_ACCOUNT env var (base64)");
        } catch (e: any) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e.message);
            authMethodLogs.push("Failed FIREBASE_SERVICE_ACCOUNT: " + e.message);
        }
    }

    // Option 2: Path to JSON file in env var (Render secret files)
    if (!serviceAccount) {
        const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
        if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                authMethodLogs.push(`Loaded from SERVICE_ACCOUNT_KEY_PATH: ${serviceAccountPath}`);
            } catch (e: any) {
                console.error(`Failed to read SERVICE_ACCOUNT_KEY_PATH ${serviceAccountPath}:`, e.message);
            }
        }
    }

    // Option 3 & 4: Local files (for development)
    if (!serviceAccount) {
        const searchPaths = [
            path.resolve(process.cwd(), 'serviceAccountKey.json'),
            path.resolve(__dirname, '../../serviceAccountKey.json'),
            path.resolve(__dirname, '../../../serviceAccountKey.json'),
        ];

        for (const localPath of searchPaths) {
            if (fs.existsSync(localPath)) {
                try {
                    serviceAccount = JSON.parse(fs.readFileSync(localPath, 'utf8'));
                    authMethodLogs.push(`Loaded from local JSON: ${localPath}`);
                    break;
                } catch (e: any) {
                    console.error(`Failed to parse ${localPath}:`, e.message);
                }
            }
        }
    }

    if (!serviceAccount) {
        console.warn("⚠️ No Firebase service account found. Fallbacks exhausted: " + authMethodLogs.join(", "));
    } else {
        console.log("✅ Credentials found via: " + authMethodLogs[authMethodLogs.length - 1]);
    }
} catch (error: any) {
    console.error("Fatal error loading service account key:", error.message);
}

if (!admin.apps.length) {
    try {
        const config: admin.AppOptions = {
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        };

        if (serviceAccount) {
            config.credential = admin.credential.cert(serviceAccount);
            // Explicitly set project ID if found in service account to avoid mismatches
            if (serviceAccount.project_id) {
                config.projectId = serviceAccount.project_id;
            }
        } else {
            console.warn("Using applicationDefault() - this will likely fail on Render!");
            config.credential = admin.credential.applicationDefault();
        }

        admin.initializeApp(config);
        console.log("✅ Firebase Admin initialized" + (serviceAccount ? ` for project: ${serviceAccount.project_id}` : " (default)"));
    } catch (e: any) {
        console.error("❌ Firebase Admin initialization failed:", e.message);
    }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { authMethodLogs };
