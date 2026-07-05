"""
Lambda handler for flight search with FlightRadarAPI integration
"""

import json
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Dict, Any, List, Optional

from shared.models import (
    Aircraft,
    AircraftWithDistance,
    ArrivalFlight,
    ArrivalsSearchResponse,
    FlightSearchResponse
)
from shared.proximity import (
    calculate_aircraft_proximity,
    feet_to_meters,
    knots_to_mph,
    knots_to_kmh,
    haversine_distance,
    miles_to_nautical_miles,
)
from shared.aircraft_classification import classify_aircraft

# Airports supported by the /arrivals feature. `zones` are broad geographic
# boxes used only to catch private/GA flights and any airline not in
# AIRLINE_NAMES -- comprehensive coverage of known airlines comes from
# per-airline queries instead (see search_arrivals_for_airport), since
# FlightRadar24 hard-caps geographic queries at 1500 results and even a
# single CONUS quadrant routinely hits that cap.
AIRPORTS = {
    'BOS': {
        'name': 'Boston Logan International',
        'latitude': 42.3656,
        'longitude': -71.0096,
        'zones': [
            # North America + North Atlantic + Europe + a polar-route margin
            {'tl_y': 75, 'br_y': 25, 'tl_x': -130, 'br_x': 15},
            # Middle East / Turkey, for Gulf-carrier and Turkish Airlines
            # flights still near departure (many hours out)
            {'tl_y': 45, 'br_y': 12, 'tl_x': 15, 'br_x': 60},
        ],
    },
}

# ICAO to IATA airline code mapping (most common airlines)
ICAO_TO_IATA = {
    'UAL': 'UA',  # United Airlines
    'AAL': 'AA',  # American Airlines
    'DAL': 'DL',  # Delta Air Lines
    'SWA': 'WN',  # Southwest Airlines
    'JBU': 'B6',  # JetBlue Airways
    'ASA': 'AS',  # Alaska Airlines
    'FFT': 'F9',  # Frontier Airlines
    'NKS': 'NK',  # Spirit Airlines
    'ACA': 'AC',  # Air Canada
    'BAW': 'BA',  # British Airways
    'AFR': 'AF',  # Air France
    'DLH': 'LH',  # Lufthansa
    'KLM': 'KL',  # KLM
    'UAE': 'EK',  # Emirates
    'QTR': 'QR',  # Qatar Airways
    'ETH': 'ET',  # Ethiopian Airlines
    'SIA': 'SQ',  # Singapore Airlines
    'ANA': 'NH',  # All Nippon Airways
    'JAL': 'JL',  # Japan Airlines
    'CPA': 'CX',  # Cathay Pacific
    'QFA': 'QF',  # Qantas
    'VOZ': 'VA',  # Virgin Australia
    'RYR': 'FR',  # Ryanair
    'EZY': 'U2',  # easyJet
    'IBE': 'IB',  # Iberia
    'TAP': 'TP',  # TAP Air Portugal
}

# Airline ICAO code -> friendly name, for display on the /arrivals page.
# Covers major US carriers, their regional-partner operators, and the
# international/long-haul carriers that plausibly serve BOS.
AIRLINE_NAMES = {
    'UAL': 'United Airlines', 'AAL': 'American Airlines', 'DAL': 'Delta Air Lines',
    'SWA': 'Southwest Airlines', 'JBU': 'JetBlue Airways', 'ASA': 'Alaska Airlines',
    'FFT': 'Frontier Airlines', 'NKS': 'Spirit Airlines', 'ACA': 'Air Canada',
    'BAW': 'British Airways', 'AFR': 'Air France', 'DLH': 'Lufthansa', 'KLM': 'KLM',
    'UAE': 'Emirates', 'QTR': 'Qatar Airways', 'ETD': 'Etihad Airways',
    'ETH': 'Ethiopian Airlines', 'SIA': 'Singapore Airlines', 'ANA': 'All Nippon Airways',
    'JAL': 'Japan Airlines', 'CPA': 'Cathay Pacific', 'QFA': 'Qantas',
    'VOZ': 'Virgin Australia', 'RYR': 'Ryanair', 'EZY': 'easyJet', 'IBE': 'Iberia',
    'TAP': 'TAP Air Portugal', 'THY': 'Turkish Airlines', 'ELY': 'El Al',
    'SWR': 'Swiss International Air Lines', 'SAS': 'SAS', 'EIN': 'Aer Lingus',
    'ICE': 'Icelandair', 'CFG': 'Condor', 'ITY': 'ITA Airways', 'CHH': 'Hainan Airlines',
    'CCA': 'Air China', 'CSN': 'China Southern', 'CES': 'China Eastern',
    'NOZ': 'Norse Atlantic Airways', 'DTA': 'La Compagnie', 'TSC': 'Air Transat',
    'WJA': 'WestJet', 'POE': 'Porter Airlines', 'ROU': 'Air Canada Rouge',
    # US regional carriers operating under a mainline brand
    'RPA': 'Republic Airways', 'ENY': 'Envoy Air', 'JZA': 'Air Canada Jazz',
    'PDT': 'Piedmont Airlines', 'EDV': 'Endeavor Air', 'SKW': 'SkyWest Airlines',
    'GJS': 'GoJet Airlines', 'AWI': 'Air Wisconsin', 'QXE': 'Horizon Air',
    'JIA': 'PSA Airlines',
}


