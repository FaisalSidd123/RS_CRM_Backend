import { Router, Request, Response } from 'express';
import { store } from '../services/storeService.js';

export const usersRouter = Router();

// GET /api/users (List all users, optionally filter by role: owner, manager, agent)
usersRouter.get('/', (req: Request, res: Response) => {
  const { role } = req.query;
  const users = store.users.filter((u) => {
    if (role && u.role !== role) return false;
    return true;
  });

  res.json({ success: true, count: users.length, users });
});

// GET /api/users/properties (List inventory properties)
usersRouter.get('/properties', (req: Request, res: Response) => {
  res.json({ success: true, count: store.properties.length, properties: store.properties });
});

// GET /api/users/activity (Activity logs)
usersRouter.get('/activity', (req: Request, res: Response) => {
  res.json({ success: true, count: store.activityLogs.length, activities: store.activityLogs });
});
