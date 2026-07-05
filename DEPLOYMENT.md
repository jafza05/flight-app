# Spookfish.ai Deployment Guide

**spookfish.ai is live.** This app is served at `spookfish.ai/flights/` (main tracker) and
`spookfish.ai/flights/arrivals/` (plane-spotting arrivals view), sharing an AWS account and an
S3 bucket with a few unrelated projects (`/golf/`, `/racesetup/`, root).

### AWS Account

All resources below live in **one** AWS account (565894223082), reachable via the local
`spookfish` CLI profile (`aws ... --profile spookfish`).

### AWS Resources

#### 1. SSL/TLS Certificate
- **ARN**: `arn:aws:acm:us-east-1:565894223082:certificate/3ab2c806-1a54-45a6-83e6-f3e47b7e1e6f`
- **Domains**: `spookfish.ai` and `*.spookfish.ai`

#### 2. S3 Bucket
- **Bucket Name**: `spookfish-ai-web`
- **Region**: us-east-1
- **Purpose**: Static website hosting, shared by multiple apps at different key prefixes.
  This app's frontend lives under the `flights/` prefix — **never sync to bucket root**,
  that would touch the other apps.

#### 3. CloudFront Distributions

**Frontend Distribution**:
- **ID**: `E2X3LCZYLRVFG4`
- **Domain**: `d1qpj7lipndzo2.cloudfront.net`
- **Custom Domain**: `spookfish.ai`
- **Origin**: S3 website endpoint (`spookfish-ai-web.s3-website-us-east-1.amazonaws.com`)
- **Routing**: A CloudFront Function (`spookfish-spa-router`, viewer-request) rewrites
  extensionless URIs to the right per-app `index.html` based on path prefix
  (`/flights/arrivals` → `/flights/arrivals/index.html`, `/golf` → `/golf/index.html`, etc.)
  — see its source via `aws cloudfront describe-function --name spookfish-spa-router --stage LIVE --profile spookfish`.
  If you add a new sub-route under `/flights/`, this function needs a matching rule.
- **Caching**: Hashed assets cached for 1 year; `index.html` files not cached.

**API Distribution**:
- **ID**: `E1W4B21N7AGUVJ`
- **Domain**: `d13qwbuyeqri8z.cloudfront.net`
- **Custom Domain**: `api.spookfish.ai`
- **Origin**: Lambda Function URL

#### 4. Lambda Function
- **Function Name**: `FlightTracker-FlightSearch`
- **Runtime**: Python 3.11, 512MB, 60s timeout
- **Direct URL**: `https://44gwliogidpnklckwdyrhupydi0dbcub.lambda-url.us-east-1.on.aws/`
- **Production URL**: `https://api.spookfish.ai` (via CloudFront)
- **Handles two request shapes** via a `mode` field in the POST body:
  - Nearby-aircraft search (no `mode`, or default): proximity search around a lat/lon.
  - `mode: "arrivals"`: all airborne flights currently inbound to an airport (per-airline
    sweep across ~55 carriers, since FlightRadar24 hard-caps geographic queries at 1500
    results and even one CONUS quadrant hits that cap).
  - `mode: "refresh_flight"`: re-fetch one flight's live telemetry by registration.
- **DynamoDB**: reads aircraft model names from a table named `aircraft` (keyed by
  `ICAO_Code`); enrichment degrades gracefully if this lookup fails.

#### 5. Route 53
- **Hosted Zone ID**: `Z09718321VNDIYKX6BLLI`
- DNS already points at AWS nameservers — no GoDaddy changes needed.

### Environment Configuration

`frontend/index.html` uses Vite's `%VITE_VAR%` build-time substitution for the Google Maps
key, rather than hardcoding it — keep it that way. Both env files are gitignored; never
commit real key values into either.

#### Development (`frontend/.env.local`)
```bash
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_API_URL=https://44gwliogidpnklckwdyrhupydi0dbcub.lambda-url.us-east-1.on.aws
```

#### Production (`frontend/.env.production`)
```bash
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_API_URL=https://api.spookfish.ai
VITE_GA_MEASUREMENT_ID=<your-ga-id>
```

### Deploying

**Backend**:
```bash
cd backend
./deploy.sh   # zips lambda/flight_search + shared/, updates the Lambda directly
```

**Frontend** (multi-page Vite build: main app + `/arrivals`):
```bash
cd frontend
npm run build   # outputs dist/index.html and dist/arrivals/index.html

aws s3 sync dist/ s3://spookfish-ai-web/flights/ \
  --delete \
  --profile spookfish \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

aws s3 cp dist/index.html s3://spookfish-ai-web/flights/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --profile spookfish

aws s3 cp dist/arrivals/index.html s3://spookfish-ai-web/flights/arrivals/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --profile spookfish

aws cloudfront create-invalidation \
  --distribution-id E2X3LCZYLRVFG4 \
  --paths "/flights/*" \
  --profile spookfish
```

### Verify

```bash
curl -I https://spookfish.ai/flights/
curl -I https://spookfish.ai/flights/arrivals/

curl -X POST https://api.spookfish.ai \
  -H 'Content-Type: application/json' \
  -d '{"user_latitude":37.7749,"user_longitude":-122.4194,"radius_mi":10}'
```

### Monitoring

```bash
# CloudFront distribution status
aws cloudfront get-distribution --id E2X3LCZYLRVFG4 --profile spookfish --query 'Distribution.Status'
aws cloudfront get-distribution --id E1W4B21N7AGUVJ --profile spookfish --query 'Distribution.Status'

# Lambda logs
aws logs tail /aws/lambda/FlightTracker-FlightSearch --follow --profile spookfish --region us-east-1
```

### Architecture

```
User Browser
    ↓
spookfish.ai/flights (CloudFront + spookfish-spa-router function)
    ↓
S3 (spookfish-ai-web bucket, flights/ prefix)
    ↓ (API calls to)
api.spookfish.ai (CloudFront)
    ↓
Lambda Function URL → FlightTracker-FlightSearch
    ↓
FlightRadar24 API (per-airline + geographic zone queries) + DynamoDB (aircraft models)
```

### Troubleshooting

**New page/route not resolving (e.g. adding `/flights/somepage`)?**
Check `spookfish-spa-router`'s rules — it needs an explicit prefix match, and rule order
matters (more specific prefixes must be checked before their parent, e.g.
`/flights/arrivals` before `/flights`).

**Frontend showing an old version?**
Invalidate CloudFront (`/flights/*`), then hard-refresh — browsers can cache aggressively
even with correct cache-control headers on a fresh deploy.

**Arrivals search returning too few/no flights?**
FlightRadar24's live-tracker endpoint is flaky under load; the backend retries, but a
transient empty response can still surface as "no flights found." Just search again.

### Security Notes

- SSL/TLS enforced on all domains.
- Lambda Function URL is public but only reachable in practice via CloudFront.
- S3 bucket serves public static content only — no secrets belong there.
- The Google Maps API key is a client-side key by nature (visible to any visitor) —
  restrict it via HTTP referrer in Google Cloud Console rather than trying to hide it.
- CORS is handled directly in the Lambda handler.
