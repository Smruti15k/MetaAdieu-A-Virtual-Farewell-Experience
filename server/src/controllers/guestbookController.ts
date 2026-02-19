import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const addEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventId, message } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userName = req.user.name;

        if (!eventId || !message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        const newEntry = {
            message,
            authorId: userId,
            authorName: userName,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('events').doc(eventId).collection('guestbook').add(newEntry);

        // Notify via socket?
        // @ts-ignore
        req.io.to(eventId).emit('newGuestbookEntry', { id: docRef.id, ...newEntry });

        res.status(201).json({ success: true, entry: { id: docRef.id, ...newEntry } });
    } catch (error: any) {
        console.error("Add Guestbook Entry Error:", error);
        res.status(500).json({ error: 'Failed to add entry' });
    }
};

export const getEntries = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    try {
        const snapshot = await db.collection('events').doc(eventId).collection('guestbook').orderBy('createdAt', 'desc').get();
        const entries = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        res.json({ success: true, entries });
    } catch (error: any) {
        console.error("Get Guestbook Entries Error:", error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
};
