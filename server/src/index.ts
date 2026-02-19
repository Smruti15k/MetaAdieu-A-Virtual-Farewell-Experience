import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io'; // Import socket.io

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// import { connectDB } from './config/db';
// connectDB();


// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware to attach io
app.use((req, res, next) => {
    // @ts-ignore
    req.io = io;
    next();
});

import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import postRoutes from './routes/postRoutes';
import guestbookRoutes from './routes/guestbookRoutes';

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/guestbook', guestbookRoutes);

import keepsakeRoutes from './routes/keepsakeRoutes';
app.use('/api/keepsake', keepsakeRoutes);


import path from 'path';

// ... routes above

// Serve Frontend in Production
// Assuming the client build is located at ../../client/dist relative to the built server file
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
    });
} else {
    app.get('/', (req: Request, res: Response) => {
        res.send('MetaAdieu Backend Server (Dev Mode)');
    });
}

// Socket Events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join Event Room
    socket.on('joinRoom', (eventId) => {
        socket.join(eventId);
        console.log(`User ${socket.id} joined room ${eventId}`);
    });

    // Chat Message
    socket.on('chatMessage', ({ eventId, user, message }) => {
        const msg = {
            id: Date.now(),
            user,
            text: message,
            timestamp: new Date()
        };
        // Broadcast to room
        io.to(eventId).emit('message', msg);
    });

    // --- WebRTC Signaling ---

    // User indicating they are ready to watch/stream
    socket.on('joinLive', ({ eventId, isHost }) => {
        // If host joins, notify everyone (or just track state)
        // If guest joins, notify host so host can initiate connection (Mesh pattern)
        socket.to(eventId).emit('userJoinedLive', { socketId: socket.id, isHost });
        console.log(`User ${socket.id} joined live stage in ${eventId} (Host: ${isHost})`);
    });

    socket.on('offer', ({ target, sdp, caller }) => {
        io.to(target).emit('offer', { sdp, caller });
    });

    socket.on('answer', ({ target, sdp, responder }) => {
        io.to(target).emit('answer', { sdp, responder });
    });

    socket.on('ice-candidate', ({ target, candidate }) => {
        io.to(target).emit('ice-candidate', { candidate });
    });

    socket.on('reaction', ({ eventId, emoji }) => {
        io.to(eventId).emit('reaction', { emoji, id: Date.now() + Math.random() });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Could notify room to remove peer connection
    });
});

// Start Server
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
