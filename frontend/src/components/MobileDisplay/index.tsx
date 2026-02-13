/**
 * MobileDisplay - Mobile-optimized flight display
 * Vertical layout designed for phone screens (portrait mode)
 * Preserves all elements from the TV display: split-flap, altitude/speed tapes,
 * mini map, aircraft info, surrounding flights, and status bar.
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SplitFlapDisplay } from '../SplitFlapDisplay';
import { MiniMap } from '../MiniMap';
import { ThemeSelector } from '../ThemeSelector';
import { LocationSearch } from '../LocationSearch';
import type { AircraftWithDistance } from '../../types/aircraft';
import type { SearchLocation } from '../../contexts/AircraftContext';
import { getAirplaneIconHTML, PLANE_ICON_SIZE } from '../../utils/planeIcon';
import styles from './MobileDisplay.module.css';

interface MobileDisplayProps {
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

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const MobileDisplay: React.FC<MobileDisplayProps> = ({
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

  // Initialize overview map for surrounding flights section
  useEffect(() => {
    if (!overviewMapRef.current || !userLocation || aircraft.length === 0) return;

    if (overviewMapInstanceRef.current) {
      overviewMapInstanceRef.current.remove();
      overviewMapInstanceRef.current = null;
    }

    const map = L.map(overviewMapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([userLocation.latitude, userLocation.longitude], 9);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);

    const userIcon = L.divIcon({
      html: '<div style="width: 10px; height: 10px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      className: '',
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });

    L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(map);

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

  const selectedAircraft = aircraft.length > 0 ? aircraft[selectedIndex] : null;
  const surroundingAircraft = aircraft.length > 0
    ? aircraft.filter((_, i) => i !== selectedIndex)
    : [];

  const handlePrevious = () => {
    if (aircraft.length === 0) return;
    onSelectAircraft(selectedIndex > 0 ? selectedIndex - 1 : aircraft.length - 1);
  };

  const handleNext = () => {
    if (aircraft.length === 0) return;
    onSelectAircraft(selectedIndex < aircraft.length - 1 ? selectedIndex + 1 : 0);
  };

  return (
    <div className={styles.mobileContainer}>
      {/* Settings Button */}
      <button
        className={styles.settingsButton}
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
      >
        <svg className={styles.settingsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Empty State */}
      {aircraft.length === 0 ? (
        <div className={styles.emptyState}>
          <h1 className={styles.emptyStateTitle}>FlightTracker</h1>
          <p className={styles.emptyStateMessage}>
            {isLoading
              ? 'Searching for nearby aircraft...'
              : 'Configure your location in settings to begin tracking flights'}
          </p>
        </div>
      ) : selectedAircraft ? (
        <>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            {/* Route Row: Origin → Destination */}
            <div className={styles.routeRow}>
              <div className={styles.airportBlock}>
                <div className={styles.airportLabel}>ORIGIN</div>
                <div className={styles.splitFlapMobile}>
                  <SplitFlapDisplay
                    origin={selectedAircraft.origin_airport_iata || '   '}
                    destination={selectedAircraft.destination_airport_iata || '   '}
                    showFullNames={false}
                    displayMode="origin-only"
                  />
                </div>
                <div className={styles.airportCity}>
                  {selectedAircraft.origin_airport_name || ''}
                </div>
              </div>

              <span className={styles.routeArrow}>→</span>

              <div className={styles.airportBlock}>
                <div className={styles.airportLabel}>DESTINATION</div>
                <div className={styles.splitFlapMobile}>
                  <SplitFlapDisplay
                    origin={selectedAircraft.origin_airport_iata || '   '}
                    destination={selectedAircraft.destination_airport_iata || '   '}
                    showFullNames={false}
                    displayMode="destination-only"
                  />
                </div>
                <div className={styles.airportCity}>
                  {selectedAircraft.destination_airport_name || ''}
                </div>
              </div>
            </div>

            {/* Instruments Row: Altitude Tape | Map | Speed Tape */}
            <div className={styles.instrumentsRow}>
              {/* Altitude Gauge */}
              <div className={styles.gaugeColumn}>
                <div className={styles.meterContainer}>
                  <div className={styles.verticalTape}>
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className={styles.tickRow}>
                        <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                        {i % 5 === 0 && (
                          <span className={styles.tickLabel}>
                            {formatNumber(35000 - i * 3500)}
                          </span>
                        )}
                        <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                      </div>
                    ))}
                    <div
                      className={styles.currentValue}
                      style={{
                        top: `${10 + 80 * (1 - Math.min(selectedAircraft.altitude_ft / 35000, 1))}%`,
                      }}
                    >
                      {formatNumber(selectedAircraft.altitude_ft)}
                    </div>
                  </div>
                  <div className={styles.unitLabel}>FT</div>
                </div>
              </div>

              {/* Mini Map */}
              <div className={styles.mapColumn}>
                <MiniMap
                  userLocation={userLocation || { latitude: 0, longitude: 0 }}
                  aircraftLocation={{
                    latitude: selectedAircraft.latitude,
                    longitude: selectedAircraft.longitude,
                  }}
                  aircraftHeading={selectedAircraft.heading}
                  isApproaching={selectedAircraft.is_approaching}
                />
              </div>

              {/* Speed Gauge */}
              <div className={`${styles.gaugeColumn} ${styles.speedGauge}`}>
                <div className={styles.meterContainer}>
                  <div className={styles.verticalTape}>
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className={styles.tickRow}>
                        <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                        {i % 5 === 0 && (
                          <span className={styles.tickLabel}>
                            {600 - i * 60}
                          </span>
                        )}
                        <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                      </div>
                    ))}
                    <div
                      className={styles.currentValue}
                      style={{
                        top: `${10 + 80 * (1 - Math.min(selectedAircraft.speed_kts / 600, 1))}%`,
                      }}
                    >
                      {selectedAircraft.speed_kts}
                    </div>
                  </div>
                  <div className={styles.unitLabel}>KTS</div>
                </div>
              </div>
            </div>

            {/* Aircraft Info Row */}
            <div className={styles.infoRow}>
              <div className={styles.infoBlock}>
                <div className={styles.infoLabel}>AIRCRAFT</div>
                <div className={styles.infoValue}>
                  {selectedAircraft.model_faa || selectedAircraft.aircraft_code || 'Unknown'}
                </div>
              </div>

              <div className={styles.airlineLogoBlock}>
                {selectedAircraft.airline_iata ? (
                  <img
                    src={getAirlineLogoUrl(selectedAircraft.airline_iata)}
                    alt={selectedAircraft.airline_iata}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.endsWith('.svg')) {
                        target.src = target.src.replace('_lockup.svg', '_lockup.png');
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                ) : null}
              </div>

              <div className={styles.infoBlock}>
                <div className={styles.infoLabel}>HEADING</div>
                <div className={styles.infoValue}>{selectedAircraft.heading}°</div>
              </div>

              <div className={styles.infoBlock}>
                <div className={styles.infoLabel}>FLIGHT</div>
                <div className={styles.infoValue}>
                  {selectedAircraft.flight_number || selectedAircraft.callsign || 'N/A'}
                </div>
              </div>
            </div>

            {/* Navigation Row */}
            <div className={styles.navRow}>
              <button className={styles.navButton} onClick={handlePrevious} aria-label="Previous aircraft">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className={styles.navCounter}>
                {selectedIndex + 1} / {aircraft.length}
              </span>
              <button className={styles.navButton} onClick={handleNext} aria-label="Next aircraft">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Surrounding Flights */}
          {surroundingAircraft.length > 0 && (
            <div className={styles.surroundingSection}>
              <h2 className={styles.surroundingTitle}>
                Other Nearby Flights ({surroundingAircraft.length})
              </h2>
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
                      overflow: 'hidden',
                    }}
                  />
                </div>

                {surroundingAircraft.map((craft) => {
                  const actualIndex = aircraft.findIndex((a) => a.id === craft.id);
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
                        <span className={styles.cardAirport}>
                          {craft.origin_airport_iata || '???'}
                        </span>
                        <span className={styles.cardArrow}>→</span>
                        <span className={styles.cardAirport}>
                          {craft.destination_airport_iata || '???'}
                        </span>
                      </div>

                      <div className={styles.cardDetails}>
                        <div className={styles.cardDetail}>
                          <span className={styles.cardDetailLabel}>Altitude</span>
                          <span className={styles.cardDetailValue}>
                            {craft.altitude_ft.toLocaleString()} ft
                          </span>
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
          )}
        </>
      ) : null}

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
          <span>{searchRadius.toFixed(1)} mi</span>
        </div>
        <div className={styles.statusItem}>
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Settings Overlay */}
      <div
        className={`${styles.settingsOverlay} ${settingsOpen ? styles.visible : ''}`}
        onClick={() => setSettingsOpen(false)}
      />

      {/* Settings Panel */}
      <div className={`${styles.settingsPanel} ${settingsOpen ? styles.open : ''}`}>
        <div className={styles.settingsPanelHeader}>
          <h2 className={styles.settingsPanelTitle}>Settings</h2>
          <button
            className={styles.settingsCloseButton}
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={styles.settingsPanelContent}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
              }}
            >
              Theme
            </h3>
            <ThemeSelector />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontSize: '0.9rem',
                marginBottom: '0.75rem',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: '600',
              }}
            >
              Location
            </h3>
            <LocationSearch onLocationSelect={onLocationSelect} disabled={isLoading} />
            <button
              onClick={onSearch}
              disabled={isLoading || !searchLocation}
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '12px 20px',
                fontSize: '0.95rem',
                fontFamily: 'var(--font-display)',
                background: searchLocation ? 'var(--color-primary)' : 'var(--color-border)',
                color: searchLocation ? 'var(--color-background)' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: 'var(--border-radius)',
                cursor: isLoading || !searchLocation ? 'not-allowed' : 'pointer',
                opacity: isLoading || !searchLocation ? 0.6 : 1,
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
          {lastUpdate && (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
                padding: '0.5rem 0',
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
