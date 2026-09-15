/**
 * Script to verify that all products have correct categoryId assignments.
 * 
 * Run: node scripts/verify-categories.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function verifyCategories() {
  try {
    console.log('🔍 Verifying product categories...\n');
    
    // Fetch all categories
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = {};
    categoriesSnapshot.docs.forEach(doc => {
      categories[doc.id] = doc.data().name;
    });
    
    console.log('📋 Available categories:');
    Object.entries(categories).forEach(([id, name]) => {
      console.log(`   - ${id}: ${name}`);
    });
    console.log('');
    
    // Fetch all products
    const productsSnapshot = await db.collection('products').get();
    
    if (productsSnapshot.empty) {
      console.log('⚠️  No products found in database');
      return;
    }

    console.log(`📦 Found ${productsSnapshot.size} products:\n`);
    
    const grouped = {};
    let withoutCategory = [];
    
    for (const doc of productsSnapshot.docs) {
      const product = doc.data();
      const categoryId = product.categoryId;
      
      if (!categoryId) {
        withoutCategory.push(product.name);
      } else {
        if (!grouped[categoryId]) {
          grouped[categoryId] = [];
        }
        grouped[categoryId].push(product.name);
      }
    }
    
    // Display grouped products
    Object.entries(grouped).forEach(([catId, products]) => {
      const categoryName = categories[catId] || 'Unknown';
      console.log(`${categoryName} (${catId}):`);
      products.forEach(name => console.log(`  ✅ ${name}`));
      console.log('');
    });
    
    if (withoutCategory.length > 0) {
      console.log('⚠️  Products without category:');
      withoutCategory.forEach(name => console.log(`  ❌ ${name}`));
    } else {
      console.log('✨ All products have categories assigned!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
verifyCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
