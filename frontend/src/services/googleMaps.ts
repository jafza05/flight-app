/**
 * Google Maps API Integration
 * Provides autocomplete and geocoding functionality using Google Places API
 */

// Type definitions for location data
export interface PlaceDetails {
  address: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
}

// Singleton instances
let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let isInitialized = false;

/**
 * Initialize the Google Maps API
 * Should be called once on app startup
 */
export async function initializeGoogleMaps(): Promise<void> {
  if (isInitialized) {
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key not found in environment variables');
  }

  try {
    // IMPORTANT: Load the Google Maps script manually with the API key
    // This is required for the Places API to work properly
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;

      // Wait for the script to load AND for the Google Maps API to be ready
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          // The script tag has loaded, but we need to wait for google.maps to be available
          const checkGoogleMaps = () => {
            if (window.google?.maps?.places) {
              resolve();
            } else {
              setTimeout(checkGoogleMaps, 100);
            }
          };
          checkGoogleMaps();
        };
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      });
    }

    // Verify that google.maps.places is available
    if (!window.google?.maps?.places) {
      throw new Error('Google Maps Places library not loaded');
    }

    // Now that the script is loaded, we can use the services directly
    autocompleteService = new google.maps.places.AutocompleteService();

    // PlacesService requires a DOM element (create a hidden div)
    const div = document.createElement('div');
    placesService = new google.maps.places.PlacesService(div);

    isInitialized = true;
    console.log('Google Maps API initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Maps API:', error);
    throw error;
  }
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return isInitialized;
}

/**
 * Get autocomplete predictions for a search query
 * @param input - The search query
 * @returns Array of autocomplete predictions
 */
export async function getPlacePredictions(
  input: string
): Promise<google.maps.places.AutocompletePrediction[]> {
  if (!autocompleteService) {
    throw new Error('Google Maps API not initialized. Call initializeGoogleMaps() first.');
  }

  if (!input || input.trim().length < 2) {
    return [];
  }

  try {
    const request: google.maps.places.AutocompletionRequest = {
      input: input.trim(),
      componentRestrictions: { country: 'us' }, // Bias to US
      types: ['geocode'], // All addresses
    };

    return new Promise((resolve, reject) => {
      autocompleteService!.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(predictions);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error getting place predictions:', error);
    throw error;
  }
}

/**
 * Get detailed information about a place using its place_id
 * @param placeId - The Google Place ID
 * @returns Place details including coordinates
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  if (!placesService) {
    throw new Error('Google Maps API not initialized. Call initializeGoogleMaps() first.');
  }

  try {
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
      fields: ['formatted_address', 'geometry', 'address_components', 'name'],
    };

    return new Promise((resolve, reject) => {
      placesService!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          if (!place.geometry || !place.geometry.location) {
            reject(new Error('No geometry data available for this place'));
            return;
          }

          // Extract address components
          let city: string | undefined;
          let state: string | undefined;
          let country: string | undefined;

          if (place.address_components) {
            for (const component of place.address_components) {
              if (component.types.includes('locality')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name;
              }
              if (component.types.includes('country')) {
                country = component.long_name;
              }
            }
          }

          const details: PlaceDetails = {
            address: place.name || place.formatted_address || 'Unknown location',
            formattedAddress: place.formatted_address || '',
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            city,
            state,
            country,
          };

          resolve(details);
        } else {
          reject(new Error(`Place details error: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to get an address
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Formatted address string
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  if (!window.google?.maps) {
    throw new Error('Google Maps API not initialized');
  }

  try {
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].formatted_address);
          } else {
            reject(new Error(`Reverse geocoding error: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}
