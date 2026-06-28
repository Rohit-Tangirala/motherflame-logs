import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from '../db.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, avatarUrl } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Set role as admin if they use 'admin@rohit.com' or the user's email, otherwise default 'user'
    const adminEmails = ['admin@rohit.com', '2410030030cse@gmail.com'];
    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

    const user = await dbService.createUser(
      name,
      email,
      passwordHash,
      role,
      avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await dbService.getUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error during login.' });
  }
});

// GET /api/auth/me (Protected)
router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const decodedUser = (req as any).user;
    const user = await dbService.getUserById(decodedUser.id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server error fetching profile.' });
  }
});

// GET /api/auth/author/:id (Public)
router.get('/author/:id', async (req: Request, res: Response) => {
  try {
    const authorId = parseInt(req.params.id, 10);
    const user = await dbService.getUserById(authorId);

    if (!user) {
      res.status(404).json({ message: 'Author not found.' });
      return;
    }

    res.status(200).json({
      author: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching author.' });
  }
});

export default router;
