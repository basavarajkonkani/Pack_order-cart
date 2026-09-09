#!/bin/bash

# GST Integration Setup Script
# This script sets up the complete GST integration for PaxMonk

set -e

echo "🚀 PaxMonk GST Integration Setup"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install expo-print expo-sharing

echo ""
echo "🔧 Step 2: Seeding business settings to Firestore..."
node scripts/seed-business-settings.js

echo ""
echo "🔐 Step 3: Deploying Firestore security rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ GST Integration Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Login to admin portal at /business-settings to verify settings"
echo "  3. Test checkout flow with GST calculations"
echo "  4. Test invoice generation from order tracking"
echo ""
echo "📖 For detailed documentation, see GST_INTEGRATION_GUIDE.md"
