# Spookfish.ai - Deployment Guide

This guide walks through deploying the Spookfish.ai application to AWS.

## Prerequisites

- AWS Account (Account ID: 565894223082)
- AWS CLI installed and configured
- AWS SAM CLI installed
- Node.js 18+ and npm
- Python 3.11+
- Google Maps API Key

## Credentials Setup

Your credentials have been configured in this repository:
- `.env.local` - Contains all environment variables
- `~/.aws/credentials` - Contains AWS access credentials
- `~/.aws/config` - Contains AWS region configuration

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

If you have AWS CLI and SAM CLI installed on your local machine:

```bash
# 1. Deploy backend infrastructure
cd scripts
./deploy-backend.sh

# 2. Note the CloudFormation outputs and update .env.local
# Copy these values:
# - UserPoolId → NEXT_PUBLIC_COGNITO_USER_POOL_ID
# - UserPoolClientId → NEXT_PUBLIC_COGNITO_CLIENT_ID
# - ApiGatewayUrl → NEXT_PUBLIC_API_GATEWAY_URL

# 3. Install frontend dependencies (already done in this repo)
cd ../frontend
npm install

# 4. Run frontend locally for testing
npm run dev

# 5. Build and deploy frontend
npm run build
```

### Option 2: Manual AWS Console Deployment

If you don't have AWS CLI/SAM CLI, you can deploy manually:

#### Step 1: Create Cognito User Pool

1. Go to AWS Cognito Console
2. Click "Create user pool"
3. Configure:
   - Sign-in options: Email
   - Password policy: Default
   - MFA: Optional (or required)
   - User account recovery: Email only
   - Required attributes: email, name
4. Create app client:
   - App client name: `spookfish-client-dev`
   - Auth flows: Enable SRP, USER_PASSWORD_AUTH
5. Note the **User Pool ID** and **App Client ID**

#### Step 2: Create DynamoDB Tables

Create two tables:

**Table 1: User Preferences**
- Table name: `spookfish-user-preferences-dev`
- Partition key: `cognitoSub` (String)
- Billing mode: On-demand

**Table 2: User Locations**
- Table name: `spookfish-user-locations-dev`
- Partition key: `cognitoSub` (String)
- Sort key: `locationId` (String)
- Billing mode: On-demand

#### Step 3: Create Lambda Functions

For each Lambda function, create in the AWS Console:

**Lambda 1: nearby-flights**
- Runtime: Python 3.11
- Code: Upload `lambda/nearby_flights/` folder as ZIP
- Handler: `handler.lambda_handler`
- Timeout: 30 seconds
- Memory: 512 MB
- Environment variables:
  - `USER_PREFERENCES_TABLE`: `spookfish-user-preferences-dev`
- Attach IAM role with:
  - DynamoDB read access to UserPreferences table
  - CloudWatch Logs write access

**Lambda 2: user-preferences**
- Runtime: Python 3.11
- Code: Upload `lambda/user_preferences/` folder as ZIP
- Handler: `handler.lambda_handler`
- Timeout: 30 seconds
- Memory: 512 MB
- Environment variables:
  - `USER_PREFERENCES_TABLE`: `spookfish-user-preferences-dev`
- Attach IAM role with:
  - DynamoDB read/write access to UserPreferences table
  - CloudWatch Logs write access

**Lambda 3: user-locations**
- Runtime: Python 3.11
- Code: Upload `lambda/user_locations/` folder as ZIP
- Handler: `handler.lambda_handler`
- Timeout: 30 seconds
- Memory: 512 MB
- Environment variables:
  - `USER_LOCATIONS_TABLE`: `spookfish-user-locations-dev`
- Attach IAM role with:
  - DynamoDB read/write access to UserLocations table
  - CloudWatch Logs write access

#### Step 4: Create Lambda Layer for FlightRadarAPI

1. Create a ZIP of `infrastructure/layers/flightradar/python/`
2. Create Lambda Layer in AWS Console
3. Upload ZIP
4. Compatible runtimes: Python 3.11
5. Attach this layer to the `nearby-flights` Lambda function

#### Step 5: Create API Gateway

1. Create REST API
2. Create Cognito Authorizer:
   - Type: Cognito
   - Cognito User Pool: Select your user pool
   - Token source: Authorization
3. Create resources and methods:

**POST /flights/nearby**
- Integration: Lambda Function → `nearby-flights`
- Authorization: Cognito Authorizer
- Enable CORS

**GET /user/preferences**
- Integration: Lambda Function → `user-preferences`
- Authorization: Cognito Authorizer
- Enable CORS

