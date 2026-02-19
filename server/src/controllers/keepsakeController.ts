import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import { db } from '../config/firebase';

export const generateKeepsake = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;

    try {
        // Fetch Event
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        const eventContext = eventDoc.data() || {};

        // Fetch Guestbook
        const guestbookSnap = await db.collection('events').doc(eventId).collection('guestbook').get();
        const guestbook = guestbookSnap.docs.map(d => d.data());

        // Fetch Posts
        const postsSnap = await db.collection('events').doc(eventId).collection('posts').get();
        const posts = postsSnap.docs.map(d => d.data());

        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Keepsake-${eventId}.pdf`);

        doc.pipe(res);

        // Cover Page
        doc.fontSize(30).text(eventContext.title || 'Farewell Event', { align: 'center' });
        doc.moveDown();
        doc.fontSize(20).text(`Honoring: ${eventContext.guestOfHonor || 'Guest'}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Hosted by: ${eventContext.hostName || 'Host'}`, { align: 'center' });
        doc.text(`Date: ${new Date(eventContext.eventDate).toLocaleDateString()}`, { align: 'center' });

        doc.addPage();

        // Guestbook Section
        doc.fontSize(24).text('Guestbook Messages', { underline: true });
        doc.moveDown();
        guestbook.forEach((entry: any) => {
            doc.fontSize(12).text(`${entry.authorName}: ${entry.message}`);
            doc.moveDown(0.5);
        });

        doc.addPage();

        // Memory Wall
        doc.fontSize(24).text('Memory Wall', { underline: true });
        doc.moveDown();

        for (const post of posts) {
            doc.fontSize(14).text(post.authorName || 'Anonymous');
            if (post.caption) doc.fontSize(12).text(post.caption);

            if (post.type === 'photo' && post.content) {
                try {
                    const imageResponse = await axios.get(post.content, { responseType: 'arraybuffer' });
                    const image = Buffer.from(imageResponse.data);
                    doc.image(image, { fit: [400, 300], align: 'center' });
                } catch (imgError) {
                    doc.text('[Image loading failed]');
                }
            } else if (post.type === 'text') {
                doc.text(post.content);
            }
            doc.moveDown();
        }

        doc.end();

    } catch (error) {
        console.error('Keepsake Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate keepsake' });
        }
    }
};
