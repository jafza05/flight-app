#!/usr/bin/env python3
"""
Explore FlightRadarAPI to understand the data structure
This will help us define TypeScript types for the frontend
"""

import json
from datetime import datetime
from FlightRadar24 import FlightRadar24API

def explore_flight_data():
    """Fetch sample flight data and print structure"""

    print("🛫 Initializing FlightRadar24 API...")
    fr_api = FlightRadar24API()

    # Test coordinates: San Francisco area
    # Format: "y1,y2,x1,x2" (south,north,west,east)
    bounds = "37.7,37.8,-122.5,-122.3"

    print(f"\n📍 Fetching flights in San Francisco area...")
    print(f"   Bounds: {bounds}")

    # Get flights in the area
    flights = fr_api.get_flights(bounds=bounds)

    print(f"\n✅ Found {len(flights)} flights")

    if flights:
        # Get detailed info for first flight
        sample_flight = flights[0]

        print("\n" + "="*80)
        print("📊 SAMPLE FLIGHT DATA STRUCTURE")
        print("="*80)

        # Print all available attributes
        print("\nAvailable attributes:")
        for attr in dir(sample_flight):
            if not attr.startswith('_'):
                try:
                    value = getattr(sample_flight, attr)
                    if not callable(value):
                        print(f"  {attr}: {value} ({type(value).__name__})")
                except:
                    pass

        # Try to get flight details
        print("\n" + "="*80)
        print("🔍 DETAILED FLIGHT INFO")
        print("="*80)

        try:
            flight_id = sample_flight.id
            details = fr_api.get_flight_details(flight_id)

            if details:
                print("\nFlight Details Structure:")
                print(json.dumps(details, indent=2, default=str))
        except Exception as e:
            print(f"Could not fetch flight details: {e}")

        # Create our data model based on what we find
        print("\n" + "="*80)
        print("📝 PROPOSED DATA MODEL")
        print("="*80)

        flight_data = {
            'id': getattr(sample_flight, 'id', None),
            'callsign': getattr(sample_flight, 'callsign', None),
            'registration': getattr(sample_flight, 'registration', None),
            'aircraft_code': getattr(sample_flight, 'aircraft_code', None),
            'airline_iata': getattr(sample_flight, 'airline_iata', None),
            'airline_icao': getattr(sample_flight, 'airline_icao', None),
            'flight_number': getattr(sample_flight, 'number', None),

            # Position
            'latitude': getattr(sample_flight, 'latitude', None),
            'longitude': getattr(sample_flight, 'longitude', None),
            'altitude': getattr(sample_flight, 'altitude', None),
            'heading': getattr(sample_flight, 'heading', None),
            'ground_speed': getattr(sample_flight, 'ground_speed', None),
            'vertical_speed': getattr(sample_flight, 'vertical_speed', None),

            # Route
            'origin_airport_iata': getattr(sample_flight, 'origin_airport_iata', None),
            'destination_airport_iata': getattr(sample_flight, 'destination_airport_iata', None),

            # Additional
            'squawk': getattr(sample_flight, 'squawk', None),
            'on_ground': getattr(sample_flight, 'on_ground', None),
            'timestamp': getattr(sample_flight, 'time', None),
        }

        print("\nOur Flight Data Model:")
        print(json.dumps(flight_data, indent=2, default=str))

    else:
        print("\n⚠️  No flights found. Try a different area or time.")

    # Test airport lookup
    print("\n" + "="*80)
    print("🛬 TESTING AIRPORT DATA")
    print("="*80)

    try:
        airports = fr_api.get_airports()
        if airports:
            # Get SFO details
            sfo = next((a for a in airports if a.iata == 'SFO'), None)
            if sfo:
                print("\nSFO Airport Details:")
                for attr in dir(sfo):
                    if not attr.startswith('_'):
                        try:
                            value = getattr(sfo, attr)
                            if not callable(value):
                                print(f"  {attr}: {value}")
                        except:
                            pass
    except Exception as e:
        print(f"Could not fetch airport data: {e}")

if __name__ == '__main__':
    try:
        explore_flight_data()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
