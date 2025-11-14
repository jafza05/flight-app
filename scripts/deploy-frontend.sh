#!/bin/bash
set -e

echo "🚀 Deploying Spookfish.ai Frontend..."
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local from .env.local.example and fill in your credentials."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building Next.js application..."
npm run build

echo ""
echo "✅ Frontend build complete!"
echo ""
echo "📋 Build output is in frontend/.next/"
echo ""
echo "To deploy to S3:"
echo "1. Export the static site: npm run export (if using static export)"
echo "2. Upload to S3: aws s3 sync out/ s3://your-bucket-name/"
echo "3. Invalidate CloudFront: aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"
echo ""
