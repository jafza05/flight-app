import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Component that applies theme CSS variables to the document root
 * This runs on every theme change to update CSS custom properties
 */
export const ThemeApplier: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    // Apply color variables
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-surface-elevated', theme.colors.surfaceElevated);

    root.style.setProperty('--color-text-primary', theme.colors.text.primary);
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--color-text-accent', theme.colors.text.accent);
    root.style.setProperty('--color-text-warning', theme.colors.text.warning);
    root.style.setProperty('--color-text-danger', theme.colors.text.danger);

    root.style.setProperty('--color-gauge-altitude', theme.colors.gauges.altitude);
    root.style.setProperty('--color-gauge-speed', theme.colors.gauges.speed);
    root.style.setProperty('--color-gauge-heading', theme.colors.gauges.heading);
    root.style.setProperty('--color-gauge-track', theme.colors.gauges.track);

    root.style.setProperty('--color-map-aircraft', theme.colors.map.aircraftMarker);
    root.style.setProperty('--color-map-user', theme.colors.map.userMarker);
    root.style.setProperty('--color-map-rings', theme.colors.map.distanceRings);

    // Apply font variables
    root.style.setProperty('--font-display', theme.fonts.display);
    root.style.setProperty('--font-body', theme.fonts.body);
    root.style.setProperty('--font-split-flap', theme.fonts.splitFlap);

    // Apply effect variables
    root.style.setProperty('--box-shadow', theme.effects.boxShadow);
    root.style.setProperty('--border-glow', theme.effects.borderGlow);
    root.style.setProperty('--panel-border', theme.effects.panelBorder);
    if (theme.effects.textShadow) {
      root.style.setProperty('--text-shadow', theme.effects.textShadow);
    }
  }, [theme]);

  return null; // This component doesn't render anything
};
