import type { Theme } from '../types';

export const retroDark: Theme = {
  id: 'retro-dark',
  name: 'Retro Dark',
  family: 'retro',
  mode: 'dark',

  colors: {
    primary: '#FF8C42',           // Warm orange
    secondary: '#E5B181',         // Tan/beige
    background: '#1E1710',        // Dark brown
    surface: '#2A2115',           // Warm dark surface
    surfaceElevated: '#362A1E',

    text: {
      primary: '#F4E8D8',         // Warm off-white
      secondary: '#B5A68C',       // Muted tan
      accent: '#FF8C42',
      warning: '#FFBB33',
      danger: '#D9534F'
    },

    gauges: {
      altitude: '#FF8C42',
      speed: '#88C057',           // Muted green
      heading: '#E5B181',
      track: 'rgba(255,140,66,0.3)'
    },

    map: {
      style: 'outdoors-v11',      // Vintage map style
      aircraftMarker: '#FF8C42',
      userMarker: '#FFBB33',
      distanceRings: 'rgba(255,140,66,0.2)'
    }
  },

  fonts: {
    display: '"Special Elite", "Courier New", monospace',
    body: '"Lora", Georgia, serif',
    splitFlap: '"Anton", "Impact", sans-serif'
  },

  effects: {
    glassmorphism: false,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    borderGlow: '0 0 8px rgba(255,140,66,0.2)',
    panelBorder: '2px solid rgba(229,177,129,0.3)',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  }
};
