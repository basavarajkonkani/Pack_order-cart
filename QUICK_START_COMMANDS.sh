#!/bin/bash
#
# Quick Start Commands for Play Store Release
# Shop Cart Flow - Production Deployment
#
# Run these commands in order after completing Firebase Console setup
#

echo "=========================================="
echo "SHOP CART FLOW - Play Store Release"
echo "Quick Start Commands"
echo "=========================================="
echo ""

# Step 1: Verify TypeScript
echo "Step 1: Verify TypeScript compilation..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript: PASS"
else
    echo "❌ TypeScript: FAIL"
    exit 1
fi
echo ""

# Step 2: EAS Login
echo "Step 2: Login to EAS (Expo Application Services)..."
echo "Command: npx eas login"
echo "Action required: Run this command and login with your Expo account"
echo ""

# Step 3: Initialize EAS
echo "Step 3: Initialize EAS project..."
echo "Command: npx eas init"
echo "Action required: This will create a real projectId in app.json"
echo ""

# Step 4: Configure Credentials
echo "Step 4: Configure Android credentials..."
echo "Command: npx eas credentials"
echo "Action required: Set up signing credentials for Android"
echo ""

# Step 5: Deploy Privacy/Terms
echo "Step 5: Deploy Privacy Policy and Terms of Service..."
echo "Command: firebase deploy --only hosting:public"
echo "This will deploy:"
echo "  - https://shop-cart-flow.web.app/privacy-policy.html"
echo "  - https://shop-cart-flow.web.app/terms-of-service.html"
echo ""

# Step 6: Build Production AAB
echo "Step 6: Build production AAB for Play Store..."
echo "Command: npx eas build --platform android --profile production"
echo "This will:"
echo "  - Build the app on EAS servers"
echo "  - Generate production AAB file"
echo "  - Provide download link"
echo "Estimated time: 15-30 minutes"
echo ""

# Step 7: Deploy Notification Function
echo "Step 7: Deploy Firebase Cloud Function for notifications..."
echo "Commands:"
echo "  mkdir -p functions"
echo "  cp functions-example/send-order-notifications.js functions/index.js"
echo "  firebase deploy --only functions:sendOrderNotifications"
echo ""

# Quick reference
echo "=========================================="
echo "QUICK REFERENCE"
echo "=========================================="
echo ""
echo "Check build status:"
echo "  npx eas build:list"
echo ""
echo "Download build:"
echo "  npx eas build:download --platform android --latest"
echo ""
echo "View logs:"
echo "  npx eas build:view"
echo ""
echo "Submit to Play Store (after manual upload):"
echo "  npx eas submit --platform android --latest"
echo ""
echo "Check Firebase Functions logs:"
echo "  firebase functions:log"
echo ""
echo "Test notification function:"
echo "  firebase functions:shell"
echo ""
echo "=========================================="
echo "FIREBASE CONSOLE CHECKLIST"
echo "=========================================="
echo ""
echo "Before running build commands, verify in Firebase Console:"
echo "  ✓ Android app added with correct package name (com.packorder.app)"
echo "  ✓ google-services.json downloaded and replaced"
echo "  ✓ Phone Authentication enabled"
echo "  ✓ Crashlytics enabled"
echo "  ✓ Cloud Messaging enabled (default)"
echo ""
echo "After first build, add SHA-256 fingerprints:"
echo "  ✓ Debug: keytool -list -v -keystore ~/.android/debug.keystore"
echo "  ✓ Production: Get from Play Console → App signing"
echo ""
echo "=========================================="
echo "GOOGLE PLAY CONSOLE CHECKLIST"
echo "=========================================="
echo ""
echo "Complete before submission:"
echo "  ✓ Create Play Developer account (\$25)"
echo "  ✓ Create new app"
echo "  ✓ Complete Store Listing"
echo "  ✓ Complete Data Safety questionnaire"
echo "  ✓ Add Privacy Policy URL"
echo "  ✓ Upload screenshots and assets"
echo "  ✓ Complete Content Rating"
echo "  ✓ Set Target Audience"
echo "  ✓ Upload AAB"
echo "  ✓ Submit for review"
echo ""
echo "=========================================="
echo "NEED HELP?"
echo "=========================================="
echo ""
echo "Documentation:"
echo "  - PLAY_STORE_RELEASE_SUMMARY.txt (Complete guide)"
echo "  - PRODUCTION_CHECKLIST.txt (Detailed checklist)"
echo ""
echo "Firebase Console:"
echo "  https://console.firebase.google.com/project/shop-cart-flow"
echo ""
echo "Expo Dashboard:"
echo "  https://expo.dev/"
echo ""
echo "Google Play Console:"
echo "  https://play.google.com/console"
echo ""
echo "=========================================="
