/**
 * Firebase Cloud Functions for WhatsApp Integration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Run: firebase init functions (select TypeScript)
 * 2. Copy this file to: functions/src/index.ts
 * 3. Install dependencies: cd functions && npm install twilio
 * 4. Set config: firebase functions:config:set twilio.account_sid="..." twilio.auth_token="..." twilio.whatsapp_number="..." twilio.admin_number="..."
 * 5. Deploy: firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

// Initialize Firebase Admin
admin.initializeApp();

// Get Twilio configuration from environment
const getTwilioConfig = () => {
  const config = functions.config().twilio;
  if (!config) {
    throw new Error('Twilio configuration not found. Run: firebase functions:config:set twilio.account_sid="..." twilio.auth_token="..."');
  }
  return config;
};

// Initialize Twilio client
const getTwilioClient = () => {
  const config = getTwilioConfig();
  return twilio(config.account_sid, config.auth_token);
};

/**
 * Format phone number to WhatsApp format
 */
function formatWhatsAppNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\s+/g, '');
  if (cleaned.startsWith('whatsapp:')) {
    return cleaned;
  }
  return `whatsapp:${cleaned}`;
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const client = getTwilioClient();
  const config = getTwilioConfig();

  try {
    const message = await client.messages.create({
      from: config.whatsapp_number,
      to: formatWhatsAppNumber(to),
      body: body,
    });

    console.log(`WhatsApp message sent successfully. SID: ${message.sid}`);
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}

/**
 * Generate order confirmation message
 */
function generateOrderConfirmationMessage(order: any, customerName: string): string {
  const itemsList = order.items
    .map((item: any) => `• ${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`)
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
 * Generate admin notification message
 */
function generateAdminOrderNotification(order: any, customerName: string, customerPhone: string): string {
  const itemsList = order.items
    .map((item: any) => `• ${item.name} (x${item.quantity})`)
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
 * Generate order status update message
 */
function generateOrderStatusMessage(order: any, customerName: string, newStatus: string): string {
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
 * Triggered when a new order is created
 * Sends confirmation to customer and notification to admin
 */
export const onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    console.log(`New order created: ${orderId}`);

    try {
      // Get customer details
      const customerDoc = await admin
        .firestore()
        .collection('users')
        .doc(order.userId)
        .get();

      if (!customerDoc.exists) {
        console.error(`Customer not found: ${order.userId}`);
        return;
      }

      const customer = customerDoc.data();
      const customerName = customer?.displayName || customer?.email || 'Customer';
      const customerPhone = customer?.phoneNumber;

      // Send confirmation to customer
      if (customerPhone) {
        const customerMessage = generateOrderConfirmationMessage(order, customerName);
        await sendWhatsAppMessage(customerPhone, customerMessage);
        console.log(`Order confirmation sent to customer: ${customerPhone}`);
      } else {
        console.warn(`Customer phone number not found for user: ${order.userId}`);
      }

      // Send notification to admin
      const config = getTwilioConfig();
      if (config.admin_number) {
        const adminMessage = generateAdminOrderNotification(
          order,
          customerName,
          customerPhone || 'Not provided'
        );
        await sendWhatsAppMessage(config.admin_number, adminMessage);
        console.log(`Admin notification sent`);
      }
    } catch (error) {
      console.error('Error sending WhatsApp messages:', error);
      // Don't throw - we don't want to fail the order creation if messaging fails
    }
  });

/**
 * Triggered when an order status is updated
 * Sends status update to customer
 */
export const onOrderStatusUpdated = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const oldOrder = change.before.data();
    const newOrder = change.after.data();
    const orderId = context.params.orderId;

    // Check if status changed
    if (oldOrder.status === newOrder.status) {
      return;
    }

    console.log(`Order ${orderId} status changed: ${oldOrder.status} -> ${newOrder.status}`);

    try {
      // Get customer details
      const customerDoc = await admin
        .firestore()
        .collection('users')
        .doc(newOrder.userId)
        .get();

      if (!customerDoc.exists) {
        console.error(`Customer not found: ${newOrder.userId}`);
        return;
      }

      const customer = customerDoc.data();
      const customerName = customer?.displayName || customer?.email || 'Customer';
      const customerPhone = customer?.phoneNumber;

      // Send status update to customer
      if (customerPhone) {
        const message = generateOrderStatusMessage(newOrder, customerName, newOrder.status);
        await sendWhatsAppMessage(customerPhone, message);
        console.log(`Status update sent to customer: ${customerPhone}`);
      } else {
        console.warn(`Customer phone number not found for user: ${newOrder.userId}`);
      }
    } catch (error) {
      console.error('Error sending WhatsApp status update:', error);
    }
  });

/**
 * Manual function to test WhatsApp integration
 * Call via: firebase functions:shell
 * > testWhatsApp({to: '+919876543210', message: 'Hello from Firebase!'})
 */
export const testWhatsApp = functions.https.onCall(async (data, context) => {
  // Verify the request is authenticated (optional but recommended)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { to, message } = data;

  if (!to || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function requires "to" and "message" parameters.'
    );
  }

  try {
    await sendWhatsAppMessage(to, message);
    return { success: true, message: 'WhatsApp message sent successfully' };
  } catch (error) {
    console.error('Test WhatsApp failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send WhatsApp message');
  }
});

/**
 * HTTP endpoint to send WhatsApp message (for testing)
 * POST to: https://your-region-your-project.cloudfunctions.net/sendWhatsAppHttp
 * Body: { "to": "+919876543210", "message": "Hello!" }
 */
export const sendWhatsAppHttp = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { to, message } = req.body;

  if (!to || !message) {
    res.status(400).json({ error: 'Missing "to" or "message" parameter' });
    return;
  }

  try {
    await sendWhatsAppMessage(to, message);
    res.status(200).json({ success: true, message: 'WhatsApp message sent' });
  } catch (error) {
    console.error('HTTP WhatsApp failed:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});
