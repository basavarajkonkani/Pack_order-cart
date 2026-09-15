const admin = require('firebase-admin');
const serviceAccount = require('/Users/basavarajgm/Downloads/shop-cart-flow-firebase-adminsdk-fbsvc-6ba7f4c7b9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAllProducts() {
  const snapshot = await db.collection('products').get();
  console.log('Total products in Firestore:', snapshot.size);
  
  let visibleCount = 0;
  let withCategory = 0;
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const isVisible = data.visible !== false;
    const hasCategory = !!data.categoryId;
    
    if (isVisible) visibleCount++;
    if (hasCategory) withCategory++;
    
    if (!isVisible) {
      console.log('Hidden product:', doc.id);
    }
  });
  
  console.log('\nVisible products:', visibleCount);
  console.log('Products with categoryId:', withCategory);
  console.log('\nIf visible products = 0, that is your problem!');
}

checkAllProducts().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
