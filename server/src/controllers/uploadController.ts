import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToImgBB } from '../utils/imgbb';
import fs from 'fs';
import path from 'path';

// Configure Multer for in-memory storage (ImgBB handle base64 easily)
const storage = multer.memoryStorage();
export const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).single('file'); // expecting 'file' field name

export const handleFileUpload = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }

    try {
        let fileUrl: string;

        if (req.file.mimetype.startsWith('image/')) {
            fileUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
        } else if (req.file.mimetype.startsWith('video/')) {
            const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
            // Adjust path depending on where server runs. Assuming uploads is in server root.
            const uploadDir = path.join(__dirname, '../../uploads');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, req.file.buffer);

            // Construct URL
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        } else {
            throw new Error('Unsupported file type');
        }

        res.json({
            success: true,
            data: {
                url: fileUrl,
                name: req.file.originalname,
                type: req.file.mimetype.startsWith('video/') ? 'video' : 'photo'
            }
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
};
