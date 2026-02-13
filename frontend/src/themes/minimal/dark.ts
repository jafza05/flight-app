import type { Theme } from '../types';

export const minimalDark: Theme = {
  id: 'minimal-dark',
  name: 'Minimal Dark',
  family: 'minimal',
  mode: 'dark',

  colors: {
    primary: '#007AFF',           // iOS blue
    secondary: '#5856D6',         // iOS purple
    background: '#000000',        // Pure black (OLED-friendly)
    surface: '#1C1C1E',           // iOS dark surface
    surfaceElevated: '#2C2C2E',

    text: {
      primary: '#FFFFFF',
      secondary: '#98989D',       // iOS secondary text
      accent: '#007AFF',
      warning: '#FF9500',
      danger: '#FF3B30'
    },

    gauges: {
      altitude: '#007AFF',
      speed: '#34C759',           // iOS green
      heading: '#FF9500',         // iOS orange
      track: 'rgba(0,122,255,0.3)'
    },

    map: {
      style: 'dark-v11',
      aircraftMarker: '#007AFF',
      userMarker: '#FF9500',
      distanceRings: 'rgba(255,255,255,0.1)'
    }
  },

  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    splitFlap: '"SF Pro Display", -apple-system, sans-serif'
  },

  effects: {
    glassmorphism: false,
    boxShadow: 'none',
    borderGlow: 'none',
    panelBorder: '0.5px solid rgba(255,255,255,0.1)'
  }
};
