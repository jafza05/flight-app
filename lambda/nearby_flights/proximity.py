"""
Flight proximity calculation and ranking algorithms.
"""

import math
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class Position:
    """User or aircraft position."""
    lat: float
    lon: float
    alt: float  # feet


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two points in miles.

    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates

    Returns:
        Distance in miles
    """
    R = 3959.0  # Earth radius in miles

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate bearing from point 1 to point 2 (0-360 degrees).

    Args:
        lat1, lon1: Origin point
        lat2, lon2: Destination point

    Returns:
        Bearing in degrees (0-360)
    """
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lon = math.radians(lon2 - lon1)

    x = math.sin(delta_lon) * math.cos(lat2_rad)
    y = (math.cos(lat1_rad) * math.sin(lat2_rad) -
         math.sin(lat1_rad) * math.cos(lat2_rad) *
         math.cos(delta_lon))

    bearing = math.atan2(x, y)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360

    return bearing


def is_flight_approaching(user_lat: float, user_lon: float,
                         flight_lat: float, flight_lon: float,
                         flight_heading: float) -> Tuple[bool, float]:
    """
    Determine if flight is approaching or departing from user.

    Args:
        user_lat, user_lon: User position
        flight_lat, flight_lon: Flight position
        flight_heading: Flight heading in degrees (0-360)

    Returns:
        (is_approaching, angle_difference)
    """
    # Calculate bearing from flight to user
    bearing_to_user = calculate_bearing(
        flight_lat, flight_lon,
        user_lat, user_lon
    )

    # Calculate angle difference between flight heading and bearing to user
    angle_diff = abs(flight_heading - bearing_to_user)

    # Normalize to 0-180 range
    if angle_diff > 180:
        angle_diff = 360 - angle_diff

    # If flight heading is within 90° cone pointing at user, it's approaching
    is_approaching = angle_diff < 90

    return is_approaching, angle_diff


def estimate_closest_approach(user_lat: float, user_lon: float,
                             flight_lat: float, flight_lon: float,
                             flight_heading: float,
                             ground_speed: float) -> Dict[str, float]:
    """
    Estimate the closest point of approach (CPA) and time to CPA.

    Uses simple vector projection assuming constant velocity.

    Args:
        user_lat, user_lon: User position
        flight_lat, flight_lon: Flight position
        flight_heading: Flight heading in degrees
        ground_speed: Ground speed in knots

    Returns:
        Dictionary with 'distance' (miles) and 'timeSeconds'
    """
    # Flight position relative to user (in miles)
    dx = haversine_distance(user_lat, user_lon, user_lat, flight_lon)
    dy = haversine_distance(user_lat, user_lon, flight_lat, user_lon)

    # Adjust signs based on relative position
    if flight_lon < user_lon:
        dx = -dx
    if flight_lat < user_lat:
        dy = -dy

    # Flight velocity vector (convert knots to miles/sec)
    speed_mph = ground_speed * 1.15078  # knots to mph
    speed_mps = speed_mph / 3600  # mph to miles per second

    vx = speed_mps * math.sin(math.radians(flight_heading))
    vy = speed_mps * math.cos(math.radians(flight_heading))

    # Time to CPA (vector math)
    v_squared = vx**2 + vy**2
    if v_squared < 0.0001:  # Nearly stationary
        return {
            'distance': haversine_distance(user_lat, user_lon, flight_lat, flight_lon),
            'timeSeconds': 0
        }

    t_cpa = -(dx * vx + dy * vy) / v_squared

    # Don't predict past (if negative, flight is moving away)
    if t_cpa < 0:
        t_cpa = 0

    # Position at CPA
    cpa_x = dx + vx * t_cpa
    cpa_y = dy + vy * t_cpa
    cpa_distance = math.sqrt(cpa_x**2 + cpa_y**2)

    return {
        'distance': round(cpa_distance, 2),
        'timeSeconds': int(t_cpa)
    }


