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
        const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH || '/etc/secrets/serviceAccountKey.json';
        if (fs.existsSync(serviceAccountPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                authMethodLogs.push(`Loaded from path: ${serviceAccountPath}`);
            } catch (e: any) {
                console.error(`Failed to read path ${serviceAccountPath}:`, e.message);
                authMethodLogs.push(`Error reading ${serviceAccountPath}: ${e.message}`);
            }
        }
    }

    // Option 3: Local files (for development)
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

// Initialize Firebase Admin
let app: admin.app.App;

if (!admin.apps.length) {
    try {
        const config: admin.AppOptions = {
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        };

        if (serviceAccount) {
            config.credential = admin.credential.cert(serviceAccount);
            // Explicitly set project ID
            config.projectId = serviceAccount.project_id;

            const maskedEmail = serviceAccount.client_email ?
                `${serviceAccount.client_email.slice(0, 5)}...${serviceAccount.client_email.slice(-10)}` : 'unknown';

            console.log(`🔑 Service Account Details: Project [${serviceAccount.project_id}], Email [${maskedEmail}]`);
        } else {
            console.warn("⚠️ No service account object. Using applicationDefault().");
            config.credential = admin.credential.applicationDefault();
        }

        app = admin.initializeApp(config);
        console.log(`✅ Firebase Admin initialized for project: ${app.options.projectId || 'default'}`);
    } catch (e: any) {
        console.error("❌ Firebase Admin initialization failed:", e.message);
        throw e;
    }
} else {
    app = admin.app();
}

export const db = app.firestore();
export const auth = app.auth();
export const storage = app.storage();
export { authMethodLogs };
