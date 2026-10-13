import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Property } from '../../types';
import { Navigation, AlertCircle, ExternalLink, MapPin } from 'lucide-react';

interface LeafletMapViewProps {
  properties: Property[];
  selectedPropertyId?: string | null;
  onSelectProperty?: (id: string | null) => void;
  onBoundsChange?: (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onBoundsChange,
  center = { lat: 12.9716, lng: 77.5946 }, // Default Bangalore center
  zoom = 12,
  className = 'w-full h-full min-h-[450px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [locatingUser, setLocatingUser] = useState(false);

  // Filter properties with real, valid coordinates
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180 &&
        (p.latitude !== 0 || p.longitude !== 0)
    );
  }, [properties]);

  const missingCoordinatesCount = properties.length - validProperties.length;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid duplicate initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap Tile Layer with required attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Bounds change listener (throttled)
    let moveTimeout: any = null;
    const handleMove = () => {
      if (!onBoundsChange) return;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        onBoundsChange({
          neLat: ne.lat,
          neLng: ne.lng,
          swLat: sw.lat,
          swLng: sw.lng,
        });
      }, 400);
    };

    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);

    mapInstanceRef.current = map;

    // Invalidate size to ensure complete tile rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(moveTimeout);
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Format rent helper
  const formatRent = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${Math.round(num / 1000)}k`;
    }
    return `₹${num}`;
  };

  // Update Markers when properties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (validProperties.length === 0) return;

    const latLngs: L.LatLngTuple[] = [];

    validProperties.forEach((p) => {
      const isSelected = p.id === selectedPropertyId;
      const rentText = formatRent(p.monthlyRent);

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-200 transform ${
            isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-10'
          }">
            <div class="px-2.5 py-1 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1 border-2 ${
              isSelected
                ? 'bg-blue-600 text-white border-white ring-2 ring-blue-500'
                : 'bg-slate-900 text-white border-white hover:bg-blue-600'
            }">
              <span>${rentText}</span>
            </div>
            <div class="w-2 h-2 bg-slate-900 mx-auto -mt-1 rotate-45 border-r border-b border-white ${
              isSelected ? 'bg-blue-600' : ''
            }"></div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });

      // Image URL
      const imgUrl =
        p.images?.find((img) => img.isPrimary)?.url ||
        p.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';

      const fullRent = Number(p.monthlyRent).toLocaleString('en-IN');

      // Popup Content
      const popupHtml = `
        <div style="font-family: inherit; width: 220px; overflow: hidden; border-radius: 12px; margin: -1px;">
          <div style="position: relative; width: 100%; height: 110px; background: #e2e8f0; overflow: hidden;">
            <img src="${imgUrl}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; bottom: 6px; left: 8px; background: rgba(15, 23, 42, 0.85); color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
              ₹${fullRent}/mo
            </div>
          </div>
          <div style="padding: 10px 8px 6px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${p.title}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
              ${p.bedrooms} BHK • ${p.locality}, ${p.city}
            </div>
            <a href="/properties/${p.id}" style="display: block; text-align: center; background: #2563eb; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700;">
              View Property Details →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'leaflet-custom-popup',
        maxWidth: 240,
      });

      marker.on('click', () => {
        onSelectProperty?.(p.id);
      });

      marker.addTo(map);
      markersRef.current.set(p.id, marker);
      latLngs.push([p.latitude, p.longitude]);
    });

    // Fit map bounds to show all markers if not explicitly selected
    if (latLngs.length > 0 && !selectedPropertyId) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [validProperties]);

  // Center on selected property when card is hovered or clicked
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPropertyId) return;

    const marker = markersRef.current.get(selectedPropertyId);
    const prop = validProperties.find((p) => p.id === selectedPropertyId);

    if (prop && marker) {
      map.panTo([prop.latitude, prop.longitude], { animate: true });
      if (!marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedPropertyId, validProperties]);

  // Geolocation handler
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
        }
      },
      () => {
        setLocatingUser(false);
        alert('Could not retrieve your location. Please check browser permissions.');
      }
    );
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[450px] z-0" />

      {/* Geolocation Button */}
      <button
        onClick={handleCurrentLocation}
        disabled={locatingUser}
        title="Find my current location"
        className="absolute top-4 right-4 z-10 p-2.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md text-slate-700 hover:text-blue-600 hover:bg-white border border-gray-200 transition"
      >
        <Navigation className={`w-4 h-4 ${locatingUser ? 'animate-spin' : ''}`} />
      </button>

      {/* Graceful notification if some properties lack coordinates */}
      {missingCoordinatesCount > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>
            {missingCoordinatesCount} {missingCoordinatesCount === 1 ? 'property has' : 'properties have'} no map
            coordinates
          </span>
        </div>
      )}

      {/* Floating property summary preview */}
      {selectedPropertyId && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          {(() => {
            const p = validProperties.find((item) => item.id === selectedPropertyId);
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
