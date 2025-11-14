#!/bin/bash

echo "🔧 Spookfish.ai Environment Setup"
echo "=================================="
echo ""

# Check if .env.local already exists
if [ -f "../.env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Copy template
echo "📝 Creating .env.local from template..."
cp ../.env.local.example ../.env.local

echo ""
echo "✅ .env.local created!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local and fill in your credentials:"
echo "   - AWS Region"
echo "   - Google Maps API Key"
echo "   - S3 Bucket URL for airline logos"
echo ""
echo "2. Deploy the backend to get AWS resource IDs:"
echo "   ./deploy-backend.sh"
echo ""
echo "3. Add the CloudFormation outputs to .env.local:"
echo "   - NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "   - NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo "   - NEXT_PUBLIC_API_GATEWAY_URL"
echo ""
echo "4. Install frontend dependencies and run:"
echo "   cd ../frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
