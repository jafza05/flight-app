import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AircraftProvider, type SearchLocation } from './contexts/AircraftContext';
import { ThemeApplier } from './components/ThemeApplier';
import { TVDisplay } from './components/TVDisplay';
import { MobileDisplay } from './components/MobileDisplay';
import { useAircraft } from './contexts/AircraftContext';
import { useMobile } from './hooks/useMobile';
import { initAnalytics, trackFlightSearch, trackAircraftView, trackIdlePrompt } from './utils/analytics';
import './styles/global.css';

const REFRESH_INTERVAL_MS = 60000; // 1 minute
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function AppContent() {
  const {
    aircraft,
    isLoading,
    error,
    searchCurrentLocation,
    searchAtAddress,
    searchLocation,
    updateSearchLocation,
    clearError,
    lastUpdate,
    userLocation,
    searchRadius,
  } = useAircraft();

  const isMobile = useMobile();

  const [selectedAircraftIndex, setSelectedAircraftIndex] = useState(0);
  const [isIdle, setIsIdle] = useState(false);
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Track aircraft selection
  const handleSelectAircraft = useCallback((index: number) => {
    setSelectedAircraftIndex(index);

    if (aircraft[index]) {
      trackAircraftView({
        airline: aircraft[index].airline_iata,
        aircraft_type: aircraft[index].aircraft_code,
        distance_mi: aircraft[index].distance_mi,
        is_approaching: aircraft[index].is_approaching,
      });
    }
  }, [aircraft]);

  const handleSearch = useCallback(() => {
    if (!searchLocation) return;

    if (searchLocation.type === 'geolocation') {
      searchCurrentLocation();
    } else {
      searchAtAddress(searchLocation);
    }
  }, [searchLocation, searchCurrentLocation, searchAtAddress]);

  // Track user activity
  const resetIdleTimer = useCallback(() => {
    setLastActivityTime(Date.now());
    if (isIdle) {
      setIsIdle(false);
      setShowIdlePrompt(false);
    }
  }, [isIdle]);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Auto-load on page load (only once)
  useEffect(() => {
    console.log('🚀 Auto-loading current location on page load...');
    searchCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  // Track flight searches when aircraft data updates
  useEffect(() => {
    if (aircraft.length > 0 && searchLocation && userLocation) {
      trackFlightSearch({
        location: searchLocation.address,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: searchRadius,
        aircraftCount: aircraft.length,
      });
    }
  }, [aircraft.length]); // Track when aircraft count changes

  // Auto-refresh interval
  useEffect(() => {
    if (aircraft.length === 0 || isIdle) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing flight data...');
      handleSearch();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [aircraft.length, isIdle, handleSearch]);

  // Idle detection
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;

      if (timeSinceActivity > IDLE_TIMEOUT_MS && !showIdlePrompt) {
        console.log('⏸️ User has been idle, showing prompt...');
        setShowIdlePrompt(true);
        trackIdlePrompt('shown');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkIdle);
  }, [lastActivityTime, showIdlePrompt]);

  // Listen for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, [resetIdleTimer]);

  const handleStillWatching = () => {
    setShowIdlePrompt(false);
    resetIdleTimer();
    console.log('✅ User confirmed still watching, resuming auto-refresh');
    trackIdlePrompt('continue');
  };

  const handleNotWatching = () => {
    setShowIdlePrompt(false);
    setIsIdle(true);
    console.log('⏸️ User not watching, pausing auto-refresh');
    trackIdlePrompt('pause');
  };

  return (
    <>
      <ThemeApplier />
      {error && (
        <div
          onClick={clearError}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '1rem 2rem',
            background: '#ff4444',
            color: 'white',
            borderRadius: 'var(--border-radius)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          {error} (click to dismiss)
        </div>
      )}

      {/* Netflix-style idle prompt */}
      {showIdlePrompt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
          }}
        >
          <h2
            style={{
              fontSize: '2.5rem',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            Are you still watching?
          </h2>
          <p
            style={{
              fontSize: '1.25rem',
              color: 'var(--color-text-secondary)',
              maxWidth: '600px',
              textAlign: 'center',
            }}
          >
            You've been inactive for 30 minutes. Auto-refresh has been paused to save resources.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleStillWatching}
              style={{
                padding: '16px 48px',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                background: 'var(--color-primary)',
                color: 'var(--color-background)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
              }}
            >
              Yes, I'm watching
            </button>
            <button
              onClick={handleNotWatching}
              style={{
                padding: '16px 48px',
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                background: 'transparent',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
              }}
            >
              Pause updates
            </button>
          </div>
        </div>
      )}

      {isMobile ? (
        <MobileDisplay
          aircraft={aircraft}
          selectedIndex={selectedAircraftIndex}
          onSelectAircraft={handleSelectAircraft}
          userLocation={userLocation}
          lastUpdate={lastUpdate}
          searchRadius={searchRadius}
          searchLocation={searchLocation}
          onLocationSelect={updateSearchLocation}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      ) : (
        <TVDisplay
          aircraft={aircraft}
          selectedIndex={selectedAircraftIndex}
          onSelectAircraft={handleSelectAircraft}
          userLocation={userLocation}
          lastUpdate={lastUpdate}
          searchRadius={searchRadius}
          searchLocation={searchLocation}
          onLocationSelect={updateSearchLocation}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AircraftProvider>
        <AppContent />
      </AircraftProvider>
    </ThemeProvider>
  );
}

export default App;
