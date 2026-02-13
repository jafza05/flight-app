import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', checkMobile);

    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', checkMobile);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', checkMobile);
      }
    };
  }, []);

  return isMobile;
};
