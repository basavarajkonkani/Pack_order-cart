/**
 * WhatsApp Service Module
 * Handles sending WhatsApp messages via Twilio API
 */

// Type definition for order items
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

// Type definition for shipping address
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

// Type definition for order
interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
  status: string;
  paymentMethod: string;
}

interface WhatsAppMessage {
  to: string;
  body: string;
}

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

/**
 * Format phone number to WhatsApp format
 * Converts +919876543210 to whatsapp:+919876543210
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  if (cleaned.startsWith('whatsapp:')) {
    return cleaned;
  }
  if (!cleaned.startsWith('+')) {
    throw new Error('Phone number must include country code with + prefix');
  }
  return `whatsapp:${cleaned}`;
}

/**
 * Send WhatsApp message via Twilio
 * This should be called from Firebase Cloud Functions (server-side only)
 */
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  message: WhatsAppMessage
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  try {
    // Twilio client should be instantiated server-side
    const twilio = require('twilio');
    const client = twilio(config.accountSid, config.authToken);

    const result = await client.messages.create({
      from: config.whatsappNumber,
      to: formatWhatsAppNumber(message.to),
      body: message.body,
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate order confirmation message
 */
export function generateOrderConfirmationMessage(
  order: Order,
  customerName: string
): string {
  const itemsList = order.items
    .map((item: OrderItem) => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`)
    .join('\n');

  return `
🛍️ *Order Confirmed!*

Hi ${customerName},

Your order has been successfully placed!

📦 *Order Details:*
Order ID: #${order.id.substring(0, 8).toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}

*Items:*
${itemsList}

💰 *Total Amount:* ₹${order.totalAmount}
📍 *Delivery Address:*
${order.shippingAddress.street}, ${order.shippingAddress.city}
${order.shippingAddress.state} - ${order.shippingAddress.postalCode}

⏰ *Estimated Delivery:* 3-5 business days

We'll send you updates as your order progresses.

Thank you for shopping with us! 🙏
`.trim();
}

/**
 * Generate order status update message
 */
export function generateOrderStatusMessage(
  order: Order,
  customerName: string,
  newStatus: string
): string {
  const statusEmoji: Record<string, string> = {
    confirmed: '✅',
    processing: '⚙️',
    shipped: '🚚',
    out_for_delivery: '📦',
    delivered: '🎉',
    cancelled: '❌',
  };

  const emoji = statusEmoji[newStatus] || '📢';
  const statusText = newStatus.replace(/_/g, ' ').toUpperCase();

  let message = `
${emoji} *Order Update*

Hi ${customerName},

Your order #${order.id.substring(0, 8).toUpperCase()} is now *${statusText}*
`.trim();

  if (newStatus === 'shipped') {
    message += `\n\n🚚 Your order is on the way!\n⏰ Expected delivery: 2-3 days`;
  } else if (newStatus === 'out_for_delivery') {
    message += `\n\n📦 Your order will be delivered today!`;
  } else if (newStatus === 'delivered') {
    message += `\n\n🎉 Your order has been delivered!\n\nWe hope you love your purchase. Thank you for shopping with us!`;
  } else if (newStatus === 'cancelled') {
    message += `\n\n❌ Your order has been cancelled.\n\nIf you didn't request this, please contact support.`;
  }

  return message;
}

/**
 * Generate admin notification message for new orders
 */
export function generateAdminOrderNotification(
  order: Order,
  customerName: string,
  customerPhone: string
): string {
  const itemsList = order.items
    .map((item: OrderItem) => `• ${item.name} (x${item.quantity})`)
    .join('\n');

  return `
🔔 *New Order Received!*

Order ID: #${order.id.substring(0, 8).toUpperCase()}
Customer: ${customerName}
Phone: ${customerPhone}

*Items:*
${itemsList}

💰 *Total:* ₹${order.totalAmount}

📍 *Delivery to:*
${order.shippingAddress.city}, ${order.shippingAddress.state}

Payment: ${order.paymentMethod}
Status: ${order.status}

⏰ ${new Date(order.createdAt).toLocaleString('en-IN')}
`.trim();
}

/**
 * Validate Indian phone number
 */
export function validateIndianPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\s+/g, '').replace(/^whatsapp:/, '');
  // Indian mobile numbers: +91 followed by 10 digits starting with 6-9
  const indianMobileRegex = /^\+91[6-9]\d{9}$/;
  return indianMobileRegex.test(cleaned);
}

/**
 * Format Indian phone number for display
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\s+/g, '').replace(/^whatsapp:/, '');
  if (cleaned.startsWith('+91')) {
    const number = cleaned.substring(3);
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
  }
  return cleaned;
}
