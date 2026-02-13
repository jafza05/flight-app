#2025 19 03

import json
import boto3
import math
import re
import logging
import requests
from FlightRadar24_ import FlightRadar24API
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

# Fetch and log the public IP address
try:
    response = requests.get('https://api.ipify.org?format=json', timeout=5)
    response.raise_for_status()  # Raise an exception for HTTP errors
    ip_info = response.json()
    public_ip = ip_info.get('ip', 'Unavailable')
except requests.RequestException as e:
    public_ip = 'Unavailable'
    print(f"Error fetching public IP: {e}")

# Log the public IP address
print(f"Lambda Public IP Address: {public_ip}")

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize external services and resources
fr_api = FlightRadar24API()
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
aircraft_table = dynamodb.Table('aircraft')
airline_logo_bucket = 'airline-logos-ja'

# Initialize caches
airlines_cache = None
airports_cache = {}
CLEAN_AIRPORT_PATTERN = re.compile(r'\b(?:international|airport|national)\b', flags=re.IGNORECASE)


def lambda_handler(event: dict, context) -> dict:
    logger.info(f"Received event: {event}")

    # Check if the request is GET or POST
    http_method = event.get('httpMethod', '').upper()

    if http_method == 'GET':
        # Parameters from query string
        parameters = event.get('queryStringParameters', {})
    elif http_method == 'POST':
        # Parameters from the body (can be JSON string or dict)
        body = event.get('body', {})

        if isinstance(body, str):
            try:
                parameters = json.loads(body)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'body': json.dumps("Invalid JSON body in POST request.")
                }
        elif isinstance(body, dict):
            parameters = body
        else:
            return {
                'statusCode': 400,
                'body': json.dumps("Invalid body format. Expected JSON string or object.")
            }
    else:
        return {
            'statusCode': 405,
            'body': json.dumps("Method Not Allowed. Only GET and POST are supported.")
        }

    # Validate required parameters
    required_keys = ['lat', 'long', 'radius']
    missing_keys = [key for key in required_keys if key not in parameters]
    if missing_keys:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Missing required parameter(s): {', '.join(missing_keys)}")
        }

    try:
        lat = float(parameters['lat'])
        long = float(parameters['long'])
        rad = float(parameters['radius'])
    except ValueError:
        return {
            'statusCode': 400,
            'body': json.dumps("Invalid parameter types. 'lat', 'long', and 'radius' must be numbers.")
        }

    # Business Logic
    flights = get_flights(lat, long, rad)
    if not flights:
        return {
            'statusCode': 404,
            'body': json.dumps("No flights found within the specified radius.")
        }

    closest_flight = find_closest_flight(flights, lat, long)
    if not closest_flight:
        return {
            'statusCode': 404,
            'body': json.dumps("No valid flights found within the specified radius.")
        }

    detailed_flight = append_closest_flight(closest_flight)
    if detailed_flight:
        detailed_flight['user_lat'] = lat
        detailed_flight['user_long'] = long
    else:
        return {
            'statusCode': 500,
            'body': json.dumps("Error processing the closest flight.")
        }

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        'body': json.dumps({'closest_flight': detailed_flight})
    }


def get_flights(lat: float, long: float, rad: float) -> list:
    """
    Fetch flights within the specified radius using FlightRadar24 API.
    """
    try:
        bounds = fr_api.get_bounds_by_point(lat, long, rad * 1000)  # Assuming rad is in kilometers
        flights = fr_api.get_flights(bounds=bounds)
        return flights
    except Exception as e:
        logger.error(f"Error fetching flights: {e}")
        return []


def haversine_3d(lat1: float, lon1: float, alt1: float,
                 lat2: float, lon2: float, alt2: float) -> float:
    R = 6371  # Earth radius in kilometers

    # Convert latitude and longitude from degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula for the great-circle distance
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    horizontal_distance = R * c  # in kilometers

    # Convert altitude from meters to kilometers
    alt1_km = alt1 / 1000
    alt2_km = alt2 / 1000
    delta_alt = alt2_km - alt1_km

    # Calculate the 3D distance using the Pythagorean theorem
    distance_3d = math.sqrt(horizontal_distance ** 2 + delta_alt ** 2)

    return distance_3d


def find_closest_flight(flights: list, target_lat: float, target_long: float) -> Optional[dict]:
    closest_flight = None
    min_distance = float('inf')

    for flight in flights:
        aircraft_code = getattr(flight, 'aircraft_code', None)
        on_ground = getattr(flight, 'on_ground', None)
        registration = getattr(flight, 'registration', None)
        altitude = getattr(flight, 'altitude', None)
        ground_speed = getattr(flight, 'ground_speed', None)

        if aircraft_code == 'GRND' or aircraft_code == 'R44' or on_ground == 1 or registration is None or registration.endswith(
                "TV") or ground_speed < 100:
            continue

        latitude = getattr(flight, 'latitude', None)
        longitude = getattr(flight, 'longitude', None)

        if latitude is None or longitude is None or altitude is None:
            continue

        distance = haversine_3d(target_lat, target_long, 0, latitude, longitude, altitude)

        if distance < min_distance:
            min_distance = distance
            closest_flight = {
                'id': getattr(flight, 'id', None),
                'callsign': getattr(flight, 'callsign', None),
                'registration': registration,
                'origin_airport_iata': getattr(flight, 'origin_airport_iata', None),
                'destination_airport_iata': getattr(flight, 'destination_airport_iata', None),
                'altitude': altitude,
                'heading': getattr(flight, 'heading', None),
                'ground_speed': getattr(flight, 'ground_speed', None),
                'aircraft_code': aircraft_code,
                'airline_iata': getattr(flight, 'airline_iata', None),
                'airline_icao': getattr(flight, 'airline_icao', None),
                'number': getattr(flight, 'number', registration),
                'latitude': latitude,
                'longitude': longitude,
                'distance': distance
            }

    return closest_flight


