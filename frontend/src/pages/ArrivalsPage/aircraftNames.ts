/**
 * Fallback ICAO type code -> friendly name lookup, used when the backend
 * doesn't have a DynamoDB model match for a given aircraft code.
 */
export const AIRCRAFT_NAME_FALLBACK: Record<string, string> = {
  // Widebodies
  A332: 'Airbus A330-200', A333: 'Airbus A330-300', A337: 'Airbus A330-700 Beluga',
  A338: 'Airbus A330-800', A339: 'Airbus A330-900',
  A342: 'Airbus A340-200', A343: 'Airbus A340-300', A345: 'Airbus A340-500', A346: 'Airbus A340-600',
  A359: 'Airbus A350-900', A35K: 'Airbus A350-1000',
  A380: 'Airbus A380', A388: 'Airbus A380-800',
  B762: 'Boeing 767-200', B763: 'Boeing 767-300', B764: 'Boeing 767-400',
  B772: 'Boeing 777-200', B773: 'Boeing 777-300', B77L: 'Boeing 777-200LR', B77W: 'Boeing 777-300ER',
  B788: 'Boeing 787-8 Dreamliner', B789: 'Boeing 787-9 Dreamliner', B78X: 'Boeing 787-10 Dreamliner',
  B741: 'Boeing 747-100', B742: 'Boeing 747-200', B743: 'Boeing 747-300', B744: 'Boeing 747-400',
  B748: 'Boeing 747-8', B74D: 'Boeing 747-400 (Domestic)', B74R: 'Boeing 747SR', B74S: 'Boeing 747SP',
  DC10: 'McDonnell Douglas DC-10', MD11: 'McDonnell Douglas MD-11', L101: 'Lockheed L-1011 TriStar',
  IL86: 'Ilyushin Il-86', IL96: 'Ilyushin Il-96',
  A124: 'Antonov An-124 Ruslan', A225: 'Antonov An-225 Mriya', C5M: 'Lockheed C-5M Super Galaxy', C5: 'Lockheed C-5 Galaxy',

  // Business/private jets
  GLF4: 'Gulfstream IV', GLF5: 'Gulfstream V', GLF6: 'Gulfstream G650',
  GALX: 'Gulfstream G200', G150: 'Gulfstream G150', G200: 'Gulfstream G200',
  G250: 'Gulfstream G250', G280: 'Gulfstream G280',
  GL5T: 'Bombardier Global 5000', GLEX: 'Bombardier Global Express', GL6T: 'Bombardier Global 6000',
  GL7T: 'Bombardier Global 7500', G650: 'Gulfstream G650', G700: 'Gulfstream G700',
  CL30: 'Bombardier Challenger 300', CL35: 'Bombardier Challenger 350', CL60: 'Bombardier Challenger 600',
  CL600: 'Bombardier Challenger 600', BD700: 'Bombardier Global Express',
  C25A: 'Cessna Citation CJ2', C25B: 'Cessna Citation CJ3', C25C: 'Cessna Citation CJ4',
  C500: 'Cessna Citation I', C510: 'Cessna Citation Mustang', C525: 'Cessna CitationJet',
  C550: 'Cessna Citation II', C560: 'Cessna Citation V', C56X: 'Cessna Citation Excel/XLS',
  C650: 'Cessna Citation III/VI/VII', C680: 'Cessna Citation Sovereign', C68A: 'Cessna Citation Latitude',
  C700: 'Cessna Citation Longitude', C750: 'Cessna Citation X',
  FA10: 'Dassault Falcon 10', FA20: 'Dassault Falcon 20', FA50: 'Dassault Falcon 50',
  FA6X: 'Dassault Falcon 6X', FA7X: 'Dassault Falcon 7X', FA8X: 'Dassault Falcon 8X',
  F2TH: 'Dassault Falcon 2000', F900: 'Dassault Falcon 900',
  LJ31: 'Learjet 31', LJ35: 'Learjet 35', LJ40: 'Learjet 40', LJ45: 'Learjet 45',
  LJ55: 'Learjet 55', LJ60: 'Learjet 60', LJ75: 'Learjet 75',
  E50P: 'Embraer Phenom 100', E55P: 'Embraer Phenom 300', EA50: 'Embraer Phenom 100', ELIT: 'Embraer Legacy',
  H25A: 'Hawker 800', H25B: 'Hawker 800', H25C: 'Hawker 800XP', HA4T: 'Hawker 400',
  BE40: 'Beechjet 400', PRM1: 'Raytheon Premier I',
  PC24: 'Pilatus PC-24', HDJT: 'HondaJet', P180: 'Piaggio P.180 Avanti',
  VC25: 'Boeing VC-25 (Air Force One)', E4B: 'Boeing E-4B Nightwatch',

  // Common mainline / regional (shown as-is, mostly for completeness)
  A319: 'Airbus A319', A320: 'Airbus A320', A321: 'Airbus A321',
  A20N: 'Airbus A320neo', A21N: 'Airbus A321neo', BCS1: 'Airbus A220-100', BCS3: 'Airbus A220-300',
  B737: 'Boeing 737', B738: 'Boeing 737-800', B739: 'Boeing 737-900', B38M: 'Boeing 737 MAX 8', B39M: 'Boeing 737 MAX 9',
  B752: 'Boeing 757-200', B753: 'Boeing 757-300',
  E170: 'Embraer E170', E175: 'Embraer E175', E75L: 'Embraer 175 (Long)', E75S: 'Embraer 175 (Short)', E190: 'Embraer E190', E195: 'Embraer E195',
  CRJ2: 'Bombardier CRJ200', CRJ7: 'Bombardier CRJ700', CRJ9: 'Bombardier CRJ900',
  DH8D: 'De Havilland Dash 8-400', AT72: 'ATR 72', AT76: 'ATR 72-600',
};
