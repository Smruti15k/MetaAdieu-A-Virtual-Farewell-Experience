
# Deployment Guide

## 1. Frontend (Vercel)
Deploy the `client` folder to Vercel.

1.  **Import Project**: Go to Vercel -> "New Project" -> Import your GitHub repo.
2.  **Root Directory**: 
    *   Click "Edit" next to "Root Directory".
    *   Select `client`.
3.  **Framework Preset**: It should auto-detect "Vite". If not, select it.
4.  **Environment Variables**:
    Add the following variables (copy values from your local `.env` and backend URL):
    *   `VITE_API_URL`: The URL of your backend (e.g., `https://metaadieu-server.onrender.com`).
    *   `VITE_SOCKET_URL`: The URL of your backend (same as above).
    *   `VITE_FIREBASE_API_KEY`: Your Firebase API Key.
    *   `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase Auth Domain.
    *   `VITE_FIREBASE_PROJECT_ID`: Your Firebase Project ID.
    *   `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase Storage Bucket.
    *   `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Sender ID.
    *   `VITE_FIREBASE_APP_ID`: Your App ID.
    *   `VITE_FIREBASE_MEASUREMENT_ID`: Your Measurement ID.
5.  **Deploy**.

## 2. Backend (Render)
Because you need Socket.IO, the backend *must* go on Render (or similar), not Vercel.

1.  Create a **New Web Service** on Render.
2.  Connect your repo.
3.  **Root Directory**: `server`.
4.  **Runtime**: Docker.
5.  **Environment Variables**:
    *   `PORT`: `5000`
    *   `SERVICE_ACCOUNT_KEY_PATH`: `/etc/secrets/serviceAccountKey.json`
6.  **Secret Files** (in "Advanced" or "Environment" tab):
    *   Filename: `serviceAccountKey.json`
    *   Content: Paste the *entire* content of your local `serviceAccountKey.json`.
7.  **Deploy**.
