/**
 * Aircraft Context - Manages flight data and search state
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AircraftWithDistance } from '../types/aircraft';
import { flightAPI, type FlightSearchResponse } from '../services/api';
import { DEFAULT_SETTINGS, type AppSettings } from '../types/settings';

export interface SearchLocation {
  type: 'geolocation' | 'address';
  address: string;
  latitude: number;
  longitude: number;
}

interface AircraftContextValue {
  aircraft: AircraftWithDistance[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  searchRadius: number;
  userLocation: { latitude: number; longitude: number } | null;
  searchLocation: SearchLocation | null;

  // Actions
  searchNearby: (latitude: number, longitude: number, settings?: AppSettings) => Promise<void>;
  searchCurrentLocation: (settings?: AppSettings) => Promise<void>;
  searchAtAddress: (location: SearchLocation, settings?: AppSettings) => Promise<void>;
  updateSearchLocation: (location: SearchLocation) => void;
  clearError: () => void;
}

const AircraftContext = createContext<AircraftContextValue | undefined>(undefined);

interface AircraftProviderProps {
  children: React.ReactNode;
}

export const AircraftProvider: React.FC<AircraftProviderProps> = ({ children }) => {
  const [aircraft, setAircraft] = useState<AircraftWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [lastSuccessfulRadius, setLastSuccessfulRadius] = useState<number>(5);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);

  const searchNearby = useCallback(
    async (latitude: number, longitude: number, settings: AppSettings = DEFAULT_SETTINGS) => {
      setIsLoading(true);
      setError(null);

      // Use last successful radius for search
      const searchSettings = {
        ...settings,
        search: {
          ...settings.search,
          radius_value_mi: lastSuccessfulRadius
        }
      };

      console.log('🔍 Searching for aircraft:', {
        latitude,
        longitude,
        radius: searchSettings.search.radius_value_mi,
        maxAircraft: settings.display.max_aircraft
      });

      try {
        const response: FlightSearchResponse = await flightAPI.searchNearbyAircraft(
          latitude,
          longitude,
          searchSettings
        );

        console.log('✅ Received aircraft data:', {
          count: response.aircraft_count,
          aircraft: response.aircraft.map(a => ({
            callsign: a.callsign,
            flight_number: a.flight_number,
            airline_iata: a.airline_iata,
            airline_icao: a.airline_icao,
            distance: a.distance_mi.toFixed(1) + 'mi',
            route: `${a.origin_airport_iata || '???'} → ${a.destination_airport_iata || '???'}`
          }))
        });

        // Log first aircraft in detail for debugging
        if (response.aircraft.length > 0) {
          console.log('🔍 First aircraft full details:', response.aircraft[0]);
        }

        setAircraft(response.aircraft);
        setSearchRadius(response.search_radius_mi);
        setLastSuccessfulRadius(response.search_radius_mi);  // Remember successful radius
        setUserLocation(response.user_location);
        setLastUpdate(new Date(response.timestamp));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to search for aircraft';
        setError(errorMessage);
        setAircraft([]);  // Clear old flights on error
        console.error('❌ Aircraft search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [lastSuccessfulRadius]
  );

  const searchCurrentLocation = useCallback(
    async (settings: AppSettings = DEFAULT_SETTINGS) => {
      setIsLoading(true);
      setError(null);

      try {
        const location = await flightAPI.getCurrentLocation();

        // Update searchLocation with geolocation data
        setSearchLocation({
          type: 'geolocation',
          address: 'Your Current Location',
          latitude: location.latitude,
          longitude: location.longitude,
        });

        await searchNearby(location.latitude, location.longitude, settings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
        setError(errorMessage);
        console.error('Geolocation error:', err);
        setIsLoading(false);
      }
    },
    [searchNearby]
  );

  const searchAtAddress = useCallback(
    async (location: SearchLocation, settings: AppSettings = DEFAULT_SETTINGS) => {
      setSearchLocation(location);
      await searchNearby(location.latitude, location.longitude, settings);
    },
    [searchNearby]
  );

  const updateSearchLocation = useCallback((location: SearchLocation) => {
    setSearchLocation(location);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AircraftContextValue = {
    aircraft,
    isLoading,
    error,
    lastUpdate,
    searchRadius,
    userLocation,
    searchLocation,
    searchNearby,
    searchCurrentLocation,
    searchAtAddress,
    updateSearchLocation,
    clearError,
  };

  return <AircraftContext.Provider value={value}>{children}</AircraftContext.Provider>;
};

export const useAircraft = (): AircraftContextValue => {
  const context = useContext(AircraftContext);
  if (context === undefined) {
    throw new Error('useAircraft must be used within an AircraftProvider');
  }
  return context;
};
