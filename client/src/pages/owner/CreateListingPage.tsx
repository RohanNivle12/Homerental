import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building,
  MapPin,
  IndianRupee,
  Bed,
  Check,
  Upload,
  ArrowRight,
  ArrowLeft,
  X,
  PlusCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { propertyApi, commonApi } from '../../services/api';
import { LocationPicker } from '../../components/map/LocationPicker';
import {
  CascadingLocationSelector,
  CascadingLocationValue,
} from '../../components/location/CascadingLocationSelector';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Amenity } from '../../types';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 = Basic, 2 = Location, 3 = Pricing & Specs, 4 = Amenities & Photos, 5 = Preview
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);

  // India-Wide Cascading Location Hierarchy State
  const [locationHierarchy, setLocationHierarchy] = useState<CascadingLocationValue>({
    stateId: undefined,
    stateName: '',
    districtId: undefined,
    districtName: '',
    subdistrictId: undefined,
    subdistrictName: '',
    villageId: undefined,
    villageName: '',
    locality: '',
    postalCode: '',
  });

  // Location
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);

  // Pricing & Specs
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [area, setArea] = useState('');
  const [furnishing, setFurnishing] = useState('SEMI_FURNISHED');

  // Amenities & Images
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
  ]);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    commonApi
      .getAmenities()
      .then((res) => setAllAmenities(res.amenities || []))
      .catch((err) => console.error(err));
  }, []);

  const handleLocationChange = (lat: number, lng: number, addr?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addr && !address) {
      setAddress(addr);
    }
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Upload to server
    setUploadingImages(true);
    try {
      const res = await propertyApi.uploadImages(files);
      if (res.images) {
        setImageUrls((prev) => [...prev, ...res.images.map((img) => img.url)]);
      }
    } catch (err: any) {
      alert(err.message || 'Image upload failed. Default photo will be used.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmitListing = async (status: 'AVAILABLE' | 'DRAFT') => {
    setError(null);
    setLoading(true);

    try {
      const resolvedState = locationHierarchy.stateName || state || 'Karnataka';
      const resolvedCity = locationHierarchy.villageName || locationHierarchy.districtName || city || 'Bengaluru';
      const resolvedLocality = locationHierarchy.locality || locality || locationHierarchy.subdistrictName || 'Main Area';
      const resolvedPostalCode = locationHierarchy.postalCode || postalCode || '560001';

      if (!address.trim()) {
        throw new Error('Please provide complete property address / building name.');
      }

      const payload = {
        title,
        description,
        propertyType,
        address: address.trim(),
        locality: resolvedLocality.trim(),
        city: resolvedCity.trim(),
        state: resolvedState.trim(),
        postalCode: resolvedPostalCode.trim(),
        stateId: locationHierarchy.stateId || undefined,
        districtId: locationHierarchy.districtId || undefined,
        subdistrictId: locationHierarchy.subdistrictId || undefined,
        villageId: locationHierarchy.villageId || undefined,
        latitude,
        longitude,
        monthlyRent: Number(monthlyRent),
        securityDeposit: Number(securityDeposit),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area: Number(area),
        furnishing,
        availableFrom,
        status,
        amenityIds: selectedAmenityIds,
        imageUrls: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000'],
      };

      await propertyApi.createProperty(payload);
      alert(
        status === 'AVAILABLE'
          ? 'Listing submitted successfully for moderation!'
          : 'Listing saved as draft.'
      );
      navigate('/dashboard/owner');
    } catch (err: any) {
      setError(err.message || 'Failed to create property listing.');
      setStep(1); // Return to fix
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/dashboard/owner"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              List Your Property (Zero Brokerage)
            </h1>
            <p className="text-xs text-slate-500">
              Reach thousands of tenants and schedule verified home inspections online.
            </p>
          </div>
        </div>

        {/* Wizard Stepper Header */}
        <div className="grid grid-cols-4 gap-2">
          {['1. Basic Info', '2. Location', '3. Pricing & Specs', '4. Photos & Features'].map(
            (label, idx) => (
              <div
                key={label}
                className={`p-3 rounded-2xl border text-center transition ${
                  step === idx + 1
                    ? 'border-blue-600 bg-white shadow-xs font-bold text-blue-600'
                    : step > idx + 1
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-gray-100/70 text-gray-400'
                }`}
              >
                <span className="text-xs">{label}</span>
              </div>
            )
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Forms */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Step 1: Property Overview</h3>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Listing Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spacious 2 BHK with Balcony in Indiranagar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Property Type *
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="APARTMENT">Apartment / Flat</option>
                  <option value="INDEPENDENT_HOUSE">Independent House / Builder Floor</option>
                  <option value="VILLA">Gated Villa</option>
                  <option value="STUDIO">1 RK / Studio</option>
                  <option value="PENTHOUSE">Penthouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property, ventilation, metro proximity, preferred tenant type (families/bachelors), etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Available From Date
                </label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!title || !description) {
                      alert('Please provide a title and description.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  Next: Location Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Step 2: Location & Address</h3>

              {/* India-Wide Cascading Administrative Location Selector */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Select Administrative Location (All India)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    State → District → Taluka → Village / City
                  </span>
                </div>

                <CascadingLocationSelector
                  value={locationHierarchy}
                  onChange={(val) => {
                    setLocationHierarchy(val);
                    if (val.stateName) setState(val.stateName);
                    if (val.villageName || val.districtName) setCity(val.villageName || val.districtName || '');
                    if (val.locality) setLocality(val.locality);
                    if (val.postalCode) setPostalCode(val.postalCode);
                  }}
                  layout="grid"
                  showLocalityInput={true}
                  showPincodeInput={true}
                />
              </div>

              {/* Complete Address & Landmarks */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Complete Address & Nearby Landmark *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Royal Residency, Opp. City Central Mall"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              {/* Location Picker */}
              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Adjust Coordinates on Map (Drag Marker to Exact Location)
                </label>
                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  address={address}
                  onLocationChange={handleLocationChange}
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2 text-slate-600 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!locality || !address || !postalCode) {
                      alert('Please complete address, locality, and postal code.');
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  Next: Pricing & Specs <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Specs */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-slate-900">Step 3: Rental Pricing & Specifications</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Expected Monthly Rent (₹) *
                  </label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Security Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Bedrooms (BHK)
                  </label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} BHK
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Bathrooms
                  </label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Baths
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Floor Area (Sq. Ft.) *
                  </label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. 1250"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Furnishing Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'FURNISHED', label: 'Furnished' },
                    { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
                    { value: 'UNFURNISHED', label: 'Unfurnished' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      onClick={() => setFurnishing(item.value)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition ${
                        furnishing === item.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-gray-200 hover:bg-gray-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 text-slate-600 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!monthlyRent || !securityDeposit || !area) {
                      alert('Please enter rent, deposit, and area.');
                      return;
                    }
                    setStep(4);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                >
                  Next: Amenities & Photos <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Amenities & Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="font-bold text-base text-slate-900">Step 4: Amenities & Photography</h3>

              {/* Amenities Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">
                  Select Available Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {allAmenities.map((amenity) => (
                    <button
                      type="button"
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        selectedAmenityIds.includes(amenity.id)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 border-gray-200 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{amenity.name}</span>
                      {selectedAmenityIds.includes(amenity.id) && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos Uploader */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Property Photos (Max 10)
                </label>
                <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-6 text-center space-y-2 cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="photo-input"
                  />
                  <label htmlFor="photo-input" className="cursor-pointer space-y-2 block">
                    <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">
                      Click to upload photos or drag & drop
                    </div>
                    <p className="text-xs text-slate-400">PNG, JPG, or WEBP up to 5MB each</p>
                  </label>
                </div>

                {uploadingImages && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold justify-center">
                    <LoadingSpinner size="sm" />
                    <span>Uploading images to secure storage...</span>
                  </div>
                )}

                {/* Previews */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 text-slate-600 text-xs font-semibold"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmitListing('DRAFT')}
                    className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSubmitListing('AVAILABLE')}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
                  >
                    {loading ? <LoadingSpinner size="sm" /> : <PlusCircle className="w-4 h-4" />}
                    Publish Listing Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
