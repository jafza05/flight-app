/**
 * HeroDisplay - Large single-aircraft display component
 * Cockpit-inspired design with split-flap, altitude tape, mini map, and speed gauge
 */

import React from 'react';
import type { AircraftWithDistance } from '../../types/aircraft';
import { SplitFlapDisplay } from '../SplitFlapDisplay';
import { MiniMap } from '../MiniMap';
import styles from './HeroDisplay.module.css';

interface HeroDisplayProps {
  aircraft: AircraftWithDistance;
  index: number;
  total: number;
  userLocation: { latitude: number; longitude: number };
  onPrevious: () => void;
  onNext: () => void;
}

export const HeroDisplay: React.FC<HeroDisplayProps> = ({
  aircraft,
  index,
  total,
  userLocation,
  onPrevious,
  onNext
}) => {
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US');
  };

  // Calculate altitude position in vertical tape (0 = top, 100 = bottom)
  const calculateAltitudePosition = (currentAlt: number): number => {
    const maxAlt = Math.ceil(currentAlt / 10000) * 10000;
    if (maxAlt === 0) return 50;
    const percentage = 100 - ((currentAlt / maxAlt) * 90); // Use 90% to keep margins
    return Math.max(5, Math.min(85, percentage));
  };

  // Calculate speed position in vertical gauge (0 = top, 100 = bottom)
  const calculateSpeedPosition = (currentSpeed: number): number => {
    const maxSpeed = 600;
    const percentage = 100 - ((currentSpeed / maxSpeed) * 90); // Use 90% to keep margins
    return Math.max(5, Math.min(85, percentage));
  };

  // Get airline logo URL from S3
  const getAirlineLogoUrl = (airlineIata: string): string => {
    const S3_BASE = 'https://duffel-airline-logo-lockups.s3.us-east-1.amazonaws.com';
    return `${S3_BASE}/${airlineIata.toUpperCase()}_lockup.svg`;
  };

  return (
    <div className={styles.heroContainer}>
      {/* Main Grid Container - 96 columns x 24 rows like stream-v2 */}
      <div className={styles.gridContainer}>
        {/* Origin IATA - grid-column: 2 / span 24, grid-row: 1 / span 10 */}
        <div className={styles.originIata}>
          <div className={styles.splitFlapWrapper}>
            <SplitFlapDisplay
              origin={aircraft.origin_airport_iata || '   '}
              destination={aircraft.destination_airport_iata || '   '}
              showFullNames={false}
              displayMode="origin-only"
            />
          </div>
          <div className={styles.airportLabel}>ORIGIN</div>
        </div>

        {/* Origin City Name - grid-column: 2 / span 24, grid-row: 12 / span 6 */}
        <div className={styles.originCity}>
          {aircraft.origin_airport_name || ''}
        </div>

        {/* Altitude Gauge - grid-column: 27 / span 10, grid-row: 1 / span 18 */}
        <div className={styles.altitudeValue}>
          <div className={styles.meterContainer}>
            <div className={styles.verticalTape}>
              {/* Altitude tick marks */}
              {[...Array(11)].map((_, i) => (
                <div key={i} className={styles.tickRow}>
                  <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                  {i % 5 === 0 && (
                    <span className={styles.tickLabel}>
                      {formatNumber(35000 - (i * 3500))}
                    </span>
                  )}
                  <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                </div>
              ))}

              {/* Current altitude indicator */}
              <div
                className={styles.currentValue}
                style={{
                  top: `${10 + (80 * (1 - Math.min(aircraft.altitude_ft / 35000, 1)))}%`
                }}
              >
                {formatNumber(aircraft.altitude_ft)}
              </div>
            </div>
            <div className={styles.unitLabel}>FT</div>
          </div>
        </div>

        {/* Map - grid-column: 40 / span 18, grid-row: 1 / span 18 */}
        <div className={styles.map}>
          <MiniMap
            userLocation={userLocation}
            aircraftLocation={{
              latitude: aircraft.latitude,
              longitude: aircraft.longitude
            }}
            aircraftHeading={aircraft.heading}
            isApproaching={aircraft.is_approaching}
          />
        </div>

        {/* Speed Gauge - grid-column: 61 / span 10, grid-row: 1 / span 18 */}
        <div className={styles.speedValue}>
          <div className={styles.meterContainer}>
            <div className={styles.verticalTape}>
              {/* Speed tick marks */}
              {[...Array(11)].map((_, i) => (
                <div key={i} className={styles.tickRow}>
                  <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                  {i % 5 === 0 && (
                    <span className={styles.tickLabel}>
                      {600 - (i * 60)}
                    </span>
                  )}
                  <div className={i % 5 === 0 ? styles.majorTick : styles.minorTick} />
                </div>
              ))}

              {/* Current speed indicator */}
              <div
                className={styles.currentValue}
                style={{
                  top: `${10 + (80 * (1 - Math.min(aircraft.speed_kts / 600, 1)))}%`
                }}
              >
                {aircraft.speed_kts}
              </div>
            </div>
            <div className={styles.unitLabel}>KTS</div>
          </div>
        </div>

        {/* Destination IATA - grid-column: 72 / span 24, grid-row: 1 / span 10 */}
        <div className={styles.destinationIata}>
          <div className={styles.splitFlapWrapper}>
            <SplitFlapDisplay
              origin={aircraft.origin_airport_iata || '   '}
              destination={aircraft.destination_airport_iata || '   '}
              showFullNames={false}
              displayMode="destination-only"
            />
          </div>
          <div className={styles.airportLabel}>DESTINATION</div>
        </div>

        {/* Destination City Name - grid-column: 72 / span 24, grid-row: 12 / span 6 */}
        <div className={styles.destinationCity}>
          {aircraft.destination_airport_name || ''}
        </div>

        {/* Bottom Row - Aircraft info */}
        {/* Aircraft Model - grid-column: 2 / span 24, grid-row: 20 / span 6 */}
        <div className={styles.aircraftModel}>
          <div className={styles.infoLabel}>AIRCRAFT</div>
          <div className={styles.infoValue}>{aircraft.model_faa || aircraft.aircraft_code || 'Unknown'}</div>
        </div>

        {/* Airline Logo - grid-column: 34 / span 32, grid-row: 20 / span 8 */}
        <div className={styles.airlineLogo}>
          {aircraft.airline_iata ? (
            <img
              src={getAirlineLogoUrl(aircraft.airline_iata)}
              alt={aircraft.airline_iata}
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

        {/* Heading - grid-column: 72 / span 12, grid-row: 20 / span 8 */}
        <div className={styles.heading}>
          <div className={styles.infoLabel}>HEADING</div>
          <div className={styles.infoValue}>{aircraft.heading}°</div>
        </div>

        {/* Flight - grid-column: 84 / span 12, grid-row: 20 / span 8 */}
        <div className={styles.flight}>
          <div className={styles.infoLabel}>FLIGHT</div>
          <div className={styles.infoValue}>
            {aircraft.flight_number || aircraft.callsign || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
