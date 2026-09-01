/**
 * Script to update "Printed Standup Pouch" to "Printed Standy Pouch" using Admin SDK
 * Run: node scripts/update-product-admin.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK with service account
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateProductName() {
  console.log('Searching for "Printed Standup Pouch"...');
  
  const snapshot = await db.collection('products').get();
  
  let found = false;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.name === 'Printed Standup Pouch') {
      console.log(`Found product: ${doc.id}`);
      await db.collection('products').doc(doc.id).update({
        name: 'Printed Standy Pouch'
      });
      console.log(`✓ Updated "${data.name}" to "Printed Standy Pouch"`);
      found = true;
    }
  }

  if (!found) {
    console.log('No product found with name "Printed Standup Pouch"');
  }

  console.log('\nDone!');
  process.exit(0);
}

updateProductName().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
