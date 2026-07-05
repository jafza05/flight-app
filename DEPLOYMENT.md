# Spookfish.ai Deployment Guide

## Infrastructure Setup Complete

Your flight tracking app is now configured to deploy to **spookfish.ai**!

### AWS Resources Created

#### 1. SSL/TLS Certificate
- **Certificate ARN**: `arn:aws:acm:us-east-1:137266778053:certificate/99be807b-3138-4782-b49d-bea036bbb8c7`
- **Domains**: `spookfish.ai` and `*.spookfish.ai`
- **Status**: ISSUED ✅
- **Validation**: DNS validation record added to Route 53

#### 2. S3 Bucket
- **Bucket Name**: `spookfish-ai-frontend`
- **Region**: us-east-1
- **Purpose**: Static website hosting for React frontend
- **Public Access**: Enabled for CloudFront

#### 3. CloudFront Distributions

**Frontend Distribution**:
- **ID**: `ETI0TC1H1LDGI`
- **Domain**: `d17akkfka5sxtn.cloudfront.net`
- **Custom Domain**: `spookfish.ai`
- **Origin**: S3 bucket (spookfish-ai-frontend)
- **SSL**: Using ACM certificate
- **Caching**: Assets cached for 1 year, index.html not cached

**API Distribution**:
- **ID**: `E3I7Q1UUY25DYF`
- **Domain**: `d3ix5fq6disg70.cloudfront.net`
- **Custom Domain**: `api.spookfish.ai`
- **Origin**: Lambda Function URL
- **SSL**: Using ACM certificate
- **Caching**: Disabled (0 TTL for dynamic content)

#### 4. Lambda Function
- **Function Name**: `FlightTracker-FlightSearch`
- **Runtime**: Python 3.11
- **Direct URL**: `https://44gwliogidpnklckwdyrhupydi0dbcub.lambda-url.us-east-1.on.aws/`
- **Production URL**: `https://api.spookfish.ai` (via CloudFront)
- **Status**: Deployed and running ✅

#### 5. Route 53 DNS Records
- **Hosted Zone ID**: `Z00917502DIKLM82LCM5I`
- **Domain**: spookfish.ai

**DNS Records Created**:
- `spookfish.ai` → A record (Alias to CloudFront `d17akkfka5sxtn.cloudfront.net`)
- `api.spookfish.ai` → A record (Alias to CloudFront `d3ix5fq6disg70.cloudfront.net`)
- `www.spookfish.ai` → CNAME to `spookfish.ai`

### GoDaddy Configuration Required

You need to update the nameservers in your GoDaddy account:

1. Log into GoDaddy: https://dcc.godaddy.com/
2. Find **spookfish.ai** in your domain list
3. Click **DNS** or **Manage**
4. Find **Nameservers** section
5. Change to **Custom** nameservers
6. Enter these 4 AWS nameservers:
   ```
   ns-1746.awsdns-26.co.uk
   ns-1332.awsdns-38.org
   ns-692.awsdns-22.net
   ns-277.awsdns-34.com
   ```
7. Save changes

**Note**: DNS propagation takes 24-48 hours (often faster)

### Environment Configuration

#### Development (.env.local)
```bash
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_API_URL=https://44gwliogidpnklckwdyrhupydi0dbcub.lambda-url.us-east-1.on.aws
```

#### Production (.env.production)
```bash
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_API_URL=https://api.spookfish.ai
```

Both `.env.local` and `.env.production` are gitignored — never commit real key values.

### Next Steps

#### Step 1: Wait for DNS Propagation
After updating GoDaddy nameservers, check propagation status:
```bash
# Check if nameservers have propagated
dig NS spookfish.ai

# Check if A records are resolving
dig spookfish.ai
dig api.spookfish.ai
```

#### Step 2: Build and Deploy Frontend

The frontend needs to be built with the production API endpoint and deployed to S3:

```bash
cd frontend

# Build for production (uses .env.production)
npm run build

# Deploy to S3
aws s3 sync dist/ s3://spookfish-ai-frontend/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://spookfish-ai-frontend/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ETI0TC1H1LDGI \
  --paths "/*"
```

**Note**: The build is currently having issues due to iCloud file synchronization. You may need to:
1. Ensure all files are downloaded from iCloud
2. Or build in a non-iCloud directory
3. Or disable iCloud for the project folder

#### Step 3: Verify Deployment

Once DNS propagates and frontend is deployed:

1. **Frontend**: https://spookfish.ai
2. **API**: https://api.spookfish.ai
3. **Test API**:
   ```bash
   curl -X POST https://api.spookfish.ai \
     -H 'Content-Type: application/json' \
     -d '{"user_latitude":37.7749,"user_longitude":-122.4194,"radius_mi":10}'
   ```

### Deployment Commands Summary

**Backend** (already deployed):
```bash
cd backend
./deploy.sh
```

**Frontend** (pending):
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://spookfish-ai-frontend/ --delete
aws cloudfront create-invalidation --distribution-id ETI0TC1H1LDGI --paths "/*"
```

### Monitoring and Maintenance

**View CloudFront status**:
```bash
aws cloudfront get-distribution --id ETI0TC1H1LDGI --query 'Distribution.Status'
aws cloudfront get-distribution --id E3I7Q1UUY25DYF --query 'Distribution.Status'
```

**View Lambda logs**:
```bash
aws logs tail /aws/lambda/FlightTracker-FlightSearch --follow --region us-east-1
```

**Check SSL certificate**:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:137266778053:certificate/99be807b-3138-4782-b49d-bea036bbb8c7 \
  --region us-east-1
```

### Architecture Diagram

```
User Browser
    ↓
spookfish.ai (CloudFront)
    ↓
S3 Bucket (Frontend React App)
    ↓ (API calls to)
api.spookfish.ai (CloudFront)
    ↓
Lambda Function URL
    ↓
Lambda: FlightTracker-FlightSearch
    ↓
FlightRadar24 API + DynamoDB
```

### Cost Estimate

- **Route 53**: ~$0.50/month (hosted zone)
- **S3**: ~$0.023/GB storage + $0.09/GB transfer
- **CloudFront**: First 1TB free, then ~$0.085/GB
- **Lambda**: First 1M requests free, then $0.20 per 1M
- **ACM Certificate**: FREE
- **Data Transfer**: Mostly covered by free tier

Expected monthly cost: **$5-15** depending on traffic

### Troubleshooting

**DNS not resolving?**
- Wait 24-48 hours for full propagation
- Check nameservers in GoDaddy match AWS
- Use `dig` or `nslookup` to verify

**CloudFront not serving content?**
- Check distribution status is "Deployed"
- Verify S3 bucket has files
- Check browser console for CORS errors

**API not working?**
- Check Lambda function logs
- Verify CORS headers in Lambda response
- Test Lambda URL directly first

**Frontend showing old version?**
- Invalidate CloudFront cache
- Clear browser cache
- Check S3 bucket has new files

### Security Notes

- SSL/TLS enforced on all domains
- Lambda Function URL is public but proxied through CloudFront
- S3 bucket is public for static hosting
- CORS configured in Lambda handler
- No API keys required (FlightRadar24 public API)

---

## Status: Ready for Frontend Deployment

✅ Infrastructure configured
✅ Backend deployed
✅ DNS records created
⏳ Waiting for GoDaddy nameserver update
⏳ Frontend build and deployment pending

Once you update the nameservers in GoDaddy and deploy the frontend, your app will be live at **https://spookfish.ai**!
