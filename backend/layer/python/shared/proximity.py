"""
Proximity calculation utilities
Haversine distance, bearing, and aircraft priority scoring
"""

import math
from typing import Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth
    Returns distance in miles
    """
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    # Earth radius in miles
    earth_radius_mi = 3959

    return earth_radius_mi * c


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the bearing from point 1 to point 2
    Returns bearing in degrees (0-359)
    """
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    dlon = lon2 - lon1

    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)

    bearing = math.atan2(x, y)

    # Convert to degrees and normalize to 0-359
    bearing_degrees = (math.degrees(bearing) + 360) % 360

    return bearing_degrees


def calculate_3d_distance(horizontal_distance_mi: float, altitude_ft: float) -> float:
    """
    Calculate 3D distance including altitude
    Returns distance in miles
    """
    # Convert altitude from feet to miles
    altitude_mi = altitude_ft / 5280

    # 3D distance using Pythagorean theorem
    distance_3d = math.sqrt(horizontal_distance_mi**2 + altitude_mi**2)

    return distance_3d


def is_aircraft_approaching(
    bearing_to_aircraft: float,
    aircraft_heading: int,
    threshold_degrees: int = 30
) -> bool:
    """
    Determine if aircraft is approaching the user's location

    Args:
        bearing_to_aircraft: Bearing from user to aircraft (degrees)
        aircraft_heading: Aircraft's heading (degrees)
        threshold_degrees: Acceptable angle difference for "approaching"

    Returns:
        True if aircraft is heading generally toward user
    """
    # Calculate the reverse bearing (where aircraft would need to point to head toward user)
    target_heading = (bearing_to_aircraft + 180) % 360

    # Calculate the difference between aircraft's actual heading and target heading
    heading_diff = abs(target_heading - aircraft_heading)

    # Normalize to 0-180 range
    if heading_diff > 180:
        heading_diff = 360 - heading_diff

    # Aircraft is approaching if within threshold
    return heading_diff <= threshold_degrees


def calculate_proximity_score(
    distance_3d_mi: float,
    is_approaching: bool,
    altitude_ft: int,
    max_distance_mi: float = 100.0
) -> float:
    """
    Calculate priority score for aircraft based on proximity and approach

    Higher score = higher priority (closer and/or approaching)

    Args:
        distance_3d_mi: 3D distance in miles
        is_approaching: Whether aircraft is approaching user
        altitude_ft: Aircraft altitude in feet
        max_distance_mi: Maximum distance for scoring

    Returns:
        Proximity score (higher = more important)
    """
    # Base score: inverse of distance (closer = higher score)
    if distance_3d_mi == 0:
        base_score = 1000.0  # Avoid division by zero
    else:
        base_score = 1.0 / distance_3d_mi

    # Approach bonus: 50% bonus if approaching
    approach_multiplier = 1.5 if is_approaching else 0.7

    # Altitude factor: lower aircraft are more relevant
    # Aircraft below 10,000 ft get a bonus (likely approaching/departing)
    altitude_multiplier = 1.0
    if altitude_ft < 10000:
        altitude_multiplier = 1.2
    elif altitude_ft > 30000:
        altitude_multiplier = 0.8

    # Calculate final score
    score = base_score * approach_multiplier * altitude_multiplier

    return score


def calculate_aircraft_proximity(
    user_lat: float,
    user_lon: float,
    aircraft_lat: float,
    aircraft_lon: float,
    aircraft_altitude_ft: int,
    aircraft_heading: int
) -> Tuple[float, float, float, bool, float]:
    """
    Calculate all proximity metrics for an aircraft

    Returns:
        Tuple of (horizontal_distance_mi, distance_3d_mi, bearing, is_approaching, proximity_score)
    """
    # Calculate horizontal distance
    horizontal_distance = haversine_distance(user_lat, user_lon, aircraft_lat, aircraft_lon)

    # Calculate 3D distance
    distance_3d = calculate_3d_distance(horizontal_distance, aircraft_altitude_ft)

    # Calculate bearing from user to aircraft
    bearing = calculate_bearing(user_lat, user_lon, aircraft_lat, aircraft_lon)

    # Determine if approaching
    approaching = is_aircraft_approaching(bearing, aircraft_heading)

    # Calculate proximity score
    score = calculate_proximity_score(distance_3d, approaching, aircraft_altitude_ft)

    return (horizontal_distance, distance_3d, bearing, approaching, score)


# Unit conversion utilities
def feet_to_meters(feet: float) -> int:
    """Convert feet to meters"""
    return int(feet * 0.3048)


def knots_to_mph(knots: int) -> int:
    """Convert knots to miles per hour"""
    return int(knots * 1.15078)


def knots_to_kmh(knots: int) -> int:
    """Convert knots to kilometers per hour"""
    return int(knots * 1.852)


def miles_to_kilometers(miles: float) -> float:
    """Convert miles to kilometers"""
    return miles * 1.60934


def miles_to_nautical_miles(miles: float) -> float:
    """Convert miles to nautical miles"""
    return miles * 0.868976
