import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, Navigation, AlertCircle } from 'lucide-react';

interface LeafletLocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  address?: string;
}

export const LeafletLocationPicker: React.FC<LeafletLocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  address = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState(address);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const initialLat = latitude && !isNaN(latitude) && latitude !== 0 ? latitude : 12.9716;
  const initialLng = longitude && !isNaN(longitude) && longitude !== 0 ? longitude : 77.5946;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom draggable pin icon
    const pinIcon = L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div class="relative cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-full">
          <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="w-2 h-2 bg-blue-600 mx-auto -mt-1 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    // Click map to reposition marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      onLocationChange(lat, lng);
    });

    // Drag marker event
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onLocationChange(position.lat, position.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && latitude && longitude) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - latitude) > 0.0001 || Math.abs(currentPos.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // Search Address via OpenStreetMap Nominatim Free Geocoder
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      const query = encodeURIComponent(`${searchQuery}, India`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
        headers: {
          'Accept-Language': 'en',
        },
      });

      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 15);
          markerRef.current.setLatLng([newLat, newLng]);
        }
        onLocationChange(newLat, newLng, item.display_name);
      } else {
        setSearchError('Location not found. Try searching with city or postal code.');
      }
    } catch (err) {
      setSearchError('Search service unavailable. You can click on the map or enter coordinates directly.');
    } finally {
      setSearching(false);
    }
  };

  // Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 15);
          markerRef.current.setLatLng([userLat, userLng]);
        }
        onLocationChange(userLat, userLng);
      },
      () => {
        alert('Could not retrieve current location.');
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Input for OpenStreetMap Address Lookup */}
      <form onSubmit={handleSearchAddress} className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, town, village, locality, or landmark in India..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Find on Map'}
        </button>
      </form>

      {searchError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Leaflet Map Container */}
      <div className="relative h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Locate Me Floating Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          title="Use my current location"
          className="absolute top-2 right-2 z-10 p-2 bg-white/95 backdrop-blur-md rounded-lg shadow-sm text-slate-700 hover:text-blue-600 border border-gray-200"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>

        <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[11px] font-semibold text-slate-700 shadow-sm border border-gray-200">
          Click anywhere or drag the pin to set entrance / gate position
        </div>
      </div>

      {/* Manual Coordinate Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
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
            step="0.000001"
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
