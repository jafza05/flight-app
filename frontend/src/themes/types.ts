export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeFamily = 'cockpit' | 'minimal' | 'retro';
export type ThemeId =
  | 'cockpit-dark'
  | 'cockpit-light'
  | 'minimal-dark'
  | 'minimal-light'
  | 'retro-dark'
  | 'retro-light';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
    danger: string;
  };
  gauges: {
    altitude: string;
    speed: string;
    heading: string;
    track: string;
  };
  map: {
    style: string;
    aircraftMarker: string;
    userMarker: string;
    distanceRings: string;
  };
}

export interface ThemeFonts {
  display: string;
  body: string;
  splitFlap: string;
}

export interface ThemeEffects {
  glassmorphism: boolean;
  boxShadow: string;
  borderGlow: string;
  panelBorder: string;
  textShadow?: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  family: ThemeFamily;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects: ThemeEffects;
}

export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  themeFamily: ThemeFamily;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeFamily: (family: ThemeFamily) => void;
  setTheme: (themeId: ThemeId) => void;
}