**PUT /user/preferences**
- Integration: Lambda Function → `user-preferences`
- Authorization: Cognito Authorizer
- Enable CORS

**GET /user/locations**
- Integration: Lambda Function → `user-locations`
- Authorization: Cognito Authorizer
- Enable CORS

**POST /user/locations**
- Integration: Lambda Function → `user-locations`
- Authorization: Cognito Authorizer
- Enable CORS

**DELETE /user/locations/{locationId}**
- Integration: Lambda Function → `user-locations`
- Authorization: Cognito Authorizer
- Enable CORS
- Path parameter: `locationId`

4. Deploy API to stage: `dev`
5. Note the **Invoke URL**

#### Step 6: Update .env.local

Update these values in `.env.local`:

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<from Step 1>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<from Step 1>
NEXT_PUBLIC_API_GATEWAY_URL=<from Step 5>
```

### Option 3: AWS SAM CLI Deployment

If you have SAM CLI installed:

```bash
# Navigate to infrastructure directory
cd infrastructure

# Build
sam build

# Deploy (first time - guided)
sam deploy --guided

# Follow prompts:
# - Stack name: spookfish-dev
# - Region: us-east-1
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to config file: Y

# Subsequent deployments
sam build && sam deploy
```

## Post-Deployment

### 1. Test the API

Test the API Gateway endpoint:

```bash
# Get Cognito token first (sign up a user via frontend)
# Then test the endpoints:

curl -X POST https://YOUR_API_URL/dev/flights/nearby \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maxFlights": 5
  }'
```

### 2. Frontend Deployment to S3

```bash
# Build frontend
cd frontend
npm run build

# If using Next.js static export
npm run export

# Upload to S3
aws s3 sync out/ s3://your-frontend-bucket/ --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 3. Configure CloudFront (Optional)

1. Create CloudFront distribution
2. Origin: S3 bucket
3. Default root object: `index.html`
4. Error pages: Custom error response for 404 → `/index.html` (for SPA routing)
5. SSL certificate: Request from ACM for `spookfish.ai`
6. Add CNAME: `www.spookfish.ai`

### 4. Configure Route 53

1. Create hosted zone for `spookfish.ai`
2. Add A record:
   - Type: A
   - Alias: Yes
   - Target: CloudFront distribution
3. Add CNAME for `www`:
   - Type: CNAME
   - Value: CloudFront domain

## Troubleshooting

### AWS Credentials Issues

If you get "Access denied" errors:

1. Verify credentials in `~/.aws/credentials`
2. Check IAM user permissions:
   - CloudFormation full access
   - IAM role creation
   - Lambda full access
   - DynamoDB full access
   - Cognito full access
   - API Gateway full access
   - S3 access (for SAM deployments)

### Lambda Layer Issues

If FlightRadarAPI is not found in Lambda:

1. Verify the layer is attached to the function
2. Check that dependencies are in `python/` directory
3. Re-create the layer with correct structure

### CORS Issues

If frontend gets CORS errors:

1. Verify API Gateway has CORS enabled
2. Check Lambda responses include CORS headers
3. Ensure OPTIONS method is configured for preflight requests

## Monitoring

### CloudWatch Logs

View Lambda logs:
```bash
aws logs tail /aws/lambda/spookfish-nearby-flights-dev --follow
```

### API Gateway Metrics

Monitor in CloudWatch:
- Request count
- Error rate
- Latency
- 4XX/5XX errors

## Cost Optimization

- Use DynamoDB on-demand billing for variable traffic
- Set Lambda memory to minimum required (test and adjust)
- Enable CloudFront caching for static assets
- Monitor S3 costs if storing large amounts of data

## Security Checklist

- [ ] Cognito user pool configured with strong password policy
- [ ] MFA enabled for Cognito (optional but recommended)
- [ ] API Gateway has Cognito authorizer on all endpoints
- [ ] Lambda functions have minimal IAM permissions
- [ ] Environment variables don't contain sensitive data
- [ ] CloudFront uses HTTPS only
- [ ] S3 bucket is not publicly accessible (unless needed for static hosting)
- [ ] API Gateway has throttling configured
- [ ] WAF rules configured (optional, for production)

## Next Steps

After successful deployment:

1. Create first user via Cognito
2. Test all API endpoints
3. Run frontend locally and verify integration
4. Deploy frontend to S3
5. Configure custom domain
6. Set up monitoring and alerts
7. Plan for CI/CD pipeline
