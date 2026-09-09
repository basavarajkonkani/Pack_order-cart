#!/usr/bin/env node
/**
 * Seeds initial business settings (GST details) into Firestore.
 * Run: node scripts/seed-business-settings.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://shop-cart-flow.firebaseio.com'
});

const db = admin.firestore();

const BUSINESS_SETTINGS = {
  gstin: '29AQEPJ1802F1Z7',
  businessName: 'Jeyd Solutions',
  legalName: 'PRASHANTH JAIKUMAR',
  address: '32, 1st Floor, Ashirvad Nilaya, 1st Cross Road, Vijaya Nagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560040',
  gstPercentage: 18,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedBusinessSettings() {
  try {
    console.log('🔄 Seeding business settings...');
    
    await db.collection('business_settings').doc('info').set(BUSINESS_SETTINGS);
    
    console.log('✅ Business settings seeded successfully!');
    console.log('📋 Settings:', JSON.stringify(BUSINESS_SETTINGS, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding business settings:', error);
    process.exit(1);
  }
}

seedBusinessSettings();
