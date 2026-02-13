/**
 * MiniMap - Compact Leaflet map showing user location and aircraft position
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAirplaneIconHTML } from '../../utils/planeIcon';
import styles from './MiniMap.module.css';

interface MiniMapProps {
  userLocation: { latitude: number; longitude: number };
  aircraftLocation: { latitude: number; longitude: number };
  aircraftHeading: number;
  isApproaching: boolean;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  userLocation,
  aircraftLocation,
  aircraftHeading,
  isApproaching
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const aircraftMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('🗺️ Initializing Leaflet map...');

    try {
      // Create map centered between user and aircraft
      const centerLat = (userLocation.latitude + aircraftLocation.latitude) / 2;
      const centerLon = (userLocation.longitude + aircraftLocation.longitude) / 2;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([centerLat, centerLon], 10);

      // Add dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: ''
      }).addTo(map);

      mapRef.current = map;

      // Wait for tiles to load
      map.whenReady(() => {
        console.log('✅ Map ready');
        setMapReady(true);
      });

    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        aircraftMarkerRef.current = null;
      }
    };
  }, []);

  // Add/update markers when map is ready
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Add or update user marker (blue dot)
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      userMarkerRef.current = L.circleMarker(
        [userLocation.latitude, userLocation.longitude],
        {
          radius: 10,
          fillColor: '#4285F4',
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 1,
        }
      ).addTo(mapRef.current);
      console.log('✅ User marker added');
    }

    // Create custom aircraft icon
    const color = isApproaching ? '#34A853' : '#EA4335';
    const aircraftIcon = L.divIcon({
      html: getAirplaneIconHTML(aircraftHeading, color, 32),
      className: styles.aircraftIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // Add or update aircraft marker
    if (aircraftMarkerRef.current) {
      aircraftMarkerRef.current.setLatLng([aircraftLocation.latitude, aircraftLocation.longitude]);
      aircraftMarkerRef.current.setIcon(aircraftIcon);
    } else {
      aircraftMarkerRef.current = L.marker(
        [aircraftLocation.latitude, aircraftLocation.longitude],
        { icon: aircraftIcon }
      ).addTo(mapRef.current);
      console.log('✅ Aircraft marker added');
    }

    // Fit bounds to show both markers
    const bounds = L.latLngBounds(
      [userLocation.latitude, userLocation.longitude],
      [aircraftLocation.latitude, aircraftLocation.longitude]
    );
    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });

  }, [mapReady, userLocation, aircraftLocation, aircraftHeading, isApproaching]);

  return <div ref={mapContainerRef} className={styles.mapContainer} />;
};
