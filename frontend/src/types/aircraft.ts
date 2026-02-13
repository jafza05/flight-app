/**
 * Aircraft and flight data types
 * Generated from backend Python models
 */

export interface Aircraft {
  // Flight identifiers
  id: string;                       // Flight ID (hex)
  callsign?: string;                // Radio callsign
  flight_number?: string;           // Flight number (e.g., "UA2451")

  // Aircraft info
  registration?: string;            // Aircraft registration (e.g., "N12345")
  aircraft_code?: string;           // Aircraft type ICAO code (e.g., "B738")

  // Airline info
  airline_iata?: string;            // Airline IATA code (e.g., "UA")
  airline_icao?: string;            // Airline ICAO code (e.g., "UAL")

  // Aircraft model info
  model_faa?: string;               // FAA model name (e.g., "Boeing 737-800")
  model_code?: string;              // Detailed model code

  // Position data
  latitude: number;
  longitude: number;
  altitude: number;                 // Feet
  heading: number;                  // Degrees (0-359)
  ground_speed: number;             // Knots
  vertical_speed: number;           // Feet per minute (positive = climbing)

  // Route
  origin_airport_iata?: string;     // Origin airport code (e.g., "SFO")
  origin_airport_name?: string;     // Origin airport full name
  origin_airport_city?: string;     // Origin airport city
  destination_airport_iata?: string; // Destination airport code (e.g., "ORD")
  destination_airport_name?: string; // Destination airport full name
  destination_airport_city?: string; // Destination airport city

  // Additional metadata
  squawk?: string;                  // Transponder squawk code
  on_ground: boolean;
  timestamp?: number;               // Unix timestamp
}

export interface AircraftWithDistance extends Aircraft {
  // Distance calculations
  distance_mi: number;              // Horizontal distance in miles
  distance_3d_mi: number;           // 3D distance including altitude
  bearing_to_aircraft: number;      // Bearing from user to aircraft (degrees)
  is_approaching: boolean;          // Whether aircraft is heading toward user
  proximity_score: number;          // Calculated priority score
  heading_difference: number;       // Degrees off from perfect approach angle

  // Extended metadata with unit conversions
  altitude_ft: number;              // Altitude in feet
  altitude_m: number;               // Altitude in meters
  speed_kts: number;                // Speed in knots
  speed_mph: number;                // Speed in miles per hour
  speed_kmh: number;                // Speed in kilometers per hour
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  radius_mi: number;                // Search radius in miles
}

export interface FlightSearchRequest {
  user_latitude: number;
  user_longitude: number;
  radius_mi?: number;
  max_aircraft?: number;
  radius_mode?: 'auto' | 'manual';
}

export interface FlightSearchResponse {
  aircraft: AircraftWithDistance[];
  search_radius_mi: number;
  aircraft_count: number;
  user_location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;                // ISO format
}

export interface AirportInfo {
  iata: string;                     // 3-letter IATA code
  icao?: string;                    // 4-letter ICAO code
  name?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;                // Feet above sea level
}

// Type aliases
export type FlightId = string;
export type AircraftRegistration = string;
export type AirportCode = string;

// Helper type for aircraft display
export interface AircraftDisplay extends AircraftWithDistance {
  // Derived/formatted fields for UI
  distance_text: string;            // "0.4 mi" or "0.6 km"
  direction_arrow: string;          // "↗" based on heading
  altitude_text: string;            // "8,200 ft" or "2,500 m"
  speed_text: string;               // "312 kts" or "361 mph"
  status: 'approaching' | 'departing' | 'passing';
}
