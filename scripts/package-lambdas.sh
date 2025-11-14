#!/bin/bash
# Script to package Lambda functions for manual upload to AWS Console

set -e

echo "📦 Creating Lambda deployment packages..."
echo ""

# Create deployment directory
DEPLOY_DIR="$(dirname "$0")/../deployment-packages"
mkdir -p "$DEPLOY_DIR"

# Package nearby_flights Lambda
echo "1️⃣  Packaging nearby_flights Lambda..."
cd "$(dirname "$0")/../lambda/nearby_flights"
zip -r "$DEPLOY_DIR/nearby_flights.zip" . -x "*.pyc" -x "__pycache__/*"
echo "   ✅ Created: deployment-packages/nearby_flights.zip"
echo ""

# Package user_preferences Lambda
echo "2️⃣  Packaging user_preferences Lambda..."
cd "$(dirname "$0")/../lambda/user_preferences"
zip -r "$DEPLOY_DIR/user_preferences.zip" . -x "*.pyc" -x "__pycache__/*"
echo "   ✅ Created: deployment-packages/user_preferences.zip"
echo ""

# Package user_locations Lambda
echo "3️⃣  Packaging user_locations Lambda..."
cd "$(dirname "$0")/../lambda/user_locations"
zip -r "$DEPLOY_DIR/user_locations.zip" . -x "*.pyc" -x "__pycache__/*"
echo "   ✅ Created: deployment-packages/user_locations.zip"
echo ""

# Package FlightRadar Lambda Layer
echo "4️⃣  Packaging FlightRadar Lambda Layer..."
cd "$(dirname "$0")/../infrastructure/layers/flightradar"
zip -r "$DEPLOY_DIR/flightradar_layer.zip" python/ -x "*.pyc" -x "*__pycache__/*"
echo "   ✅ Created: deployment-packages/flightradar_layer.zip"
echo ""

echo "✅ All deployment packages created successfully!"
echo ""
echo "📁 Packages location: $DEPLOY_DIR"
echo ""
echo "You can now upload these to AWS Lambda:"
echo "  1. nearby_flights.zip → nearby-flights Lambda function"
echo "  2. user_preferences.zip → user-preferences Lambda function"
echo "  3. user_locations.zip → user-locations Lambda function"
echo "  4. flightradar_layer.zip → Lambda Layer (attach to nearby-flights)"
echo ""
