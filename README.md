# ✈️ FlightTracker

Real-time aircraft tracking application with cockpit-inspired design

## 🚀 Quick Start

```bash
# Frontend development
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173/

## ✅ Completed Features

### Phase 1: Theme System & Foundation
- ✅ **6 Complete Themes** (Cockpit/Minimal/Retro × Light/Dark)
  - **Cockpit Dark** (Default): Aviation HUD-inspired with cyan accents
  - **Cockpit Light**: Light aviation theme
  - **Minimal Dark**: iOS-style dark mode
  - **Minimal Light**: Clean, minimal design
  - **Retro Dark**: Vintage aviation aesthetic
  - **Retro Light**: Warm, retro styling

- ✅ **Dynamic Theme System**
  - Theme context with localStorage persistence
  - System theme detection (auto dark/light)
  - CSS variables for seamless transitions
  - Theme selector UI component

- ✅ **Split-Flap Display Component**
  - Animated airport code displays (SFO → ORD)
  - Theme-aware styling (glassmorphism for cockpit theme)
  - Responsive sizing (mobile/tablet/desktop/TV)

- ✅ **Orientation & TV Mode Hooks**
  - `useOrientation`: Detect landscape/portrait
  - `useTVMode`: Large display mode for 10-foot viewing
  - Auto-suggestion for TV mode on large screens

## 🎨 Theme System Details

### Cockpit Dark (Default)
```typescript
- Primary: #00D4FF (Cyan HUD)
- Background: #0A0E14 (Near black)
- Fonts: B612 Mono (aviation), Bebas Neue (split-flap)
- Effects: Glassmorphism, subtle glows
```

### Usage
```tsx
import { useTheme } from './contexts/ThemeContext';

const { theme, setThemeFamily, setThemeMode } = useTheme();

// Change theme family
setThemeFamily('cockpit'); // or 'minimal', 'retro'

// Change mode
setThemeMode('dark'); // or 'light', 'system'
```

## 🏗️ Project Structure

```
flight-app-1/
├── frontend/
│   ├── src/
│   │   ├── themes/           # 6 theme definitions
│   │   │   ├── cockpit/
│   │   │   ├── minimal/
│   │   │   └── retro/
│   │   ├── contexts/         # Theme context
│   │   ├── components/
│   │   │   ├── SplitFlapDisplay/
│   │   │   ├── ThemeSelector/
│   │   │   └── ThemeApplier.tsx
│   │   ├── hooks/
│   │   │   ├── useOrientation.ts
│   │   │   └── useTVMode.ts
│   │   └── styles/
│   │       └── global.css    # CSS variables
│   └── package.json
└── backend/                  # Coming soon
```

## 🎯 Next Steps

### Phase 2: Gauges & Layout (In Progress)
- 🚧 Dynamic gauge components (Circular/Bar/Tape)
- 🚧 Cockpit hero layout (3-column design)
- 🚧 Gauge selection based on orientation

### Phase 3: Map Integration
- ⏳ MapTiler + Leaflet.js integration
- ⏳ Aircraft markers with heading indicators
- ⏳ Distance rings and trajectory lines

### Phase 4: Backend
- ⏳ AWS Lambda functions (Python)
- ⏳ FlightRadarAPI integration
- ⏳ Proximity calculation algorithm
- ⏳ AWS deployment (SAM/CDK)

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Leaflet.js (maps)
- CSS Modules

**Backend (Planned):**
- AWS Lambda (Python)
- FlightRadarAPI
- API Gateway
- DynamoDB

## 📱 Responsive Design

- **Mobile**: 320px+ (portrait/landscape)
- **Tablet**: 768px+ (optimized for landscape)
- **Desktop**: 1024px+
- **TV/Large**: 1920px+ (TV mode available)

## ⚙️ Configuration

### Default Settings
- Theme: **Cockpit Dark**
- Layout: **Hero Mode**
- Units: **US Standard (mi/ft/kts)**
- Radius: **Auto-expand**
- Max Aircraft: **5** (configurable 1-10)

## 🎨 Try It Out!

1. Start the dev server
2. Open http://localhost:5173/
3. Try switching between:
   - **Cockpit** theme (aviation-inspired)
   - **Minimal** theme (iOS-style)
   - **Retro** theme (vintage aviation)
4. Toggle between Light/Dark/Auto modes
5. See the split-flap display animation!

## 📝 Development Log

**2024-11-14:**
- ✅ Initialized React + TypeScript project
- ✅ Created 6 complete theme definitions
- ✅ Built theme system with context & CSS variables
- ✅ Implemented split-flap display component
- ✅ Added orientation and TV mode hooks
- ✅ Created theme selector UI
- ✅ Responsive typography and spacing system

**Next Session:**
- Build dynamic gauge components
- Create cockpit hero layout
- Integrate map component

---

Built with ❤️ for aviation enthusiasts
