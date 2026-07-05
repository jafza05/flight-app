/**
 * ArrivalsPage - Plane-spotting view of airborne flights inbound to an airport.
 * Highlights private jets, widebodies, and rare finds for boat-based spotting.
 * Optimized for a quick glance on a boat console iPad: sticky clock, live
 * countdowns, and a landscape grid layout alongside the phone list view.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ThemeApplier } from '../../components/ThemeApplier';
import { flightAPI } from '../../services/api';
import { ARRIVAL_AIRPORTS } from '../../types/arrivals';
import type { ArrivalFlight } from '../../types/arrivals';
import { AIRCRAFT_NAME_FALLBACK } from './aircraftNames';
import styles from './ArrivalsPage.module.css';

// Narrowbodies worth keeping even though they're not widebodies: long-haul
// capable (A321LR/XLR) or historically transatlantic (757). Everything else
// narrowbody/regional (737s, A319/320, E-jets, CRJs, turboprops) is filtered
// out by default -- private jets, widebodies, and rare finds always show
// regardless of this list.
const NOTABLE_NARROWBODY_CODES = new Set(['A321', 'A21N', 'B752', 'B753']);

interface EnrichedFlight extends ArrivalFlight {
  arrivalTimestamp: number | null;
}

function isNotable(flight: ArrivalFlight): boolean {
  return (
    flight.is_widebody ||
    flight.is_private_jet ||
    flight.is_rare ||
    (!!flight.aircraft_code && NOTABLE_NARROWBODY_CODES.has(flight.aircraft_code))
  );
}

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatEtaClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'Landing now';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Second-level precision only when it's imminent -- otherwise it's just
  // visual noise for a flight that's hours out.
  if (totalSeconds < 15 * 60) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatAltitude(ft: number): string {
  return `${Math.round(ft / 100) / 10}k ft`;
}

function formatQueuePosition(aheadCount: number): string {
  return aheadCount === 0 ? 'Next to land' : `${aheadCount} ahead`;
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

interface ArrivalCardProps {
  flight: EnrichedFlight;
  now: number;
  aheadCount: number | null;
  isRefreshing: boolean;
  refreshFailed: boolean;
  onRefresh: (flight: EnrichedFlight) => void;
}

function ArrivalCard({ flight, now, aheadCount, isRefreshing, refreshFailed, onRefresh }: ArrivalCardProps) {
  const remaining = flight.arrivalTimestamp != null ? flight.arrivalTimestamp - now : null;

  return (
    <div className={cardClassName(flight)}>
      <div className={styles.cardTop}>
        <div className={styles.idBlock}>
          <span className={styles.flightId}>
            {flight.flight_number || flight.callsign || flight.registration || 'Unknown'}
          </span>
          {flight.airline_name && <span className={styles.airline}>{flight.airline_name}</span>}
        </div>
        {flight.registration && (
          <button
            className={`${styles.refreshButton} ${isRefreshing ? styles.refreshSpinning : ''} ${refreshFailed ? styles.refreshFailed : ''}`}
            onClick={() => onRefresh(flight)}
            disabled={isRefreshing}
            aria-label="Refresh this flight"
            title="Refresh this flight"
          >
            ↻
          </button>
        )}
      </div>

      <div className={styles.aircraftName}>{aircraftDisplayName(flight)}</div>

      {flight.spotting_tags.length > 0 && (
        <div className={styles.tags}>
          {flight.spotting_tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.countdownBlock}>
        <span className={styles.countdown}>
          {remaining != null ? formatCountdown(remaining) : '—'}
        </span>
        {flight.arrivalTimestamp != null && (
          <span className={styles.etaClock}>{formatEtaClock(flight.arrivalTimestamp)}</span>
        )}
      </div>

      <div className={styles.cardDetails}>
        <span>{flight.origin_airport_iata || '???'} → {flight.destination_airport_iata}</span>
        <span>{formatAltitude(flight.altitude)}</span>
        <span>{flight.ground_speed}kt</span>
        {aheadCount != null && <span>{formatQueuePosition(aheadCount)}</span>}
      </div>
    </div>
  );
}

function ArrivalsPageContent() {
  const [airportCode, setAirportCode] = useState(ARRIVAL_AIRPORTS[0].code);
  const [arrivals, setArrivals] = useState<EnrichedFlight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notableOnly, setNotableOnly] = useState(true);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [failedRefreshIds, setFailedRefreshIds] = useState<Set<string>>(new Set());

  const now = useNow();

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await flightAPI.searchArrivals(airportCode);
      const fetchedAt = Date.now();
      const enriched: EnrichedFlight[] = result.arrivals.map((flight) => ({
        ...flight,
        arrivalTimestamp: flight.eta_minutes != null ? fetchedAt + flight.eta_minutes * 60000 : null,
      }));
      setArrivals(enriched);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load arrivals');
      setArrivals([]);
    } finally {
      setIsLoading(false);
    }
  }, [airportCode]);

  const handleRefreshFlight = useCallback(async (flight: EnrichedFlight) => {
    if (!flight.registration) return;

    setRefreshingIds((prev) => new Set(prev).add(flight.id));
    setFailedRefreshIds((prev) => {
      const next = new Set(prev);
      next.delete(flight.id);
      return next;
    });

    try {
      const fresh = await flightAPI.refreshFlight(airportCode, flight.registration);
      const fetchedAt = Date.now();
      const enrichedFresh: EnrichedFlight = {
        ...fresh,
        arrivalTimestamp: fresh.eta_minutes != null ? fetchedAt + fresh.eta_minutes * 60000 : null,
      };
      setArrivals((prev) => prev.map((f) => (f.id === flight.id ? enrichedFresh : f)));
    } catch (err) {
      console.error('Failed to refresh flight', flight.flight_number, err);
      setFailedRefreshIds((prev) => new Set(prev).add(flight.id));
      setTimeout(() => {
        setFailedRefreshIds((prev) => {
          const next = new Set(prev);
          next.delete(flight.id);
          return next;
        });
      }, 3000);
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(flight.id);
        return next;
      });
    }
  }, [airportCode]);

  // Landing order is based on ALL fetched flights, not just the notable
  // ones -- an ordinary 737 landing first is still ahead of your A380 in
  // the actual queue, regardless of the display filter.
  const aheadCountById = useMemo(() => {
    const withEta = arrivals
      .filter((f) => f.arrivalTimestamp != null)
      .sort((a, b) => a.arrivalTimestamp! - b.arrivalTimestamp!);
    const map = new Map<string, number>();
    withEta.forEach((f, index) => map.set(f.id, index));
    return map;
  }, [arrivals]);

  const visibleArrivals = useMemo(
    () => (notableOnly ? arrivals.filter(isNotable) : arrivals),
    [arrivals, notableOnly]
  );

  const hiddenCount = arrivals.length - visibleArrivals.length;

  return (
    <div className={styles.page}>
      <div className={styles.stickyHeader}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>✈️ Arrivals Spotter</h1>
          <div className={styles.clock}>{formatClock(now)}</div>
        </div>

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

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={notableOnly}
              onChange={(e) => setNotableOnly(e.target.checked)}
            />
            <span className={styles.toggleTrack}><span className={styles.toggleThumb} /></span>
            Notable only
          </label>

          <button className={styles.searchButton} onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search Arrivals'}
          </button>
        </div>

        {lastUpdate && !error && (
          <div className={styles.meta}>
            {visibleArrivals.length} shown
            {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''} · updated {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {visibleArrivals.map((flight) => (
          <ArrivalCard
            key={flight.id}
            flight={flight}
            now={now}
            aheadCount={aheadCountById.get(flight.id) ?? null}
            isRefreshing={refreshingIds.has(flight.id)}
            refreshFailed={failedRefreshIds.has(flight.id)}
            onRefresh={handleRefreshFlight}
          />
        ))}

        {!isLoading && lastUpdate && visibleArrivals.length === 0 && !error && (
          <div className={styles.empty}>
            {arrivals.length === 0
              ? `No airborne flights currently inbound to ${airportCode}. Try again in a bit.`
              : 'Nothing notable right now — toggle "Notable only" off to see everything.'}
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
