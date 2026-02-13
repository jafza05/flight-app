#!/bin/bash
set -e

echo "🚀 Spookfish.ai Frontend Deployment"
echo "===================================="

BUCKET="spookfish-ai-frontend"
CLOUDFRONT_ID="ETI0TC1H1LDGI"

echo ""
echo "📦 Step 1: Building frontend..."
npm run build

echo ""
echo "☁️  Step 2: Uploading to S3..."
# Upload assets with long cache
aws s3 sync dist/ s3://$BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "vite.svg"

# Upload index.html with no cache
aws s3 cp dist/index.html s3://$BUCKET/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Upload other root files
aws s3 cp dist/vite.svg s3://$BUCKET/vite.svg \
  --cache-control "public, max-age=86400"

echo ""
echo "🔄 Step 3: Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --query 'Invalidation.{ID:Id,Status:Status}' \
  --output table

echo ""
echo "===================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "===================================="
echo ""
echo "🌐 URLs:"
echo "   CloudFront: https://d17akkfka5sxtn.cloudfront.net"
echo "   Custom Domain: https://spookfish.ai (once DNS propagates)"
echo ""
echo "📊 Check status:"
echo "   aws cloudfront get-distribution --id $CLOUDFRONT_ID --query 'Distribution.Status'"
echo ""
