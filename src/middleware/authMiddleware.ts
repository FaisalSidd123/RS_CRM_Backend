import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.js';
import { UserRole } from '../types/schema.js';

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  req.user = payload;
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 * e.g. requireRole('owner') or requireRole('owner', 'manager')
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
}
