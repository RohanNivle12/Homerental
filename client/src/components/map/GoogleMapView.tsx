import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Property } from '../../types';
import { MapPin, AlertCircle, Navigation, ExternalLink } from 'lucide-react';

interface GoogleMapViewProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string | null) => void;
  onBoundsChange?: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onBoundsChange,
  center = { lat: 12.9716, lng: 77.5946 }, // Default Bangalore center
  zoom = 12,
  className = 'w-full h-full min-h-[450px]',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Initialize Map
  useEffect(() => {
    if (!apiKey) {
      setApiKeyMissing(true);
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
        if (!mapRef.current) return;
        const gMap = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        // Listen for map movements (pan / zoom)
        gMap.addListener('idle', () => {
          const bounds = gMap.getBounds();
          if (bounds && onBoundsChange) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onBoundsChange({
              neLat: ne.lat(),
              neLng: ne.lng(),
              swLat: sw.lat(),
              swLng: sw.lng(),
            });
          }
        });

        setMap(gMap);
      })
      .catch((err) => {
        console.warn('Google Maps failed to load:', err);
        setApiKeyMissing(true);
      });
  }, [apiKey]);

  // Update Markers when properties change
  useEffect(() => {
    if (!map || apiKeyMissing || !window.google) return;

    // Clear existing markers
    markers.forEach((m) => m.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    properties.forEach((p) => {
      if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return;

      const pos = { lat: p.latitude, lng: p.longitude };
      bounds.extend(pos);

      const isSelected = p.id === selectedPropertyId;

      // Custom SVG marker pin
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: p.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 8,
          fillColor: isSelected ? '#2563EB' : '#0F172A',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // Info window content
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 6px; max-width: 200px; font-family: sans-serif;">
            <div style="font-weight: 700; font-size: 13px; color: #0F172A; margin-bottom: 3px;">
              ₹${Number(p.monthlyRent).toLocaleString('en-IN')}/mo
            </div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
              ${p.bedrooms} BHK • ${p.locality}
            </div>
            <a href="/properties/${p.id}" style="font-size: 11px; color: #2563EB; font-weight: 600; text-decoration: none;">
              View Property →
            </a>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        onSelectProperty?.(p.id);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // If properties exist and no bounds have been manually panned, fit bounds
    if (properties.length > 0 && !selectedPropertyId) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      // Avoid excessive zoom if only 1 marker
      if (properties.length === 1) {
        map.setZoom(14);
      }
    }
  }, [map, properties, selectedPropertyId]);

  // Center on selected property when card is clicked
  useEffect(() => {
    if (!map || !selectedPropertyId) return;
    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (prop) {
      map.panTo({ lat: prop.latitude, lng: prop.longitude });
      map.setZoom(15);
    }
  }, [selectedPropertyId, properties, map]);

  // Geolocation button handler
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const userPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (map) {
          map.panTo(userPos);
          map.setZoom(14);
        }
      },
      () => {
        setLocatingUser(false);
        alert('Could not access your location. Please check browser permissions.');
      }
    );
  };

  // Honest Fallback View when Google Maps API Key is not set or invalid
  if (apiKeyMissing) {
    return (
      <div className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-white ${className}`}>
        {/* Background decorative map grid graphic */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-md space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-inner">
            <MapPin className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-white">Interactive Coordinates View</h4>
            <p className="text-xs text-slate-400 mt-1">
              Google Maps API key (<code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300">VITE_GOOGLE_MAPS_API_KEY</code>) is optional for local development. Real database coordinates are active below.
            </p>
          </div>

          {/* Stored property coordinates chips */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-3 border border-slate-700/60 max-h-48 overflow-y-auto space-y-2 text-left">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Mapped Properties ({properties.length} Active in View):
            </div>
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProperty?.(p.id)}
                className={`p-2 rounded-lg text-xs cursor-pointer transition flex items-center justify-between ${
                  p.id === selectedPropertyId
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-semibold truncate max-w-[190px]">{p.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {p.locality}, {p.city} (Lat: {p.latitude.toFixed(4)}, Lng: {p.longitude.toFixed(4)})
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold">₹{Number(p.monthlyRent).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>To enable live Google satellite map, supply your browser key in .env</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[450px]" />

      {/* Current location floating button */}
      <button
        onClick={handleCurrentLocation}
        disabled={locatingUser}
        title="Find my current location"
        className="absolute top-4 right-4 z-10 p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md text-slate-700 hover:text-blue-600 hover:bg-white border border-gray-200 transition"
      >
        <Navigation className={`w-4 h-4 ${locatingUser ? 'animate-spin' : ''}`} />
      </button>

      {/* Floating property summary pill */}
      {selectedPropertyId && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          {(() => {
            const p = properties.find((item) => item.id === selectedPropertyId);
            if (!p) return null;
            return (
              <div className="pointer-events-auto max-w-sm mx-auto bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-200 flex items-center justify-between gap-3 animate-fade-in">
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {p.bedrooms} BHK • ₹{Number(p.monthlyRent).toLocaleString('en-IN')}/mo
                  </p>
                </div>
                <a
                  href={`/properties/${p.id}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shrink-0 flex items-center gap-1"
                >
                  Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
