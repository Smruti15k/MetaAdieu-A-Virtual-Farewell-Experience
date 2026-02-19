
# Deployment Guide

This project is a monorepo containing a React Frontend (`client`) and an Express Backend (`server`).
Because the backend uses **Socket.IO** for real-time features, it requires a persistent server.

## Option 1: Full Stack on Render (Recommended if you want everything in one place)

You can deploy both the frontend and backend as separate services on Render.

### 1. Backend Service (Web Service)
Deploy the `server` directory.

1.  Create a new **Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory**: Set to `server`.
4.  **Runtime**: Docker (it will pick up `server/Dockerfile`).
5.  **Environment Variables**:
    *   `PORT`: `5000`
    *   Upload your `serviceAccountKey.json` as a **Secret File** (Advanced -> Secret Files).
        *   Filename: `serviceAccountKey.json`
        *   Path: `../serviceAccountKey.json` (relative to app) or configure `SERVICE_ACCOUNT_KEY_PATH` to `/etc/secrets/serviceAccountKey.json`.
6.  **Deploy**. Copy the URL (e.g., `https://metaadieu-server.onrender.com`).

### 2. Frontend Service (Static Site)
Deploy the `client` directory.

1.  Create a new **Static Site** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory**: Set to `client`.
4.  **Build Command**: `npm run build`
5.  **Publish Directory**: `dist`
6.  **Environment Variables**:
    *   `VITE_API_URL`: The URL of your backend (e.g., `https://metaadieu-server.onrender.com`).
    *   `VITE_SOCKET_URL`: Same as above.
    *   Add all your Firebase keys: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
7.  **Deploy**.

---

## Option 2: Hybrid (Vercel + Render)

*   **Frontend**: Deploy `client` folder to Vercel (Root Directory: `client`).
*   **Backend**: Deploy `server` folder to Render (Root Directory: `server`).

This is often faster/cheaper for the frontend, but splitting services is fine too.
