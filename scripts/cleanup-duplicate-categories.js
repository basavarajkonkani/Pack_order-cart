/**
 * Script to remove duplicate or unused categories.
 * 
 * Run: node scripts/cleanup-duplicate-categories.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupCategories() {
  try {
    console.log('🧹 Cleaning up duplicate categories...\n');
    
    // Categories to remove (duplicates or unused)
    const categoriesToRemove = ['standup-pouch', 'printed'];
    
    for (const categoryId of categoriesToRemove) {
      const docRef = db.collection('categories').doc(categoryId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        await docRef.delete();
        console.log(`✅ Deleted category: ${categoryId} (${doc.data().name})`);
      } else {
        console.log(`⏭️  Category not found: ${categoryId}`);
      }
    }
    
    console.log('\n✨ Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
cleanupCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
