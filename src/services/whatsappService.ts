import axios from 'axios';

interface SendWhatsAppMessageParams {
  toPhone: string;
  messageText: string;
}

export async function sendWhatsAppMessage({ toPhone, messageText }: SendWhatsAppMessageParams) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('[WhatsAppService] META_ACCESS_TOKEN or META_PHONE_NUMBER_ID not configured. Skipping API call.');
    return { success: false, reason: 'Credentials not configured' };
  }

  // Meta expects international digits format without plus sign, e.g. "923001234567"
  const cleanRecipient = toPhone.replace(/\D/g, '');

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[WhatsAppService] Failed to send WhatsApp message:', error?.response?.data || error.message);
    return { success: false, error: error?.response?.data || error.message };
  }
}

/**
 * Auto-reply acknowledgment sent to the lead
 */
export async function sendAutoReply(recipientPhone: string, leadName: string) {
  const autoReplyText = `Assalam-o-Alaikum ${leadName}! 
Thank you for contacting PropertyOS Real Estate.

We have received your inquiry. One of our dedicated property specialists will get in touch with you shortly.

Regards,
PropertyOS Agency Team`;

  return await sendWhatsAppMessage({
    toPhone: recipientPhone,
    messageText: autoReplyText,
  });
}
