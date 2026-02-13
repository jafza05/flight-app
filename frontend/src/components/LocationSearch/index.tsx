/**
 * LocationSearch Component
 * Allows users to either use their current location or search for an address
 * Integrates with Google Places Autocomplete API
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { getPlacePredictions, getPlaceDetails, isGoogleMapsLoaded } from '../../services/googleMaps';
import { trackAirportQuickSelect } from '../../utils/analytics';
import styles from './LocationSearch.module.css';

export interface SearchLocation {
  type: 'geolocation' | 'address';
  address: string;
  latitude: number;
  longitude: number;
}

// Popular airports for quick selection
const POPULAR_AIRPORTS = [
  { code: 'JFK', name: 'New York JFK', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', name: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'ORD', name: 'Chicago O\'Hare', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth', lat: 32.8998, lon: -97.0403 },
  { code: 'ATL', name: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  { code: 'DEN', name: 'Denver', lat: 39.8561, lon: -104.6737 },
  { code: 'SFO', name: 'San Francisco', lat: 37.6213, lon: -122.3790 },
  { code: 'LAS', name: 'Las Vegas', lat: 36.0840, lon: -115.1537 },
  { code: 'SEA', name: 'Seattle', lat: 47.4502, lon: -122.3088 },
  { code: 'MIA', name: 'Miami', lat: 25.7959, lon: -80.2870 },
  { code: 'BOS', name: 'Boston', lat: 42.3656, lon: -71.0096 },
  { code: 'LHR', name: 'London Heathrow', lat: 51.4700, lon: -0.4543 },
];

interface LocationSearchProps {
  onLocationSelect: (location: SearchLocation) => void;
  disabled?: boolean;
  initialMode?: 'geolocation' | 'address';
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  disabled = false,
  initialMode = 'geolocation',
}) => {
  const [mode, setMode] = useState<'geolocation' | 'address'>(initialMode);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SearchLocation | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingGeolocation, setIsLoadingGeolocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebounce(query, 400);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (mode === 'address' && debouncedQuery.length > 2 && isGoogleMapsLoaded()) {
      fetchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, mode]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoadingSuggestions(true);
    setError(null);

    try {
      const predictions = await getPlacePredictions(searchQuery);
      setSuggestions(predictions);
      setShowSuggestions(predictions.length > 0);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoadingSuggestions(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const details = await getPlaceDetails(prediction.place_id);

      const location: SearchLocation = {
        type: 'address',
        address: details.address,
        latitude: details.latitude,
        longitude: details.longitude,
      };

      setSelectedLocation(location);
      setQuery(details.address);
      onLocationSelect(location);
    } catch (err) {
      console.error('Error getting place details:', err);
      setError('Failed to get location details');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleUseMyLocation = async () => {
    setIsLoadingGeolocation(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const location: SearchLocation = {
        type: 'geolocation',
        address: 'Your Current Location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setSelectedLocation(location);
      onLocationSelect(location);
    } catch (err: any) {
      console.error('Geolocation error:', err);

      if (err.code === 1) {
        setError('Location permission denied. Please enable location access.');
      } else if (err.code === 2) {
        setError('Unable to determine your location. Try searching an address.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to get your location');
      }
    } finally {
      setIsLoadingGeolocation(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setQuery('');
    setSuggestions([]);
    setError(null);
    if (inputRef.current && mode === 'address') {
      inputRef.current.focus();
    }
  };

  const handleModeSwitch = () => {
    setMode(mode === 'geolocation' ? 'address' : 'geolocation');
    setSelectedLocation(null);
    setQuery('');
    setSuggestions([]);
    setError(null);
  };

  const handleAirportClick = (airport: typeof POPULAR_AIRPORTS[0]) => {
    const location: SearchLocation = {
      type: 'address',
      address: `${airport.name} Airport (${airport.code})`,
      latitude: airport.lat,
      longitude: airport.lon,
    };

    setSelectedLocation(location);
    setQuery(location.address);
    onLocationSelect(location);

    // Track airport quick selection
    trackAirportQuickSelect(airport.code, airport.name);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <label className={styles.label}>Location Search</label>
      </div>

      {mode === 'geolocation' ? (
        // Geolocation Mode
        <div className={styles.geolocationMode}>
          {!selectedLocation ? (
            <button
              className={styles.useLocationButton}
              onClick={handleUseMyLocation}
              disabled={disabled || isLoadingGeolocation}
            >
              {isLoadingGeolocation ? (
                <>
                  <span className={styles.spinner}></span>
                  Getting location...
                </>
              ) : (
                <>
                  <span className={styles.icon}>📍</span>
                  Use My Location
                </>
              )}
            </button>
          ) : (
            <div className={styles.selectedLocation}>
              <div className={styles.locationInfo}>
                <div className={styles.locationName}>
                  <span className={styles.checkmark}>✅</span>
                  {selectedLocation.address}
                </div>
                <div className={styles.coordinates}>
                  {selectedLocation.latitude.toFixed(4)}°N, {Math.abs(selectedLocation.longitude).toFixed(4)}°W
                </div>
              </div>
              <button className={styles.clearButton} onClick={handleClearSelection} disabled={disabled}>
                ✕
              </button>
            </div>
          )}

          <button className={styles.switchModeButton} onClick={handleModeSwitch} disabled={disabled}>
            Switch to Address Search
          </button>
        </div>
      ) : (
        // Address Search Mode
        <div className={styles.addressMode}>
          <div className={styles.inputContainer}>
            {!selectedLocation ? (
              <>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  className={styles.input}
                  placeholder="Enter an address..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  disabled={disabled}
                />
                {query && (
                  <button
                    className={styles.clearInputButton}
                    onClick={() => {
                      setQuery('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    disabled={disabled}
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <div className={styles.selectedLocation}>
                <div className={styles.locationInfo}>
                  <div className={styles.locationName}>
                    <span className={styles.checkmark}>✅</span>
                    {selectedLocation.address}
                  </div>
                  <div className={styles.coordinates}>
                    {selectedLocation.latitude.toFixed(4)}°N,{' '}
                    {Math.abs(selectedLocation.longitude).toFixed(4)}°W
                  </div>
                </div>
                <button className={styles.clearButton} onClick={handleClearSelection} disabled={disabled}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && !selectedLocation && (
            <div ref={suggestionsRef} className={styles.suggestionsDropdown}>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className={styles.suggestionIcon}>➤</div>
                  <div className={styles.suggestionContent}>
                    <div className={styles.suggestionMain}>{suggestion.structured_formatting.main_text}</div>
                    <div className={styles.suggestionSecondary}>
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoadingSuggestions && !selectedLocation && (
            <div className={styles.loadingMessage}>
              <span className={styles.spinner}></span>
              Loading suggestions...
            </div>
          )}

          <button className={styles.switchModeButton} onClick={handleModeSwitch} disabled={disabled}>
            Switch to My Location
          </button>

          {/* Popular Airports - Show when no location selected */}
          {!selectedLocation && (
            <div className={styles.popularAirports}>
              <div className={styles.popularAirportsLabel}>Popular Airports:</div>
              <div className={styles.airportGrid}>
                {POPULAR_AIRPORTS.map((airport) => (
                  <button
                    key={airport.code}
                    className={styles.airportButton}
                    onClick={() => handleAirportClick(airport)}
                    disabled={disabled}
                  >
                    <span className={styles.airportCode}>{airport.code}</span>
                    <span className={styles.airportName}>{airport.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
};
