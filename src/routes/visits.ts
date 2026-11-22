import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { store } from '../services/storeService.js';

export function createVisitsRouter(io: SocketIOServer) {
  const router = Router();

  // GET /api/visits (filter by agentId)
  router.get('/', (req: Request, res: Response) => {
    const { agentId } = req.query;
    const visits = store.getSiteVisits(agentId as string);
    res.json({ success: true, count: visits.length, visits });
  });

  // POST /api/visits (Manager schedules site visit & assigns field agent)
  router.post('/', (req: Request, res: Response) => {
    const {
      leadId,
      propertyId,
      assignedAgentId,
      scheduledByManagerId,
      scheduledTime,
      agentInternalNotes,
    } = req.body;

    if (!leadId || !propertyId || !assignedAgentId || !scheduledByManagerId || !scheduledTime) {
      res.status(400).json({
        success: false,
        message: 'leadId, propertyId, assignedAgentId, scheduledByManagerId, scheduledTime are required',
      });
      return;
    }

    const { visit, lead } = store.scheduleSiteVisit({
      leadId,
      propertyId,
      assignedAgentId,
      scheduledByManagerId,
      scheduledTime,
      agentInternalNotes,
    });

    // Notify agent portal in real-time
    io.emit('visit_scheduled', { visit, lead });

    res.status(201).json({ success: true, visit, lead });
  });

  // PATCH /api/visits/:id/complete (Agent records post-visit client feedback)
  router.patch('/:id/complete', (req: Request, res: Response) => {
    const { clientFeedback, agentId } = req.body;
    if (!clientFeedback || !agentId) {
      res.status(400).json({ success: false, message: 'clientFeedback and agentId are required' });
      return;
    }

    const completed = store.completeSiteVisit(req.params.id as string, clientFeedback, agentId);
    if (!completed) {
      res.status(404).json({ success: false, message: 'Site visit not found' });
      return;
    }

    io.emit('visit_completed', { visit: completed });
    res.json({ success: true, visit: completed });
  });

  return router;
}
