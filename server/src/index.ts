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

    // Track participants per room
    const roomParticipants = new Map<string, Set<{ id: string, name: string }>>();

    // Join Event Room
    socket.on('joinRoom', ({ eventId, user }) => {
        socket.join(eventId);

        if (!roomParticipants.has(eventId)) {
            roomParticipants.set(eventId, new Set());
        }
        const participants = roomParticipants.get(eventId)!;
        // Remove existing if reconnecting
        for (const p of participants) {
            if (p.id === socket.id) participants.delete(p);
        }
        participants.add({ id: socket.id, name: user || 'Guest' });

        console.log(`User ${user} (${socket.id}) joined room ${eventId}`);

        // Broadcast updated list
        io.to(eventId).emit('roomUsers', Array.from(participants));
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove from all rooms
        roomParticipants.forEach((participants, eventId) => {
            let found = false;
            for (const p of participants) {
                if (p.id === socket.id) {
                    participants.delete(p);
                    found = true;
                    break;
                }
            }
            if (found) {
                io.to(eventId).emit('roomUsers', Array.from(participants));
            }
        });

        // If user was in a live room, notify others
        if (currentLiveRoom) {
            socket.to(currentLiveRoom).emit('userLeftLive', { socketId: socket.id });
        }
    });

    // --- WebRTC Signaling (Multi-party Video Call) ---

    // Track which live rooms users are in for cleanup
    let currentLiveRoom: string | null = null;

    // User joins the live video call
    socket.on('joinLive', ({ eventId, isHost, userName }) => {
        currentLiveRoom = eventId;
        // Notify all others in the room that a new user joined
        socket.to(eventId).emit('userJoinedLive', { socketId: socket.id, isHost, userName });
        console.log(`User ${userName} (${socket.id}) joined live stage in ${eventId}`);
    });

    // User leaves the live video call
    socket.on('leaveLive', ({ eventId }) => {
        currentLiveRoom = null;
        socket.to(eventId).emit('userLeftLive', { socketId: socket.id });
        console.log(`User ${socket.id} left live stage in ${eventId}`);
    });

    // WebRTC Offer (includes callerName for display)
    socket.on('offer', ({ target, sdp, caller, callerName }) => {
        io.to(target).emit('offer', { sdp, caller, callerName });
    });

    // WebRTC Answer (includes responderName for display)
    socket.on('answer', ({ target, sdp, responder, responderName }) => {
        io.to(target).emit('answer', { sdp, responder, responderName });
    });

    // ICE Candidate (includes 'from' so receiver knows which peer it's for)
    socket.on('ice-candidate', ({ target, candidate }) => {
        io.to(target).emit('ice-candidate', { candidate, from: socket.id });
    });

    socket.on('reaction', ({ eventId, emoji }) => {
        io.to(eventId).emit('reaction', { emoji, id: Date.now() + Math.random() });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // If user was in a live room, notify others
        if (currentLiveRoom) {
            socket.to(currentLiveRoom).emit('userLeftLive', { socketId: socket.id });
        }
    });
});

// Start Server
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
