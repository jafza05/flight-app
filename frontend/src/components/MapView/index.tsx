/**
 * MapView - Google Maps component showing aircraft positions
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AircraftWithDistance } from '../../types/aircraft';
import styles from './MapView.module.css';

interface MapViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  aircraft: AircraftWithDistance[];
  selectedIndex: number;
  searchRadius: number;
  onAircraftClick?: (index: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  aircraft,
  selectedIndex,
  searchRadius,
  onAircraftClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !userLocation || !window.google?.maps) {
      return;
    }

    try {
      // Create map centered on user location
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        zoom: 11,
        mapTypeId: 'terrain',
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        fullscreenControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      googleMapRef.current = map;

      // Add user location marker
      new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        zIndex: 1000
      });

      // Add search radius circle
      const circle = new google.maps.Circle({
        map,
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        radius: searchRadius * 1609.34, // miles to meters
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 2
      });

      circleRef.current = circle;

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to load map');
    }
  }, [userLocation]);

  // Update search radius circle
  useEffect(() => {
    if (circleRef.current && userLocation) {
      circleRef.current.setRadius(searchRadius * 1609.34);
    }
  }, [searchRadius, userLocation]);

  // Update aircraft markers
  useEffect(() => {
    if (!googleMapRef.current || !userLocation) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for each aircraft
    aircraft.forEach((ac, index) => {
      const isSelected = index === selectedIndex;
      const isApproaching = ac.is_approaching;

      // Determine color based on approach status
      const fillColor = isApproaching ? '#34A853' : '#EA4335'; // Green for approaching, red for departing
      const scale = isSelected ? 12 : 8;

      const marker = new google.maps.Marker({
        position: { lat: ac.latitude, lng: ac.longitude },
        map: googleMapRef.current,
        title: `${ac.callsign || ac.flight_number || 'Unknown'} - ${ac.origin_airport_iata || '???'} → ${ac.destination_airport_iata || '???'}`,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: scale,
          fillColor: fillColor,
          fillOpacity: isSelected ? 1 : 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: isSelected ? 3 : 1.5,
          rotation: ac.heading
        },
        zIndex: isSelected ? 999 : 100 + index,
        optimized: false
      });

      // Add click handler
      marker.addListener('click', () => {
        if (onAircraftClick) {
          onAircraftClick(index);
        }
      });

      // Add info window on hover
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
            <strong style="font-size: 14px; color: #202124;">
              ${ac.callsign || ac.flight_number || 'Unknown'}
            </strong>
            <div style="color: #5f6368; font-size: 12px; margin-top: 4px;">
              ${ac.origin_airport_iata || '???'} → ${ac.destination_airport_iata || '???'}
            </div>
            <div style="color: #5f6368; font-size: 11px; margin-top: 4px;">
              ${ac.distance_mi.toFixed(1)} mi ${isApproaching ? '→ Approaching' : '← Departing'}
            </div>
            <div style="color: #5f6368; font-size: 11px;">
              ${ac.altitude_ft.toLocaleString()} ft • ${ac.speed_kts} kts
            </div>
          </div>
        `
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
    });
  }, [aircraft, selectedIndex, userLocation, onAircraftClick]);

  // Center on selected aircraft
  useEffect(() => {
    if (googleMapRef.current && aircraft[selectedIndex]) {
      const selectedAircraft = aircraft[selectedIndex];
      googleMapRef.current.panTo({
        lat: selectedAircraft.latitude,
        lng: selectedAircraft.longitude
      });
    }
  }, [selectedIndex, aircraft]);

  if (mapError) {
    return (
      <div className={styles.mapError}>
        <p>Error loading map: {mapError}</p>
        <p>Please check your internet connection and Google Maps API key.</p>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className={styles.mapPlaceholder}>
        <p>Waiting for location data...</p>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <div ref={mapRef} className={styles.map} />
      <div className={styles.mapLegend}>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon} style={{ background: '#34A853' }} />
          <span>Approaching</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon} style={{ background: '#EA4335' }} />
          <span>Departing</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendIcon} style={{ background: '#4285F4' }} />
          <span>Your Location</span>
        </div>
      </div>
    </div>
  );
};
