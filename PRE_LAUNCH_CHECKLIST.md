# Shop Cart Flow - Pre-Launch Checklist

## 🔴 CRITICAL (Must Complete Before Launch)

### Push Notifications
- [ ] Install expo-notifications: `npx expo install expo-notifications`
- [ ] Configure FCM in Firebase Console
- [ ] Add notification permission request
- [ ] Implement foreground notification handler
- [ ] Implement background notification handler
- [ ] Add notification tap navigation
- [ ] Test order confirmation notification
- [ ] Test order status update notification
- [ ] Save FCM tokens in Firestore users collection

### Phone Authentication
**Option A: Native Support (Recommended)**
- [ ] Install @react-native-firebase/auth
- [ ] Add expo config plugin
- [ ] Run expo prebuild
- [ ] Test OTP on native Android
- [ ] Update AuthContext to use native auth

**Option B: Web-Only (Quick)**
- [ ] Document limitation in app
- [ ] Add web-only notice in verify-mobile screen
- [ ] Ensure deep linking works for web verification

### Coupon System
- [ ] Add coupon input field in checkout.tsx
- [ ] Create coupon validation logic
- [ ] Apply discount to cart total
- [ ] Show discount breakdown in order summary
- [ ] Add coupon management in admin portal
- [ ] Test coupon application flow

## 🟡 HIGH PRIORITY (Should Complete Before Launch)

### Build & Testing
- [ ] Run `eas build --platform android --profile preview`
- [ ] Install APK on real Android device
- [ ] Test complete user flow end-to-end
- [ ] Test on different Android versions
- [ ] Test on different screen sizes
- [ ] Fix any crashes or UI issues

### Play Store Assets
- [ ] Create app screenshots (6-8 images)
  - [ ] Home screen
  - [ ] Product listing
  - [ ] Product details
  - [ ] Cart
  - [ ] Checkout
  - [ ] Orders
  - [ ] Profile
- [ ] Write app description (short + long)
- [ ] Create feature graphic (1024x500)
- [ ] Prepare app icon (512x512)
- [ ] Create privacy policy page
- [ ] Create terms & conditions page
- [ ] Set up support email

### Firebase Configuration
- [ ] Enable Firestore indexes if needed
- [ ] Deploy Firestore rules: `npm run deploy:rules`
- [ ] Enable App Check (optional but recommended)
- [ ] Add reCAPTCHA site key to .env
- [ ] Review Firebase quotas
- [ ] Set up billing alerts

## 🟢 MEDIUM PRIORITY (Good to Have)

### Additional Features
- [ ] Implement order cancellation
- [ ] Add reorder button in order history
- [ ] Implement banner management in admin
- [ ] Add customer block/unblock in admin
- [ ] Enable Firestore offline persistence
- [ ] Add image compression on upload
- [ ] Add pull-to-refresh on all lists

### Firebase Functions (Optional)
- [ ] Move functions-example to functions/
- [ ] Install Firebase Functions dependencies
- [ ] Configure Twilio credentials
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Test WhatsApp notifications
- [ ] Set up order status webhooks

### Performance
- [ ] Run Lighthouse audit on web app
- [ ] Optimize bundle size if needed
- [ ] Add more image prefetching
- [ ] Profile React rendering
- [ ] Test on slow network (3G)

## ⚪ LOW PRIORITY (Post-Launch)

### Analytics
- [ ] Add Firebase Analytics
- [ ] Track key user events
- [ ] Set up conversion tracking
- [ ] Create analytics dashboard

### Nice to Have
- [ ] Add dark mode support
- [ ] Implement product reviews
- [ ] Add product ratings
- [ ] Social media sharing
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Multiple payment gateways
- [ ] Invoice generation
- [ ] Order PDF export

## 📝 Pre-Build Checklist

Before running `eas build --platform android --profile production`:

- [x] app.json configured correctly
- [x] eas.json created
- [x] Package name set: com.packorder.app
- [x] Version code: 1
- [x] Icons created
- [ ] .env file has all Firebase credentials
- [ ] Admin panel .env has same Firebase project
- [ ] Test web app: `npm run dev`
- [ ] Test admin panel: `cd admin-portal && npm run dev`
- [ ] All TypeScript errors resolved
- [ ] Firebase rules deployed
- [ ] Git committed (important!)

## 🚀 Deployment Sequence

1. **Test Locally**
   ```bash
   npm run dev
   # Test all features
   ```

2. **Deploy Web Apps**
   ```bash
   npm run deploy:demo
   # Verify https://shop-cart-flow.web.app
   # Verify https://shop-cart-flow-admin.web.app
   ```

3. **Build Android Preview**
   ```bash
   eas build --platform android --profile preview
   # Download and test APK
   ```

4. **Fix Issues**
   - Test, find bugs, fix, repeat

5. **Build Production**
   ```bash
   eas build --platform android --profile production
   # Generates AAB for Play Store
   ```

6. **Submit to Play Store**
   ```bash
   eas submit --platform android --profile production
   # Or manually upload AAB to Play Console
   ```

7. **Start with Internal Testing**
   - Upload to internal testing track
   - Share with team
   - Gather feedback
   - Fix issues

8. **Move to Closed Beta**
   - Invite beta testers
   - Monitor crash reports
   - Collect feedback

9. **Public Release**
   - Promote to production
   - Monitor reviews
   - Respond to feedback

## 📊 Success Metrics

After launch, monitor:
- [ ] App crash rate < 1%
- [ ] Order completion rate
- [ ] Cart abandonment rate
- [ ] User retention (D1, D7, D30)
- [ ] Average order value
- [ ] Customer satisfaction score

## 🆘 Emergency Contacts

- Firebase Console: https://console.firebase.google.com
- Expo Dashboard: https://expo.dev
- Play Console: https://play.google.com/console

## 📞 Support

If issues arise:
1. Check Firebase Console logs
2. Check EAS build logs: `eas build:list`
3. Review Firestore rules: `firebase emulators:start`
4. Check error tracking in Play Console

---

**Last Updated**: December 2024  
**Current Status**: 85% Complete  
**Estimated Time to Launch**: 6-10 hours
