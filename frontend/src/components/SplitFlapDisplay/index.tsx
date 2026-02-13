import React, { useState, useEffect, useRef } from 'react';
import styles from './SplitFlapDisplay.module.css';

interface SplitFlapDisplayProps {
  origin: string;           // 3-letter IATA code
  destination: string;      // 3-letter IATA code
  originName?: string;      // Full airport name
  destinationName?: string; // Full airport name
  size?: 'small' | 'medium' | 'large';
  showFullNames?: boolean;
  displayMode?: 'both' | 'origin-only' | 'destination-only';
}

// Available characters for split-flap (matching airport codes)
const LETTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DROP_TIME = 100; // ms per flip

interface LetterState {
  current: string;
  target: string;
  isAnimating: boolean;
}

export const SplitFlapDisplay: React.FC<SplitFlapDisplayProps> = ({
  origin,
  destination,
  originName,
  destinationName,
  showFullNames = true,
  displayMode = 'both'
}) => {
  // State for each letter position (3 letters)
  const [letterStates, setLetterStates] = useState<LetterState[]>([
    { current: ' ', target: ' ', isAnimating: false },
    { current: ' ', target: ' ', isAnimating: false },
    { current: ' ', target: ' ', isAnimating: false }
  ]);

  const intervalsRef = useRef<(NodeJS.Timeout | null)[]>([null, null, null]);
  const fallingRefs = useRef<(HTMLSpanElement | null)[]>([null, null, null]);

  // Create a ref to hold the latest state to avoid stale closures in setInterval
  const letterStatesRef = useRef(letterStates);
  letterStatesRef.current = letterStates;

  // Get current code based on display mode
  const getCurrentCode = () => {
    if (displayMode === 'origin-only') return origin || '   ';
    if (displayMode === 'destination-only') return destination || '   ';
    return '   ';
  };

  // Update targets when code changes
  useEffect(() => {
    const code = getCurrentCode();
    if (!code) return;

    const targetLetters = code.padEnd(3, ' ').substring(0, 3).toUpperCase().split('');

    setLetterStates(prev => prev.map((state, index) => {
      const targetLetter = targetLetters[index] || ' ';
      // Only trigger animation if letter actually changed and target is in LETTERS
      if (state.current !== targetLetter && LETTERS.indexOf(targetLetter) >= 0) {
        return { ...state, target: targetLetter, isAnimating: true };
      }
      return { ...state, target: targetLetter };
    }));
  }, [origin, destination, displayMode]);

  // Tick function - performs one flip animation (matches 4mb-splitflap)
  const tick = (index: number) => {
    const state = letterStatesRef.current[index];
    const oldValue = state.current;
    const currentIndex = LETTERS.indexOf(state.current);
    const nextIndex = (currentIndex + 1) % LETTERS.length;
    const newValue = LETTERS[nextIndex];

    const fallingElement = fallingRefs.current[index];
    if (!fallingElement) return;

    const fallingTextElement = fallingElement.querySelector(`.${styles.text}`) as HTMLSpanElement;
    if (!fallingTextElement) return;

    // Phase 1: Show falling flap with old value, scale from 1 to 0 (top flap falls down)
    fallingTextElement.innerHTML = oldValue;
    fallingElement.style.display = 'block';
    fallingElement.style.top = 'auto';
    fallingElement.style.bottom = '0';
    fallingTextElement.style.top = '0';

    // Trigger animation after a brief delay (allows display: block to take effect)
    setTimeout(() => {
      fallingTextElement.style.transitionTimingFunction = 'ease-in';
      fallingTextElement.style.transform = 'scaleY(0)';
    }, 1);

    // Phase 2: After half DROP_TIME, flip the falling element and scale back up (bottom flap rises)
    setTimeout(() => {
      fallingTextElement.innerHTML = newValue;
      fallingElement.style.top = '0';
      fallingElement.style.bottom = 'auto';
      fallingTextElement.style.top = '-40px';

      fallingTextElement.style.transitionTimingFunction = 'ease-out';
      fallingTextElement.style.transform = 'scaleY(1)';
    }, DROP_TIME / 2);

    // Phase 3: After full DROP_TIME, hide falling element and update state
    setTimeout(() => {
      fallingElement.style.display = 'none';
      fallingElement.style.top = 'auto';
      fallingElement.style.bottom = '0';
      fallingTextElement.style.top = '0';

      // Update state
      setLetterStates(prev => {
        const newStates = [...prev];
        newStates[index] = { ...newStates[index], current: newValue };

        // Check if we reached target
        const targetIndex = LETTERS.indexOf(newStates[index].target);
        if (nextIndex === targetIndex) {
          newStates[index].isAnimating = false;
          if (intervalsRef.current[index]) {
            clearInterval(intervalsRef.current[index]!);
            intervalsRef.current[index] = null;
          }
        }

        return newStates;
      });
    }, DROP_TIME);
  };

  // Animate each letter to its target
  useEffect(() => {
    letterStates.forEach((state, index) => {
      if (state.isAnimating && state.current !== state.target) {
        // Clear existing interval
        if (intervalsRef.current[index]) {
          clearInterval(intervalsRef.current[index]!);
        }

        // Start cycling with stagger
        setTimeout(() => {
          intervalsRef.current[index] = setInterval(() => {
            tick(index);
          }, DROP_TIME * 1.1); // Slightly longer than DROP_TIME to allow animation to complete
        }, index * 100); // Stagger start by 100ms per letter
      }
    });

    return () => {
      // Cleanup intervals
      intervalsRef.current.forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [letterStates.map(s => `${s.target}-${s.isAnimating}`).join(',')]);

  const renderFlaps = () => {
    return letterStates.map((state, index) => (
      <div key={index} className={styles.letter}>
        <span className={`${styles.flap} ${styles.top}`}>
          <span className={styles.text}>{state.current}</span>
        </span>
        <span className={`${styles.flap} ${styles.bottom}`}>
          <span className={styles.text}>{state.current}</span>
        </span>
        <span className={styles.fold}>
          <span
            ref={(el) => { fallingRefs.current[index] = el; }}
            className={`${styles.flap} ${styles.falling} ${state.isAnimating ? styles.flapping : ''}`}
          >
            <span className={styles.text}>{state.current}</span>
          </span>
        </span>
      </div>
    ));
  };

  // Single airport mode (origin-only or destination-only)
  if (displayMode === 'origin-only') {
    return (
      <div className={styles.flapContainer}>
        {renderFlaps()}
      </div>
    );
  }

  if (displayMode === 'destination-only') {
    return (
      <div className={styles.flapContainer}>
        {renderFlaps()}
      </div>
    );
  }

  // Both mode (default)
  return (
    <div className={styles.container}>
      <div className={styles.airportGroup}>
        <div className={styles.label}>Origin</div>
        <div className={styles.flapContainer}>
          {renderFlaps()}
        </div>
        {showFullNames && originName && (
          <div className={styles.airportName}>{originName}</div>
        )}
      </div>

      <div className={styles.arrow}>→</div>

      <div className={styles.airportGroup}>
        <div className={styles.label}>Destination</div>
        <div className={styles.flapContainer}>
          {renderFlaps()}
        </div>
        {showFullNames && destinationName && (
          <div className={styles.airportName}>{destinationName}</div>
        )}
      </div>
    </div>
  );
};
