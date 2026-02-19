import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify the ID token using Firebase Admin SDK
            const decodedToken = await auth.verifyIdToken(token);

            // Attach user info to request
            // @ts-ignore
            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                picture: decodedToken.picture
            };

            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};
