import type { Theme } from '../types';

export const cockpitLight: Theme = {
  id: 'cockpit-light',
  name: 'Cockpit Light',
  family: 'cockpit',
  mode: 'light',

  colors: {
    primary: '#0066CC',
    secondary: '#FF8800',
    background: '#E8EDF2',        // Light blue-gray
    surface: '#FFFFFF',
    surfaceElevated: '#F5F8FA',

    text: {
      primary: '#1A2332',
      secondary: '#5C6B7D',
      accent: '#0066CC',
      warning: '#FF8800',
      danger: '#D63031'
    },

    gauges: {
      altitude: '#0066CC',
      speed: '#00AA44',
      heading: '#FF8800',
      track: 'rgba(0,102,204,0.3)'
    },

    map: {
      style: 'light-v11',
      aircraftMarker: '#0066CC',
      userMarker: '#FF8800',
      distanceRings: 'rgba(0,102,204,0.2)'
    }
  },

  fonts: {
    display: '"B612 Mono", "Courier New", monospace',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    splitFlap: '"Bebas Neue", "Impact", sans-serif'
  },

  effects: {
    glassmorphism: false,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    borderGlow: 'none',
    panelBorder: '1px solid #D1DBE5'
  }
};
