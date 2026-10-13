import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  IndianRupee,
  Bed,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Building,
  Key,
  Users,
  Star,
  PlusCircle,
} from 'lucide-react';
import { propertyApi, locationApi } from '../services/api';
import { Property, State, LocationSearchResult } from '../types';
import { PropertyCard } from '../components/property/PropertyCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search state
  const [states, setStates] = useState<State[]>([]);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [maxRent, setMaxRent] = useState('');

  // Location suggestions
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Featured properties
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Load States list on mount
  useEffect(() => {
    locationApi
      .getStates()
      .then((res) => setStates(res.states || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch location suggestions when typing keyword
  useEffect(() => {
    if (keyword.trim().length >= 2) {
      const timer = setTimeout(() => {
        locationApi
          .searchLocations(keyword.trim())
          .then((res) => {
            setSuggestions(res.results || []);
            setShowSuggestions(true);
          })
          .catch(() => setSuggestions([]));
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [keyword]);

  useEffect(() => {
    propertyApi
      .getProperties({ limit: 6, sortBy: 'newest' })
      .then((res) => setFeatured(res.properties || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedStateId) params.append('stateId', selectedStateId);
    if (keyword.trim()) params.append('search', keyword.trim());
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (maxRent) params.append('maxRent', maxRent);

    navigate(`/search?${params.toString()}`);
  };

  const handleSelectSuggestion = (item: LocationSearchResult) => {
    setShowSuggestions(false);
    setKeyword(item.name);
    const params = new URLSearchParams();
    if (item.stateId) params.append('stateId', item.stateId);
    if (item.districtId) params.append('districtId', item.districtId);
    if (item.subdistrictId) params.append('subdistrictId', item.subdistrictId);
    if (item.villageId) params.append('villageId', item.villageId);
    if (item.pincode) params.append('pincode', item.pincode);
    if (bedrooms) params.append('bedrooms', bedrooms);
    if (maxRent) params.append('maxRent', maxRent);

    navigate(`/search?${params.toString()}`);
  };

  const handleLocalityClick = (selectedCity: string, locality: string) => {
    navigate(`/search?city=${selectedCity}&locality=${locality}`);
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-navy-900 to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            100% Zero Brokerage Rental Homes
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find a Home That <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Fits Your Life</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Discover verified apartments, independent builder floors, and gated villas directly from homeowners. Schedule property visits online with zero middleman fees.
          </p>

          {/* Search Card */}
          <div className="mt-8 pt-4">
            <form
              onSubmit={handleSearch}
              className="bg-white p-3 sm:p-4 rounded-3xl shadow-2xl border border-gray-100 text-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center text-left"
            >
              {/* State selector */}
              <div className="p-2 sm:border-r border-gray-100">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600" /> State / UT
                </label>
                <select
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                  className="w-full bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer truncate"
                >
                  <option value="">All India (36 States/UTs)</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Locality / Town / Keyword search with auto-suggest */}
              <div className="p-2 sm:border-r border-gray-100 relative">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Search className="w-3 h-3 text-blue-600" /> City / Taluka / Locality
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="e.g. Ichalkaranji, Sinnar, Whitefield"
                  className="w-full bg-transparent font-semibold text-slate-800 text-sm placeholder:text-gray-400 focus:outline-none"
                />

                {/* Autocomplete Suggestions Box */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-50">
                    <div className="p-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Locations Matching "{keyword}"
                    </div>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 transition flex flex-col group"
                      >
                        <span className="font-semibold text-slate-900 group-hover:text-blue-600">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {item.breadcrumb}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bedrooms filter */}
              <div className="p-2 sm:border-r border-gray-100">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Bed className="w-3 h-3 text-blue-600" /> Bedrooms
                </label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="">Any BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>

              {/* Max Rent budget */}
              <div className="p-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-blue-600" /> Max Budget
                </label>
                <select
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="w-full bg-transparent font-semibold text-slate-800 text-sm focus:outline-none cursor-pointer"
                >
                  <option value="">Any Budget</option>
                  <option value="25000">Up to ₹25,000</option>
                  <option value="40000">Up to ₹40,000</option>
                  <option value="60000">Up to ₹60,000</option>
                  <option value="100000">Up to ₹1,00,000</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div className="sm:col-span-2 lg:col-span-1 p-1">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  <Search className="w-4 h-4" />
                  Search Homes
                </button>
              </div>
            </form>
          </div>

          {/* Quick Locality chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs">
            <span className="text-slate-400">Popular Localities:</span>
            <button
              onClick={() => handleLocalityClick('Bangalore', 'Indiranagar')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition"
            >
              Indiranagar (BLR)
            </button>
            <button
              onClick={() => handleLocalityClick('Bangalore', 'Koramangala')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition"
            >
              Koramangala (BLR)
            </button>
            <button
              onClick={() => handleLocalityClick('Mumbai', 'Bandra West')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition"
            >
              Bandra West (MUM)
            </button>
            <button
              onClick={() => handleLocalityClick('Mumbai', 'Powai')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition"
            >
              Powai (MUM)
            </button>
            <button
              onClick={() => handleLocalityClick('Delhi', 'Greater Kailash')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/15 transition"
            >
              Greater Kailash (DEL)
            </button>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Handpicked Residences
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Verified Rental Homes
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Browse all properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Why Choose HomeFinder Benefits */}
      <section className="bg-slate-50 py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              The HomeFinder Difference
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Millions Choose No-Brokerage Rentals
            </h2>
            <p className="text-sm text-slate-500">
              Traditional real estate brokers charge up to 2 months rent for just showing a door. We eliminate the middlemen completely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">100% Direct Owner Listings</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Every property on HomeFinder is listed directly by verified homeowners. No fake broker listings or inflated deposits.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Seamless Visit Scheduling</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Pick your preferred date and time slot online. Owners confirm visits directly with notifications and directions.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm hover:shadow-md transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Save Up To ₹50,000+</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Zero brokerage charges mean complete financial transparency. Use your hard-earned money to furnish your dream space instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How Renting on HomeFinder Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900">Search & Explore on Map</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Filter by budget, BHK, furnishing status, and explore real geographic coordinates across your favorite neighborhoods.
            </p>
          </div>

          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900">Schedule a Free Visit</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Choose your convenient date and time slot. The owner receives instant in-app alerts to accept or confirm your appointment.
            </p>
          </div>

          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900">Connect & Move In</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Inspect the home, finalize rental terms directly with the landlord, and enjoy zero brokerage savings!
            </p>
          </div>
        </div>
      </section>

      {/* Clearly Identified Sample Testimonials */}
      <section className="bg-slate-50 py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              User Experiences (Sample Testimonials)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Loved by Tenants & Landlords Alike
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "Saved ₹45,000 in brokerage fees when shifting to Koramangala. The visit scheduling was seamless and the owner was verified."
              </p>
              <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  AK
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Ananya Kapoor</h5>
                  <span className="text-[10px] text-slate-400">Software Engineer, Bangalore</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "Listed my 2 BHK in Bandra West on HomeFinder and received 4 genuine visit requests within 48 hours. Found a great tenant in 3 days!"
              </p>
              <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  SK
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Sunil Kulkarni</h5>
                  <span className="text-[10px] text-slate-400">Property Owner, Mumbai</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 italic">
                "The map feature showing exact coordinates saved so much time. We were able to inspect neighborhood parks and metro proximity before visiting."
              </p>
              <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                  RM
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Rohan Malhotra</h5>
                  <span className="text-[10px] text-slate-400">Tenant, Gurgaon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Landlord Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy-900 to-blue-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
              For Property Owners
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Have a Vacant Flat or House to Rent Out?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Post your property for free, reach thousands of verified tenants, receive direct visit requests, and avoid paying high broker commissions.
            </p>
          </div>
          <Link
            to="/register?role=OWNER"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 shrink-0 transition hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            Post Your Property Free
          </Link>
        </div>
      </section>
    </div>
  );
};
