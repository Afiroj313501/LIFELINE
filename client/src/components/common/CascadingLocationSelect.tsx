import React, { useMemo } from 'react';
import {
  getDivisionList,
  getDistrictsByDivision,
  getUpazilasByDistrict,
} from '../../data/bangladeshGeo';
import { MapPin } from 'lucide-react';

export interface LocationValue {
  division: string;
  district: string;
  upazila: string;
}

interface CascadingLocationSelectProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  required?: boolean;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
  error?: {
    division?: string;
    district?: string;
    upazila?: string;
  };
}

export const CascadingLocationSelect: React.FC<CascadingLocationSelectProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  showLabels = true,
  className = '',
  error,
}) => {
  const divisions = useMemo(() => getDivisionList(), []);

  const districts = useMemo(() => {
    if (!value.division) return [];
    return getDistrictsByDivision(value.division);
  }, [value.division]);

  const upazilas = useMemo(() => {
    if (!value.division || !value.district) return [];
    return getUpazilasByDistrict(value.division, value.district);
  }, [value.division, value.district]);

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDivision = e.target.value;
    onChange({
      division: newDivision,
      district: '',
      upazila: '',
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    onChange({
      ...value,
      district: newDistrict,
      upazila: '',
    });
  };

  const handleUpazilaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUpazila = e.target.value;
    onChange({
      ...value,
      upazila: newUpazila,
    });
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
      {/* Division Selector */}
      <div>
        {showLabels && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blood-600" />
            Division / বিভাগ {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={value.division}
          onChange={handleDivisionChange}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500 transition-colors ${
            error?.division ? 'border-red-500' : 'border-slate-300'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
        >
          <option value="">Select Division (বিভাগ)</option>
          {divisions.map((div) => (
            <option key={div.value} value={div.value}>
              {div.label} ({div.bnLabel})
            </option>
          ))}
        </select>
        {error?.division && <p className="text-xs text-red-500 mt-1">{error.division}</p>}
      </div>

      {/* District Selector */}
      <div>
        {showLabels && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            District / জেলা {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={value.district}
          onChange={handleDistrictChange}
          disabled={disabled || !value.division}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500 transition-colors ${
            error?.district ? 'border-red-500' : 'border-slate-300'
          } ${disabled || !value.division ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
        >
          <option value="">
            {value.division ? 'Select District (জেলা)' : 'Select Division first'}
          </option>
          {districts.map((dist) => (
            <option key={dist.value} value={dist.value}>
              {dist.label} ({dist.bnLabel})
            </option>
          ))}
        </select>
        {error?.district && <p className="text-xs text-red-500 mt-1">{error.district}</p>}
      </div>

      {/* Upazila Selector */}
      <div>
        {showLabels && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Upazila / উপজেলা {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          value={value.upazila}
          onChange={handleUpazilaChange}
          disabled={disabled || !value.district}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500 transition-colors ${
            error?.upazila ? 'border-red-500' : 'border-slate-300'
          } ${disabled || !value.district ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
        >
          <option value="">
            {value.district ? 'Select Upazila (উপজেলা)' : 'Select District first'}
          </option>
          {upazilas.map((upa) => (
            <option key={upa} value={upa}>
              {upa}
            </option>
          ))}
        </select>
        {error?.upazila && <p className="text-xs text-red-500 mt-1">{error.upazila}</p>}
      </div>
    </div>
  );
};
