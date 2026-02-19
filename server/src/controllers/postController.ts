import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        let { eventId, type, content, caption, guestName } = req.body;

        // Support both authenticated users and guests
        // @ts-ignore
        const user = req.user;
        const userId = user?.id || 'guest-' + Date.now();
        const userName = user?.name || guestName || 'Guest';
        const userPicture = user?.picture || null;

        // Start: File Upload Handling
        if (req.file) {
            if (req.file.mimetype.startsWith('image/')) {
                // Upload images to ImgBB
                const { uploadToImgBB } = await import('../utils/imgbb');
                try {
                    content = await uploadToImgBB(req.file.buffer, req.file.originalname);
                } catch (uploadError) {
                    console.error("ImgBB Upload Failed:", uploadError);
                    res.status(500).json({ error: 'Failed to upload image' });
                    return;
                }
            } else if (req.file.mimetype.startsWith('video/')) {
                // Upload videos to Cloudinary
                const { uploadVideoToCloudinary } = await import('../utils/cloudinary');
                try {
                    content = await uploadVideoToCloudinary(req.file.buffer, req.file.originalname);
                } catch (uploadError) {
                    console.error("Cloudinary Upload Failed:", uploadError);
                    res.status(500).json({ error: 'Failed to upload video' });
                    return;
                }
            }
        }
        // End: File Upload Handling

        if (!eventId || !type || !content) {
            res.status(400).json({ error: 'Missing required fields (content or file)' });
            return;
        }

        const newPostData = {
            type,
            content,
            caption: caption || '',
            authorId: userId,
            authorName: userName,
            authorPicture: userPicture,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('events').doc(eventId).collection('posts').add(newPostData);

        // Build the response in the shape the frontend expects
        const responsePost = {
            id: docRef.id,
            type: newPostData.type,
            content: newPostData.content,
            caption: newPostData.caption,
            createdAt: newPostData.createdAt,
            author: {
                name: userName,
                profilePicture: userPicture
            }
        };

        // Notify via socket
        // @ts-ignore
        if (req.io) {
            // @ts-ignore
            req.io.to(eventId).emit('newPost', responsePost);
        }

        res.status(201).json({ success: true, post: responsePost });
    } catch (error: any) {
        console.error("Create Post Error:", error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    try {
        const snapshot = await db.collection('events').doc(eventId).collection('posts').orderBy('createdAt', 'desc').get();
        const posts = snapshot.docs.map(doc => {
            const data = doc.data() as any;
            return {
                id: doc.id,
                type: data.type,
                content: data.content,
                caption: data.caption || '',
                createdAt: data.createdAt,
                author: {
                    name: data.authorName || 'Unknown',
                    profilePicture: data.authorPicture || null
                }
            };
        });

        res.json({ success: true, posts });
    } catch (error: any) {
        console.error("Get Posts Error:", error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};