def get_cors_headers() -> Dict[str, str]:
    """Get CORS headers for all responses"""
    # Note: We let Lambda Function URL handle CORS automatically
    # Just return Content-Type here
    return {
        'Content-Type': 'application/json'
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """AWS Lambda handler for flight search"""

    # Debug: Print event to understand structure
    print(f"Event: {json.dumps(event)[:500]}")

    # Handle OPTIONS preflight request (check both formats)
    http_method = event.get('requestContext', {}).get('http', {}).get('method')
    if not http_method:
        http_method = event.get('httpMethod')  # API Gateway format

    print(f"HTTP Method: {http_method}")

    if http_method == 'OPTIONS':
        print("Handling OPTIONS preflight request")
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': ''
        }

    try:
        # Parse request
        body = event.get('body', {})
        if isinstance(body, str):
            body = json.loads(body)

        # Airport-arrivals search (used by the /arrivals plane-spotting page)
        if body.get('mode') == 'arrivals':
            return handle_arrivals_request(body)

        user_lat = float(body.get('user_latitude'))
        user_lon = float(body.get('user_longitude'))
        radius_mi = float(body.get('radius_mi', 5.0))
        max_aircraft = int(body.get('max_aircraft', 5))
        radius_mode = body.get('radius_mode', 'auto')
        max_expand_attempts = int(body.get('max_expand_attempts', 10))
        expand_increment_mi = float(body.get('expand_increment_mi', 5.0))

        print(f"Flight search: lat={user_lat}, lon={user_lon}, radius={radius_mi}mi")

        # Search for aircraft
        try:
            aircraft_list, actual_radius = search_nearby_aircraft(
                user_lat, user_lon, radius_mi, max_aircraft, radius_mode,
                max_expand_attempts, expand_increment_mi
            )
        except ValueError as e:
            # No flights found after all attempts - return 404 with clear message
            print(f"No flights found: {e}")
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({
                    'error': str(e),
                    'message': f'No flights found in your area. Try expanding your search or checking a different location.'
                })
            }

        # Create response
        response_data = FlightSearchResponse(
            aircraft=aircraft_list,
            search_radius_mi=actual_radius,  # Use actual radius from auto-expand
            aircraft_count=len(aircraft_list),
            user_location={'latitude': user_lat, 'longitude': user_lon},
            timestamp=datetime.utcnow().isoformat() + 'Z'
        )

        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps(response_data.to_dict())
        }

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }


