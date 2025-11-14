"""
Lambda handler for user preferences endpoints.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError


# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('USER_PREFERENCES_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET and PUT /user/preferences requests.
    """
    try:
        # Get Cognito user ID from authorizer
        cognito_sub = get_cognito_sub(event)
        if not cognito_sub:
            return error_response(401, 'UNAUTHORIZED', 'User not authenticated')

        # Route based on HTTP method
        http_method = event.get('httpMethod', '')

        if http_method == 'GET':
            return handle_get_preferences(cognito_sub)
        elif http_method == 'PUT':
            return handle_update_preferences(cognito_sub, event)
        else:
            return error_response(405, 'METHOD_NOT_ALLOWED',
                                f'Method {http_method} not allowed')

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, 'INTERNAL_ERROR',
                            'An unexpected error occurred')


def handle_get_preferences(cognito_sub: str) -> Dict[str, Any]:
    """
    Get user preferences from DynamoDB.
    """
    try:
        response = table.get_item(Key={'cognitoSub': cognito_sub})

        if 'Item' in response:
            # User has existing preferences
            return success_response(response['Item'])
        else:
            # Create and return default preferences
            default_prefs = create_default_preferences(cognito_sub)
            table.put_item(Item=default_prefs)
            return success_response(default_prefs)

    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'DATABASE_ERROR', 'Error retrieving preferences')


def handle_update_preferences(cognito_sub: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update user preferences in DynamoDB.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Get existing preferences or create defaults
        existing = table.get_item(Key={'cognitoSub': cognito_sub}).get('Item')
        if not existing:
            existing = create_default_preferences(cognito_sub)

        # Update fields from request
        updated = update_preferences_fields(existing, body)
        updated['updatedAt'] = datetime.utcnow().isoformat() + 'Z'

        # Save to DynamoDB
        table.put_item(Item=updated)

        return success_response(updated)

    except json.JSONDecodeError:
        return error_response(400, 'INVALID_JSON', 'Request body must be valid JSON')
    except ValueError as e:
        return error_response(400, 'INVALID_DATA', str(e))
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'DATABASE_ERROR', 'Error updating preferences')


def create_default_preferences(cognito_sub: str) -> Dict[str, Any]:
    """
    Create default user preferences.
    """
    now = datetime.utcnow().isoformat() + 'Z'
    return {
        'cognitoSub': cognito_sub,
        'theme': 'system',
        'layout': 'hero',
        'maxFlights': 5,
        'units': {
            'distance': 'miles',
            'altitude': 'feet',
            'speed': 'knots'
        },
        'searchRadius': {
            'mode': 'auto'
        },
        'refreshInterval': 30,
        'useCurrentLocation': True,
        'createdAt': now,
        'updatedAt': now
    }


def update_preferences_fields(existing: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update preference fields with validation.
    """
    # Theme
    if 'theme' in updates:
        theme = updates['theme']
        if theme not in ['light', 'dark', 'system']:
            raise ValueError("theme must be 'light', 'dark', or 'system'")
        existing['theme'] = theme

    # Layout
    if 'layout' in updates:
        layout = updates['layout']
        if layout not in ['hero', 'list', 'grid']:
            raise ValueError("layout must be 'hero', 'list', or 'grid'")
        existing['layout'] = layout

    # Max flights
    if 'maxFlights' in updates:
        max_flights = updates['maxFlights']
        if not isinstance(max_flights, int) or not (1 <= max_flights <= 5):
            raise ValueError("maxFlights must be an integer between 1 and 5")
        existing['maxFlights'] = max_flights

    # Units
    if 'units' in updates:
        units = updates['units']
        if not isinstance(units, dict):
            raise ValueError("units must be an object")

        # Validate distance units
        if 'distance' in units:
            if units['distance'] not in ['miles', 'kilometers']:
                raise ValueError("units.distance must be 'miles' or 'kilometers'")
            existing['units']['distance'] = units['distance']

        # Validate altitude units
        if 'altitude' in units:
            if units['altitude'] not in ['feet', 'meters']:
                raise ValueError("units.altitude must be 'feet' or 'meters'")
            existing['units']['altitude'] = units['altitude']

        # Validate speed units
        if 'speed' in units:
            if units['speed'] not in ['knots', 'mph', 'kph']:
                raise ValueError("units.speed must be 'knots', 'mph', or 'kph'")
            existing['units']['speed'] = units['speed']

    # Search radius
    if 'searchRadius' in updates:
        radius = updates['searchRadius']
        if not isinstance(radius, dict):
            raise ValueError("searchRadius must be an object")

        if 'mode' in radius:
            if radius['mode'] not in ['auto', 'manual']:
                raise ValueError("searchRadius.mode must be 'auto' or 'manual'")
            existing['searchRadius']['mode'] = radius['mode']

        if 'manualValue' in radius:
            manual_value = radius['manualValue']
            if not isinstance(manual_value, (int, float)) or not (1 <= manual_value <= 50):
                raise ValueError("searchRadius.manualValue must be between 1 and 50")
            existing['searchRadius']['manualValue'] = float(manual_value)

    # Refresh interval
    if 'refreshInterval' in updates:
        interval = updates['refreshInterval']
        if not isinstance(interval, int) or not (10 <= interval <= 45):
            raise ValueError("refreshInterval must be between 10 and 45 seconds")
        existing['refreshInterval'] = interval

    # Use current location
    if 'useCurrentLocation' in updates:
        use_current = updates['useCurrentLocation']
        if not isinstance(use_current, bool):
            raise ValueError("useCurrentLocation must be a boolean")
        existing['useCurrentLocation'] = use_current

    # Default location ID
    if 'defaultLocationId' in updates:
        existing['defaultLocationId'] = updates['defaultLocationId']

    return existing


def get_cognito_sub(event: Dict[str, Any]) -> str:
    """
    Extract Cognito user ID from API Gateway event.
    """
    try:
        claims = event['requestContext']['authorizer']['claims']
        return claims.get('sub', '')
    except (KeyError, TypeError):
        return ''


def success_response(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a successful API Gateway response."""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
        },
        'body': json.dumps({
            'success': True,
            'data': data
        })
    }


def error_response(status_code: int, error_code: str, message: str) -> Dict[str, Any]:
    """Create an error API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'error': {
                'code': error_code,
                'message': message
            }
        })
    }
