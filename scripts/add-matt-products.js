/**
 * Script to add Matt Standy Zipper products using Admin SDK
 * Run: node scripts/add-matt-products.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK with service account
const serviceAccount = require(path.resolve(__dirname, '../../shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const MATT_PRODUCTS = [
  {
    id: 'matt-standy-zipper-pouch',
    name: 'Matt Standy Zipper Pouch',
    desc: 'Elegant matte finish standy pouch with zipper, 3 sides sealed with bottom gusset and tear notch. Perfect for premium packaging.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sortOrder: 1, // Display at top
    colors: [
      { name: 'Black', hexCode: '#000000', available: true },
      { name: 'White', hexCode: '#FFFFFF', available: true },
      { name: 'Red', hexCode: '#FF0000', available: true },
      { name: 'Blue', hexCode: '#0000FF', available: true },
      { name: 'Green', hexCode: '#008000', available: true },
    ],
    sizes: [
      { code: 'MSZP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 3.15 },
      { code: 'MSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 5.15 },
      { code: 'MSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 6.25 },
      { code: 'MSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 7.60 },
    ],
  },
  {
    id: 'matt-window-standy-zipper-pouch',
    name: 'Matt Window Standy Zipper Pouch',
    desc: 'Premium matte finish standy pouch with transparent window and zipper. Perfect for showcasing products while maintaining elegant aesthetics.',
    size: 'Medium',
    micron: 135,
    material: 'PET + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sortOrder: 2, // Display second
    colors: [
      { name: 'Black', hexCode: '#000000', available: true },
      { name: 'White', hexCode: '#FFFFFF', available: true },
      { name: 'Red', hexCode: '#FF0000', available: true },
      { name: 'Blue', hexCode: '#0000FF', available: true },
      { name: 'Green', hexCode: '#008000', available: true },
      { name: 'Silver', hexCode: '#C0C0C0', available: true },
      { name: 'Gold', hexCode: '#FFD700', available: true },
      { name: 'Pink', hexCode: '#FFC0CB', available: true },
    ],
    sizes: [
      { code: 'MWSZP1', label: '10 x 15 + 3 cm', weight: '50 g', pricePerPiece: 4.25 },
      { code: 'MWSZP2', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 5.42 },
      { code: 'MWSZP3', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 5.75 },
      { code: 'MWSZP4', label: '16 x 22 + 4 cm', weight: '500 g', pricePerPiece: 7.16 },
      { code: 'MWSZP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 8.83 },
    ],
  },
];

async function addMattProducts() {
  console.log('Adding Matt Standy Zipper products...\n');
  
  for (const product of MATT_PRODUCTS) {
    const { id, ...data } = product;
    
    // Check if product already exists
    const docRef = db.collection('products').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log(`⚠️  Product "${product.name}" already exists. Updating...`);
      await docRef.update(data);
      console.log(`✓ Updated: ${product.name}`);
    } else {
      await docRef.set(data);
      console.log(`✓ Added: ${product.name}`);
    }
  }

  console.log('\n✅ Done! Matt products have been added to Firestore.');
  console.log('Refresh your app to see the products.');
  process.exit(0);
}

addMattProducts().catch((err) => {
  console.error('❌ Failed to add products:', err);
  process.exit(1);
});
