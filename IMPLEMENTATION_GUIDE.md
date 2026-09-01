# Critical Features Implementation Guide

This guide provides step-by-step instructions to implement the 3 critical missing features.

---

## 1. Firebase Cloud Messaging (Push Notifications)

### Step 1: Install Dependencies

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Step 2: Configure Firebase

1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Note your Server Key (for admin panel to send notifications)
3. For Android: Download google-services.json and add to project

### Step 3: Add FCM Configuration to app.json

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "android.permission.POST_NOTIFICATIONS"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#166534"
        }
      ]
    ]
  }
}
```

### Step 4: Create Notification Service (lib/notifications.ts)

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string) {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push notification permissions');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Save token to Firestore
  if (userId) {
    await setDoc(doc(db, 'users', userId), {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#166534',
    });
  }

  return token;
}
```

### Step 5: Update AuthContext

```typescript
// In context/AuthContext.tsx

import { registerForPushNotifications } from '@/lib/notifications';
import * as Notifications from 'expo-notifications';

// In AuthProvider, after user is authenticated:
useEffect(() => {
  if (user && !user.isAnonymous) {
    registerForPushNotifications(user.uid);
  }
}, [user]);

// Add notification handlers
useEffect(() => {
  // Foreground notification
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
    }
  );

  // Background/Quit - User tapped notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      // Navigate based on data
      if (data.orderId) {
        router.push({
          pathname: '/order-tracking',
          params: { orderKey: data.orderId }
        });
      }
    }
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}, []);
```

### Step 6: Send Notifications from Admin Panel

Create `admin-portal/src/lib/notifications.ts`:

```typescript
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Usage in OrderDetailPage when status changes:
const user = await getDoc(doc(db, 'users', order.userId));
if (user.exists() && user.data().pushToken) {
  await sendPushNotification(
    user.data().pushToken,
    'Order Update',
    `Your order #${order.orderId} is now ${newStatus}`,
    { orderId: order.id }
  );
}
```

---

## 2. Native Phone Authentication (Option A: Full Native Support)

### Step 1: Install React Native Firebase

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth
```

### Step 2: Add Config Plugin to app.json

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "@react-native-firebase/auth",
        {
          "android": {
            "enablePhoneAuth": true
          }
        }
      ]
    ]
  }
}
```

### Step 3: Download Firebase Config Files

1. iOS: Download GoogleService-Info.plist from Firebase Console
2. Android: Download google-services.json from Firebase Console
3. Place in project root

### Step 4: Update lib/phoneAuth.ts

```typescript
import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';

export function isPhoneAuthAvailable(): boolean {
  return true; // Now works everywhere
}

export async function sendOtp(phoneE164: string): Promise<string> {
  if (Platform.OS === 'web') {
    // Keep existing web implementation
    return sendOtpWeb(phoneE164);
  }

  // Native implementation
  const confirmation = await auth().signInWithPhoneNumber(phoneE164);
  return confirmation.verificationId;
}

export async function confirmOtp(
  verificationId: string,
  code: string
): Promise<ConfirmOtpResult> {
  if (Platform.OS === 'web') {
    return confirmOtpWeb(verificationId, code);
  }

  // Native implementation
  const credential = auth.PhoneAuthProvider.credential(verificationId, code);
  
  const current = auth().currentUser;
  if (current?.isAnonymous) {
    try {
      await current.linkWithCredential(credential);
      return { preservedGuestData: true };
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        await auth().signInWithCredential(credential);
        return { preservedGuestData: false };
      }
      throw err;
    }
  }

  await auth().signInWithCredential(credential);
  return { preservedGuestData: false };
}
```

### Step 5: Prebuild and Test

```bash
npx expo prebuild --clean
eas build --platform android --profile preview
```

---

## 2b. Native Phone Authentication (Option B: Keep Web-Only)

### Quick Solution: Add Warning

In `app/verify-mobile.tsx`, add this notice:

```typescript
{!phoneAuthAvailable && (
  <View style={[styles.warningBox, { backgroundColor: colors.warning + '14' }]}>
    <Feather name="alert-triangle" size={16} color={colors.warning} />
    <Text style={[styles.warningText, { color: colors.warning }]}>
      Phone verification is currently available on the web version only.
      Please visit https://shop-cart-flow.web.app to complete checkout.
    </Text>
  </View>
)}
```

### Update Checkout Flow

In `app/checkout.tsx`, check availability:

```typescript
useEffect(() => {
  const { phoneAuthAvailable } = useAuth();
  if (!phoneAuthAvailable) {
    Alert.alert(
      'Web Verification Required',
      'Please complete your order on our website to verify your mobile number.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Website', onPress: () => {
          Linking.openURL('https://shop-cart-flow.web.app');
        }}
      ]
    );
  }
}, []);
```

---

## 3. Coupon System

### Step 1: Create Coupon Types

```typescript
// types/coupon.ts
export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // 10 for 10% or 100 for ₹100
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}
```

### Step 2: Create Coupon Validation Logic

```typescript
// lib/coupons.ts
export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<{ valid: boolean; discount: number; error?: string }> {
  const couponRef = doc(db, 'coupons', code.toUpperCase());
  const couponSnap = await getDoc(couponRef);

  if (!couponSnap.exists()) {
    return { valid: false, discount: 0, error: 'Invalid coupon code' };
  }

  const coupon = couponSnap.data() as Coupon;

  if (!coupon.active) {
    return { valid: false, discount: 0, error: 'Coupon is no longer active' };
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    return { valid: false, discount: 0, error: 'Coupon has expired' };
  }

  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    return {
      valid: false,
      discount: 0,
      error: `Minimum purchase of ₹${coupon.minPurchase} required`,
    };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
  }

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (cartTotal * coupon.value) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.value;
  }

  return { valid: true, discount: Math.round(discount) };
}
```

### Step 3: Update Checkout Screen

```typescript
// In app/checkout.tsx