def append_closest_flight(flight: dict) -> Optional[dict]:
    """
    Append detailed information to the closest flight, such as airline name, aircraft model,
    and origin/destination airport names.
    """
    if not flight:
        return None

    # Handle special registration ending with "NE"
    registration = flight.get('registration', '')
    if registration.endswith("NE"):
        flight['airline_name'] = "Boston MedFlight"
        flight['airline_icao'] = "BMF"
    else:
        airlines = get_cached_airlines()
        flight['airline_name'] = get_airline_name(flight.get('airline_icao'), airlines)

    aircraft_code = flight.get('aircraft_code', '')
    flight['aircraft_model'] = get_aircraft_model(aircraft_code)

    origin_iata = flight.get('origin_airport_iata')
    destination_iata = flight.get('destination_airport_iata')

    airline_icao = flight.get('airline_icao', '')
    airline_logo_url = get_airline_logo_url(airline_logo_bucket, airline_icao)
    flight['airline_logo_url'] = airline_logo_url  # Optionally store the URL

    with ThreadPoolExecutor(max_workers=2) as executor:
        origin_future = executor.submit(get_airport_name, origin_iata) if origin_iata else None
        destination_future = executor.submit(get_airport_name, destination_iata) if destination_iata else None

        if origin_future:
            flight['origin_airport_name'] = origin_future.result()
            flight['origin_airport_clean'] = clean_airport_name(flight['origin_airport_name'])
        else:
            flight['origin_airport_name'] = ''
            flight['origin_airport_clean'] = ''

        if destination_future:
            flight['destination_airport_name'] = destination_future.result()
            flight['destination_airport_clean'] = clean_airport_name(flight['destination_airport_name'])
        else:
            flight['destination_airport_name'] = ''
            flight['destination_airport_clean'] = ''

    return flight


def get_airline_logo_url(bucket_name, airline_icao):
    if not airline_icao:
        return None  # Early return if ICAO code is not provided

    base_url = f"https://{bucket_name}.s3.us-east-1.amazonaws.com/{airline_icao}"
    print(base_url)
    for extension in ["png", "jpg"]:
        url = f"{base_url}.{extension}"
        try:
            response = requests.head(url, timeout=5)  # Sends a lightweight HEAD request to check availability
            if response.status_code == 200:
                return url
        except requests.RequestException as e:
            logger.error(f"Error checking logo URL {url}: {e}")
            continue
    return None


def get_cached_airlines() -> dict:
    """
    Retrieve airlines data from cache or fetch from API if not cached.
    Returns a dictionary mapping ICAO codes to airline names.
    """
    global airlines_cache
    if airlines_cache is None:
        try:
            airlines = fr_api.get_airlines()
            airlines_cache = {airline['ICAO']: airline.get('Name', 'Airline Unavailable') for airline in airlines}
        except Exception as e:
            logger.error(f"Error fetching airlines: {e}")
            airlines_cache = {}
    return airlines_cache


def get_airline_name(icao_code: str, airlines: dict) -> str:
    return airlines.get(icao_code, "Airline Unavailable")


def get_aircraft_model(icao_code: str) -> str:
    if not icao_code:
        return "Unknown Model"

    try:
        response = aircraft_table.get_item(
            Key={'ICAO_Code': icao_code},
            ProjectionExpression='Model_FAA'
        )
        if 'Item' in response:
            return response['Item'].get('Model_FAA', icao_code)
        else:
            return icao_code
    except Exception as e:
        logger.error(f"Error retrieving aircraft model for {icao_code}: {e}")
        return icao_code


def get_airport_name(iata_code: str) -> str:
    if not iata_code:
        return ""

    if iata_code in airports_cache:
        return airports_cache[iata_code]

    try:
        airport = fr_api.get_airport(iata_code)
        airport_name = getattr(airport, 'name', '')
        airports_cache[iata_code] = airport_name
        return airport_name
    except Exception as e:
        logger.error(f"Error fetching airport {iata_code}: {e}")
        airports_cache[iata_code] = ''
        return ''


def clean_airport_name(name: str) -> str:
    """
    Clean the airport name by removing specific words and extra spaces.
    """
    if not name:
        return ""
    cleaned_name = CLEAN_AIRPORT_PATTERN.sub('', name)
    return ' '.join(cleaned_name.split())
