/**
 * TVDisplay - Professional TV-optimized flight display
 * Designed for 16:9 screens (1920x1080)
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HeroDisplay } from '../HeroDisplay';
import { ThemeSelector } from '../ThemeSelector';
import { LocationSearch } from '../LocationSearch';
import type { AircraftWithDistance } from '../../types/aircraft';
import type { SearchLocation } from '../../contexts/AircraftContext';
import { getAirplaneIconHTML, PLANE_ICON_SIZE } from '../../utils/planeIcon';
import styles from './TVDisplay.module.css';

interface TVDisplayProps {
  aircraft: AircraftWithDistance[];
  selectedIndex: number;
  onSelectAircraft: (index: number) => void;
  userLocation: { latitude: number; longitude: number } | null;
  lastUpdate: Date | null;
  searchRadius: number;
  searchLocation: SearchLocation | null;
  onLocationSelect: (location: SearchLocation) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const getAirlineLogoUrl = (airlineIata: string): string => {
  const S3_BASE = 'https://duffel-airline-logo-lockups.s3.us-east-1.amazonaws.com';
  return `${S3_BASE}/${airlineIata.toUpperCase()}_lockup.svg`;
};

export const TVDisplay: React.FC<TVDisplayProps> = ({
  aircraft,
  selectedIndex,
  onSelectAircraft,
  userLocation,
  lastUpdate,
  searchRadius,
  searchLocation,
  onLocationSelect,
  onSearch,
  isLoading,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const overviewMapRef = useRef<HTMLDivElement>(null);
  const overviewMapInstanceRef = useRef<L.Map | null>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize overview map
  useEffect(() => {
    if (!overviewMapRef.current || !userLocation || aircraft.length === 0) return;

    // Clean up existing map
    if (overviewMapInstanceRef.current) {
      overviewMapInstanceRef.current.remove();
      overviewMapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(overviewMapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([userLocation.latitude, userLocation.longitude], 9);

    // Add dark tile layer (same as hero map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      html: '<div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(map);

    // Add aircraft markers
    aircraft.forEach((craft) => {
      const isSelected = craft.id === aircraft[selectedIndex]?.id;
      const color = isSelected ? '#ef4444' : '#10b981';
      const heading = craft.heading || 0;

      const aircraftIcon = L.divIcon({
        html: getAirplaneIconHTML(heading, color, PLANE_ICON_SIZE),
        className: '',
        iconSize: [PLANE_ICON_SIZE, PLANE_ICON_SIZE],
        iconAnchor: [PLANE_ICON_SIZE / 2, PLANE_ICON_SIZE / 2],
      });

      L.marker([craft.latitude, craft.longitude], { icon: aircraftIcon }).addTo(map);
    });

    overviewMapInstanceRef.current = map;

    return () => {
      if (overviewMapInstanceRef.current) {
        overviewMapInstanceRef.current.remove();
        overviewMapInstanceRef.current = null;
      }
    };
  }, [aircraft, userLocation, selectedIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      } else if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        setSettingsOpen(prev => !prev);
      } else if (e.key === 'ArrowLeft' && aircraft.length > 0) {
        onSelectAircraft(selectedIndex > 0 ? selectedIndex - 1 : aircraft.length - 1);
      } else if (e.key === 'ArrowRight' && aircraft.length > 0) {
        onSelectAircraft(selectedIndex < aircraft.length - 1 ? selectedIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [aircraft.length, selectedIndex, onSelectAircraft]);

  const selectedAircraft = aircraft.length > 0 ? aircraft[selectedIndex] : null;
  const surroundingAircraft = aircraft.length > 0 ? aircraft.filter((_, i) => i !== selectedIndex) : [];

  return (
    <div className={styles.tvContainer}>
      {/* Settings Button */}
      <button
        className={styles.settingsButton}
        onClick={() => setSettingsOpen(true)}
        title="Settings (Ctrl+S)"
      >
        <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Empty State or Hero Display */}
      {aircraft.length === 0 ? (
        <div className={styles.emptyState}>
          <h1 className={styles.emptyStateTitle}>FlightTracker TV</h1>
          <p className={styles.emptyStateMessage}>
            {isLoading ? 'Searching for nearby aircraft...' : 'Configure your location in settings to begin tracking flights'}
          </p>
        </div>
      ) : (
        <>
          {/* Hero Display */}
          <div className={styles.heroSection}>
            <HeroDisplay
              aircraft={selectedAircraft!}
              index={selectedIndex}
              total={aircraft.length}
              userLocation={userLocation || { latitude: 0, longitude: 0 }}
              onPrevious={() => onSelectAircraft(selectedIndex > 0 ? selectedIndex - 1 : aircraft.length - 1)}
              onNext={() => onSelectAircraft(selectedIndex < aircraft.length - 1 ? selectedIndex + 1 : 0)}
            />
          </div>

          {/* Surrounding Flights */}
          <div className={styles.surroundingSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 className={styles.surroundingTitle}>
                Other Nearby Flights ({surroundingAircraft.length})
              </h2>
            </div>
            <div className={styles.flightCards}>
              {/* Map Overview Card */}
              <div className={styles.mapCard}>
                <div
                  ref={overviewMapRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: '#000000',
                    borderRadius: 'var(--border-radius)',
                    overflow: 'hidden'
                  }}
                />
              </div>

              {surroundingAircraft.map((craft, index) => {
            const actualIndex = aircraft.findIndex(a => a.id === craft.id);
            return (
              <div
                key={craft.id}
                className={styles.flightCard}
                onClick={() => onSelectAircraft(actualIndex)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardAirline}>
                    {craft.airline_iata && (
                      <img
                        src={getAirlineLogoUrl(craft.airline_iata)}
                        alt={craft.airline_iata}
                        className={styles.cardAirlineLogo}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <span className={styles.cardFlightNumber}>
                      {craft.flight_number || craft.callsign || craft.registration}
                    </span>
                  </div>
                  <span className={styles.cardDistance}>
                    {craft.distance_mi.toFixed(1)} mi
                  </span>
                </div>

                <div className={styles.cardRoute}>
                  <span className={styles.cardAirport}>{craft.origin_airport_iata || '???'}</span>
                  <span className={styles.cardArrow}>→</span>
                  <span className={styles.cardAirport}>{craft.destination_airport_iata || '???'}</span>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.cardDetail}>
                    <span className={styles.cardDetailLabel}>Altitude</span>
                    <span className={styles.cardDetailValue}>{craft.altitude_ft.toLocaleString()} ft</span>
                  </div>
                  <div className={styles.cardDetail}>
                    <span className={styles.cardDetailLabel}>Speed</span>
                    <span className={styles.cardDetailValue}>{craft.speed_kts} kts</span>
                  </div>
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </>
      )}

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.statusDot}></span>
          <span>Live</span>
        </div>
        <div className={styles.statusItem}>
          {searchLocation && <span>{searchLocation.address}</span>}
        </div>
        <div className={styles.statusItem}>
          <span>{searchRadius.toFixed(1)} mi radius</span>
        </div>
        <div className={styles.statusItem}>
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Settings Panel */}
      <div className={`${styles.settingsPanel} ${settingsOpen ? styles.open : ''}`}>
        <div className={styles.settingsPanelHeader}>
          <h2 className={styles.settingsPanelTitle}>Settings</h2>
          <button
            className={styles.settingsCloseButton}
            onClick={() => setSettingsOpen(false)}
            title="Close (Esc)"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.settingsPanelContent}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Theme</h3>
            <ThemeSelector />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Location</h3>
            <LocationSearch
              onLocationSelect={onLocationSelect}
              disabled={isLoading}
            />
            <button
              onClick={onSearch}
              disabled={isLoading || !searchLocation}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '10px 20px',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-display)',
                background: searchLocation ? 'var(--color-primary)' : 'var(--color-border)',
                color: searchLocation ? 'var(--color-background)' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: (isLoading || !searchLocation) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !searchLocation) ? 0.6 : 1,
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
          {lastUpdate && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0.5rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--border-radius)', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <strong style={{ fontSize: '0.85rem' }}>Keyboard Shortcuts</strong>
            <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>Ctrl+S: Settings</li>
              <li>← →: Navigate</li>
              <li>Esc: Close</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
