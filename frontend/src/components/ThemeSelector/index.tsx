import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeFamily, ThemeMode } from '../../themes/types';
import { trackThemeChange } from '../../utils/analytics';
import styles from './ThemeSelector.module.css';

export const ThemeSelector: React.FC = () => {
  const { themeMode, themeFamily, setThemeMode, setThemeFamily } = useTheme();

  const themeFamilies: { id: ThemeFamily; name: string; icon: string }[] = [
    { id: 'cockpit', name: 'Cockpit', icon: '✈️' },
    { id: 'minimal', name: 'Minimal', icon: '◼' },
    { id: 'retro', name: 'Retro', icon: '⚙' }
  ];

  const themeModes: { id: ThemeMode; name: string; icon: string }[] = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'system', name: 'Auto', icon: '🖥️' }
  ];

  const handleThemeFamilyChange = (family: ThemeFamily) => {
    setThemeFamily(family);
    trackThemeChange(`${family}_${themeMode}`);
  };

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    trackThemeChange(`${themeFamily}_${mode}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.title}>Design Style</h3>
        <div className={styles.buttonGroup}>
          {themeFamilies.map((family) => (
            <button
              key={family.id}
              className={`${styles.button} ${
                themeFamily === family.id ? styles.active : ''
              }`}
              onClick={() => handleThemeFamilyChange(family.id)}
            >
              <span className={styles.icon}>{family.icon}</span>
              <span className={styles.name}>{family.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.title}>Mode</h3>
        <div className={styles.buttonGroup}>
          {themeModes.map((mode) => (
            <button
              key={mode.id}
              className={`${styles.button} ${
                themeMode === mode.id ? styles.active : ''
              }`}
              onClick={() => handleThemeModeChange(mode.id)}
            >
              <span className={styles.icon}>{mode.icon}</span>
              <span className={styles.name}>{mode.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
