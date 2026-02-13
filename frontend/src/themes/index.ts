import type { Theme, ThemeId, ThemeFamily } from './types';
import { cockpitDark } from './cockpit/dark';
import { cockpitLight } from './cockpit/light';
import { minimalDark } from './minimal/dark';
import { minimalLight } from './minimal/light';
import { retroDark } from './retro/dark';
import { retroLight } from './retro/light';

export const themes: Record<ThemeId, Theme> = {
  'cockpit-dark': cockpitDark,
  'cockpit-light': cockpitLight,
  'minimal-dark': minimalDark,
  'minimal-light': minimalLight,
  'retro-dark': retroDark,
  'retro-light': retroLight
};

export const getTheme = (themeId: ThemeId): Theme => {
  return themes[themeId];
};

export const getThemeByFamily = (
  family: ThemeFamily,
  mode: 'light' | 'dark'
): Theme => {
  const themeId = `${family}-${mode}` as ThemeId;
  return themes[themeId];
};

export * from './types';
export {
  cockpitDark,
  cockpitLight,
  minimalDark,
  minimalLight,
  retroDark,
  retroLight
};
