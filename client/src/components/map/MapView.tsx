import React from 'react';
import { Property } from '../../types';
import { LeafletMapView } from './LeafletMapView';
import { GoogleMapView } from './GoogleMapView';

export interface MapViewProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string | null) => void;
  onBoundsChange?: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

/**
 * Unified MapView component that automatically selects Leaflet (OpenStreetMap)
 * or Google Maps based on environment configuration (VITE_MAP_PROVIDER and VITE_GOOGLE_MAPS_API_KEY).
 * Defaults to LeafletMapView for zero API key dependency.
 */
export const MapView: React.FC<MapViewProps> = (props) => {
  const mapProvider = (import.meta.env.VITE_MAP_PROVIDER || 'osm').toLowerCase();
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (mapProvider === 'google' && googleApiKey) {
    return <GoogleMapView {...props} />;
  }

  return <LeafletMapView {...props} />;
};

export default MapView;
