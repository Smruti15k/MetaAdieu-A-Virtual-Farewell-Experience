import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, type, content, caption } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userName = req.user.name;

        if (!eventId || !type || !content) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const newPost = {
            type,
            content,
            caption,
            authorId: userId,
            authorName: userName,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('events').doc(eventId).collection('posts').add(newPost);

        // Notify via socket?
        // @ts-ignore
        req.io.to(eventId).emit('newPost', { id: docRef.id, ...newPost });

        res.status(201).json({ success: true, post: { id: docRef.id, ...newPost } });
    } catch (error: any) {
        console.error("Create Post Error:", error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    try {
        const snapshot = await db.collection('events').doc(eventId).collection('posts').orderBy('createdAt', 'desc').get();
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        res.json({ success: true, posts });
    } catch (error: any) {
        console.error("Get Posts Error:", error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};