const [couponCode, setCouponCode] = useState('');
const [couponDiscount, setCouponDiscount] = useState(0);
const [couponError, setCouponError] = useState('');
const [applyingCoupon, setApplyingCoupon] = useState(false);

const applyCoupon = async () => {
  if (!couponCode.trim()) return;
  
  setApplyingCoupon(true);
  setCouponError('');
  
  const result = await validateCoupon(couponCode, cartTotal);
  
  if (result.valid) {
    setCouponDiscount(result.discount);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } else {
    setCouponError(result.error || 'Invalid coupon');
    setCouponDiscount(0);
  }
  
  setApplyingCoupon(false);
};

const finalTotal = cartTotal - couponDiscount;

// Add to UI:
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Coupon Code</Text>
  <View style={styles.couponRow}>
    <TextInput
      style={styles.couponInput}
      value={couponCode}
      onChangeText={setCouponCode}
      placeholder="Enter coupon code"
      autoCapitalize="characters"
    />
    <TouchableOpacity
      style={styles.applyBtn}
      onPress={applyCoupon}
      disabled={applyingCoupon}
    >
      <Text style={styles.applyBtnText}>Apply</Text>
    </TouchableOpacity>
  </View>
  {couponError && (
    <Text style={styles.errorText}>{couponError}</Text>
  )}
  {couponDiscount > 0 && (
    <Text style={styles.successText}>
      ✓ Coupon applied! You saved ₹{couponDiscount}
    </Text>
  )}
</View>

// Update order summary:
{couponDiscount > 0 && (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Discount</Text>
    <Text style={[styles.summaryValue, { color: colors.success }]}>
      -₹{couponDiscount}
    </Text>
  </View>
)}
<View style={styles.summaryRow}>
  <Text style={styles.totalLabel}>Total Amount</Text>
  <Text style={styles.totalValue}>₹{finalTotal}</Text>
</View>
```

### Step 4: Update Order Placement

```typescript
const order = placeOrder(address, gstNumber, payment, {
  couponCode: couponDiscount > 0 ? couponCode : null,
  couponDiscount,
});

// In CartContext, update placeOrder to accept discount:
placeOrder: (
  address: string,
  gstNumber: string,
  paymentMethod: string,
  couponData?: { couponCode: string | null; couponDiscount: number }
) => {
  const order: Order = {
    // ... existing fields
    subtotal: cartTotal,
    discount: couponData?.couponDiscount || 0,
    total: cartTotal - (couponData?.couponDiscount || 0),
    couponCode: couponData?.couponCode || null,
  };
  
  // ... rest of the function
  
  // If coupon was used, increment usage count
  if (couponData?.couponCode) {
    const couponRef = doc(db, 'coupons', couponData.couponCode.toUpperCase());
    updateDoc(couponRef, {
      usedCount: increment(1),
    });
  }
}
```

### Step 5: Add Coupon Management in Admin

Create `admin-portal/src/features/coupons/CouponsPage.tsx`:

```typescript
export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // CRUD operations
  const createCoupon = async (data: Omit<Coupon, 'id' | 'usedCount'>) => {
    const couponRef = doc(db, 'coupons', data.code.toUpperCase());
    await setDoc(couponRef, {
      ...data,
      id: data.code.toUpperCase(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    });
  };
  
  // List, edit, delete coupons
  // Similar structure to ProductsListPage
}
```

Add route in admin panel's router.

---

## Testing Checklist

After implementing each feature:

### Push Notifications
- [ ] Request permission on app launch
- [ ] Token saved to Firestore
- [ ] Foreground notification shows
- [ ] Background notification shows
- [ ] Tap notification navigates correctly
- [ ] Admin can send test notification

### Phone Auth
- [ ] OTP sends on native Android
- [ ] OTP verifies successfully
- [ ] Guest cart preserved after verification
- [ ] Existing account sign-in works
- [ ] Error messages display correctly

### Coupons
- [ ] Coupon code input accepts text
- [ ] Valid coupon applies discount
- [ ] Invalid coupon shows error
- [ ] Percentage discount calculates correctly
- [ ] Fixed discount applies correctly
- [ ] Min purchase enforced
- [ ] Max discount cap respected
- [ ] Expired coupon rejected
- [ ] Usage limit enforced
- [ ] Discount shows in order summary
- [ ] Order stores coupon info
- [ ] Admin can create/edit/delete coupons

---

## Estimated Implementation Time

- Push Notifications: **4-6 hours**
  - Setup: 1 hour
  - Implementation: 2 hours
  - Testing: 1-2 hours
  - Admin integration: 1 hour

- Phone Auth (Native): **4-6 hours**
  - Setup: 1 hour
  - Code changes: 2 hours
  - Testing: 1-2 hours
  - Debugging: 1 hour

- Phone Auth (Web-Only Warning): **30 minutes**
  - Just add UI warnings

- Coupon System: **6-8 hours**
  - Data model: 1 hour
  - Validation logic: 2 hours
  - UI integration: 2 hours
  - Admin panel: 2 hours
  - Testing: 1-2 hours

**Total: 14-20 hours for all three features**

---

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- React Native Firebase: https://rnfirebase.io/

Good luck! 🚀
