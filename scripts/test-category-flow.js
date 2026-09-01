/**
 * Test script to verify category navigation and product filtering
 * 
 * Run: node scripts/test-category-flow.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testCategoryFlow() {
  try {
    console.log('🧪 Testing Category Flow\n');
    console.log('=' .repeat(60));
    
    // 1. Check categories
    console.log('\n📂 CATEGORIES:\n');
    const categoriesSnapshot = await db.collection('categories').orderBy('sortOrder').get();
    
    categoriesSnapshot.forEach(doc => {
      const cat = doc.data();
      console.log(`   ${cat.name} (id: ${doc.id})`);
      console.log(`   → ${cat.description}`);
      console.log(`   → Enabled: ${cat.enabled}`);
      console.log('');
    });
    
    // 2. Check products and their categories
    console.log('=' .repeat(60));
    console.log('\n📦 PRODUCTS BY CATEGORY:\n');
    
    const productsSnapshot = await db.collection('products').get();
    const productsByCategory = {};
    
    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const categoryId = product.categoryId || 'uncategorized';
      
      if (!productsByCategory[categoryId]) {
        productsByCategory[categoryId] = [];
      }
      productsByCategory[categoryId].push(product.name);
    });
    
    // Show products grouped by category
    for (const [categoryId, products] of Object.entries(productsByCategory)) {
      console.log(`\n   Category: "${categoryId}"`);
      console.log(`   Products (${products.length}):`);
      products.forEach(name => console.log(`      • ${name}`));
    }
    
    // 3. Simulate clicking "Bopp" category
    console.log('\n' + '=' .repeat(60));
    console.log('\n🖱️  SIMULATING: User clicks "Bopp" category\n');
    
    const boppCategory = categoriesSnapshot.docs.find(d => {
      const name = d.data().name?.toLowerCase() || '';
      return name.includes('bopp');
    });
    
    if (boppCategory) {
      const catData = boppCategory.data();
      console.log(`   Found category: "${catData.name}" (id: ${boppCategory.id})`);
      console.log(`   Navigation target: /(tabs)/products?categoryId=${boppCategory.id}`);
      
      // Filter products
      const filteredProducts = productsSnapshot.docs.filter(doc => {
        return doc.data().categoryId === boppCategory.id;
      });
      
      console.log(`\n   📋 Products that will be shown (${filteredProducts.length}):\n`);
      filteredProducts.forEach(doc => {
        console.log(`      ✓ ${doc.data().name}`);
      });
    } else {
      console.log('   ⚠️  No "Bopp" category found!');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testCategoryFlow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
