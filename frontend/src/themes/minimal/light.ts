import type { Theme } from '../types';

export const minimalLight: Theme = {
  id: 'minimal-light',
  name: 'Minimal Light',
  family: 'minimal',
  mode: 'light',

  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F2F2F7',           // iOS light surface
    surfaceElevated: '#FFFFFF',

    text: {
      primary: '#000000',
      secondary: '#6C6C70',
      accent: '#007AFF',
      warning: '#FF9500',
      danger: '#FF3B30'
    },

    gauges: {
      altitude: '#007AFF',
      speed: '#34C759',
      heading: '#FF9500',
      track: 'rgba(0,122,255,0.2)'
    },

    map: {
      style: 'light-v11',
      aircraftMarker: '#007AFF',
      userMarker: '#FF9500',
      distanceRings: 'rgba(0,0,0,0.1)'
    }
  },

  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    splitFlap: '"SF Pro Display", -apple-system, sans-serif'
  },

  effects: {
    glassmorphism: false,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    borderGlow: 'none',
    panelBorder: '0.5px solid rgba(0,0,0,0.1)'
  }
};
