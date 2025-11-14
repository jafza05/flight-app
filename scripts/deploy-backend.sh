#!/bin/bash
set -e

echo "🚀 Deploying Spookfish.ai Backend..."
echo ""

# Navigate to infrastructure directory
cd "$(dirname "$0")/../infrastructure"

# Check if samconfig.toml exists
if [ ! -f samconfig.toml ]; then
    echo "⚙️  No SAM config found. Running guided deployment..."
    sam build && sam deploy --guided
else
    echo "⚙️  Using existing SAM config..."
    sam build && sam deploy
fi

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the CloudFormation outputs above"
echo "2. Update your .env.local file with:"
echo "   - NEXT_PUBLIC_COGNITO_USER_POOL_ID"
echo "   - NEXT_PUBLIC_COGNITO_CLIENT_ID"
echo "   - NEXT_PUBLIC_API_GATEWAY_URL"
echo ""