def search_nearby_aircraft(
    user_lat: float,
    user_lon: float,
    radius_mi: float,
    max_aircraft: int,
    radius_mode: str,
    max_expand_attempts: int,
    expand_increment_mi: float
) -> tuple[List[AircraftWithDistance], float]:
    """
    Search for aircraft using FlightRadar24 API with auto-expand.
    Returns (aircraft_list, actual_radius_used)
    """

    aircraft_list = []
    current_radius = radius_mi
    attempts = 0

    try:
        import boto3
        from FlightRadar24 import FlightRadar24API

        print("Initializing FlightRadar24 API...")
        fr_api = FlightRadar24API()

        # Auto-expand loop: try increasing radius until we find flights
        while attempts < max_expand_attempts:
            attempts += 1
            print(f"📡 Attempt {attempts}/{max_expand_attempts}: Searching with {current_radius}mi radius...")

            # USER'S PROVEN SOLUTION: Use get_bounds_by_point()
            # IMPORTANT: get_bounds_by_point() expects radius in METERS, not miles!
            radius_meters = current_radius * 1609.34  # Convert miles to meters
            bounds = fr_api.get_bounds_by_point(user_lat, user_lon, radius_meters)
            print(f"  Bounds for {current_radius}mi ({radius_meters:.0f}m): {bounds}")
            flights = fr_api.get_flights(bounds=bounds)
            print(f"  API returned: {type(flights)}, length: {len(flights) if flights else 0}")

            if flights and len(flights) > 0:
                print(f"✅ Found {len(flights)} raw flights at {current_radius}mi radius")

                # Convert to our Aircraft model and filter
                import time
                current_time = time.time()
                debug_printed = False  # Flag to only print debug once

                for flight_id in flights:
                    try:
                        # Debug: Check what type we got (only once)
                        if not debug_printed:
                            debug_printed = True
                            print(f"  🔍 DEBUG - flight_id type: {type(flight_id)}")
                            print(f"  🔍 DEBUG - isinstance(flight_id, str): {isinstance(flight_id, str)}")

                        # Check if flight is a string (ID) or object
                        if isinstance(flight_id, str):
                            # API returned just IDs, need to get full details
                            print(f"  🔍 Getting details for flight ID: {flight_id}")
                            flight = fr_api.get_flight_details(flight_id)
                            if not flight:
                                print(f"  ⚠️ Could not get details for flight {flight_id}")
                                continue
                        else:
                            # API returned full flight object
                            flight = flight_id

                            # ⚡ PERFORMANCE: Filter out grounded aircraft FIRST before expensive operations
                            altitude = int(getattr(flight, 'altitude', 0))
                            on_ground = bool(getattr(flight, 'on_ground', False))
                            if on_ground or altitude < 100:
                                # Skip expensive API calls for grounded aircraft
                                continue

                            # Get airport names using get_airport() method (not from flight_details)
                            try:
                                origin_iata = getattr(flight, 'origin_airport_iata', None)
                                dest_iata = getattr(flight, 'destination_airport_iata', None)

                                if origin_iata:
                                    try:
                                        origin_airport = fr_api.get_airport(origin_iata)
                                        flight.origin_airport_name = getattr(origin_airport, 'name', None)
                                        print(f"  ✅ Got origin airport: {flight.origin_airport_name}")
                                    except Exception as e:
                                        print(f"  ⚠️ Could not get origin airport {origin_iata}: {e}")
                                        flight.origin_airport_name = None

                                if dest_iata:
                                    try:
                                        dest_airport = fr_api.get_airport(dest_iata)
                                        flight.destination_airport_name = getattr(dest_airport, 'name', None)
                                        print(f"  ✅ Got dest airport: {flight.destination_airport_name}")
                                    except Exception as e:
                                        print(f"  ⚠️ Could not get dest airport {dest_iata}: {e}")
                                        flight.destination_airport_name = None

                            except Exception as airport_error:
                                print(f"  ⚠️ Error fetching airport names: {airport_error}")

                        # Extract airline codes and flight number from callsign
                        airline_iata = getattr(flight, 'airline_iata', None) or ''
                        airline_icao = getattr(flight, 'airline_icao', None) or ''
                        flight_number = getattr(flight, 'number', None) or ''
                        callsign = getattr(flight, 'callsign', None) or ''

                        # If airline_iata is empty but we have a callsign, try to extract it
                        if not airline_iata and callsign:
                            # Commercial flights have callsigns like "UAL50", "DAL123", etc.
                            # Extract the 3-letter airline code and convert to 2-letter IATA
                            import re
                            match = re.match(r'^([A-Z]{3})(\d+)$', callsign)
                            if match:
                                icao_code = match.group(1)
                                flight_num = match.group(2)
                                if icao_code in ICAO_TO_IATA:
                                    airline_iata = ICAO_TO_IATA[icao_code]
                                    airline_icao = icao_code
                                    flight_number = f"{airline_iata}{flight_num}"
                                    print(f"  ✅ Extracted airline from callsign: {callsign} -> {airline_iata} (flight {flight_number})")

                        print(f"  ✈️ Flight: airline_iata='{airline_iata}', airline_icao='{airline_icao}', number='{flight_number}', callsign='{callsign}'")

                        aircraft = Aircraft(
                            id=str(getattr(flight, 'id', flight_id if isinstance(flight_id, str) else '')),
                            callsign=callsign or None,
                            flight_number=flight_number or None,
                            registration=getattr(flight, 'registration', None),
                            aircraft_code=getattr(flight, 'aircraft_code', None),
                            airline_iata=airline_iata or None,
                            airline_icao=airline_icao or None,
                            latitude=float(getattr(flight, 'latitude', 0)),
                            longitude=float(getattr(flight, 'longitude', 0)),
                            altitude=int(getattr(flight, 'altitude', 0)),
                            heading=int(getattr(flight, 'heading', 0)),
                            ground_speed=int(getattr(flight, 'ground_speed', 0)),
                            vertical_speed=int(getattr(flight, 'vertical_speed', 0)),
                            origin_airport_iata=getattr(flight, 'origin_airport_iata', None),
                            destination_airport_iata=getattr(flight, 'destination_airport_iata', None),
                            origin_airport_name=getattr(flight, 'origin_airport_name', None),
                            origin_airport_city=getattr(flight, 'origin_airport_city', None),
                            destination_airport_name=getattr(flight, 'destination_airport_name', None),
                            destination_airport_city=getattr(flight, 'destination_airport_city', None),
                            squawk=getattr(flight, 'squawk', None),
                            on_ground=bool(getattr(flight, 'on_ground', False)),
                            timestamp=getattr(flight, 'time', None)
                        )

                        # Get detailed aircraft info from DynamoDB
                        try:
                            dynamodb = boto3.resource('dynamodb')
                            aircraft_table = dynamodb.Table('aircraft')

                            if aircraft.aircraft_code:
                                response = aircraft_table.get_item(
                                    Key={'ICAO_Code': aircraft.aircraft_code}
                                )
                                if 'Item' in response:
                                    item = response['Item']
                                    aircraft.model_faa = item.get('Model_FAA')
                                    aircraft.model_code = item.get('Model_Code')
                                    print(f"  ✅ Found aircraft model in DynamoDB: {aircraft.aircraft_code} -> {aircraft.model_faa}")
                                else:
                                    print(f"  ⚠️ Aircraft model not found in DynamoDB for: {aircraft.aircraft_code}")

                        except Exception as db_error:
                            print(f"  ❌ DynamoDB query failed for {aircraft.aircraft_code}: {db_error}")

                        # Filter out stale data (older than 5 minutes)
                        if aircraft.timestamp:
                            age_seconds = current_time - aircraft.timestamp
                            if age_seconds > 300:  # 5 minutes
                                print(f"  ⏰ Skipping stale: {aircraft.callsign or aircraft.registration} ({age_seconds:.0f}s old)")
                                continue

                        aircraft_list.append(aircraft)
                    except Exception as e:
                        import traceback
                        print(f"❌ Error processing flight {flight_id}: {e}")
                        print(f"   Traceback: {traceback.format_exc()}")
                        continue

                # Check if we found any airborne flights after filtering
                if aircraft_list:
                    print(f"✅ Found {len(aircraft_list)} airborne flights after filtering")
                    break  # Found valid flights, exit loop
                else:
                    print(f"🔄 All {len(flights)} flights were grounded. Expanding search...")
                    current_radius += expand_increment_mi
            else:
                print(f"🔄 No flights found at {current_radius}mi. Expanding search...")
                current_radius += expand_increment_mi

        # If no flights found after all attempts, raise error (NO MOCK DATA)
        if not aircraft_list:
            raise ValueError(f"No flights found within {current_radius}mi after {attempts} attempts")

    except Exception as e:
        print(f"❌ FlightRadar24 API error: {e}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise error - NO MOCK DATA

    # Calculate proximity for all aircraft
    aircraft_with_proximity = calculate_proximity_for_aircraft(
        aircraft_list, user_lat, user_lon, max_aircraft
    )

    return aircraft_with_proximity, current_radius


def calculate_proximity_for_aircraft(
    aircraft_list: List[Aircraft],
    user_lat: float,
    user_lon: float,
    max_aircraft: int
) -> List[AircraftWithDistance]:
    """Calculate proximity metrics and sort by priority"""

    aircraft_with_proximity = []

    for aircraft in aircraft_list:
        # Calculate proximity
        (horizontal_distance, distance_3d, bearing, is_approaching, proximity_score, heading_diff) = \
            calculate_aircraft_proximity(
                user_lat, user_lon,
                aircraft.latitude, aircraft.longitude,
                aircraft.altitude, aircraft.heading,
                aircraft.on_ground
            )

        # Create enhanced aircraft
        enhanced = AircraftWithDistance(
            **aircraft.__dict__,
            distance_mi=horizontal_distance,
            distance_3d_mi=distance_3d,
            bearing_to_aircraft=bearing,
            is_approaching=is_approaching,
            proximity_score=proximity_score,
            heading_difference=heading_diff,
            altitude_ft=aircraft.altitude,
            altitude_m=feet_to_meters(aircraft.altitude),
            speed_kts=aircraft.ground_speed,
            speed_mph=knots_to_mph(aircraft.ground_speed),
            speed_kmh=knots_to_kmh(aircraft.ground_speed)
        )

        aircraft_with_proximity.append(enhanced)

    # Sort by proximity score (highest first)
    aircraft_with_proximity.sort(key=lambda a: a.proximity_score, reverse=True)

    # Return top N
    return aircraft_with_proximity[:max_aircraft]


def handle_arrivals_request(body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle a `mode: 'arrivals'` request: airborne flights inbound to an airport"""

    destination_iata = str(body.get('destination_airport_iata', '')).upper()
    max_results = int(body.get('max_results', 300))

    airport = AIRPORTS.get(destination_iata)
    if not airport:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'error': f"Unsupported airport '{destination_iata}'",
                'supported_airports': list(AIRPORTS.keys()),
            })
        }

    try:
        arrivals = search_arrivals_for_airport(destination_iata, airport, max_results)
    except Exception as e:
        print(f"❌ Arrivals search error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

    response_data = ArrivalsSearchResponse(
        airport_iata=destination_iata,
        airport_name=airport['name'],
        arrivals=arrivals,
        arrivals_count=len(arrivals),
        timestamp=datetime.utcnow().isoformat() + 'Z'
    )

    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': json.dumps(response_data.to_dict())
    }


def _fetch_zone(fr_api, zone: Dict[str, float], max_attempts: int = 3) -> List[Any]:
    """
    Fetch flights in a geographic zone. Retries on empty/error, since an
    empty result for a broad zone usually means a transient API hiccup.
    Note: FlightRadar24 hard-caps results at 1500 per query regardless of
    zone size or requested limit, so zones must stay small enough (or be
    supplemented by per-airline queries) to avoid silently dropping flights.
    """
    bounds = fr_api.get_bounds(zone)
    for attempt in range(1, max_attempts + 1):
        try:
            flights = fr_api.get_flights(bounds=bounds)
            if flights:
                return flights
        except Exception as e:
            print(f"  ⚠️ zone get_flights failed: {e}")
        time.sleep(1.5)
    return []


def _fetch_airline(fr_api, airline_code: str, max_attempts: int = 2) -> List[Any]:
    """
    Fetch all of one airline's currently-airborne flights worldwide. An
    empty result is treated as valid (that airline just has none in the
    air right now) -- only exceptions are retried.
    """
    for attempt in range(1, max_attempts + 1):
        try:
            return fr_api.get_flights(airline=airline_code)
        except Exception as e:
            print(f"  ⚠️ airline {airline_code} get_flights failed: {e}")
            time.sleep(1)
    return []


def search_arrivals_for_airport(
    destination_iata: str,
    airport: Dict[str, Any],
    max_results: int,
) -> List[ArrivalFlight]:
    """
    Find all airborne flights currently inbound to `destination_iata`,
    anywhere in the world (including transatlantic traffic still hours
    out over the ocean). FlightRadar24 only surfaces flights that have
    already taken off, so this reflects "in the air right now", not a
    full pre-departure schedule.

    FlightRadar24 hard-caps each query at 1500 flights, and even a single
    CONUS quadrant or European region routinely hits that cap -- so a
    couple of huge geographic zones silently drop real flights (a plane
    departing Madrid can get crowded out of the results just as easily as
    one over open ocean). To get comprehensive coverage we query per
    airline (each carrier's worldwide fleet is well under the cap) for
    every airline we know about, PLUS a couple of broad geographic zones
    to catch private/GA flights and any carrier not in our airline list.
    All of this runs concurrently since it's pure network I/O.
    """
    from FlightRadar24 import FlightRadar24API

    fr_api = FlightRadar24API()
    flights_by_id: Dict[str, Any] = {}

    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = [executor.submit(_fetch_airline, fr_api, code) for code in AIRLINE_NAMES.keys()]
        futures += [executor.submit(_fetch_zone, fr_api, zone) for zone in airport['zones']]

        for future in as_completed(futures):
            for flight in future.result():
                flights_by_id[getattr(flight, 'id', None) or id(flight)] = flight

    flights = list(flights_by_id.values())
    print(f"📡 Fetched {len(flights)} unique flights across {len(AIRLINE_NAMES)} airlines + {len(airport['zones'])} zones")

    dest_lat = airport['latitude']
    dest_lon = airport['longitude']

    dynamodb = None
    try:
        import boto3
        dynamodb = boto3.resource('dynamodb')
    except Exception as e:
        print(f"  ⚠️ Could not init DynamoDB: {e}")

    arrivals: List[ArrivalFlight] = []

    for flight in flights:
        if getattr(flight, 'on_ground', False):
            continue
        if getattr(flight, 'destination_airport_iata', None) != destination_iata:
            continue

        altitude = int(getattr(flight, 'altitude', 0))
        latitude = float(getattr(flight, 'latitude', 0))
        longitude = float(getattr(flight, 'longitude', 0))
        ground_speed = int(getattr(flight, 'ground_speed', 0))
        aircraft_code = getattr(flight, 'aircraft_code', None)
        airline_iata = getattr(flight, 'airline_iata', None) or None
        airline_icao = getattr(flight, 'airline_icao', None) or None
        flight_number = getattr(flight, 'number', None) or None
        callsign = getattr(flight, 'callsign', None) or None
        airline_name = AIRLINE_NAMES.get(airline_icao) if airline_icao else None

        distance_nm = miles_to_nautical_miles(
            haversine_distance(latitude, longitude, dest_lat, dest_lon)
        )
        eta_minutes = (distance_nm / ground_speed) * 60 if ground_speed > 0 else None

        model_faa = None
        model_code = None
        if dynamodb is not None and aircraft_code:
            try:
                response = dynamodb.Table('aircraft').get_item(Key={'ICAO_Code': aircraft_code})
                item = response.get('Item')
                if item:
                    model_faa = item.get('Model_FAA')
                    model_code = item.get('Model_Code')
            except Exception as db_error:
                print(f"  ⚠️ DynamoDB lookup failed for {aircraft_code}: {db_error}")

        classification = classify_aircraft(aircraft_code, airline_iata, flight_number)

        arrivals.append(ArrivalFlight(
            id=str(getattr(flight, 'id', '')),
            callsign=callsign,
            flight_number=flight_number,
            registration=getattr(flight, 'registration', None),
            aircraft_code=aircraft_code,
            airline_iata=airline_iata,
            airline_icao=airline_icao,
            airline_name=airline_name,
            model_faa=model_faa,
            model_code=model_code,
            latitude=latitude,
            longitude=longitude,
            altitude=altitude,
            heading=int(getattr(flight, 'heading', 0)),
            ground_speed=ground_speed,
            vertical_speed=int(getattr(flight, 'vertical_speed', 0)),
            origin_airport_iata=getattr(flight, 'origin_airport_iata', None) or None,
            destination_airport_iata=destination_iata,
            on_ground=False,
            distance_to_airport_nm=round(distance_nm, 1),
            eta_minutes=round(eta_minutes, 1) if eta_minutes is not None else None,
            category=classification['category'],
            is_widebody=classification['is_widebody'],
            is_private_jet=classification['is_private_jet'],
            is_rare=classification['is_rare'],
            spotting_tags=classification['spotting_tags'],
        ))

    # Soonest arrivals first; unknown ETA (no speed data) sorts last
    arrivals.sort(key=lambda a: (a.eta_minutes is None, a.eta_minutes))

    return arrivals[:max_results]
