import { useState, useEffect } from 'react';

export type Orientation = 'landscape' | 'portrait';

export interface UseOrientationReturn {
  orientation: Orientation;
  aspectRatio: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export const useOrientation = (): UseOrientationReturn => {
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = width / height;

      setAspectRatio(ratio);
      setOrientation(ratio >= 1 ? 'landscape' : 'portrait');
    };

    // Initial check
    updateOrientation();

    // Listen for window resize
    window.addEventListener('resize', updateOrientation);

    // Listen for orientation change on mobile
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }

    return () => {
      window.removeEventListener('resize', updateOrientation);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
    };
  }, []);

  return {
    orientation,
    aspectRatio,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait'
  };
};
