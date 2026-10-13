import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, ShieldCheck } from 'lucide-react';
import { Property } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PropertyCardProps {
  property: Property;
  isHighlighted?: boolean;
  onHover?: (id: string | null) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isHighlighted = false,
  onHover,
}) => {
  const { isFavorite, toggleFavorite, isAuthenticated } = useAuth();
  const favorite = isFavorite(property.id);

  const primaryImage =
    property.images?.find((img) => img.isPrimary)?.url ||
    property.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please log in to save properties to your favorites.');
      return;
    }
    try {
      await toggleFavorite(property.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update favorite');
    }
  };

  const formatRent = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl ${
        isHighlighted
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
          : 'border-gray-200/80 hover:border-blue-200'
      }`}
    >
      <Link to={`/properties/${property.id}`} className="block relative">
        {/* Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 rounded-lg shadow-sm">
              {property.propertyType.replace('_', ' ')}
            </span>
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-navy-900/80 backdrop-blur-md text-white rounded-lg shadow-sm">
              {property.furnishing.replace('_', ' ')}
            </span>
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-rose-500 hover:bg-white shadow-sm transition"
            aria-label="Save to favorites"
          >
            <Heart
              className={`w-4 h-4 transition ${
                favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
            />
          </button>

          {/* Rent overlay badge */}
          <div className="absolute bottom-3 left-3 text-white">
            <div className="text-xl font-extrabold tracking-tight">
              {formatRent(property.monthlyRent)}
              <span className="text-xs font-normal text-slate-200 ml-1">/ month</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1 text-base">
            {property.title}
          </h3>

          {/* Locality */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">
              {property.locality}, {property.city}
            </span>
          </div>

          {/* Key Specifications */}
          <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.area} sqft</span>
            </div>
          </div>

          {/* Owner info & Deposit */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">
              Deposit: <strong className="text-slate-700">{formatRent(property.securityDeposit)}</strong>
            </span>

            {property.owner?.ownerVerification?.status === 'APPROVED' ? (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Owner
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">Owner Listed</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
