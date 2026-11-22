import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { store } from '../services/storeService.js';
import { DealStage } from '../types/schema.js';

export function createDealsRouter(io: SocketIOServer) {
  const router = Router();

  // GET /api/deals (filter by agentId)
  router.get('/', (req: Request, res: Response) => {
    const { agentId } = req.query;
    const deals = store.getDeals(agentId as string);
    res.json({ success: true, count: deals.length, deals });
  });

  // POST /api/deals (Create deal from qualified lead)
  router.post('/', (req: Request, res: Response) => {
    const {
      dealTitle,
      leadId,
      propertyId,
      agentId,
      managerId,
      agreedPrice,
      tokenAmount,
      tokenDate,
      agencyCommissionPct,
      targetClosingDate,
    } = req.body;

    if (!dealTitle || !leadId || !propertyId || !agentId || !agreedPrice) {
      res.status(400).json({
        success: false,
        message: 'dealTitle, leadId, propertyId, agentId, and agreedPrice are required',
      });
      return;
    }

    const deal = store.createDeal({
      dealTitle,
      leadId,
      propertyId,
      agentId,
      managerId,
      agreedPrice: Number(agreedPrice),
      tokenAmount: Number(tokenAmount || 0),
      tokenDate,
      agencyCommissionPct: agencyCommissionPct ? Number(agencyCommissionPct) : 1.0,
      targetClosingDate,
    });

    io.emit('deal_created', { deal });
    res.status(201).json({ success: true, deal });
  });

  // PATCH /api/deals/:id/stage (Move deal stage: token_received -> closed_won)
  router.patch('/:id/stage', (req: Request, res: Response) => {
    const { stage, userId } = req.body;
    if (!stage || !userId) {
      res.status(400).json({ success: false, message: 'stage and userId are required' });
      return;
    }

    const updated = store.updateDealStage(req.params.id as string, stage as DealStage, userId);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    io.emit('deal_stage_changed', { deal: updated });
    res.json({ success: true, deal: updated });
  });

  return router;
}
