import type { Theme } from '../types';

export const retroLight: Theme = {
  id: 'retro-light',
  name: 'Retro Light',
  family: 'retro',
  mode: 'light',

  colors: {
    primary: '#D2691E',           // Chocolate
    secondary: '#8B4513',         // Saddle brown
    background: '#F5E6D3',        // Cream/manila
    surface: '#FFFFFF',
    surfaceElevated: '#FAF0E6',   // Linen

    text: {
      primary: '#2C1810',
      secondary: '#6B4423',
      accent: '#D2691E',
      warning: '#FF8C00',
      danger: '#B22222'
    },

    gauges: {
      altitude: '#D2691E',
      speed: '#556B2F',           // Dark olive green
      heading: '#CD853F',         // Peru
      track: 'rgba(210,105,30,0.3)'
    },

    map: {
      style: 'outdoors-v11',
      aircraftMarker: '#D2691E',
      userMarker: '#FF8C00',
      distanceRings: 'rgba(210,105,30,0.2)'
    }
  },

  fonts: {
    display: '"Special Elite", "Courier New", monospace',
    body: '"Lora", Georgia, serif',
    splitFlap: '"Anton", "Impact", sans-serif'
  },

  effects: {
    glassmorphism: false,
    boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
    borderGlow: 'none',
    panelBorder: '2px solid rgba(139,69,19,0.3)'
  }
};
