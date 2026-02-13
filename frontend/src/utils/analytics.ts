/**
 * Google Analytics 4 Integration
 *
 * Tracks page views and custom events
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Get GA4 Measurement ID from environment variable
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics
 * Call this once when the app loads
 */
export function initAnalytics() {
  if (window.gtag) return; // Already initialized

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'disabled') {
    console.log('📊 Analytics disabled (no measurement ID)');
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.onerror = () => {
    console.error('❌ Failed to load Google Analytics script. Check for ad blockers.');
  };
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    debug_mode: import.meta.env.DEV, // Enable debug mode for local development
  });

  console.log('📊 Google Analytics initialized:', GA_MEASUREMENT_ID);
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!window.gtag) {
    console.warn('Analytics not initialized');
    return;
  }

  window.gtag('event', eventName, params);
  console.log('📊 Event tracked:', eventName, params);
}

/**
 * Track page view
 */
export function trackPageView(pagePath: string, pageTitle: string) {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/**
 * Track flight search
 */
export function trackFlightSearch(params: {
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  aircraftCount: number;
}) {
  trackEvent('flight_search', {
    location: params.location,
    radius_mi: params.radius,
    aircraft_found: params.aircraftCount,
  });
}

/**
 * Track aircraft selection
 */
export function trackAircraftView(params: {
  airline?: string;
  aircraft_type?: string;
  distance_mi: number;
  is_approaching: boolean;
}) {
  trackEvent('aircraft_view', params);
}

/**
 * Track airport quick select
 */
export function trackAirportQuickSelect(airportCode: string, airportName: string) {
  trackEvent('airport_quick_select', {
    airport_code: airportCode,
    airport_name: airportName,
  });
}

/**
 * Track theme change
 */
export function trackThemeChange(themeName: string) {
  trackEvent('theme_change', {
    theme: themeName,
  });
}

/**
 * Track settings opened
 */
export function trackSettingsOpen() {
  trackEvent('settings_open');
}

/**
 * Track idle prompt shown
 */
export function trackIdlePrompt(action: 'shown' | 'continue' | 'pause') {
  trackEvent('idle_prompt', { action });
}
