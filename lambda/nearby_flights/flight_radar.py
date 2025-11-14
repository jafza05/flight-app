"""
FlightRadarAPI wrapper for fetching flight data.
"""

from typing import Dict, List, Optional
from FlightRadar24 import FlightRadar24API


class FlightRadarClient:
    """Wrapper for FlightRadarAPI."""

    def __init__(self):
        """Initialize FlightRadar24 API client."""
        self.api = FlightRadar24API()

    def get_flights_in_bounds(self, lat: float, lon: float, radius: float) -> List[Dict]:
        """
        Get all flights within a bounding box around the given position.

        Args:
            lat: Center latitude
            lon: Center longitude
            radius: Search radius in miles

        Returns:
            List of flight dictionaries
        """
        # Convert radius to approximate lat/lon bounds
        # 1 degree latitude ≈ 69 miles
        # 1 degree longitude ≈ 69 miles * cos(latitude)
        import math
        lat_delta = radius / 69.0
        lon_delta = radius / (69.0 * math.cos(math.radians(lat)))

        # Define bounding box
        bounds = {
            'north': lat + lat_delta,
            'south': lat - lat_delta,
            'east': lon + lon_delta,
            'west': lon - lon_delta
        }

        # Fetch flights in bounds
        try:
            flights = self.api.get_flights(bounds=f"{bounds['north']},{bounds['south']},"
                                                  f"{bounds['west']},{bounds['east']}")

            if not flights:
                return []

            # Convert flight objects to dictionaries
            flight_list = []
            for flight in flights:
                flight_dict = self._parse_flight(flight)
                if flight_dict:
                    flight_list.append(flight_dict)

            return flight_list

        except Exception as e:
            print(f"Error fetching flights: {str(e)}")
            return []

    def get_flight_details(self, flight_id: str) -> Optional[Dict]:
        """
        Get detailed information about a specific flight.

        Args:
            flight_id: Flight ID

        Returns:
            Flight details dictionary or None
        """
        try:
            details = self.api.get_flight_details(flight_id)
            return details if details else None
        except Exception as e:
            print(f"Error fetching flight details: {str(e)}")
            return None

    def _parse_flight(self, flight) -> Optional[Dict]:
        """
        Parse flight object into a standardized dictionary.

        Args:
            flight: Flight object from FlightRadar24API

        Returns:
            Flight dictionary or None if invalid
        """
        try:
            # Extract basic info
            flight_id = getattr(flight, 'id', None)
            if not flight_id:
                return None

            # Position data
            latitude = getattr(flight, 'latitude', None)
            longitude = getattr(flight, 'longitude', None)
            altitude = getattr(flight, 'altitude', 0)
            heading = getattr(flight, 'heading', 0)

            # Skip flights without position data
            if latitude is None or longitude is None:
                return None

            # Velocity data
            ground_speed = getattr(flight, 'ground_speed', 0)
            vertical_speed = getattr(flight, 'vertical_speed', 0)

            # Aircraft info
            registration = getattr(flight, 'registration', '')
            aircraft_code = getattr(flight, 'aircraft_code', '')

            # Flight info
            callsign = getattr(flight, 'callsign', '').strip()
            origin = getattr(flight, 'origin_airport_iata', '')
            destination = getattr(flight, 'destination_airport_iata', '')

            # Airline info
            airline_iata = getattr(flight, 'airline_iata', '')
            airline_icao = getattr(flight, 'airline_icao', '')

            # Other data
            squawk = getattr(flight, 'squawk', '')
            on_ground = getattr(flight, 'on_ground', 0) == 1

            return {
                'id': flight_id,
                'callsign': callsign if callsign else 'N/A',
                'latitude': float(latitude),
                'longitude': float(longitude),
                'altitude': int(altitude),
                'heading': int(heading),
                'ground_speed': int(ground_speed),
                'vertical_speed': int(vertical_speed),
                'registration': registration,
                'aircraft_code': aircraft_code,
                'origin': origin if origin else 'N/A',
                'destination': destination if destination else 'N/A',
                'airline_iata': airline_iata,
                'airline_icao': airline_icao,
                'squawk': squawk,
                'on_ground': on_ground,
                'timestamp': None  # Will be set by handler
            }

        except Exception as e:
            print(f"Error parsing flight: {str(e)}")
            return None
