import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { store } from '../services/storeService.js';

export function createLeadsRouter(io: SocketIOServer) {
  const router = Router();

  // 1. GET /api/leads (filter by unassigned, my-leads, status)
  router.get('/', (req: Request, res: Response) => {
    const { status, managerId, agentId, unassigned } = req.query;

    const leads = store.getLeads({
      status: status as string,
      managerId: managerId as string,
      agentId: agentId as string,
      unassigned: unassigned === 'true',
    });

    res.json({ success: true, count: leads.length, leads });
  });

  // 2. GET /api/leads/:id
  router.get('/:id', (req: Request, res: Response) => {
    const lead = store.getLeadById(req.params.id as string);
    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json({ success: true, lead });
  });

  // 3. POST /api/leads/:id/claim (Atomic Concurrency Lock for Managers)
  router.post('/:id/claim', (req: Request, res: Response) => {
    const { managerId } = req.body;
    if (!managerId) {
      res.status(400).json({ success: false, message: 'managerId is required' });
      return;
    }

    const result = store.claimLead(req.params.id as string, managerId);

    if (!result.success) {
      // 409 Conflict: Already locked by another manager
      res.status(409).json(result);
      return;
    }

    // Broadcast lock update to all active manager screens in real-time
    io.emit('lead_locked', {
      leadId: req.params.id as string,
      lockedByManagerId: managerId,
      lead: result.lead,
    });

    res.json(result);
  });

  // 4. POST /api/leads/:id/release-lock
  router.post('/:id/release-lock', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId is required' });
      return;
    }

    const result = store.releaseLeadLock(req.params.id as string, userId);
    if (!result.success) {
      res.status(403).json(result);
      return;
    }

    io.emit('lead_unlocked', {
      leadId: req.params.id as string,
      lead: result.lead,
    });

    res.json(result);
  });

  // 5. PATCH /api/leads/:id (Update status, qualification, notes)
  router.patch('/:id', (req: Request, res: Response) => {
    const { userId, ...updates } = req.body;
    const updated = store.updateLead(req.params.id as string, updates, userId);

    if (!updated) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    io.emit('lead_updated', { lead: updated });
    res.json({ success: true, lead: updated });
  });

  // 6. POST /api/leads/simulate (Local test simulator for incoming WhatsApp leads)
  router.post('/simulate', (req: Request, res: Response) => {
    const { name, phone, message } = req.body;

    const senderPhone = phone || '923001234567';
    const senderName = name || 'Muhammad Usman';
    const messageText =
      message ||
      'Assalam-o-Alaikum, I am looking for a 1 Kanal plot in DHA Phase 6. Budget is around 5.4 Crore.';

    const { lead, isDuplicate } = store.ingestWhatsAppLead(
      senderPhone,
      senderName,
      messageText,
      `sim-${Date.now()}`
    );

    // Broadcast to frontend
    io.emit('new_lead', {
      lead,
      isDuplicate,
      notification: {
        title: isDuplicate ? '⚠️ Duplicate WhatsApp Lead Detected' : '⚡ New WhatsApp Lead Received!',
        description: `${lead.fullName} (${lead.phone}): "${messageText.slice(0, 75)}"`,
      },
    });

    res.json({
      success: true,
      message: 'Simulated WhatsApp lead ingested and broadcast to all manager portals',
      lead,
      isDuplicate,
    });
  });

  return router;
}
