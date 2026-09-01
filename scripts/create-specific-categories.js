/**
 * Script to create specific product categories in Firestore.
 * Each category will contain only its specific product types.
 * 
 * Run: node scripts/create-specific-categories.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Specific categories for different pouch types
const CATEGORIES = [
  {
    id: 'bopp-bags',
    name: 'Bopp Bags',
    description: 'BOPP bags (Blank, no printing)',
    enabled: true,
    sortOrder: 0,
  },
  {
    id: 'standup-pouches',
    name: 'Standup',
    description: 'Stand-up pouches',
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'kraft-pouches',
    name: 'Kraft',
    description: 'Natural & Premium kraft pouches',
    enabled: true,
    sortOrder: 2,
  },
  {
    id: 'printed',
    name: 'Printed',
    description: 'Custom Packaging',
    enabled: true,
    sortOrder: 3,
  },
];

async function createCategories() {
  try {
    console.log('🔄 Creating specific categories...\n');
    
    for (const category of CATEGORIES) {
      const { id, ...data } = category;
      
      // Update or create category
      const docRef = db.collection('categories').doc(id);
      await docRef.set(data, { merge: true });
      console.log(`✅ Created/Updated category "${category.name}" (${id})`);
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
