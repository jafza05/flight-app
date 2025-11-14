import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Light theme
        light: {
          bg: {
            primary: '#ffffff',
            secondary: '#f5f5f5',
            card: '#ffffff',
          },
          text: {
            primary: '#1a1a1a',
            secondary: '#666666',
          },
          border: '#e0e0e0',
          accent: {
            blue: '#0066cc',
            green: '#00aa44',
            red: '#cc0000',
          },
        },
        // Dark theme (aviation-inspired)
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#1a1a1a',
            card: '#1f1f1f',
          },
          text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
          },
          border: '#333333',
          accent: {
            blue: '#3399ff',
            green: '#00ff66',
            red: '#ff3333',
          },
        },
      },
      screens: {
        'phone-portrait': '320px',
        'phone-landscape': '480px',
        'tablet': '768px',
        'desktop': '1024px',
        'desktop-lg': '1440px',
        'tv': '1920px',
      },
    },
  },
  plugins: [],
}
export default config