def calculate_priority_score(user_pos: Position, flight_data: Dict) -> Dict:
    """
    Calculate priority score for a flight.
    Lower score = higher priority.

    Factors:
    1. Horizontal distance (primary)
    2. Altitude difference (secondary)
    3. Approaching vs departing (major modifier)
    4. Closest approach distance (tertiary)

    Args:
        user_pos: User position
        flight_data: Flight data dictionary

    Returns:
        Dictionary with proximity data and priority score
    """
    flight_lat = flight_data.get('latitude', 0)
    flight_lon = flight_data.get('longitude', 0)
    flight_alt = flight_data.get('altitude', 0)
    flight_heading = flight_data.get('heading', 0)
    ground_speed = flight_data.get('ground_speed', 0)

    # 1. Horizontal distance
    horizontal_dist = haversine_distance(
        user_pos.lat, user_pos.lon,
        flight_lat, flight_lon
    )

    # 2. Altitude difference (normalize to miles)
    altitude_diff = abs(flight_alt - user_pos.alt)
    altitude_factor = altitude_diff / 5280  # feet to miles

    # 3. Check if approaching
    is_approaching, angle_diff = is_flight_approaching(
        user_pos.lat, user_pos.lon,
        flight_lat, flight_lon,
        flight_heading
    )

    # 4. Estimate closest approach
    cpa = estimate_closest_approach(
        user_pos.lat, user_pos.lon,
        flight_lat, flight_lon,
        flight_heading,
        ground_speed
    )

    # Base score: horizontal distance + altitude factor
    base_score = horizontal_dist + (altitude_factor * 0.3)

    # Approaching modifier
    if is_approaching:
        # Boost priority for approaching flights
        # More direct approach = bigger boost
        approach_factor = 0.4 + (angle_diff / 180) * 0.4  # 0.4 to 0.8
        score = base_score * approach_factor
    else:
        # Penalty for departing flights
        departure_factor = 1.2 + (angle_diff / 180) * 0.4  # 1.2 to 1.6
        score = base_score * departure_factor

    # Further boost if CPA is very close
    if cpa['distance'] < 0.5:  # Within half mile CPA
        score *= 0.7

    # Calculate bearing from user to flight
    bearing = calculate_bearing(
        user_pos.lat, user_pos.lon,
        flight_lat, flight_lon
    )

    return {
        'distance': round(horizontal_dist, 2),
        'bearing': round(bearing, 1),
        'altitudeDifference': int(altitude_diff),
        'isApproaching': is_approaching,
        'priorityScore': round(score, 3),
        'estimatedClosestApproach': cpa
    }


def rank_flights(user_pos: Position, flights: List[Dict], max_flights: int = 5) -> List[Dict]:
    """
    Rank flights by proximity and return top N.

    Args:
        user_pos: User position
        flights: List of flight data dictionaries
        max_flights: Maximum number of flights to return

    Returns:
        List of flights with proximity data, sorted by priority
    """
    scored_flights = []

    for flight in flights:
        proximity = calculate_priority_score(user_pos, flight)
        flight_with_proximity = flight.copy()
        flight_with_proximity['proximity'] = proximity
        scored_flights.append(flight_with_proximity)

    # Sort by priority score (ascending - lower is better)
    scored_flights.sort(key=lambda x: x['proximity']['priorityScore'])

    # Return top N
    return scored_flights[:max_flights]


def calculate_optimal_radius(lat: float, lon: float, user_preference: float = None) -> float:
    """
    Calculate optimal search radius based on location.

    Args:
        lat, lon: Location coordinates
        user_preference: User-specified radius (if any)

    Returns:
        Optimal radius in miles
    """
    if user_preference:
        return user_preference  # User override always wins

    # Default radius
    # TODO: Could enhance with airport proximity detection
    # or flight density checks in future iterations
    return 10.0  # miles
