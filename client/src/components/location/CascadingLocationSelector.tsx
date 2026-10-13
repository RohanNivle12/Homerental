import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ChevronDown,
  X,
  Search,
  Building2,
  Map,
  Compass,
  Landmark,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { locationApi } from '../../services/api';
import { State, District, Subdistrict, Village } from '../../types';

export interface CascadingLocationValue {
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  subdistrictId?: string;
  subdistrictName?: string;
  villageId?: string;
  villageName?: string;
  locality?: string;
  postalCode?: string;
}

export interface CascadingLocationSelectorProps {
  value: CascadingLocationValue;
  onChange: (val: CascadingLocationValue) => void;
  required?: boolean;
  layout?: 'grid' | 'stacked' | 'horizontal';
  showLocalityInput?: boolean;
  showPincodeInput?: boolean;
  className?: string;
}

// Searchable Dropdown Helper Component
interface SearchableSelectProps {
  label: string;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  items: { id: string; name: string; badge?: string }[];
  selectedId?: string;
  onSelect: (item: { id: string; name: string } | null) => void;
  icon: React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder,
  disabled = false,
  loading = false,
  items,
  selectedId,
  onSelect,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((i) => i.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="text-[10px] text-slate-400 hover:text-rose-600 font-normal normal-case flex items-center gap-0.5"
          >
            <X className="w-2.5 h-2.5" /> Clear
          </button>
        )}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition ${
          disabled
            ? 'bg-slate-50 border-gray-200 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-white text-slate-800'
            : selectedItem
            ? 'border-gray-300 bg-white text-slate-900 font-medium'
            : 'border-gray-200 bg-white text-slate-400 hover:border-gray-300'
        }`}
      >
        <div className="truncate flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-1.5 text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
            </span>
          ) : (
            <span className="truncate">{selectedItem ? selectedItem.name : placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-gray-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* List items */}
          <div className="max-h-52 overflow-y-auto p-1 divide-y divide-gray-50">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching {label.toLowerCase()} found
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const CascadingLocationSelector: React.FC<CascadingLocationSelectorProps> = ({
  value,
  onChange,
  required = false,
  layout = 'grid',
  showLocalityInput = true,
  showPincodeInput = true,
  className = '',
}) => {
  // Cascading lists data
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  // Loading flags
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Load all 36 Indian States and UTs on mount
  useEffect(() => {
    let mounted = true;
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const res = await locationApi.getStates();
        if (mounted) setStates(res.states || []);
      } catch (err) {
        console.error('Failed to load states:', err);
      } finally {
        if (mounted) setLoadingStates(false);
      }
    };
    fetchStates();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    let mounted = true;
    if (!value.stateId) {
      setDistricts([]);
      setSubdistricts([]);
      setVillages([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await locationApi.getDistricts(value.stateId);
        if (mounted) setDistricts(res.districts || []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      } finally {
        if (mounted) setLoadingDistricts(false);
      }
    };
    fetchDistricts();
    return () => {
      mounted = false;
    };
  }, [value.stateId]);

  // Fetch subdistricts when district changes
  useEffect(() => {
    let mounted = true;
    const currentDistrictId = value.districtId;
    if (!currentDistrictId) {
      setSubdistricts([]);
      setVillages([]);
      return;
    }

    const fetchSubdistricts = async () => {
      setLoadingSubdistricts(true);
      try {
        const res = await locationApi.getSubdistricts(currentDistrictId);
        if (mounted) setSubdistricts(res.subdistricts || []);
      } catch (err) {
        console.error('Failed to load subdistricts:', err);
      } finally {
        if (mounted) setLoadingSubdistricts(false);
      }
    };
    fetchSubdistricts();
    return () => {
      mounted = false;
    };
  }, [value.districtId]);

  // Fetch villages/towns when subdistrict changes
  useEffect(() => {
    let mounted = true;
    if (!value.subdistrictId) {
      setVillages([]);
      return;
    }

    const fetchVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await locationApi.getVillages({ subdistrictId: value.subdistrictId });
        if (mounted) setVillages(res.villages || []);
      } catch (err) {
        console.error('Failed to load settlements:', err);
      } finally {
        if (mounted) setLoadingVillages(false);
      }
    };
    fetchVillages();
    return () => {
      mounted = false;
    };
  }, [value.subdistrictId]);

  // Handlers for cascading state updates
  const handleStateChange = (item: { id: string; name: string } | null) => {
    onChange({
      ...value,
      stateId: item ? item.id : undefined,
      stateName: item ? item.name : undefined,
      districtId: undefined,
      districtName: undefined,
      subdistrictId: undefined,
      subdistrictName: undefined,
      villageId: undefined,
      villageName: undefined,
    });
  };

  const handleDistrictChange = (item: { id: string; name: string } | null) => {
    onChange({
      ...value,
      districtId: item ? item.id : undefined,
      districtName: item ? item.name : undefined,
      subdistrictId: undefined,
      subdistrictName: undefined,
      villageId: undefined,
      villageName: undefined,
    });
  };

  const handleSubdistrictChange = (item: { id: string; name: string } | null) => {
    onChange({
      ...value,
      subdistrictId: item ? item.id : undefined,
      subdistrictName: item ? item.name : undefined,
      villageId: undefined,
      villageName: undefined,
    });
  };

  const handleVillageChange = (item: { id: string; name: string } | null) => {
    onChange({
      ...value,
      villageId: item ? item.id : undefined,
      villageName: item ? item.name : undefined,
    });
  };

  const gridClass =
    layout === 'horizontal'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'
      : layout === 'stacked'
      ? 'space-y-3'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Cascading dropdown selectors */}
      <div className={gridClass}>
        {/* 1. State / Union Territory */}
        <SearchableSelect
          label="State / Union Territory"
          placeholder="Select State / UT"
          loading={loadingStates}
          items={states.map((s) => ({
            id: s.id,
            name: s.name,
            badge: s.type === 'UT' ? 'UT' : undefined,
          }))}
          selectedId={value.stateId}
          onSelect={handleStateChange}
          icon={<Compass className="w-3.5 h-3.5 text-blue-600" />}
        />

        {/* 2. District */}
        <SearchableSelect
          label="District"
          placeholder={value.stateId ? 'Select District' : 'Select State first'}
          disabled={!value.stateId}
          loading={loadingDistricts}
          items={districts.map((d) => ({
            id: d.id,
            name: d.name,
          }))}
          selectedId={value.districtId}
          onSelect={handleDistrictChange}
          icon={<Map className="w-3.5 h-3.5 text-indigo-600" />}
        />

        {/* 3. Taluka / Tehsil / Subdistrict */}
        <SearchableSelect
          label="Taluka / Tehsil / Subdistrict"
          placeholder={
            value.districtId
              ? subdistricts.length > 0
                ? 'Select Taluka / Tehsil'
                : 'All Subdistricts'
              : 'Select District first'
          }
          disabled={!value.districtId || subdistricts.length === 0}
          loading={loadingSubdistricts}
          items={subdistricts.map((s) => ({
            id: s.id,
            name: s.name,
          }))}
          selectedId={value.subdistrictId}
          onSelect={handleSubdistrictChange}
          icon={<Landmark className="w-3.5 h-3.5 text-emerald-600" />}
        />

        {/* 4. City / Town / Village */}
        <SearchableSelect
          label="City / Town / Village"
          placeholder={
            value.subdistrictId
              ? villages.length > 0
                ? 'Select City or Village'
                : 'All Settlements'
              : 'Select Taluka first'
          }
          disabled={!value.subdistrictId || villages.length === 0}
          loading={loadingVillages}
          items={villages.map((v) => ({
            id: v.id,
            name: v.name,
            badge: v.isUrban ? 'City/Town' : 'Village',
          }))}
          selectedId={value.villageId}
          onSelect={handleVillageChange}
          icon={<Building2 className="w-3.5 h-3.5 text-amber-600" />}
        />

        {/* 5. Locality / Area (Optional Text) */}
        {showLocalityInput && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Locality / Area
            </label>
            <input
              type="text"
              value={value.locality || ''}
              onChange={(e) => onChange({ ...value, locality: e.target.value })}
              placeholder="e.g. Koramangala 4th Block or Jawahar Nagar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>
        )}

        {/* 6. PIN Code (Optional) */}
        {showPincodeInput && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              PIN Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={value.postalCode || ''}
              onChange={(e) => {
                const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                onChange({ ...value, postalCode: pin });
              }}
              placeholder="e.g. 416115 or 560034"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      {/* Breadcrumb preview for current selection */}
      {(value.stateName || value.districtName || value.subdistrictName || value.villageName) && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl flex-wrap">
          <span className="font-semibold text-slate-700">Selected Location:</span>
          {value.villageName && (
            <span className="text-blue-700 font-medium">{value.villageName} →</span>
          )}
          {value.subdistrictName && (
            <span className="text-slate-700">{value.subdistrictName} →</span>
          )}
          {value.districtName && (
            <span className="text-slate-700">{value.districtName} →</span>
          )}
          {value.stateName && (
            <span className="font-semibold text-slate-900">{value.stateName}</span>
          )}
          {value.postalCode && (
            <span className="font-mono text-slate-500">({value.postalCode})</span>
          )}
        </div>
      )}
    </div>
  );
};

export default CascadingLocationSelector;
