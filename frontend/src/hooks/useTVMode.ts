import { useState, useEffect } from 'react';

export interface UseTVModeReturn {
  isTVMode: boolean;
  setTVMode: (enabled: boolean) => void;
  shouldSuggestTVMode: boolean;
  dismissTVModeSuggestion: () => void;
}

const TV_MODE_KEY = 'flight-tracker-tv-mode';
const TV_MODE_SUGGESTED_KEY = 'flight-tracker-tv-mode-suggested';
const TV_MODE_THRESHOLD = 1920; // Suggest TV mode for screens >= 1920px

export const useTVMode = (): UseTVModeReturn => {
  const [isTVMode, setIsTVModeState] = useState<boolean>(false);
  const [shouldSuggestTVMode, setShouldSuggestTVMode] = useState<boolean>(false);

  useEffect(() => {
    // Load saved TV mode preference
    const saved = localStorage.getItem(TV_MODE_KEY);
    if (saved !== null) {
      const enabled = saved === 'true';
      setIsTVModeState(enabled);

      // Apply TV mode class to document
      if (enabled) {
        document.documentElement.classList.add('tv-mode');
      }
    } else {
      // Check if we should auto-suggest TV mode
      const hasSuggested = localStorage.getItem(TV_MODE_SUGGESTED_KEY);
      if (!hasSuggested && window.innerWidth >= TV_MODE_THRESHOLD) {
        setShouldSuggestTVMode(true);
      }
    }
  }, []);

  const setTVMode = (enabled: boolean) => {
    setIsTVModeState(enabled);
    localStorage.setItem(TV_MODE_KEY, String(enabled));

    if (enabled) {
      document.documentElement.classList.add('tv-mode');
    } else {
      document.documentElement.classList.remove('tv-mode');
    }
  };

  const dismissTVModeSuggestion = () => {
    setShouldSuggestTVMode(false);
    localStorage.setItem(TV_MODE_SUGGESTED_KEY, 'true');
  };

  return {
    isTVMode,
    setTVMode,
    shouldSuggestTVMode,
    dismissTVModeSuggestion
  };
};
