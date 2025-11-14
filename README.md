# ✈️ Spookfish.ai

Real-time aircraft proximity tracker with intelligent approach detection.

## 🌟 Overview

Spookfish.ai helps you identify aircraft near your location in real-time. Using the FlightRadarAPI and intelligent proximity algorithms, it shows you the closest aircraft with detailed flight information including origin, destination, altitude, speed, and whether the aircraft is approaching or departing from your location.

### Key Features

- 🎯 **Smart Proximity Detection** - Prioritizes approaching aircraft over departing ones
- 🗺️ **Live Map View** - Google Maps integration with custom airplane markers
- ✈️ **Beautiful Gauges** - Aviation-inspired altitude, speed, and heading indicators
- 🎴 **Split-Flap Display** - Retro airport-style display for origin/destination codes
- 🎨 **Light/Dark Themes** - System-aware theme with manual override
- 📱 **Responsive Design** - Optimized for desktop, tablets, and mobile
- 💾 **Saved Locations** - Save favorite observation points
- 🔧 **Customizable** - Configure units, refresh intervals, and search radius

## 🏗️ Architecture

**Frontend:** Next.js 14+ (React, TypeScript, Tailwind CSS)
**Backend:** AWS Lambda (Python 3.11+) with FlightRadarAPI
**API:** AWS API Gateway (REST)
**Auth:** AWS Cognito
**Database:** DynamoDB
**Hosting:** S3 + CloudFront
**Domain:** spookfish.ai

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- AWS CLI configured
- AWS SAM CLI
- Google Maps API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd flight-app
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your:
- AWS region and credentials
- Google Maps API key
- S3 bucket URL for airline logos

**Note:** The Cognito and API Gateway URLs will be populated after infrastructure deployment.

### 3. Deploy AWS Infrastructure

```bash
cd infrastructure
sam build
sam deploy --guided
```

Follow the prompts to configure your stack. After deployment, note the outputs:
- Cognito User Pool ID
- Cognito Client ID
- API Gateway URL

Add these to your `.env.local` file.

### 4. Install and Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Deploy to Production

**Backend:**
```bash
cd infrastructure
sam build && sam deploy
```

**Frontend:**
```bash
cd frontend
npm run build
```

Upload the `frontend/out` directory to your S3 bucket.

## 📁 Project Structure

```
flight-app/
├── infrastructure/         # AWS SAM templates
├── lambda/                # Python Lambda functions
│   ├── nearby_flights/    # Flight proximity detection
│   ├── user_preferences/  # User settings management
│   └── user_locations/    # Saved locations CRUD
├── frontend/              # Next.js application
│   └── src/
│       ├── app/          # Pages and layouts
│       ├── components/   # React components
│       ├── lib/          # Utilities and API clients
│       └── hooks/        # Custom React hooks
├── scripts/              # Deployment scripts
└── docs/                 # Documentation
```

## 🔧 Development

### Backend (Lambda)

```bash
cd lambda/nearby_flights
pip install -r requirements.txt
python -m pytest  # Run tests
```

### Frontend

```bash
cd frontend
npm run dev       # Development server
npm run build     # Production build
npm run lint      # Lint code
```

## 📊 API Endpoints

- `POST /flights/nearby` - Get nearby aircraft with proximity data
- `GET /user/preferences` - Get user settings
- `PUT /user/preferences` - Update user settings
- `GET /user/locations` - Get saved locations
- `POST /user/locations` - Create saved location
- `DELETE /user/locations/{id}` - Delete saved location

See [docs/API.md](docs/API.md) for detailed API documentation.

## 🎨 Customization

### Theme

Toggle between light and dark themes in Settings, or use system preference.

### Units

Configure your preferred units:
- Distance: miles or kilometers
- Altitude: feet or meters
- Speed: knots, mph, or kph

### Search Radius

Choose automatic (intelligent) or manual radius selection (1-50 miles).

### Refresh Interval

Set how often flight data updates (10-45 seconds).

### Display Layout

- **Hero Mode:** Single aircraft, large gauges
- **List Mode:** Up to 5 aircraft in a scrollable list
- **Grid Mode:** Multiple aircraft in a grid layout

## 🔒 Security

- User authentication via AWS Cognito
- API requests secured with JWT tokens
- HTTPS everywhere (CloudFront SSL)
- Rate limiting on API Gateway
- No credentials stored in code

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [FlightRadarAPI](https://pypi.org/project/FlightRadarAPI/) for flight data
- Google Maps for mapping services
- AWS for serverless infrastructure

---

**Built with ❤️ for aviation enthusiasts**