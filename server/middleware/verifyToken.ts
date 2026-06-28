import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'user' | 'admin';
    name: string;
  };
}

/**
 * Middleware to verify JWT token. Extracts user metadata and binds it to req.user.
 */
export function verifyOptionalToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';
    const decoded = jwt.verify(token, secret) as any;
    
    // Attach decoded token payload to req.user
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    
    next();
  } catch (error) {
    next();
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key_12345';
    const decoded = jwt.verify(token, secret) as any;
    
    // Attach decoded token payload to req.user
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
