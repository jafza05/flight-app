/**
 * API client for FlightTracker backend
 */

import type { AircraftWithDistance } from '../types/aircraft';
import type { AppSettings } from '../types/settings';
import type { ArrivalFlight, ArrivalsSearchRequest, ArrivalsSearchResponse } from '../types/arrivals';

const API_BASE_URL = 'https://44gwliogidpnklckwdyrhupydi0dbcub.lambda-url.us-east-1.on.aws';

export interface FlightSearchRequest {
  user_latitude: number;
  user_longitude: number;
  radius_mi: number;
  max_aircraft?: number;
  radius_mode?: 'manual' | 'auto';
  max_expand_attempts?: number;
  expand_increment_mi?: number;
}

export interface FlightSearchResponse {
  aircraft: AircraftWithDistance[];
  search_radius_mi: number;
  aircraft_count: number;
  user_location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export class FlightTrackerAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for nearby aircraft
   */
  async searchNearbyAircraft(
    latitude: number,
    longitude: number,
    settings: AppSettings
  ): Promise<FlightSearchResponse> {
    const request: FlightSearchRequest = {
      user_latitude: latitude,
      user_longitude: longitude,
      radius_mi: settings.search.radius_value_mi,
      max_aircraft: settings.display.max_aircraft,
      radius_mode: settings.search.radius_mode,
      max_expand_attempts: settings.search.max_auto_expand_attempts,
      expand_increment_mi: settings.search.auto_expand_increment_mi,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Use the friendly message if available (for 404), otherwise use the error
      const message = error.message || error.error || response.statusText;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Search for airborne flights currently inbound to an airport
   */
  async searchArrivals(destinationIata: string, maxResults = 300): Promise<ArrivalsSearchResponse> {
    const request: ArrivalsSearchRequest = {
      mode: 'arrivals',
      destination_airport_iata: destinationIata,
      max_results: maxResults,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const message = error.message || error.error || response.statusText;
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Refresh one flight's live telemetry (position/altitude/speed/ETA)
   * without re-running the full arrivals search.
   */
  async refreshFlight(destinationIata: string, registration: string): Promise<ArrivalFlight> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'refresh_flight',
        destination_airport_iata: destinationIata,
        registration,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const message = error.message || error.error || response.statusText;
      throw new Error(message);
    }

    const data = await response.json();
    return data.arrival;
  }

  /**
   * Get current user location using browser geolocation API
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
}

// Singleton instance
export const flightAPI = new FlightTrackerAPI();
