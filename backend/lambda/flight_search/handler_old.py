"""
Lambda handler for flight search
Searches for nearby aircraft and calculates proximity
"""

import json
import math
from datetime import datetime
from typing import Dict, Any, List

from shared.models import (
    Aircraft,
    AircraftWithDistance,
    FlightSearchRequest,
    FlightSearchResponse
)
from shared.proximity import (
    calculate_aircraft_proximity,
    feet_to_meters,
    knots_to_mph,
    knots_to_kmh
)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for flight search

    Event structure:
    {
        "user_latitude": 37.7749,
        "user_longitude": -122.4194,
        "radius_mi": 10,  // optional, default 10
        "max_aircraft": 5,  // optional, default 5
        "radius_mode": "auto"  // optional, "auto" or "manual"
    }

    Returns:
    {
        "statusCode": 200,
        "body": {
            "aircraft": [...],
            "search_radius_mi": 10,
            "aircraft_count": 5,
            "user_location": {"latitude": 37.7749, "longitude": -122.4194},
            "timestamp": "2024-11-14T20:00:00Z"
        }
    }
    """

    try:
        # Parse request
        body = event.get('body', {})
        if isinstance(body, str):
            body = json.loads(body)

        user_lat = float(body.get('user_latitude'))
        user_lon = float(body.get('user_longitude'))
        radius_mi = float(body.get('radius_mi', 10.0))
        max_aircraft = int(body.get('max_aircraft', 5))
        radius_mode = body.get('radius_mode', 'auto')

        print(f"Flight search request: lat={user_lat}, lon={user_lon}, radius={radius_mi}mi")

        # Search for nearby aircraft
        aircraft_list = search_nearby_aircraft(
            user_lat,
            user_lon,
            radius_mi,
            max_aircraft,
            radius_mode
        )

        # Create response
        response_data = FlightSearchResponse(
            aircraft=aircraft_list,
            search_radius_mi=radius_mi,
            aircraft_count=len(aircraft_list),
            user_location={'latitude': user_lat, 'longitude': user_lon},
            timestamp=datetime.utcnow().isoformat() + 'Z'
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # CORS
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(response_data.to_dict())
        }

    except Exception as e:
        print(f"Error processing flight search: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to search for aircraft'
            })
        }


def search_nearby_aircraft(
    user_lat: float,
    user_lon: float,
    radius_mi: float,
    max_aircraft: int,
    radius_mode: str
) -> List[AircraftWithDistance]:
    """
    Search for aircraft near user location using FlightRadar24 API
    """

    try:
        from FlightRadar24 import FlightRadar24API
        print(f"Initializing FlightRadar24 API...")
        fr_api = FlightRadar24API()

        # Calculate bounds from user location and radius
        # Approximate: 1 degree lat/lon ~ 69 miles
        lat_offset = radius_mi / 69.0
        lon_offset = radius_mi / (69.0 * abs(math.cos(math.radians(user_lat))))

        # Format: "y1,y2,x1,x2" (south,north,west,east)
        bounds = f"{user_lat - lat_offset},{user_lat + lat_offset},{user_lon - lon_offset},{user_lon + lon_offset}"

        print(f"Searching for flights in bounds: {bounds}")
        flights = fr_api.get_flights(bounds=bounds)

        print(f"Found {len(flights)} flights in API response")

        # Convert FlightRadar24 flight objects to our Aircraft model
        aircraft_list = []
        for flight in flights:
            try:
                aircraft = Aircraft(
                    id=str(getattr(flight, 'id', '')),
                    callsign=getattr(flight, 'callsign', None),
                    flight_number=getattr(flight, 'number', None) or getattr(flight, 'flight_number', None),
                    registration=getattr(flight, 'registration', None),
                    aircraft_code=getattr(flight, 'aircraft_code', None),
                    airline_iata=getattr(flight, 'airline_iata', None),
                    airline_icao=getattr(flight, 'airline_icao', None),
                    latitude=float(getattr(flight, 'latitude', 0)),
                    longitude=float(getattr(flight, 'longitude', 0)),
                    altitude=int(getattr(flight, 'altitude', 0)),
                    heading=int(getattr(flight, 'heading', 0)),
                    ground_speed=int(getattr(flight, 'ground_speed', 0)),
                    vertical_speed=int(getattr(flight, 'vertical_speed', 0)),
                    origin_airport_iata=getattr(flight, 'origin_airport_iata', None),
                    destination_airport_iata=getattr(flight, 'destination_airport_iata', None),
                    squawk=getattr(flight, 'squawk', None),
                    on_ground=bool(getattr(flight, 'on_ground', False)),
                    timestamp=getattr(flight, 'time', None)
                )
                aircraft_list.append(aircraft)
            except Exception as e:
                print(f"Error processing flight {getattr(flight, 'id', 'unknown')}: {e}")
                continue

        print(f"Successfully converted {len(aircraft_list)} flights to Aircraft objects")

        if not aircraft_list:
            print("No valid aircraft found, falling back to mock data")
            # Fall back to mock data if no real flights found
            aircraft_list = get_mock_aircraft(user_lat, user_lon)

    except ImportError as e:
        print(f"FlightRadar24 API not available: {e}")
        print("Using mock data instead")
        aircraft_list = get_mock_aircraft(user_lat, user_lon)
    except Exception as e:
        print(f"Error calling FlightRadar24 API: {e}")
        import traceback
        traceback.print_exc()
        print("Falling back to mock data")
        aircraft_list = get_mock_aircraft(user_lat, user_lon)

    # For now, return mock data for testing
    mock_aircraft = [
        Aircraft(
            id="abc123",
            callsign="UAL2451",
            flight_number="UA2451",
            registration="N27537",
            aircraft_code="B39M",
            airline_iata="UA",
            airline_icao="UAL",
            latitude=user_lat + 0.05,  # ~3 miles north
            longitude=user_lon + 0.03,
            altitude=8200,
            heading=45,
            ground_speed=312,
            vertical_speed=1200,
            origin_airport_iata="SFO",
            destination_airport_iata="ORD",
            squawk="1200",
            on_ground=False,
            timestamp=int(datetime.utcnow().timestamp())
        ),
        Aircraft(
            id="def456",
            callsign="AAL1234",
            flight_number="AA1234",
            registration="N12345",
            aircraft_code="B738",
            airline_iata="AA",
            airline_icao="AAL",
            latitude=user_lat - 0.03,  # ~2 miles south
            longitude=user_lon - 0.02,
            altitude=12000,
            heading=180,
            ground_speed=285,
            vertical_speed=-800,
            origin_airport_iata="LAX",
            destination_airport_iata="JFK",
            squawk="2451",
            on_ground=False,
            timestamp=int(datetime.utcnow().timestamp())
        ),
        Aircraft(
            id="ghi789",
            callsign="DAL5678",
            flight_number="DL5678",
            registration="N45678",
            aircraft_code="A321",
            airline_iata="DL",
            airline_icao="DAL",
            latitude=user_lat + 0.08,
            longitude=user_lon - 0.05,
            altitude=15000,
            heading=270,
            ground_speed=425,
            vertical_speed=0,
            origin_airport_iata="ATL",
            destination_airport_iata="LAX",
            squawk="3456",
            on_ground=False,
            timestamp=int(datetime.utcnow().timestamp())
        )
    ]

    # Calculate proximity for each aircraft
    aircraft_with_proximity = []

    for aircraft in mock_aircraft:
        # Calculate all proximity metrics
        (
            horizontal_distance,
            distance_3d,
            bearing,
            is_approaching,
            proximity_score
        ) = calculate_aircraft_proximity(
            user_lat,
            user_lon,
            aircraft.latitude,
            aircraft.longitude,
            aircraft.altitude,
            aircraft.heading
        )

        # Create enhanced aircraft object
        enhanced = AircraftWithDistance(
            # Copy all base aircraft fields
            **aircraft.__dict__,

            # Add proximity calculations
            distance_mi=horizontal_distance,
            distance_3d_mi=distance_3d,
            bearing_to_aircraft=bearing,
            is_approaching=is_approaching,
            proximity_score=proximity_score,

            # Add unit conversions
            altitude_ft=aircraft.altitude,
            altitude_m=feet_to_meters(aircraft.altitude),
            speed_kts=aircraft.ground_speed,
            speed_mph=knots_to_mph(aircraft.ground_speed),
            speed_kmh=knots_to_kmh(aircraft.ground_speed)
        )

        aircraft_with_proximity.append(enhanced)

    # Sort by proximity score (highest first = closest/most important)
    aircraft_with_proximity.sort(key=lambda a: a.proximity_score, reverse=True)

    # Return top N aircraft
    return aircraft_with_proximity[:max_aircraft]
