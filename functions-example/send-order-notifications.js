/**
 * Firebase Cloud Function to send push notifications when order status changes.
 * 
 * Deploy with: firebase deploy --only functions:sendOrderNotifications
 * 
 * This function:
 * 1. Listens to order document updates in Firestore
 * 2. Reads the user's FCM token from users collection
 * 3. Sends a push notification via Firebase Admin SDK
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (automatically uses project credentials when deployed)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Status display names for notifications
const STATUS_NAMES = {
  'pending': 'Pending Confirmation',
  'confirmed': 'Confirmed',
  'artwork-review': 'Artwork Under Review',
  'printing': 'Printing in Progress',
  'quality-check': 'Quality Check',
  'dispatched': 'Dispatched',
  'delivered': 'Delivered',
  'cancelled': 'Cancelled',
};

exports.sendOrderNotifications = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const orderId = context.params.orderId;
    const before = change.before.data();
    const after = change.after.data();

    // Only send notification if status actually changed
    if (before.status === after.status) {
      console.log('Status unchanged, skipping notification');
      return null;
    }

    const userId = after.userId;
    const newStatus = after.status;
    const statusName = STATUS_NAMES[newStatus] || newStatus;

    console.log(`Order ${orderId} status changed: ${before.status} → ${newStatus}`);

    try {
      // Get user's FCM token from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.warn(`User ${userId} not found`);
        return null;
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcmToken;

      if (!fcmToken) {
        console.warn(`No FCM token for user ${userId}`);
        return null;
      }

      // Prepare notification message
      const message = {
        notification: {
          title: 'Order Update',
          body: `Your order #${orderId.substring(0, 8)} is now ${statusName}`,
        },
        data: {
          orderId: orderId,
          status: newStatus,
          type: 'order_update',
        },
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            channelId: 'orders',
            color: '#10B981',
            sound: 'default',
          },
        },
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log(`Notification sent successfully: ${response}`);

      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // If token is invalid (user uninstalled app), remove it
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        console.log(`Removing invalid FCM token for user ${userId}`);
        await db.collection('users').doc(userId).update({
          fcmToken: null,
          fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      return null;
    }
  });

/**
 * Test function to manually send a notification (callable from app or admin portal).
 * 
 * Usage from app:
 * const testNotification = httpsCallable(functions, 'testOrderNotification');
 * await testNotification({ userId: 'user123', orderId: 'order456' });
 */
exports.testOrderNotification = functions.https.onCall(async (data, context) => {
  const { userId, orderId } = data;

  if (!userId || !orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and orderId are required');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const fcmToken = userDoc.data().fcmToken;

    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'No FCM token registered');
    }

    const message = {
      notification: {
        title: 'Test Notification',
        body: `This is a test notification for order #${orderId.substring(0, 8)}`,
      },
      data: {
        orderId: orderId,
        status: 'test',
        type: 'order_update',
      },
      token: fcmToken,
      android: {
        priority: 'high',
        notification: {
          channelId: 'orders',
          color: '#10B981',
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Test notification error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
