import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        let { eventId, type, content, caption } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userName = req.user.name;

        // Start: File Upload Handling
        if (req.file) {
            const { uploadToImgBB } = await import('../utils/imgbb');
            // If it's a photo, upload to ImgBB
            if (req.file.mimetype.startsWith('image/')) {
                try {
                    content = await uploadToImgBB(req.file.buffer, req.file.originalname);
                } catch (uploadError) {
                    console.error("ImgBB Upload Failed:", uploadError);
                    res.status(500).json({ error: 'Failed to upload image' });
                    return;
                }
            } else if (req.file.mimetype.startsWith('video/')) {
                // For videos, in a real app, you'd upload to Cloudinary/S3.
                // Since ImgBB is images only, we can't upload video there.
                // For this demo with Render (ephemeral fs), we'll warn or skip.
                res.status(400).json({ error: 'Video upload requires external storage (S3/Cloudinary). ImgBB only supports images.' });
                return;
            }
        }
        // End: File Upload Handling

        if (!eventId || !type || !content) {
            res.status(400).json({ error: 'Missing required fields (content or file)' });
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
