"""
Aircraft classification for plane-spotting purposes.

Tags each aircraft as widebody / private jet / rare-and-special so the
frontend can highlight the interesting catches (private jets, unique
airframes, and large widebodies) rather than just listing raw flights.
"""

from typing import Dict, Optional

# Twin-aisle (widebody) ICAO type codes
WIDEBODY_CODES = {
    # Airbus A300/A310 (mostly freighters now, e.g. FedEx)
    'A306', 'A30B', 'A310',
    # Airbus A330
    'A332', 'A333', 'A337', 'A338', 'A339',
    # Airbus A340
    'A342', 'A343', 'A345', 'A346',
    # Airbus A350
    'A359', 'A35K',
    # Airbus A380
    'A380', 'A388',
    # Boeing 767
    'B762', 'B763', 'B764',
    # Boeing 777
    'B772', 'B773', 'B77L', 'B77W',
    # Boeing 787
    'B788', 'B789', 'B78X',
    # Boeing 747
    'B741', 'B742', 'B743', 'B744', 'B748', 'B74D', 'B74R', 'B74S',
    # Older / cargo widebodies still occasionally seen
    'DC10', 'MD11', 'L101', 'IL86', 'IL96',
    # Ultra-rare freighters
    'A124', 'A225', 'C5M', 'C5',
}

# Business / private jet ICAO type codes
PRIVATE_JET_CODES = {
    # Gulfstream
    'GLF4', 'GLF5', 'GLF6', 'GALX', 'G150', 'G200', 'G250', 'G280',
    'GL5T', 'GLEX', 'GL6T', 'GL7T', 'G650', 'G700',
    # Bombardier Challenger / Global
    'CL30', 'CL35', 'CL60', 'CL600', 'BD700',
    # Cessna Citation
    'C25A', 'C25B', 'C25C', 'C500', 'C510', 'C525', 'C550', 'C560',
    'C56X', 'C650', 'C680', 'C68A', 'C700', 'C750',
    # Dassault Falcon
    'FA10', 'FA20', 'FA50', 'FA6X', 'FA7X', 'FA8X', 'F2TH', 'F900',
    # Learjet
    'LJ31', 'LJ35', 'LJ40', 'LJ45', 'LJ55', 'LJ60', 'LJ75',
    # Embraer business jets
    'E50P', 'E55P', 'EA50', 'ELIT',
    # Hawker / Beechcraft
    'H25A', 'H25B', 'H25C', 'HA4T', 'BE40', 'PRM1',
    # Pilatus / Honda / Piaggio
    'PC24', 'HDJT', 'P180',
}

# Rare / especially exciting catches (mostly a subset already flagged as
# widebody, but called out separately since they're the "stop what you're
# doing and grab the camera" sightings)
RARE_CODES = {
    'A380', 'A388',
    'B741', 'B742', 'B743', 'B744', 'B748', 'B74D', 'B74R', 'B74S',
    'A342', 'A343', 'A345', 'A346',
    'DC10', 'MD11', 'L101', 'IL86', 'IL96',
    'A124', 'A225', 'C5M', 'C5',
    'VC25', 'E4B', 'CONC',
}


def classify_aircraft(
    aircraft_code: Optional[str],
    airline_iata: Optional[str],
    flight_number: Optional[str],
) -> Dict[str, object]:
    """
    Classify a flight for plane-spotting interest.

    Returns a dict with:
      is_widebody, is_private_jet, is_rare: bool flags
      category: single human-readable label for display
      spotting_tags: list of badge labels, most-interesting first
    """
    code = (aircraft_code or '').upper()

    is_widebody = code in WIDEBODY_CODES
    is_rare = code in RARE_CODES
    is_known_private_jet = code in PRIVATE_JET_CODES

    # No airline + no flight number is the classic signature of a
    # non-scheduled (private/GA) flight, even if the type code isn't in
    # our curated business-jet list (e.g. piston/turboprop GA traffic).
    looks_like_private_flight = not airline_iata and not flight_number
    is_private_jet = is_known_private_jet or looks_like_private_flight

    tags = []
    if is_rare:
        tags.append('Rare Find')
    if is_widebody:
        tags.append('Widebody')
    if is_private_jet:
        tags.append('Private Jet' if is_known_private_jet else 'Private/GA')

    if is_rare:
        category = 'Rare/Special'
    elif is_widebody:
        category = 'Widebody'
    elif is_private_jet:
        category = 'Private Jet' if is_known_private_jet else 'Private/GA'
    else:
        category = 'Mainline/Regional'

    return {
        'is_widebody': is_widebody,
        'is_private_jet': is_private_jet,
        'is_rare': is_rare,
        'category': category,
        'spotting_tags': tags,
    }
