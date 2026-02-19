import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const register = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    try {
        // Validate input
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Please provide all required fields' });
            return;
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'guest'
        });

        // Generate Token
        // @ts-ignore
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Server Error during Registration' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate Token
        // @ts-ignore
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server Error during Login' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    // Middleware should attach user to request object
    try {
        // @ts-ignore
        const userId = req.user.id;
        const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ success: true, user });
    } catch (error: any) {
        res.status(500).json({ error: 'Server Error fetching profile' });
    }
};
