import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  IndianRupee,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  ShieldCheck,
  Heart,
  Share2,
  Send,
  Flag,
  CheckCircle,
  Home,
  Check,
  Sparkles,
} from 'lucide-react';
import { propertyApi } from '../services/api';
import { Property } from '../types';
import { PropertyGallery } from '../components/property/PropertyGallery';
import { InquiryModal } from '../components/property/InquiryModal';
import { ScheduleVisitModal } from '../components/property/ScheduleVisitModal';
import { ReportModal } from '../components/property/ReportModal';
import { MapView } from '../components/map/MapView';
import { PropertyCard } from '../components/property/PropertyCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isFavorite, toggleFavorite } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    propertyApi
      .getPropertyById(id)
      .then((res) => {
        setProperty(res.property);
        setSimilar(res.similarProperties || []);
      })
      .catch((err) => {
        setError(err.message || 'Property not found.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Property Not Found</h2>
        <p className="text-sm text-slate-500">
          The property listing you requested may have been unlisted, rented, or removed.
        </p>
        <Link
          to="/search"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl"
        >
          Explore Available Homes
        </Link>
      </div>
    );
  }

  const formatRent = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const favorite = isFavorite(property.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this rental home on HomeFinder: ${property.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Listing link copied to clipboard!');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 truncate">
            <Link to="/" className="hover:text-blue-600">
              Home
            </Link>
            <span>/</span>
            <Link to={`/search?city=${property.city}`} className="hover:text-blue-600">
              {property.city}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold truncate">{property.locality}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 text-slate-600 transition"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => toggleFavorite(property.id)}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition ${
                favorite ? 'text-rose-600 font-bold' : 'text-slate-600'
              }`}
              title="Save to favorites"
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="hidden sm:inline">{favorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Gallery */}
        <PropertyGallery images={property.images} title={property.title} />

        {/* Two-column layout: Details + Sticky Action Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Info (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Basic Specs */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase rounded-lg">
                  {property.propertyType.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg">
                  {property.furnishing.replace('_', ' ')}
                </span>
                {property.owner?.ownerVerification?.status === 'APPROVED' && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Landlord
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {property.title}
              </h1>

              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {property.address}, {property.locality}, {property.city} - {property.postalCode}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Bed className="w-3.5 h-3.5" /> Bedrooms
                  </div>
                  <div className="text-base font-bold text-slate-900">{property.bedrooms} BHK</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Bath className="w-3.5 h-3.5" /> Bathrooms
                  </div>
                  <div className="text-base font-bold text-slate-900">{property.bathrooms} Baths</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Maximize2 className="w-3.5 h-3.5" /> Super Built-up
                  </div>
                  <div className="text-base font-bold text-slate-900">{property.area} sqft</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl">
                  <div className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Available From
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {new Date(property.availableFrom).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Property Overview & Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Amenities & Features</h3>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map(({ amenity }) => (
                    <div
                      key={amenity.id}
                      className="p-3 rounded-2xl border border-gray-100 bg-slate-50/60 flex items-center gap-2.5 text-xs font-semibold text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Standard residential amenities included.</p>
              )}
            </div>

            {/* Map Location Preview */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Neighborhood & Map</h3>
                  <p className="text-xs text-slate-500">
                    Exact location coordinates in {property.locality}, {property.city}
                  </p>
                </div>
              </div>
              <div className="h-72 rounded-2xl overflow-hidden border border-gray-200">
                <MapView
                  properties={[property]}
                  center={{ lat: property.latitude, lng: property.longitude }}
                  zoom={15}
                  className="w-full h-full min-h-[280px]"
                />
              </div>
            </div>

            {/* Report Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                Report inaccurate information or suspicious listing
              </button>
            </div>
          </div>

          {/* Sticky Action Sidebar (Right col) */}
          <div className="space-y-6 lg:sticky lg:top-28">
            {/* Rent & Booking Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg space-y-6">
              <div>
                <span className="text-xs text-slate-500 font-medium">Monthly Rent</span>
                <div className="text-3xl font-extrabold text-slate-900">
                  {formatRent(property.monthlyRent)}
                  <span className="text-sm font-normal text-slate-500 ml-1">/ month</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>Security Deposit:</span>
                  <span className="font-bold text-slate-800">{formatRent(property.securityDeposit)}</span>
                </div>
              </div>

              {/* Zero Brokerage Promise */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-900">Zero Brokerage Guarantee</div>
                  <div className="text-[11px] text-emerald-700 leading-tight">
                    Direct deal with owner. No middleman charges or surprise brokerage fees.
                  </div>
                </div>
              </div>

              {/* Primary Call to Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      alert('Please log in as a Tenant to schedule a visit.');
                      return;
                    }
                    setVisitOpen(true);
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.01]"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule a Visit
                </button>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      alert('Please log in as a Tenant to send an inquiry.');
                      return;
                    }
                    setInquiryOpen(true);
                  }}
                  className="w-full py-3 px-4 bg-navy-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  Contact Landlord
                </button>
              </div>

              {/* Owner Profile Overview */}
              {property.owner && (
                <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                  {property.owner.avatarUrl ? (
                    <img
                      src={property.owner.avatarUrl}
                      alt={property.owner.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {property.owner.fullName[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900">{property.owner.fullName}</div>
                    <div className="text-xs text-slate-500">Property Owner</div>
                    {property.owner.ownerVerification?.status === 'APPROVED' && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Identity Verified
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties Section */}
        {similar.length > 0 && (
          <section className="pt-8 border-t border-gray-200 space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-900">
              Similar Properties in {property.locality}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similar.map((sim) => (
                <PropertyCard key={sim.id} property={sim} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      <InquiryModal
        isOpen={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        ownerName={property.owner?.fullName || 'Landlord'}
      />

      <ScheduleVisitModal
        isOpen={visitOpen}
        onClose={() => setVisitOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </div>
  );
};
