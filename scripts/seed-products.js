/**
 * One-time seed script: pushes the static STOCK_PRODUCTS catalog into Firestore.
 *
 * Usage:
 *   1. Create your Firebase project + Firestore database (test mode is fine for this step).
 *   2. Copy .env.example to .env and fill in your Firebase web app config.
 *   3. Run: node scripts/seed-products.js
 *
 * Product images are NOT stored in Firestore — they stay bundled as local
 * assets (see lib/products.ts, which re-attaches the image by product id
 * after fetching the rest of the fields from Firestore).
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file. Copy .env.example to .env and fill in your Firebase config first.');
    process.exit(1);
  }
  const contents = fs.readFileSync(envPath, 'utf-8');
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase config is incomplete. Check your .env file against .env.example.');
  process.exit(1);
}

// Product data (image fields intentionally omitted — see file header).
const PRODUCTS = [
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
    sizes: [
      { code: 'MWSZP1', label: '10 x 15 + 3 cm', weight: '50 g', pricePerPiece: 4.25 },
      { code: 'MWSZP2', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 5.42 },
      { code: 'MWSZP3', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 5.75 },
      { code: 'MWSZP4', label: '16 x 22 + 4 cm', weight: '500 g', pricePerPiece: 7.16 },
      { code: 'MWSZP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 8.83 },
    ],
  },
  {
    id: 'gold-standy',
    name: 'Gold Standy Pouch',
    desc: 'Premium gold standy pouch with excellent barrier properties, perfect for premium products and long shelf life.',
    size: 'Medium',
    micron: 112,
    material: 'Metalized',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'GSP1', label: '10.5 x 17 x 3 cm', weight: '100 g', pricePerPiece: 2.45 },
      { code: 'GSP2', label: '13.5 x 20.5 x 3.5 cm', weight: '250 g', pricePerPiece: 3.85 },
      { code: 'GSP3', label: '15 x 20.5 x 3.5 cm', weight: '500 g', pricePerPiece: 4.25 },
      { code: 'GSP4', label: '18 x 25 x 4 cm', weight: '1000 g', pricePerPiece: 6.15 },
    ],
  },
  {
    id: 'gold-standy-zipper',
    name: 'Gold Standy Zipper Pouch',
    desc: 'Shiny gold in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, herbs, grains, tea/coffee powder, spices etc.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'GSZP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 3.15 },
      { code: 'GSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 5.15 },
      { code: 'GSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 6.25 },
      { code: 'GSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 7.60 },
    ],
  },
  {
    id: 'silver-standy',
    name: 'Silver Standy Pouch',
    desc: 'Shiny silver standy pouch, 3 sides sealed with bottom gusset and tear notch. Ideal for packing dry fruits, protein powder, spices, tea/coffee powder, seeds etc.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'SSP1', label: '8.5 x 13.5 + 2.5 cm', weight: '50 g', pricePerPiece: 1.35 },
      { code: 'SSP2', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 2.10 },
      { code: 'SSP3', label: '10.5 x 20.5 + 3.5 cm', weight: '200 g', pricePerPiece: 2.50 },
      { code: 'SSP4', label: '13.5 x 20.5 + 3.5 cm', weight: '250 g', pricePerPiece: 3.20 },
      { code: 'SSP5', label: '15 x 20.5 + 3.5 cm', weight: '500 g', pricePerPiece: 3.60 },
      { code: 'SSP6', label: '18 x 25 + 4 cm', weight: '1000 g', pricePerPiece: 5.25 },
      { code: 'SSP7', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 6.96 },
    ],
  },
  {
    id: 'silver-standy-zipper',
    name: 'Silver Standy Zipper Pouch',
    desc: 'Shiny silver standy pouch, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, pickle, confectionery, herbs, spices etc.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'SSZP1', label: '10 x 13.5 + 2.5 cm', weight: '50 g', pricePerPiece: 2.10 },
      { code: 'SSZP2', label: '10 x 17 + 3.5 cm', weight: '100 g', pricePerPiece: 2.55 },
      { code: 'SSZP3', label: '10.5 x 21 + 3.5 cm', weight: '200 g', pricePerPiece: 3.05 },
      { code: 'SSZP4', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 4.15 },
      { code: 'SSZP5', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 5.00 },
      { code: 'SSZP6', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 6.05 },
      { code: 'SSZP7', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 8.10 },
    ],
  },
  {
    id: 'kraft-standy',
    name: 'Kraft Standy Pouch (Brown)',
    desc: 'Brown in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, grains, herbs, tea/coffee powder, spices etc.',
    size: 'Medium',
    micron: 140,
    material: 'Kraft Paper + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KSP1', label: '11 x 18.5 + 3 cm', weight: '100 g', pricePerPiece: 4.75 },
      { code: 'KSP2', label: '13 x 21 + 4 cm', weight: '200 g', pricePerPiece: 6.16 },
      { code: 'KSP3', label: '15 x 21 + 4 cm', weight: '250 g', pricePerPiece: 6.83 },
      { code: 'KSP4', label: '15 x 24 + 4 cm', weight: '500 g', pricePerPiece: 7.50 },
      { code: 'KSP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 9.50 },
    ],
  },
  {
    id: 'kraft-window-standy-brown',
    name: 'Kraft Window Standy Pouch (Brown)',
    desc: 'Brown in colour, 3 sides sealed with bottom gusset, tear notch, zipper and window. Ideal for packing dry fruits, protein powder, spices, grains etc.',
    size: 'Medium',
    micron: 135,
    material: 'Kraft Paper + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KWSP1', label: '10 x 15 + 3 cm', weight: '50 g', pricePerPiece: 4.25 },
      { code: 'KWSP2', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 5.42 },
      { code: 'KWSP3', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 5.75 },
      { code: 'KWSP4', label: '16 x 22 + 4 cm', weight: '500 g', pricePerPiece: 7.16 },
      { code: 'KWSP5', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 8.83 },
      { code: 'KWSP6', label: '20 x 30 + 5 cm', weight: '2000 g', pricePerPiece: 11.58 },
      { code: 'KWSP7', label: '30 x 40 + 6 cm', weight: '3000 g', pricePerPiece: 22.66 },
    ],
  },
  {
    id: 'kraft-window-standy-white',
    name: 'Kraft Window Standy Pouch (White)',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch, zipper and window. Ideal for packing dry fruits, grains, tea/coffee powder, herbs, confectionery etc.',
    size: 'Medium',
    micron: 135,
    material: 'Kraft Paper + Poly + Window',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'KWSP1', label: '12 x 20 + 4 cm', weight: '100 g', pricePerPiece: 6.41 },
      { code: 'KWSP2', label: '14 x 20 + 4 cm', weight: '250 g', pricePerPiece: 7.50 },
      { code: 'KWSP3', label: '15 x 22 + 4 cm', weight: '500 g', pricePerPiece: 8.50 },
      { code: 'KWSP4', label: '18 x 26 + 4 cm', weight: '1000 g', pricePerPiece: 10.80 },
    ],
  },
  {
    id: 'milky-standy',
    name: 'Milky Standy Pouch',
    desc: 'White in colour, 3 side sealed with bottom gusset and tear notch. Ideal for packing dry fruits, grains, protein powder, seeds, herbs etc.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'MSP1', label: '10.5 x 17 + 3 cm', weight: '100 g', pricePerPiece: 2.10 },
      { code: 'MSP2', label: '13.5 x 20.5 + 3.5 cm', weight: '250 g', pricePerPiece: 3.25 },
      { code: 'MSP3', label: '15 x 20.5 + 3.5 cm', weight: '500 g', pricePerPiece: 3.60 },
      { code: 'MSP4', label: '18 x 25 + 4 cm', weight: '1000 g', pricePerPiece: 5.25 },
    ],
  },
  {
    id: 'milky-standy-zipper',
    name: 'Milky Standy Zipper Pouch',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing dry fruits, grains, confectionery, seeds, pickle etc.',
    size: 'Medium',
    micron: 112,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'MSZP1', label: '10 x 17 + 3.5 cm', weight: '100 g', pricePerPiece: 2.55 },
      { code: 'MSZP2', label: '13.5 x 22 + 3.5 cm', weight: '250 g', pricePerPiece: 4.15 },
      { code: 'MSZP3', label: '16 x 23 + 3.5 cm', weight: '500 g', pricePerPiece: 5.00 },
      { code: 'MSZP4', label: '17 x 26.5 + 4 cm', weight: '1000 g', pricePerPiece: 6.05 },
    ],
  },
  {
    id: 'center-seal',
    name: 'Center Seal Pouch',
    desc: 'Classic center seal (pillow) pouch, a cost-effective flat pouch ideal for high-volume packing of snacks and grains.',
    size: 'Small',
    micron: 90,
    material: 'Laminate',
    sealing: 'Heat sealable',
    heatResistance: '85°C',
    moq: 500,
    inStock: true,
    sizes: [
      { code: 'CSP1', label: '10 x 15 cm', weight: '100 g', pricePerPiece: 1.45 },
      { code: 'CSP2', label: '15 x 22 cm', weight: '250 g', pricePerPiece: 2.15 },
      { code: 'CSP3', label: '20 x 28 cm', weight: '500 g', pricePerPiece: 2.85 },
      { code: 'CSP4', label: '25 x 35 cm', weight: '1000 g', pricePerPiece: 3.95 },
    ],
  },
  {
    id: 'batter-pouch',
    name: 'Idly Dosa Batter Pouch',
    desc: 'White in colour, 3 sides sealed with bottom gusset, tear notch and zipper. Ideal for packing idly / dosa batter.',
    size: 'Small',
    micron: 72,
    material: 'PET + Poly',
    sealing: 'Zipper + Heat sealable',
    heatResistance: '100°C',
    moq: 100,
    inStock: true,
    sizes: [
      { code: 'IDBP1', label: '27 x 21 + 5 cm', weight: '1000 g', pricePerPiece: 9.65 },
    ],
  },
];

async function seed() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const product of PRODUCTS) {
    const { id, ...data } = product;
    await setDoc(doc(db, 'products', id), data);
    console.log(`Seeded: ${id}`);
  }

  console.log(`\nDone. Seeded ${PRODUCTS.length} products into Firestore.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
