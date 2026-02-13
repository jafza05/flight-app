"""
Data models for FlightTracker backend
Based on FlightRadarAPI v1.3.28 documentation and real API responses
"""

from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class Aircraft:
    """
    Aircraft data from FlightRadar24 API
    """
    # Flight identifiers
    id: str                          # Flight ID (hex)
    callsign: Optional[str] = None   # Radio callsign
    flight_number: Optional[str] = None  # Flight number (e.g., "UA2451")

    # Aircraft info
    registration: Optional[str] = None    # Aircraft registration (e.g., "N12345")
    aircraft_code: Optional[str] = None   # Aircraft type ICAO code (e.g., "B738")

    # Airline info
    airline_iata: Optional[str] = None    # Airline IATA code (e.g., "UA")
    airline_icao: Optional[str] = None    # Airline ICAO code (e.g., "UAL")

    # Position data
    latitude: float = 0.0
    longitude: float = 0.0
    altitude: int = 0                # Feet
    heading: int = 0                 # Degrees (0-359)
    ground_speed: int = 0            # Knots
    vertical_speed: int = 0          # Feet per minute (positive = climbing)

    # Route
    origin_airport_iata: Optional[str] = None        # Origin airport code (e.g., "SFO")
    destination_airport_iata: Optional[str] = None   # Destination airport code (e.g., "ORD")

    # Additional metadata
    squawk: Optional[str] = None     # Transponder squawk code
    on_ground: bool = False
    timestamp: Optional[int] = None  # Unix timestamp

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)


@dataclass
class AircraftWithDistance(Aircraft):
    """
    Aircraft with calculated distance and proximity info
    """
    # Distance calculations
    distance_mi: float = 0.0              # Horizontal distance in miles
    distance_3d_mi: float = 0.0           # 3D distance including altitude
    bearing_to_aircraft: float = 0.0      # Bearing from user to aircraft (degrees)
    is_approaching: bool = False          # Whether aircraft is heading toward user
    proximity_score: float = 0.0          # Calculated priority score

    # Extended metadata
    altitude_ft: int = 0              # Altitude in feet (copy for clarity)
    altitude_m: int = 0               # Altitude in meters
    speed_kts: int = 0                # Speed in knots (copy)
    speed_mph: int = 0                # Speed in miles per hour
    speed_kmh: int = 0                # Speed in kilometers per hour


@dataclass
class UserLocation:
    """User's location for proximity calculations"""
    latitude: float
    longitude: float
    radius_mi: float = 10.0  # Search radius in miles


@dataclass
class FlightSearchRequest:
    """Request to search for nearby flights"""
    user_latitude: float
    user_longitude: float
    radius_mi: Optional[float] = 10.0
    max_aircraft: Optional[int] = 5
    radius_mode: str = 'auto'  # 'auto' or 'manual'


@dataclass
class FlightSearchResponse:
    """Response from flight search"""
    aircraft: list[AircraftWithDistance]
    search_radius_mi: float
    aircraft_count: int
    user_location: Dict[str, float]
    timestamp: str  # ISO format

    def to_dict(self) -> Dict[str, Any]:
        return {
            'aircraft': [a.to_dict() for a in self.aircraft],
            'search_radius_mi': self.search_radius_mi,
            'aircraft_count': self.aircraft_count,
            'user_location': self.user_location,
            'timestamp': self.timestamp
        }


@dataclass
class AirportInfo:
    """Airport information"""
    iata: str              # 3-letter IATA code
    icao: Optional[str] = None    # 4-letter ICAO code
    name: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[int] = None  # Feet above sea level


# Type aliases for clarity
FlightId = str
AircraftRegistration = str
AirportCode = str
