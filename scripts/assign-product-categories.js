/**
 * Script to assign categoryIds to products based on their names.
 * This helps organize products into categories like "BOPP", "Standup", "Kraft", etc.
 * 
 * Run: node scripts/assign-product-categories.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Category mapping rules based on product names
// Assign products to specific categories based on their actual type
const CATEGORY_RULES = [
  {
    categoryId: 'bopp-bags',
    keywords: ['bopp'],
    description: 'BOPP bags only',
    priority: 1, // Check this first
  },
  {
    categoryId: 'kraft-pouches',
    keywords: ['kraft'],
    description: 'Kraft pouches only',
    priority: 2,
  },
  {
    categoryId: 'standup-pouches',
    keywords: ['standy', 'stand-up', 'standup', 'gold', 'silver', 'milky', 'batter'],
    description: 'Stand-up pouches (gold, silver, milky, etc.)',
    priority: 3,
  },
  {
    categoryId: 'printed',
    keywords: ['custom', 'printed'],
    description: 'Custom printed pouches',
    priority: 4,
  },
];

async function assignCategories() {
  try {
    console.log('🔄 Fetching products...');
    const productsSnapshot = await db.collection('products').get();
    
    if (productsSnapshot.empty) {
      console.log('⚠️  No products found in database');
      return;
    }

    console.log(`📦 Found ${productsSnapshot.size} products`);
    
    let updated = 0;
    let skipped = 0;
    
    // Sort rules by priority
    const sortedRules = [...CATEGORY_RULES].sort((a, b) => a.priority - b.priority);
    
    for (const doc of productsSnapshot.docs) {
      const product = doc.data();
      const productName = product.name?.toLowerCase() || '';
      
      // Find matching category (first match wins due to priority)
      let assignedCategory = null;
      for (const rule of sortedRules) {
        if (rule.keywords.some(keyword => productName.includes(keyword))) {
          assignedCategory = rule.categoryId;
          break;
        }
      }
      
      if (assignedCategory) {
        // Update product with categoryId
        await doc.ref.update({
          categoryId: assignedCategory,
        });
        console.log(`✅ ${product.name} → ${assignedCategory}`);
        updated++;
      } else {
        console.log(`⏭️  ${product.name} → No matching category`);
        skipped++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('✨ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
assignCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
