/**
 * Script to test that category filtering works correctly.
 * This simulates what the app does when filtering products.
 * 
 * Run: node scripts/test-category-filter.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testCategoryFilter() {
  try {
    console.log('🧪 Testing category filter logic...\n');
    
    // Fetch all categories
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = [];
    categoriesSnapshot.docs.forEach(doc => {
      categories.push({ id: doc.id, name: doc.data().name });
    });
    
    // Fetch all products
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      categoryId: doc.data().categoryId
    }));
    
    console.log(`📦 Total products: ${products.length}\n`);
    
    // Test each category filter
    for (const category of categories) {
      // This is the EXACT logic used in products.tsx after the fix
      const filtered = products.filter(p => p.categoryId === category.id);
      
      console.log(`${category.name} (${category.id}):`);
      console.log(`   Expected: Products with categoryId="${category.id}"`);
      console.log(`   Found: ${filtered.length} product(s)`);
      
      if (filtered.length > 0) {
        filtered.forEach(p => {
          console.log(`   ✅ ${p.name}`);
        });
      } else {
        console.log(`   ⚠️  No products found`);
      }
      console.log('');
    }
    
    // Test "All" filter
    console.log('All Products:');
    console.log(`   Expected: All products`);
    console.log(`   Found: ${products.length} product(s)`);
    products.forEach(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      console.log(`   ✅ ${p.name} [${cat ? cat.name : 'No category'}]`);
    });
    
    console.log('\n✨ Filter test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
testCategoryFilter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
