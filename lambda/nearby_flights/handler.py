"""
Lambda handler for nearby flights endpoint.
"""

import json
import os
import time
from typing import Dict, Any

from flight_radar import FlightRadarClient
from proximity import Position, rank_flights, calculate_optimal_radius


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle POST /flights/nearby requests.

    Expected body:
    {
        "latitude": float,
        "longitude": float,
        "altitude": float (optional, default 0),
        "radius": float (optional, miles),
        "maxFlights": int (optional, default 5)
    }

    Returns:
        API Gateway response with flight data
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract and validate required parameters
        lat = body.get('latitude')
        lon = body.get('longitude')

        if lat is None or lon is None:
            return error_response(400, 'MISSING_COORDINATES',
                                'Latitude and longitude are required')

        # Validate coordinate ranges
        if not (-90 <= lat <= 90):
            return error_response(400, 'INVALID_LATITUDE',
                                'Latitude must be between -90 and 90')

        if not (-180 <= lon <= 180):
            return error_response(400, 'INVALID_LONGITUDE',
                                'Longitude must be between -180 and 180')

        # Extract optional parameters
        alt = body.get('altitude', 0)
        max_flights = body.get('maxFlights', 5)
        user_radius = body.get('radius')

        # Validate max_flights
        if not (1 <= max_flights <= 10):
            return error_response(400, 'INVALID_MAX_FLIGHTS',
                                'maxFlights must be between 1 and 10')

        # Calculate optimal search radius
        search_radius = calculate_optimal_radius(lat, lon, user_radius)

        # Initialize FlightRadar client
        fr_client = FlightRadarClient()

        # Fetch flights in the area
        print(f"Searching for flights near ({lat}, {lon}) within {search_radius} miles")
        flights = fr_client.get_flights_in_bounds(lat, lon, search_radius)

        print(f"Found {len(flights)} flights")

        if not flights:
            # No flights found, return empty result
            return success_response({
                'flights': [],
                'searchRadius': search_radius,
                'actualRadius': search_radius,
                'timestamp': int(time.time())
            })

        # Create user position
        user_pos = Position(lat=lat, lon=lon, alt=alt)

        # Add timestamp to all flights
        current_time = int(time.time())
        for flight in flights:
            flight['timestamp'] = current_time

        # Rank flights by proximity
        ranked_flights = rank_flights(user_pos, flights, max_flights)

        print(f"Returning top {len(ranked_flights)} flights")

        # Return successful response
        return success_response({
            'flights': ranked_flights,
            'searchRadius': search_radius,
            'actualRadius': search_radius,
            'timestamp': current_time
        })

    except json.JSONDecodeError:
        return error_response(400, 'INVALID_JSON', 'Request body must be valid JSON')

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, 'INTERNAL_ERROR',
                            'An unexpected error occurred')


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a successful API Gateway response.

    Args:
        data: Response data

    Returns:
        API Gateway response dictionary
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps({
            'success': True,
            'data': data
        })
    }


def error_response(status_code: int, error_code: str, message: str) -> Dict[str, Any]:
    """
    Create an error API Gateway response.

    Args:
        status_code: HTTP status code
        error_code: Application error code
        message: Error message

    Returns:
        API Gateway response dictionary
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'error': {
                'code': error_code,
                'message': message
            }
        })
    }
