import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { store } from '../services/storeService.js';

export function createFollowUpsRouter(io: SocketIOServer) {
  const router = Router();

  // GET /api/follow-ups (filter by userId, status: pending, overdue)
  router.get('/', (req: Request, res: Response) => {
    const { userId, filter } = req.query;
    const followUps = store.getFollowUps(
      userId as string,
      filter as 'pending' | 'overdue' | 'all'
    );
    res.json({ success: true, count: followUps.length, followUps });
  });

  // POST /api/follow-ups (Schedule a follow-up)
  router.post('/', (req: Request, res: Response) => {
    const {
      leadId,
      createdByUserId,
      assignedToUserId,
      scheduledAt,
      actionType,
      reminderNote,
      priority,
    } = req.body;

    if (!leadId || !createdByUserId || !assignedToUserId || !scheduledAt || !reminderNote) {
      res.status(400).json({
        success: false,
        message: 'leadId, createdByUserId, assignedToUserId, scheduledAt, reminderNote are required',
      });
      return;
    }

    const followUp = store.createFollowUp({
      leadId,
      createdByUserId,
      assignedToUserId,
      scheduledAt,
      actionType: actionType || 'call',
      reminderNote,
      priority: priority || 'high',
    });

    io.emit('follow_up_created', { followUp });
    res.status(201).json({ success: true, followUp });
  });

  // PATCH /api/follow-ups/:id/complete (Complete follow-up & log outcome)
  router.patch('/:id/complete', (req: Request, res: Response) => {
    const { outcomeNotes, userId } = req.body;
    if (!outcomeNotes || !userId) {
      res.status(400).json({ success: false, message: 'outcomeNotes and userId are required' });
      return;
    }

    const completed = store.completeFollowUp(req.params.id as string, outcomeNotes, userId);
    if (!completed) {
      res.status(404).json({ success: false, message: 'Follow-up not found' });
      return;
    }

    io.emit('follow_up_completed', { followUp: completed });
    res.json({ success: true, followUp: completed });
  });

  return router;
}
