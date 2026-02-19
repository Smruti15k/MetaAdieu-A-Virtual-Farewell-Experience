
# Deployment Guide

This project is a monorepo containing a React Frontend (`client`) and an Express Backend (`server`).
Because the backend uses **Socket.IO** for real-time features, it requires a persistent server and cannot be deployed as a standard Vercel Serverless Function.

## Recommended Deployment Strategy

### 1. Frontend (Vercel)
Deploy the `client` directory to Vercel.

1.  Push this repository to GitHub.
2.  Go to Vercel Dashboard -> Add New Project -> Import from GitHub.
3.  Select the `client` directory as the **Root Directory** (cleaner distinct project).
    *   *Click "Edit" next to Root Directory and select `client`.*
4.  **Build Settings**: The default Vite settings should work automatically (`npm run build`, output `dist`).
5.  **Environment Variables**:
    *   Add `VITE_API_URL`: The URL of your deployed Backend (e.g., `https://your-app-server.onrender.com`).
    *   Add `VITE_SOCKET_URL`: The URL of your deployed Backend (same as above).
    *   Add your Firebase config variables (`VITE_FIREBASE_API_KEY`, etc.) from your `.env` file.

### 2. Backend (Render / Railway)
Deploy the `server` directory to a platform that supports persistent Node.js apps, like Render.com or Railway.app.

#### Deploying on Render:
1.  Create a new **Web Service**.
2.  Connect your GitHub repository.
3.  **Root Directory**: Set to `server`.
4.  **Runtime**: Docker (it will pick up the `server/Dockerfile` I created).
5.  **Environment Variables**:
    *   `PORT`: `5000` (internal port, Render will map it).
    *   `GOOGLE_APPLICATION_CREDENTIALS`: Path to your service account key (requires uploading the file as a "Secret File" or setting the content as a variable if your code supports it).
    *   Since we use `firebase-admin`, you need to provide the credentials.
        *   **Option A**: Upload `serviceAccountKey.json` as a "Secret File" in Render with filename `../serviceAccountKey.json` (relative to where app runs) or adjust path.
        *   **Option B**: Set `SERVICE_ACCOUNT_KEY_PATH` env var to `/etc/secrets/serviceAccountKey.json` (Render default path for secret files).
    *   `CLIENT_URL`: The URL of your Vercel frontend (e.g., `https://your-app.vercel.app`) - for CORS.

**Important**: Your backend needs the Firebase Service Account Key. Since it is gitignored for security, you must manually upload it to the deployment service.

## Why not Vercel for Backend?
Vercel functions are serverless and ephemeral. They shut down immediately after responding. Socket.IO requires a continuous connection, which Vercel kills instantly.
