import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        // @ts-ignore
        const userName = req.user.name;

        const { title, guestOfHonor, eventDate, duration, description, isPrivate } = req.body;

        const newEvent = {
            title,
            guestOfHonor,
            eventDate,
            duration,
            description,
            isPrivate,
            hostId: userId,
            hostName: userName,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('events').add(newEvent);
        const eventContext = { id: docRef.id, ...newEvent };

        res.status(201).json({ success: true, event: eventContext });
    } catch (error: any) {
        console.error("Create Event Error:", error);
        res.status(500).json({ error: 'Failed to create event', details: error.message, stack: error.stack });
    }
};

export const getMyEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        // @ts-ignore
        const userId = req.user.id;

        const snapshot = await db.collection('events').where('hostId', '==', userId).get();
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        res.json({ success: true, events });
    } catch (error: any) {
        console.error("Get My Events Error:", error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

export const getEventById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    try {
        const doc = await db.collection('events').doc(id).get();
        if (!doc.exists) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json({ success: true, event: { id: doc.id, ...doc.data() } });
    } catch (error: any) {
        console.error("Get Event Error:", error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
};
