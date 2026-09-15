const admin = require('firebase-admin');
const serviceAccount = require('/Users/basavarajgm/Downloads/shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkProductImages() {
  const snapshot = await db.collection('products').get();
  
  let withImageUrl = 0;
  let withoutImageUrl = 0;
  
  console.log('Product Image Status:\n');
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const hasImageUrl = !!data.imageUrl;
    
    if (hasImageUrl) {
      withImageUrl++;
      console.log('✓', doc.id, '- has Firebase Storage URL');
    } else {
      withoutImageUrl++;
      console.log('✗', doc.id, '- NO imageUrl (using bundled fallback)');
    }
  });
  
  console.log('\nSummary:');
  console.log('With imageUrl:', withImageUrl);
  console.log('Without imageUrl (need bundled images):', withoutImageUrl);
}

checkProductImages().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
