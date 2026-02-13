/**
 * User settings and configuration types
 */

export type DistanceUnit = 'mi' | 'km' | 'nm';  // miles, kilometers, nautical miles
export type AltitudeUnit = 'ft' | 'm';          // feet, meters
export type SpeedUnit = 'kts' | 'mph' | 'kmh';  // knots, miles/hour, km/hour
export type TemperatureUnit = 'F' | 'C';        // Fahrenheit, Celsius

export type RadiusMode = 'auto' | 'manual';
export type LayoutMode = 'hero' | 'grid' | 'split';

export interface UnitPreferences {
  distance: DistanceUnit;
  altitude: AltitudeUnit;
  speed: SpeedUnit;
  temperature: TemperatureUnit;
}

export interface SearchSettings {
  radius_mode: RadiusMode;
  radius_value_mi: number;           // Used when radius_mode is 'manual'
  radius_min_mi: number;             // Minimum radius (default: 5)
  radius_max_mi: number;             // Maximum radius (default: 200)
  auto_expand_increment_mi: number;  // How much to expand (default: 5)
  auto_target_aircraft: number;      // Target number of aircraft (default: 3)
  max_auto_expand_attempts: number;  // Maximum expansion attempts (default: 10)
}

export interface DisplaySettings {
  layout_mode: LayoutMode;
  max_aircraft: number;              // 1-10
  auto_switch_to_closest: boolean;   // Auto-select closest aircraft in hero mode
  show_distance_rings: boolean;
  show_aircraft_trails: boolean;
  center_on_user: boolean;
}

export interface RefreshSettings {
  interval_seconds: number;          // Refresh interval (5-60 seconds)
  auto_refresh: boolean;
}

export interface AccessibilitySettings {
  reduced_motion: boolean;           // Disable animations
  sound_effects: boolean;            // Split-flap click sounds
  high_contrast: boolean;            // Extra contrast for readability
}

export interface AppSettings {
  units: UnitPreferences;
  search: SearchSettings;
  display: DisplaySettings;
  refresh: RefreshSettings;
  accessibility: AccessibilitySettings;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  units: {
    distance: 'mi',
    altitude: 'ft',
    speed: 'kts',
    temperature: 'F'
  },
  search: {
    radius_mode: 'auto',
    radius_value_mi: 5,                // 5 miles default
    radius_min_mi: 5,
    radius_max_mi: 200,                // Max 200 miles
    auto_expand_increment_mi: 5,       // Expand by 5 miles
    auto_target_aircraft: 3,
    max_auto_expand_attempts: 10       // Try up to 10 times (5→50mi)
  },
  display: {
    layout_mode: 'hero',
    max_aircraft: 5,
    auto_switch_to_closest: true,
    show_distance_rings: true,
    show_aircraft_trails: true,
    center_on_user: true
  },
  refresh: {
    interval_seconds: 15,
    auto_refresh: true
  },
  accessibility: {
    reduced_motion: false,
    sound_effects: false,
    high_contrast: false
  }
};

// Preset configurations
export const UNIT_PRESETS = {
  standard: {
    distance: 'mi' as DistanceUnit,
    altitude: 'ft' as AltitudeUnit,
    speed: 'kts' as SpeedUnit,
    temperature: 'F' as TemperatureUnit
  },
  metric: {
    distance: 'km' as DistanceUnit,
    altitude: 'm' as AltitudeUnit,
    speed: 'kmh' as SpeedUnit,
    temperature: 'C' as TemperatureUnit
  },
  aviation: {
    distance: 'nm' as DistanceUnit,
    altitude: 'ft' as AltitudeUnit,
    speed: 'kts' as SpeedUnit,
    temperature: 'C' as TemperatureUnit
  }
};
