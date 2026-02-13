# FlightTracker Backend

Python Lambda functions for aircraft tracking and proximity calculation

## ✅ Completed Features

### Data Models
- ✅ **Aircraft** - Complete aircraft data structure
- ✅ **AircraftWithDistance** - Enhanced with proximity calculations
- ✅ **FlightSearchRequest/Response** - API contracts
- ✅ **TypeScript Types** - Matching frontend types generated

### Proximity Algorithm
- ✅ **Haversine Distance** - Accurate great-circle distance calculation
- ✅ **3D Distance** - Includes altitude in calculations
- ✅ **Bearing Calculation** - Direction from user to aircraft
- ✅ **Approach Detection** - Determines if aircraft is heading toward user
- ✅ **Priority Scoring** - Weights by distance, approach, and altitude

### Lambda Functions
- ✅ **FlightSearchFunction** - Search for nearby aircraft
  - Accepts user location and radius
  - Calculates proximity for all aircraft
  - Sorts by proximity score
  - Returns top N aircraft with full metadata

### Testing
- ✅ **Local Testing** - Test Lambda without AWS
- ✅ **Mock Data** - Sample aircraft for development
- ✅ **Unit Conversions** - feet/meters, knots/mph/kmh

## 🧪 Test Locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test the Lambda function
python test_lambda_local.py
```

**Expected Output:**
```json
{
  "aircraft": [
    {
      "callsign": "AAL1234",
      "flight_number": "AA1234",
      "route": "LAX → JFK",
      "distance_mi": 2.34,
      "altitude_ft": 12000,
      "speed_kts": 285,
      "is_approaching": false,
      "proximity_score": 0.2144
    }
  ],
  "aircraft_count": 3,
  "search_radius_mi": 10.0
}
```

## 📊 Data Structure

### Request
```json
{
  "user_latitude": 37.7749,
  "user_longitude": -122.4194,
  "radius_mi": 10,
  "max_aircraft": 5,
  "radius_mode": "auto"
}
```

### Response
```json
{
  "aircraft": [...],
  "search_radius_mi": 10.0,
  "aircraft_count": 3,
  "user_location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "timestamp": "2025-11-14T21:21:08Z"
}
```

### Aircraft Object
Each aircraft includes:
- **Identifiers**: id, callsign, flight_number, registration
- **Aircraft Info**: aircraft_code (e.g., "B738")
- **Airline**: airline_iata, airline_icao
- **Position**: latitude, longitude, altitude, heading
- **Speed**: ground_speed, vertical_speed
- **Route**: origin_airport_iata, destination_airport_iata
- **Proximity**: distance_mi, distance_3d_mi, bearing_to_aircraft
- **Intelligence**: is_approaching, proximity_score
- **Unit Conversions**: altitude_m, speed_mph, speed_kmh

## 🚀 Deploy to AWS

### Prerequisites
- AWS CLI configured with `spookfish` profile
- AWS SAM CLI installed

### Deployment Commands

```bash
# Build
sam build --use-container

# Deploy (first time)
sam deploy --guided --profile spookfish

# Deploy (subsequent)
sam deploy --profile spookfish
```

### Configuration
When prompted during `sam deploy --guided`:
- **Stack Name**: `flighttracker-backend`
- **AWS Region**: `us-east-1` (or your preference)
- **Confirm changes**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Save arguments to config**: Y

## 📁 Project Structure

```
backend/
├── lambda/
│   └── flight_search/
│       └── handler.py          # Main Lambda handler
├── shared/
│   ├── models.py              # Data models (Aircraft, etc.)
│   └── proximity.py           # Distance & scoring algorithms
├── tests/
├── template.yaml              # SAM CloudFormation template
├── requirements.txt           # Python dependencies
└── test_lambda_local.py       # Local testing script
```

## 🔧 Next Steps

1. **Integrate FlightRadarAPI** - Replace mock data with real API calls
2. **Add Caching** - Use DynamoDB to cache results (reduce API calls)
3. **Auto-Radius** - Implement intelligent radius expansion
4. **Rate Limiting** - Add request throttling
5. **Deploy to AWS** - Use SAM with spookfish profile

## 🎯 Proximity Algorithm

The proximity score considers:
1. **Distance** - Closer aircraft score higher
2. **Approach** - Approaching aircraft get 50% bonus
3. **Altitude** - Lower aircraft (<10,000 ft) get 20% bonus

Formula:
```python
base_score = 1 / distance_3d_mi
approach_multiplier = 1.5 if approaching else 0.7
altitude_multiplier = 1.2 if altitude < 10000 else 0.8
proximity_score = base_score * approach_multiplier * altitude_multiplier
```

## 🔗 API Endpoint

After deployment:
```
POST https://{api-id}.execute-api.{region}.amazonaws.com/prod/flights/search
```

The endpoint URL will be output after `sam deploy` completes.
