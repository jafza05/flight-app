#!/bin/bash
set -e

echo "🚀 FlightTracker Backend Deployment"
echo "===================================="

PROFILE="spookfish"
REGION="us-east-1"
FUNCTION_NAME="FlightTracker-FlightSearch"
LAMBDA_ROLE_NAME="FlightTracker-LambdaRole"

echo ""
echo "📦 Step 1: Creating deployment package..."

# Create clean build directory
rm -rf build
mkdir -p build/lambda build/layer/python

# Copy Lambda function code
cp -r lambda/flight_search/* build/lambda/
cp -r shared build/lambda/

# Install dependencies directly into Lambda package with Linux platform
echo "📦 Installing Python dependencies for Lambda runtime (Python 3.11)..."
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install with platform-specific wheels for Lambda (Amazon Linux 2, Python 3.11)
python3 -m pip install -q \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version 3.11 \
    --only-binary=:all: \
    --upgrade \
    --target=build/lambda/ \
    -r requirements.txt

# Install pure Python packages that don't have platform-specific builds
python3 -m pip install -q \
    --target=build/lambda/ \
    --no-deps \
    FlightRadarAPI beautifulsoup4 python-dateutil pytz 2>/dev/null || true

# Create Lambda zip
cd build/lambda
zip -qr ../lambda-function.zip .
cd ../..

# Create Layer zip
cd build/layer
zip -qr ../layer-package.zip .
cd ../..

echo "✅ Deployment packages created"
echo ""
echo "☁️  Step 2: Checking AWS resources..."

# Check if IAM role exists
if aws iam get-role --role-name $LAMBDA_ROLE_NAME --profile $PROFILE >/dev/null 2>&1; then
    echo "✅ IAM role exists: $LAMBDA_ROLE_NAME"
    ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE_NAME --profile $PROFILE --query 'Role.Arn' --output text)
else
    echo "📝 Creating IAM role: $LAMBDA_ROLE_NAME"

    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    ROLE_ARN=$(aws iam create-role \
        --role-name $LAMBDA_ROLE_NAME \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --profile $PROFILE \
        --query 'Role.Arn' \
        --output text)

    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name $LAMBDA_ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --profile $PROFILE

    echo "✅ IAM role created: $ROLE_ARN"
    echo "⏳ Waiting 10 seconds for IAM role to propagate..."
    sleep 10
fi

echo ""
echo "🔄 Step 3: Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --profile $PROFILE --region $REGION >/dev/null 2>&1; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://build/lambda-function.zip \
        --profile $PROFILE \
        --region $REGION \
        --output json > /dev/null

    echo "✅ Function updated"
else
    echo "📝 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.11 \
        --role $ROLE_ARN \
        --handler handler.lambda_handler \
        --zip-file fileb://build/lambda-function.zip \
        --timeout 30 \
        --memory-size 512 \
        --profile $PROFILE \
        --region $REGION \
        --output json > /dev/null

    echo "✅ Function created"
fi

echo ""
echo "🎯 Step 4: Creating Function URL..."

# Try to update first (if exists), if fails, create
# Note: We don't add CORS config here - Lambda handler manages CORS headers directly
if ! aws lambda update-function-url-config \
    --function-name $FUNCTION_NAME \
    --auth-type NONE \
    --profile $PROFILE \
    --region $REGION \
    --output json >/dev/null 2>&1; then

    echo "📝 Creating new function URL..."
    aws lambda create-function-url-config \
        --function-name $FUNCTION_NAME \
        --auth-type NONE \
        --profile $PROFILE \
        --region $REGION \
        --output json >/dev/null
fi

# Get the URL
FUNCTION_URL=$(aws lambda get-function-url-config \
    --function-name $FUNCTION_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'FunctionUrl' \
    --output text)

# Add permission for function URL
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id FunctionURLAllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --profile $PROFILE \
    --region $REGION \
    2>/dev/null || echo "  (Permission already exists)"

echo ""
echo "===================================="
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "===================================="
echo ""
echo "📡 API Endpoint:"
echo "   $FUNCTION_URL"
echo ""
echo "🧪 Test with:"
echo "   curl -X POST $FUNCTION_URL \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"user_latitude\":37.7749,\"user_longitude\":-122.4194,\"radius_mi\":10}'"
echo ""
echo "📊 View logs:"
echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --profile $PROFILE --region $REGION"
echo ""
