
import React, { useEffect, useRef } from 'react';
import { Coordinates } from '../types';

interface MapDisplayProps {
  onLocationSelect: (coords: Coordinates, name?: string) => void;
  initialCoords?: Coordinates | null;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ onLocationSelect, initialCoords }) => {
  const mapRef = useRef<any>(null); // Leaflet map instance
  const markerRef = useRef<any>(null); // Leaflet marker instance
  const mapContainerRef = useRef<HTMLDivElement>(null); // DOM element for map

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) { // Initialize map only once
      const map = L.map(mapContainerRef.current).setView([20, 0], 2); // Default view
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onLocationSelect({ lat, lng });
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(map);
        }
        map.setView(e.latlng, 13); // Zoom in on selected location
      });
      mapRef.current = map;
    }

    // Handle initialCoords or subsequent changes to selectedCoords from App
    if (mapRef.current && initialCoords) {
      const { lat, lng } = initialCoords;
      const latLng = L.latLng(lat, lng);
      mapRef.current.setView(latLng, 13);
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng).addTo(mapRef.current);
      }
    } else if (mapRef.current && !initialCoords && markerRef.current) {
      // If initialCoords becomes null (e.g. after a named search), remove marker
      // mapRef.current.removeLayer(markerRef.current);
      // markerRef.current = null;
      // mapRef.current.setView([20,0], 2); // Reset view
      // For this app, let's keep the marker if it was set by a previous coordinate search.
      // A named search won't clear it unless explicitly handled.
    }
     // Invalidate size when container might have resized
     const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

    return () => {
      // Don't destroy map on unmount to preserve state if component re-renders quickly
      // if (mapRef.current) {
      //   mapRef.current.remove();
      //   mapRef.current = null; 
      // }
       if (mapContainerRef.current) {
        resizeObserver.unobserve(mapContainerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoords, onLocationSelect]); // Rerun if initialCoords changes or onLocationSelect changes (though latter is less likely)


  return <div ref={mapContainerRef} className="leaflet-container" />;
};
