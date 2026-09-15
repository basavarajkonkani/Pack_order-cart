/**
 * Migration script to populate customer information in existing orders
 * 
 * This script:
 * 1. Fetches all orders from Firestore
 * 2. For each order with a userId, looks up the user's profile
 * 3. Adds customerName, customerPhone, and customerEmail to the order
 * 
 * Run with: node scripts/migrate-order-customer-info.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateOrderCustomerInfo() {
  console.log('Starting migration to add customer info to orders...\n');

  try {
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`Found ${ordersSnapshot.size} orders to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each order
    for (const orderDoc of ordersSnapshot.docs) {
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();

      // Skip if customer info already exists
      if (orderData.customerName || orderData.customerPhone || orderData.customerEmail) {
        console.log(`✓ Order ${orderData.orderId || orderId} already has customer info, skipping`);
        skippedCount++;
        continue;
      }

      // Skip if no userId
      if (!orderData.userId) {
        console.log(`⚠ Order ${orderData.orderId || orderId} has no userId, skipping`);
        skippedCount++;
        continue;
      }

      try {
        // Fetch user profile
        const userDoc = await db.collection('users').doc(orderData.userId).get();
        
        if (!userDoc.exists) {
          console.log(`⚠ User ${orderData.userId} not found for order ${orderData.orderId || orderId}`);
          skippedCount++;
          continue;
        }

        const userData = userDoc.data();
        
        // Prepare update data
        const updateData = {};
        if (userData.name) updateData.customerName = userData.name;
        if (userData.phone) updateData.customerPhone = userData.phone;
        if (userData.email) updateData.customerEmail = userData.email;

        // Only update if we have at least one piece of customer info
        if (Object.keys(updateData).length === 0) {
          console.log(`⚠ No customer info available for order ${orderData.orderId || orderId}`);
          skippedCount++;
          continue;
        }

        // Update the order
        await db.collection('orders').doc(orderId).update(updateData);
        
        console.log(`✓ Updated order ${orderData.orderId || orderId} with:`, 
          Object.keys(updateData).join(', '));
        updatedCount++;

      } catch (error) {
        console.error(`✗ Error processing order ${orderData.orderId || orderId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total orders: ${ordersSnapshot.size}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateOrderCustomerInfo();
