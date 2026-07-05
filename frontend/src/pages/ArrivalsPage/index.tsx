/**
 * ArrivalsPage - Plane-spotting view of airborne flights inbound to an airport.
 * Highlights private jets, widebodies, and rare finds for boat-based spotting.
 */

import React, { useCallback, useState } from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ThemeApplier } from '../../components/ThemeApplier';
import { flightAPI } from '../../services/api';
import { ARRIVAL_AIRPORTS } from '../../types/arrivals';
import type { ArrivalFlight } from '../../types/arrivals';
import { AIRCRAFT_NAME_FALLBACK } from './aircraftNames';
import styles from './ArrivalsPage.module.css';

function formatRelativeEta(minutes?: number): string {
  if (minutes == null) return '';
  if (minutes < 1) return 'now';
  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatClockEta(minutes?: number): string {
  if (minutes == null) return '—';
  const arrival = new Date(Date.now() + minutes * 60000);
  return arrival.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatAltitude(ft: number): string {
  return `${Math.round(ft / 100) / 10}k ft`;
}

function aircraftDisplayName(flight: ArrivalFlight): string {
  return (
    flight.model_faa ||
    (flight.aircraft_code && AIRCRAFT_NAME_FALLBACK[flight.aircraft_code]) ||
    flight.aircraft_code ||
    'Unknown aircraft'
  );
}

function cardClassName(flight: ArrivalFlight): string {
  if (flight.is_rare) return `${styles.card} ${styles.cardRare}`;
  if (flight.is_widebody) return `${styles.card} ${styles.cardWidebody}`;
  if (flight.is_private_jet) return `${styles.card} ${styles.cardPrivate}`;
  return styles.card;
}

function ArrivalCard({ flight }: { flight: ArrivalFlight }) {
  return (
    <div className={cardClassName(flight)}>
      <div className={styles.cardTop}>
        <div className={styles.idBlock}>
          <span className={styles.flightId}>
            {flight.flight_number || flight.callsign || flight.registration || 'Unknown'}
          </span>
          {flight.airline_name && <span className={styles.airline}>{flight.airline_name}</span>}
        </div>
        <div className={styles.etaBlock}>
          <span className={styles.eta}>{formatClockEta(flight.eta_minutes)}</span>
          <span className={styles.etaRelative}>{formatRelativeEta(flight.eta_minutes)}</span>
        </div>
      </div>

      <div className={styles.middleRow}>
        <span className={styles.aircraftName}>{aircraftDisplayName(flight)}</span>
        {flight.spotting_tags.length > 0 && (
          <span className={styles.tags}>
            {flight.spotting_tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </span>
        )}
      </div>

      <div className={styles.cardDetails}>
        <span>{flight.origin_airport_iata || '???'} → {flight.destination_airport_iata}</span>
        <span>{formatAltitude(flight.altitude)}</span>
        <span>{flight.ground_speed}kt</span>
        <span>{flight.distance_to_airport_nm ?? '?'}nm</span>
        {flight.registration && <span>{flight.registration}</span>}
      </div>
    </div>
  );
}

function ArrivalsPageContent() {
  const [airportCode, setAirportCode] = useState(ARRIVAL_AIRPORTS[0].code);
  const [arrivals, setArrivals] = useState<ArrivalFlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await flightAPI.searchArrivals(airportCode);
      setArrivals(result.arrivals);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load arrivals');
      setArrivals([]);
    } finally {
      setIsLoading(false);
    }
  }, [airportCode]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>✈️ Arrivals Spotter</h1>
        <p className={styles.subtitle}>
          Airborne flights heading in — private jets, widebodies, and rare finds highlighted
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.label}>
          Airport
          <select
            className={styles.select}
            value={airportCode}
            onChange={(e) => setAirportCode(e.target.value)}
            disabled={isLoading}
          >
            {ARRIVAL_AIRPORTS.map((airport) => (
              <option key={airport.code} value={airport.code}>
                {airport.code} — {airport.name}
              </option>
            ))}
          </select>
        </label>
        <button className={styles.searchButton} onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search Arrivals'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {lastUpdate && !error && (
        <div className={styles.meta}>
          {arrivals.length} inbound · updated {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <div className={styles.list}>
        {arrivals.map((flight) => (
          <ArrivalCard key={flight.id} flight={flight} />
        ))}

        {!isLoading && lastUpdate && arrivals.length === 0 && !error && (
          <div className={styles.empty}>
            No airborne flights currently inbound to {airportCode}. Try again in a bit.
          </div>
        )}
      </div>
    </div>
  );
}

export function ArrivalsPage() {
  return (
    <ThemeProvider>
      <ThemeApplier />
      <ArrivalsPageContent />
    </ThemeProvider>
  );
}
