import { Router, Request, Response } from 'express';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

export const whatsappRouter = Router();

// GET /api/whatsapp/status
whatsappRouter.get('/status', (req: Request, res: Response) => {
  const isConfigured = Boolean(
    process.env.META_ACCESS_TOKEN &&
    process.env.META_PHONE_NUMBER_ID &&
    process.env.META_WABA_ID
  );

  res.json({
    status: isConfigured ? 'CONNECTED' : 'CREDENTIALS_MISSING',
    configured: isConfigured,
    phoneNumberId: process.env.META_PHONE_NUMBER_ID ? '***' + process.env.META_PHONE_NUMBER_ID.slice(-4) : null,
    verifyToken: process.env.META_VERIFY_TOKEN || 'propertyos_pakistan_verify_2026',
  });
});

// POST /api/whatsapp/send
whatsappRouter.post('/send', async (req: Request, res: Response) => {
  const { toPhone, message } = req.body;

  if (!toPhone || !message) {
    res.status(400).json({ success: false, error: 'toPhone and message are required' });
    return;
  }

  const result = await sendWhatsAppMessage({ toPhone, messageText: message });
  res.json(result);
});
