import type { Theme } from '../types';

export const cockpitDark: Theme = {
  id: 'cockpit-dark',
  name: 'Cockpit Dark',
  family: 'cockpit',
  mode: 'dark',

  colors: {
    primary: '#00D4FF',           // Cyan (HUD blue)
    secondary: '#FFB627',         // Amber warning
    background: '#0A0E14',        // Near black
    surface: '#14181F',           // Dark panel
    surfaceElevated: '#1C2128',   // Raised elements

    text: {
      primary: '#E8F0F7',         // Off-white
      secondary: '#8C9DB5',       // Muted blue-gray
      accent: '#00D4FF',          // Cyan
      warning: '#FFB627',         // Amber
      danger: '#FF4757'           // Red
    },

    gauges: {
      altitude: '#00D4FF',        // Cyan
      speed: '#00FF88',           // Green
      heading: '#FFB627',         // Amber
      track: 'rgba(0,212,255,0.3)' // Cyan trail
    },

    map: {
      style: 'dark-v11',
      aircraftMarker: '#00D4FF',
      userMarker: '#FFB627',
      distanceRings: 'rgba(0,212,255,0.2)'
    }
  },

  fonts: {
    display: '"B612 Mono", "Courier New", monospace',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    splitFlap: '"Bebas Neue", "Impact", sans-serif'
  },

  effects: {
    glassmorphism: true,
    boxShadow: '0 8px 32px rgba(0,212,255,0.15)',
    borderGlow: '0 0 10px rgba(0,212,255,0.3)',
    panelBorder: '1px solid rgba(0,212,255,0.2)'
  }
};
