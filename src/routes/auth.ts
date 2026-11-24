import { Router, Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';
import { store } from '../services/storeService.js';

export const authRouter = Router();

/**
 * 1. POST /api/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const result = loginUser(email, password);
  if (!result.success) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
});

/**
 * 2. POST /api/auth/register
 * Body: { name, email, phone, role: 'owner'|'manager'|'agent', password }
 * Creates a new account in the system
 */
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, phone, role, password } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({
      success: false,
      message: 'name, email, role, and password are required fields',
    });
    return;
  }

  const validRoles = ['owner', 'manager', 'agent'];
  if (!validRoles.includes(role)) {
    res.status(400).json({
      success: false,
      message: `Invalid role '${role}'. Must be one of: owner, manager, agent`,
    });
    return;
  }

  const result = registerUser({ name, email, phone, role, password });
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.status(201).json(result);
});

/**
 * 3. GET /api/auth/me
 * Protected: Requires Authorization: Bearer <token>
 */
authRouter.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.sub;
  const user = store.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({
    success: true,
    user,
  });
});
