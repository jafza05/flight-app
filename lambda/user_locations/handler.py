"""
Lambda handler for user saved locations endpoints.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError


# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('USER_LOCATIONS_TABLE')
table = dynamodb.Table(table_name)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET, POST, DELETE /user/locations requests.
    """
    try:
        # Get Cognito user ID from authorizer
        cognito_sub = get_cognito_sub(event)
        if not cognito_sub:
            return error_response(401, 'UNAUTHORIZED', 'User not authenticated')

        # Route based on HTTP method
        http_method = event.get('httpMethod', '')

        if http_method == 'GET':
            return handle_get_locations(cognito_sub)
        elif http_method == 'POST':
            return handle_create_location(cognito_sub, event)
        elif http_method == 'DELETE':
            return handle_delete_location(cognito_sub, event)
        else:
            return error_response(405, 'METHOD_NOT_ALLOWED',
                                f'Method {http_method} not allowed')

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return error_response(500, 'INTERNAL_ERROR',
                            'An unexpected error occurred')


def handle_get_locations(cognito_sub: str) -> Dict[str, Any]:
    """
    Get all saved locations for a user.
    """
    try:
        response = table.query(
            KeyConditionExpression='cognitoSub = :sub',
            ExpressionAttributeValues={':sub': cognito_sub}
        )

        locations = response.get('Items', [])

        return success_response({'locations': locations})

    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'DATABASE_ERROR', 'Error retrieving locations')


def handle_create_location(cognito_sub: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new saved location.
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        name = body.get('name')
        latitude = body.get('latitude')
        longitude = body.get('longitude')

        if not name:
            return error_response(400, 'MISSING_NAME', 'Location name is required')

        if latitude is None or longitude is None:
            return error_response(400, 'MISSING_COORDINATES',
                                'Latitude and longitude are required')

        # Validate coordinates
        if not (-90 <= latitude <= 90):
            return error_response(400, 'INVALID_LATITUDE',
                                'Latitude must be between -90 and 90')

        if not (-180 <= longitude <= 180):
            return error_response(400, 'INVALID_LONGITUDE',
                                'Longitude must be between -180 and 180')

        # Get altitude (optional, default to 0)
        altitude = body.get('altitude', 0)

        if not isinstance(altitude, (int, float)):
            return error_response(400, 'INVALID_ALTITUDE',
                                'Altitude must be a number')

        # Create location item
        location_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'

        location = {
            'cognitoSub': cognito_sub,
            'locationId': location_id,
            'name': str(name).strip(),
            'latitude': float(latitude),
            'longitude': float(longitude),
            'altitude': float(altitude),
            'createdAt': now
        }

        # Save to DynamoDB
        table.put_item(Item=location)

        # Return created location (renamed id for consistency)
        response_location = location.copy()
        response_location['id'] = response_location.pop('locationId')

        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'data': response_location
            })
        }

    except json.JSONDecodeError:
        return error_response(400, 'INVALID_JSON', 'Request body must be valid JSON')
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'DATABASE_ERROR', 'Error creating location')


def handle_delete_location(cognito_sub: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Delete a saved location.
    """
    try:
        # Get location ID from path parameters
        path_params = event.get('pathParameters', {})
        location_id = path_params.get('locationId')

        if not location_id:
            return error_response(400, 'MISSING_LOCATION_ID', 'Location ID is required')

        # Delete from DynamoDB
        table.delete_item(
            Key={
                'cognitoSub': cognito_sub,
                'locationId': location_id
            }
        )

        return success_response({'message': 'Location deleted successfully'})

    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return error_response(500, 'DATABASE_ERROR', 'Error deleting location')


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
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
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
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
        },
        'body': json.dumps({
            'success': False,
            'error': {
                'code': error_code,
                'message': message
            }
        })
    }
