import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access to admin users only.
 * Must be used after verifyToken.
 */
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
    return;
  }

  next();
}
