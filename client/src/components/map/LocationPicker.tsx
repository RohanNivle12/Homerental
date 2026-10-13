import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Search } from 'lucide-react';
import { LeafletLocationPicker } from './LeafletLocationPicker';

export interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  address?: string;
}

const GoogleLocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  address = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [, setMap] = useState<google.maps.Map | null>(null);
  const [, setMarker] = useState<google.maps.Marker | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!apiKey) {
      setLoadFailed(true);
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    loader
      .load()
      .then(() => {
        if (!mapContainerRef.current) return;

        const initialPos = {
          lat: latitude || 12.9716,
          lng: longitude || 77.5946,
        };

        const gMap = new google.maps.Map(mapContainerRef.current, {
          center: initialPos,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
        });

        const gMarker = new google.maps.Marker({
          position: initialPos,
          map: gMap,
          draggable: true,
          title: 'Drag to adjust exact property location',
        });

        // Click map to reposition marker
        gMap.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            gMarker.setPosition(e.latLng);
            onLocationChange(lat, lng);
          }
        });

        // Drag marker listener
        gMarker.addListener('dragend', () => {
          const pos = gMarker.getPosition();
          if (pos) {
            onLocationChange(pos.lat(), pos.lng());
          }
        });

        // Autocomplete search box
        if (searchInputRef.current && window.google?.maps?.places) {
          const autocomplete = new google.maps.places.Autocomplete(
            searchInputRef.current,
            { fields: ['geometry', 'formatted_address', 'name'] }
          );

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              gMap.setCenter(place.geometry.location);
              gMap.setZoom(16);
              gMarker.setPosition(place.geometry.location);
              onLocationChange(lat, lng, place.formatted_address || place.name);
            }
          });
        }

        setMap(gMap);
        setMarker(gMarker);
      })
      .catch(() => setLoadFailed(true));
  }, [apiKey]);

  if (loadFailed) {
    // Fall back to Leaflet if Google fails to load
    return (
      <LeafletLocationPicker
        latitude={latitude}
        longitude={longitude}
        onLocationChange={onLocationChange}
        address={address}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input for Places */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          defaultValue={address}
          placeholder="Search locality, apartment or landmark on Google Maps..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        />
      </div>

      {/* Map Container */}
      <div className="relative h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[11px] font-semibold text-slate-700 shadow-sm">
          Drag the pin to adjust exact entrance or gate
        </div>
      </div>

      {/* Coordinate Display & Manual Adjustment */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="0.0001"
            value={latitude || ''}
            onChange={(e) => onLocationChange(parseFloat(e.target.value) || 0, longitude)}
            placeholder="12.9716"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Longitude
          </label>
          <input
            type="number"
            step="0.0001"
            value={longitude || ''}
            onChange={(e) => onLocationChange(latitude, parseFloat(e.target.value) || 0)}
            placeholder="77.5946"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            required
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Unified LocationPicker component that automatically defaults to Leaflet (OpenStreetMap)
 * or Google Maps if configured in environment variables.
 */
export const LocationPicker: React.FC<LocationPickerProps> = (props) => {
  const mapProvider = (import.meta.env.VITE_MAP_PROVIDER || 'osm').toLowerCase();
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (mapProvider === 'google' && googleApiKey) {
    return <GoogleLocationPicker {...props} />;
  }

  return <LeafletLocationPicker {...props} />;
};

export default LocationPicker;
