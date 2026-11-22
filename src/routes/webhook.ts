import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { store } from '../services/storeService.js';
import { sendAutoReply } from '../services/whatsappService.js';

export function createWebhookRouter(io: SocketIOServer) {
  const router = Router();

  /**
   * 1. Meta Webhook Verification (GET /api/webhook)
   */
  router.get('/', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = process.env.META_VERIFY_TOKEN || 'propertyos_pakistan_verify_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('✅ [Meta Webhook Verification Succeeded]');
      res.status(200).send(challenge);
    } else {
      console.warn('❌ [Meta Webhook Verification Failed]: Invalid verify token');
      res.sendStatus(403);
    }
  });

  /**
   * 2. Meta WhatsApp Inbound Message Event (POST /api/webhook)
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const payload = req.body;

      // Send 200 OK immediately as required by Meta (within 3 seconds)
      res.status(200).json({ status: 'EVENT_RECEIVED' });

      if (payload.object !== 'whatsapp_business_account') {
        return;
      }

      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const val = change.value;
          const messages = val.messages;
          const contacts = val.contacts;

          if (messages && messages.length > 0) {
            for (const msg of messages) {
              if (msg.type === 'text' && msg.text?.body) {
                const senderPhone = msg.from; // e.g. "923001234567"
                const senderName = contacts?.[0]?.profile?.name || 'WhatsApp Inquiry';
                const messageText = msg.text.body;

                console.log(`📩 [WhatsApp Received] From: ${senderName} (${senderPhone}) - "${messageText}"`);

                // Ingest into store with phone normalization & duplicate check
                const { lead, isDuplicate } = store.ingestWhatsAppLead(
                  senderPhone,
                  senderName,
                  messageText,
                  msg.id
                );

                // Broadcast live to all connected Manager and Owner screens
                io.emit('new_lead', {
                  lead,
                  isDuplicate,
                  notification: {
                    title: isDuplicate ? '⚠️ Duplicate WhatsApp Lead Detected' : '⚡ New WhatsApp Lead Received!',
                    description: `${lead.fullName} (${lead.phone}): "${messageText.slice(0, 75)}"`,
                  },
                });

                // Auto-reply acknowledgment
                if (process.env.AUTO_REPLY_ENABLED === 'true') {
                  sendAutoReply(senderPhone, senderName).catch((err) =>
                    console.error('Auto-reply failed:', err)
                  );
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error handling Meta Webhook:', err);
    }
  });

  return router;
}
