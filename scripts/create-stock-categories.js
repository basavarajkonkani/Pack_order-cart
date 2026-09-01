/**
 * Script to create stock pouch categories in Firestore.
 * These categories will be used to organize products in the app.
 * 
 * Run: node scripts/create-stock-categories.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Categories to create
const CATEGORIES = [
  {
    id: 'plain',
    name: 'Bopp',
    description: 'BOPP bags (Blank, no printing)',
    enabled: true,
    sortOrder: 0,
  },
  {
    id: 'standup',
    name: 'Standup',
    description: 'Stand-up pouches',
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'printed',
    name: 'Printed',
    description: 'Custom Packaging',
    enabled: true,
    sortOrder: 2,
  },
];

async function createCategories() {
  try {
    console.log('🔄 Creating categories...\n');
    
    for (const category of CATEGORIES) {
      const { id, ...data } = category;
      
      // Check if category already exists
      const docRef = db.collection('categories').doc(id);
      const doc = await docRef.get();
      
      if (doc.exists) {
        console.log(`⏭️  Category "${category.name}" already exists (${id})`);
      } else {
        await docRef.set(data);
        console.log(`✅ Created category "${category.name}" (${id})`);
      }
    }
    
    console.log('\n✨ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
createCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
