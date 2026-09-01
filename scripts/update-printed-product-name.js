/**
 * Script to update "Printed Standup Pouch" to "Printed Standy Pouch"
 * Run: node scripts/update-printed-product-name.js
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file.');
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

async function updateProductName() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Searching for "Printed Standup Pouch"...');
  
  const snapshot = await getDocs(collection(db, 'products'));
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.name === 'Printed Standup Pouch') {
      console.log(`Found product: ${docSnap.id}`);
      await updateDoc(doc(db, 'products', docSnap.id), {
        name: 'Printed Standy Pouch'
      });
      console.log(`✓ Updated "${data.name}" to "Printed Standy Pouch"`);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

updateProductName().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
