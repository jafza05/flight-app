# CORS Configuration for FlightTracker Lambda

## IMPORTANT: DO NOT MODIFY THIS SETUP

This Lambda Function uses **Lambda Function URL** with CORS configured at the **Function URL level**, NOT in the Lambda code.

### Current Configuration:
- **Function URL CORS**: Enabled with:
  - AllowOrigins: ["*"]
  - AllowMethods: ["POST", "GET"]  
  - AllowHeaders: ["content-type"]
  - MaxAge: 86400

- **Lambda Handler**: Does NOT send CORS headers (Function URL handles it automatically)

### Why This Works:
- Lambda Function URLs automatically handle OPTIONS preflight requests
- Adding CORS headers in BOTH places causes duplicate header errors
- The Function URL CORS config handles all CORS automatically

### To Update CORS:
```bash
aws lambda update-function-url-config \
  --function-name FlightTracker-FlightSearch \
  --auth-type NONE \
  --cors file://cors-config.json \
  --profile spookfish \
  --region us-east-1
```

### DO NOT:
- ❌ Add Access-Control-* headers in Lambda response
- ❌ Handle OPTIONS requests manually in Lambda
- ❌ Delete and recreate Function URL (breaks CORS)
- ❌ Remove CORS from Function URL config

### If CORS Breaks:
Run this command to restore:
```bash
cat > /tmp/cors-config.json << 'CORSEOF'
{
  "AllowOrigins": ["*"],
  "AllowMethods": ["POST", "GET"],
  "AllowHeaders": ["content-type"],
  "MaxAge": 86400
}
CORSEOF

aws lambda update-function-url-config \
  --function-name FlightTracker-FlightSearch \
  --auth-type NONE \
  --cors file:///tmp/cors-config.json \
  --profile spookfish \
  --region us-east-1
```
