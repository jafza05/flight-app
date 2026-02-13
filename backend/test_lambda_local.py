#!/usr/bin/env python3
"""
Test the Lambda function locally without deploying
"""

import json
import sys
import os

# Add paths
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'shared'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lambda/flight_search'))

from handler import lambda_handler


def test_flight_search():
    """Test the flight search Lambda function"""

    print("🧪 Testing FlightSearch Lambda Function Locally")
    print("=" * 80)

    # Test event - simulating API Gateway POST request
    test_event = {
        'body': json.dumps({
            'user_latitude': 37.7749,   # San Francisco
            'user_longitude': -122.4194,
            'radius_mi': 10,
            'max_aircraft': 5,
            'radius_mode': 'auto'
        }),
        'httpMethod': 'POST',
        'headers': {
            'Content-Type': 'application/json'
        }
    }

    # Mock context
    class MockContext:
        function_name = 'FlightSearch-Test'
        request_id = 'test-request-123'
        invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:FlightSearch-Test'

    context = MockContext()

    # Call the handler
    print("\n📤 Request:")
    print(json.dumps(json.loads(test_event['body']), indent=2))

    print("\n⚙️  Invoking Lambda handler...")
    response = lambda_handler(test_event, context)

    print("\n📥 Response:")
    print(f"Status Code: {response['statusCode']}")
    print(f"Headers: {json.dumps(response['headers'], indent=2)}")

    # Parse and pretty-print body
    body = json.loads(response['body'])
    print(f"\nBody:")
    print(json.dumps(body, indent=2))

    # Validate response structure
    print("\n✅ Validation:")

    assert response['statusCode'] == 200, "Expected status code 200"
    print("  ✓ Status code is 200")

    assert 'aircraft' in body, "Response should contain 'aircraft'"
    print(f"  ✓ Response contains {len(body['aircraft'])} aircraft")

    assert 'search_radius_mi' in body, "Response should contain search_radius_mi"
    print(f"  ✓ Search radius: {body['search_radius_mi']} mi")

    assert 'aircraft_count' in body, "Response should contain aircraft_count"
    print(f"  ✓ Aircraft count: {body['aircraft_count']}")

    # Check first aircraft data structure
    if body['aircraft']:
        first_aircraft = body['aircraft'][0]
        print(f"\n  First Aircraft Details:")
        print(f"    Callsign: {first_aircraft.get('callsign')}")
        print(f"    Flight: {first_aircraft.get('flight_number')}")
        print(f"    Route: {first_aircraft.get('origin_airport_iata')} → {first_aircraft.get('destination_airport_iata')}")
        print(f"    Distance: {first_aircraft.get('distance_mi'):.2f} mi")
        print(f"    3D Distance: {first_aircraft.get('distance_3d_mi'):.2f} mi")
        print(f"    Altitude: {first_aircraft.get('altitude_ft')} ft ({first_aircraft.get('altitude_m')} m)")
        print(f"    Speed: {first_aircraft.get('speed_kts')} kts ({first_aircraft.get('speed_mph')} mph)")
        print(f"    Approaching: {first_aircraft.get('is_approaching')}")
        print(f"    Proximity Score: {first_aircraft.get('proximity_score'):.4f}")

    print("\n" + "=" * 80)
    print("✅ All tests passed!")
    print("\nReady to deploy to AWS using SAM!")


if __name__ == '__main__':
    try:
        test_flight_search()
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
