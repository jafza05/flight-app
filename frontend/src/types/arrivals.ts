/**
 * Types for the /arrivals plane-spotting page
 */

export type SpottingCategory = 'Rare/Special' | 'Widebody' | 'Private Jet' | 'Private/GA' | 'Mainline/Regional';

export interface ArrivalFlight {
  id: string;
  callsign?: string;
  flight_number?: string;
  registration?: string;
  aircraft_code?: string;
  airline_iata?: string;
  airline_icao?: string;
  airline_name?: string;
  model_faa?: string;
  model_code?: string;

  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  ground_speed: number;
  vertical_speed: number;

  origin_airport_iata?: string;
  destination_airport_iata?: string;
  on_ground: boolean;

  distance_to_airport_nm?: number;
  eta_minutes?: number;

  category: SpottingCategory;
  is_widebody: boolean;
  is_private_jet: boolean;
  is_rare: boolean;
  spotting_tags: string[];
}

export interface ArrivalsSearchRequest {
  mode: 'arrivals';
  destination_airport_iata: string;
  max_results?: number;
}

export interface ArrivalsSearchResponse {
  airport_iata: string;
  airport_name: string;
  arrivals: ArrivalFlight[];
  arrivals_count: number;
  timestamp: string;
}

export interface ArrivalAirportOption {
  code: string;
  name: string;
}

// Airports currently supported by the backend's arrivals search
export const ARRIVAL_AIRPORTS: ArrivalAirportOption[] = [
  { code: 'BOS', name: 'Boston Logan International' },
];
