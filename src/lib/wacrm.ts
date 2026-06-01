// ═══════════════════════════════════════════════════════════
// WhatsApp Cloud API Client
// Directly calls Meta's WhatsApp Business API
// Integrated into ImpactLens — no external WACRM app needed
// ═══════════════════════════════════════════════════════════

const WA_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
const WA_PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
const WA_API_BASE = `https://graph.facebook.com/v21.0/${WA_PHONE_NUMBER_ID}`;

export function isWhatsAppConfigured(): boolean {
  return !!(WA_ACCESS_TOKEN && WA_PHONE_NUMBER_ID);
}

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ wa_id: string }>;
  messages: Array<{ id: string }>;
}

/**
 * Send a text message to a single recipient.
 */
export async function sendTextMessage(
  recipientPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const response = await fetch(`${WA_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone.replace(/\D/g, ''),
        type: 'text',
        text: { body: message },
      }),
    });

    const data: WhatsAppMessageResponse = await response.json();
    return {
      success: response.ok,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send a document (PDF receipt) to a recipient.
 */
export async function sendDocument(
  recipientPhone: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const response = await fetch(`${WA_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone.replace(/\D/g, ''),
        type: 'document',
        document: {
          link: documentUrl,
          filename,
          caption: caption || `Receipt from ImpactLens`,
        },
      }),
    });

    const data: WhatsAppMessageResponse = await response.json();
    return {
      success: response.ok,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send an image with caption (for impact updates).
 */
export async function sendImageMessage(
  recipientPhone: string,
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const response = await fetch(`${WA_API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientPhone.replace(/\D/g, ''),
        type: 'image',
        image: {
          link: imageUrl,
          caption,
        },
      }),
    });

    const data: WhatsAppMessageResponse = await response.json();
    return {
      success: response.ok,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Send a broadcast message to multiple donors.
 * Replaces template variables like {{donor_name}}, {{campaign_name}}, etc.
 */
export async function sendBroadcast(
  recipients: Array<{ phone: string; name: string; [key: string]: string }>,
  messageTemplate: string,
  attachmentUrl?: string
): Promise<{ sent: number; failed: number; results: Array<{ phone: string; success: boolean; error?: string }> }> {
  const results: Array<{ phone: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Replace template variables
    let message = messageTemplate;
    message = message.replace(/\{\{donor_name\}\}/g, recipient.name);
    Object.entries(recipient).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    let result;
    if (attachmentUrl) {
      // Determine if it's an image or document
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentUrl);
      if (isImage) {
        result = await sendImageMessage(recipient.phone, attachmentUrl, message);
      } else {
        result = await sendDocument(recipient.phone, attachmentUrl, 'attachment.pdf', message);
      }
    } else {
      result = await sendTextMessage(recipient.phone, message);
    }

    results.push({ phone: recipient.phone, ...result });
    if (result.success) sent++;
    else failed++;

    // Rate limiting: 80 messages per second max
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { sent, failed, results };
}

/**
 * Send an impact update to donors interested in a specific category.
 */
export async function sendImpactUpdate(
  donors: Array<{ phone: string; name: string }>,
  photoUrl: string,
  description: string,
  trustfeedUrl: string
): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };

  for (const donor of donors) {
    const message = `Hi ${donor.name}! 🌱\n\nYour support is making a real difference:\n\n${description}\n\n🔗 See the full impact: ${trustfeedUrl}`;

    const result = await sendImageMessage(donor.phone, photoUrl, message);
    if (result.success) results.sent++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  mediaUrl,
  variables,
  credentials
}: {
  to: string;
  templateName: string;
  mediaUrl?: string;
  variables: string[];
  credentials?: {
    phoneNumberId: string;
    accessToken: string;
  }
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = credentials?.accessToken || WA_ACCESS_TOKEN;
  const phoneId = credentials?.phoneNumberId || WA_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const components: any[] = [
      {
        type: "body",
        parameters: variables.map(text => ({ type: "text", text }))
      }
    ];

    if (mediaUrl) {
      components.push({
        type: "header",
        parameters: [
          {
            type: "image",
            image: { link: mediaUrl }
          }
        ]
      });
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components
        },
      }),
    });

    const data = await response.json();
    return {
      success: response.ok,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
