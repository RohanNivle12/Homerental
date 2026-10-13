import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  MapPin,
  IndianRupee,
  Bed,
  Check,
  X,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { propertyApi, commonApi } from '../services/api';
import { Property, Amenity } from '../types';
import { PropertyCard } from '../components/property/PropertyCard';
import { MapView } from '../components/map/MapView';
import {
  CascadingLocationSelector,
  CascadingLocationValue,
} from '../components/location/CascadingLocationSelector';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'INDEPENDENT_HOUSE', label: 'Builder Floor / House' },
  { value: 'VILLA', label: 'Gated Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
];

const FURNISHING_TYPES = [
  { value: 'FURNISHED', label: 'Fully Furnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'UNFURNISHED', label: 'Unfurnished' },
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // India-Wide Cascading Location Hierarchy Filter State
  const [locationValue, setLocationValue] = useState<CascadingLocationValue>({
    stateId: searchParams.get('stateId') || undefined,
    stateName: searchParams.get('state') || undefined,
    districtId: searchParams.get('districtId') || undefined,
    districtName: searchParams.get('city') || undefined,
    subdistrictId: searchParams.get('subdistrictId') || undefined,
    villageId: searchParams.get('villageId') || undefined,
    locality: searchParams.get('locality') || undefined,
    postalCode: searchParams.get('postalCode') || searchParams.get('pincode') || undefined,
  });

  // Filters state from URL query params
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [locality, setLocality] = useState(searchParams.get('locality') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [selectedBhk, setSelectedBhk] = useState<string[]>(
    searchParams.get('bedrooms') ? searchParams.get('bedrooms')!.split(',') : []
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('propertyType') ? searchParams.get('propertyType')!.split(',') : []
  );
  const [selectedFurnishing, setSelectedFurnishing] = useState<string[]>(
    searchParams.get('furnishing') ? searchParams.get('furnishing')!.split(',') : []
  );
  const [sortBy, setSortBy] = useState<'newest' | 'rent_asc' | 'rent_desc' | 'area_desc'>(
    (searchParams.get('sortBy') as any) || 'newest'
  );
  const [ownerVerifiedOnly, setOwnerVerifiedOnly] = useState(
    searchParams.get('ownerVerifiedOnly') === 'true'
  );

  // View mode: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Hover & selection synchronization between map and cards
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Sync state to URL params
  const applyFilters = (page = 1, updatedLocation?: CascadingLocationValue) => {
    const loc = updatedLocation || locationValue;
    const params = new URLSearchParams();

    if (loc.stateId) params.set('stateId', loc.stateId);
    if (loc.stateName) params.set('state', loc.stateName);
    if (loc.districtId) params.set('districtId', loc.districtId);
    if (loc.districtName) params.set('city', loc.districtName);
    if (loc.subdistrictId) params.set('subdistrictId', loc.subdistrictId);
    if (loc.villageId) params.set('villageId', loc.villageId);
    if (loc.locality) params.set('locality', loc.locality);
    if (loc.postalCode) params.set('postalCode', loc.postalCode);

    if (search) params.set('search', search);
    if (minRent) params.set('minRent', minRent);
    if (maxRent) params.set('maxRent', maxRent);
    if (selectedBhk.length > 0) params.set('bedrooms', selectedBhk.join(','));
    if (selectedTypes.length > 0) params.set('propertyType', selectedTypes.join(','));
    if (selectedFurnishing.length > 0) params.set('furnishing', selectedFurnishing.join(','));
    if (sortBy !== 'newest') params.set('sortBy', sortBy);
    if (ownerVerifiedOnly) params.set('ownerVerifiedOnly', 'true');
    if (page > 1) params.set('page', String(page));

    setSearchParams(params);
    setCurrentPage(page);
  };

  // Fetch properties whenever query parameters change
  useEffect(() => {
    setLoading(true);
    const filterPayload = {
      stateId: searchParams.get('stateId') || undefined,
      districtId: searchParams.get('districtId') || undefined,
      subdistrictId: searchParams.get('subdistrictId') || undefined,
      villageId: searchParams.get('villageId') || undefined,
      state: searchParams.get('state') || undefined,
      city: searchParams.get('city') || undefined,
      locality: searchParams.get('locality') || undefined,
      postalCode: searchParams.get('postalCode') || searchParams.get('pincode') || undefined,
      search: searchParams.get('search') || undefined,
      minRent: searchParams.get('minRent') ? Number(searchParams.get('minRent')) : undefined,
      maxRent: searchParams.get('maxRent') ? Number(searchParams.get('maxRent')) : undefined,
      bedrooms: searchParams.get('bedrooms') || undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      furnishing: searchParams.get('furnishing') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      ownerVerifiedOnly: searchParams.get('ownerVerifiedOnly') === 'true',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: 12,
    };

    propertyApi
      .getProperties(filterPayload)
      .then((res) => {
        setProperties(res.properties || []);
        setTotalCount(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => console.error('Fetch properties error:', err))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleClearFilters = () => {
    setLocationValue({});
    setCity('');
    setLocality('');
    setSearch('');
    setMinRent('');
    setMaxRent('');
    setSelectedBhk([]);
    setSelectedTypes([]);
    setSelectedFurnishing([]);
    setSortBy('newest');
    setOwnerVerifiedOnly(false);
    setSearchParams(new URLSearchParams());
  };

  const toggleBhk = (bhk: string) => {
    setSelectedBhk((prev) =>
      prev.includes(bhk) ? prev.filter((b) => b !== bhk) : [...prev, bhk]
    );
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const toggleFurnishing = (f: string) => {
    setSelectedFurnishing((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-800">
              {loading ? 'Searching...' : `${totalCount} Homes Available`}
            </span>
            {city && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {city}
              </span>
            )}
            {ownerVerifiedOnly && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Only
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                applyFilters(1);
              }}
              className="text-xs font-semibold text-slate-700 bg-gray-100 hover:bg-gray-200/80 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="rent_asc">Rent: Low to High</option>
              <option value="rent_desc">Rent: High to Low</option>
              <option value="area_desc">Size: Largest First</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-slate-600">
              <button
                onClick={() => setViewMode('split')}
                title="Split View (List + Map)"
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === 'split' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="List View Only"
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                title="Map View Only"
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                  viewMode === 'map' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Map</span>
              </button>
            </div>

            {/* Mobile Filter Drawer Button */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Filter Sidebar (Desktop & Mobile Drawer) */}
          <aside
            className={`lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm space-y-6 ${
              mobileFilterOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Filter Properties
              </h3>
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear All
              </button>
            </div>

            {/* India-Wide Cascading Administrative Location Selector */}
            <div className="space-y-2">
              <CascadingLocationSelector
                value={locationValue}
                onChange={(newLoc) => {
                  setLocationValue(newLoc);
                  applyFilters(1, newLoc);
                }}
                layout="stacked"
                showLocalityInput={true}
                showPincodeInput={true}
              />
            </div>

            {/* Rent Budget Range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Monthly Rent (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  placeholder="Min (e.g. 15000)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200"
                />
                <input
                  type="number"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  placeholder="Max (e.g. 50000)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200"
                />
              </div>
            </div>

            {/* Bedroom Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Bedrooms (BHK)
              </label>
              <div className="flex flex-wrap gap-2">
                {['1', '2', '3', '4'].map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => toggleBhk(bhk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      selectedBhk.includes(bhk)
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {bhk} BHK
                  </button>
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Property Type
              </label>
              <div className="space-y-1.5">
                {PROPERTY_TYPES.map((pt) => (
                  <label
                    key={pt.value}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(pt.value)}
                      onChange={() => toggleType(pt.value)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{pt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Furnishing Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Furnishing
              </label>
              <div className="space-y-1.5">
                {FURNISHING_TYPES.map((f) => (
                  <label
                    key={f.value}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFurnishing.includes(f.value)}
                      onChange={() => toggleFurnishing(f.value)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified Landlord Toggle */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Owners Only
                </span>
                <input
                  type="checkbox"
                  checked={ownerVerifiedOnly}
                  onChange={(e) => setOwnerVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Apply button */}
            <button
              onClick={() => {
                applyFilters(1);
                setMobileFilterOpen(false);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              Apply Filter Selection
            </button>
          </aside>

          {/* Results Grid & Map Container */}
          <main
            className={`${
              viewMode === 'list'
                ? 'lg:col-span-3'
                : viewMode === 'map'
                ? 'lg:col-span-3'
                : 'lg:col-span-3'
            } space-y-6`}
          >
            {/* View Mode Split/Map/List Rendering */}
            {viewMode === 'map' ? (
              <div className="h-[75vh] w-full sticky top-36">
                <MapView
                  properties={properties}
                  selectedPropertyId={selectedPropertyId || hoveredPropertyId}
                  onSelectProperty={(id) => setSelectedPropertyId(id)}
                  className="w-full h-full"
                />
              </div>
            ) : viewMode === 'split' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Properties Cards List */}
                <div className="xl:col-span-7 space-y-6">
                  {loading ? (
                    <div className="py-24 flex justify-center">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">No Properties Found</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No homes matched your current search filters. Try widening your rent budget or clearing selected filters.
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {properties.map((p) => (
                        <PropertyCard
                          key={p.id}
                          property={p}
                          isHighlighted={p.id === selectedPropertyId || p.id === hoveredPropertyId}
                          onHover={(id) => setHoveredPropertyId(id)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => applyFilters(pg)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                            currentPage === pg
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sticky Side Map */}
                <div className="hidden xl:block xl:col-span-5 sticky top-36 h-[75vh]">
                  <MapView
                    properties={properties}
                    selectedPropertyId={selectedPropertyId || hoveredPropertyId}
                    onSelectProperty={(id) => {
                      setSelectedPropertyId(id);
                      const el = document.getElementById(`property-${id}`);
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full h-full shadow-sm"
                  />
                </div>
              </div>
            ) : (
              // List Only View
              <div className="space-y-6">
                {loading ? (
                  <div className="py-24 flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
                    <h4 className="text-base font-bold text-slate-800">No Properties Found</h4>
                    <p className="text-xs text-slate-500">Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {properties.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
