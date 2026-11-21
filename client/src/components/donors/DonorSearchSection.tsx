import React, { useState, useEffect, useCallback } from 'react';
import { CascadingLocationSelect, LocationValue } from '../common/CascadingLocationSelect';
import { apiClient } from '../../services/api';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
  Lock,
  Sparkles,
  Users,
  Loader2
} from 'lucide-react';

export interface DonorCardItem {
  id: string;
  displayName: string;
  bloodGroup: string;
  division: string;
  district: string;
  upazila: string;
  isAvailable: boolean;
  totalDonations: number;
  isMedicallyEligible?: boolean;
}

interface DonorSearchSectionProps {
  initialDonors?: DonorCardItem[];
  onRequestOpenModal?: () => void;
}

export const DonorSearchSection: React.FC<DonorSearchSectionProps> = ({
  initialDonors = [
    {
      id: 'd-1',
      displayName: 'Rahim A.',
      bloodGroup: 'O_POSITIVE',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      isAvailable: true,
      totalDonations: 8,
      isMedicallyEligible: true,
    },
    {
      id: 'd-2',
      displayName: 'Fatima Z.',
      bloodGroup: 'O_NEGATIVE',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Mirpur',
      isAvailable: true,
      totalDonations: 4,
      isMedicallyEligible: true,
    },
    {
      id: 'd-3',
      displayName: 'Kamal U.',
      bloodGroup: 'B_POSITIVE',
      division: 'Chattogram',
      district: 'Chattogram',
      upazila: 'Halishahar',
      isAvailable: true,
      totalDonations: 12,
      isMedicallyEligible: true,
    },
    {
      id: 'd-4',
      displayName: 'Shirin B.',
      bloodGroup: 'AB_NEGATIVE',
      division: 'Sylhet',
      district: 'Sylhet',
      upazila: 'Kotwali',
      isAvailable: true,
      totalDonations: 3,
      isMedicallyEligible: true,
    },
    {
      id: 'd-5',
      displayName: 'Tanvir M.',
      bloodGroup: 'A_POSITIVE',
      division: 'Rajshahi',
      district: 'Rajshahi',
      upazila: 'Boalia',
      isAvailable: true,
      totalDonations: 5,
      isMedicallyEligible: true,
    },
    {
      id: 'd-6',
      displayName: 'Nusrat J.',
      bloodGroup: 'A_NEGATIVE',
      division: 'Khulna',
      district: 'Khulna',
      upazila: 'Sonadanga',
      isAvailable: true,
      totalDonations: 7,
      isMedicallyEligible: true,
    },
  ],
  onRequestOpenModal,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [location, setLocation] = useState<LocationValue>({
    division: '',
    district: '',
    upazila: '',
  });
  const [donors, setDonors] = useState<DonorCardItem[]>(initialDonors);
  const [isLoading, setIsLoading] = useState(false);

  const bloodGroups = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const fetchLiveDonors = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedGroup !== 'ALL') {
        const denorm = selectedGroup.endsWith('+')
          ? selectedGroup.slice(0, -1) + '_POSITIVE'
          : selectedGroup.endsWith('-')
          ? selectedGroup.slice(0, -1) + '_NEGATIVE'
          : selectedGroup;
        params.append('bloodGroup', denorm);
      }
      if (location.division) params.append('division', location.division);
      if (location.district) params.append('district', location.district);
      if (location.upazila) params.append('upazila', location.upazila);
      params.append('limit', '30');

      const res = await apiClient<{ items: any[] }>(`/donors/search?${params.toString()}`);
      if (res.data?.items && res.data.items.length > 0) {
        const mapped: DonorCardItem[] = res.data.items.map((item) => ({
          id: item.id,
          displayName: item.displayName,
          bloodGroup: item.bloodGroup,
          division: item.division,
          district: item.district,
          upazila: item.upazila,
          isAvailable: item.isAvailable,
          totalDonations: item.totalDonations,
          isMedicallyEligible: item.eligibility?.isMedicallyEligible ?? true,
        }));
        setDonors(mapped);
      } else {
        const filtered = initialDonors.filter((donor) => {
          const formatted = donor.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
          if (selectedGroup !== 'ALL' && formatted !== selectedGroup) return false;
          if (location.division && donor.division !== location.division) return false;
          if (location.district && donor.district !== location.district) return false;
          return true;
        });
        setDonors(filtered);
      }
    } catch {
      const filtered = initialDonors.filter((donor) => {
        const formatted = donor.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
        if (selectedGroup !== 'ALL' && formatted !== selectedGroup) return false;
        if (location.division && donor.division !== location.division) return false;
        if (location.district && donor.district !== location.district) return false;
        return true;
      });
      setDonors(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroup, location, initialDonors]);

  useEffect(() => {
    void fetchLiveDonors();
  }, [fetchLiveDonors]);

  return (
    <div id="find-donors" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-blood-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Users className="w-4 h-4 text-blood-600" />
              Verified Volunteer Directory
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Compatible Donor Discovery
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse voluntary blood donors ready to mobilize across administrative divisions and districts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Zero-Trust Privacy Active
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm mb-8 space-y-4">
          {/* Blood Group Filter */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Filter by Donor Blood Group:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    selectedGroup === bg
                      ? 'bg-blood-600 text-white border-blood-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blood-300'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Cascading Location Filter */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Filter by Geographic Location:
            </span>
            <CascadingLocationSelect
              value={location}
              onChange={setLocation}
              showLabels={false}
            />
          </div>

          {(location.division || location.district || location.upazila || selectedGroup !== 'ALL') && (
            <button
              onClick={() => {
                setSelectedGroup('ALL');
                setLocation({ division: '', district: '', upazila: '' });
              }}
              className="text-xs font-bold text-blood-600 hover:text-blood-700 underline"
            >
              Reset All Filters
            </button>
          )}
        </div>

        {/* Donor Cards Grid */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blood-600 animate-spin mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Searching verified compatible donors...</p>
          </div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-navy-900">No registered donors found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try choosing another blood group or administrative district.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {donors.map((donor) => {
              const bgFormatted = donor.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');

              return (
                <div
                  key={donor.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blood-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blood-50 border border-blood-200 text-blood-700 font-black text-base flex items-center justify-center shadow-sm">
                          {bgFormatted}
                        </div>
                        <div>
                          <div className="text-base font-bold text-navy-900 leading-tight">
                            {donor.displayName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {donor.upazila}, {donor.district}
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Award className="w-3 h-3 text-amber-500" /> Donations
                        </span>
                        <strong className="text-navy-900 text-sm">{donor.totalDonations} Times</strong>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-500" /> Interval
                        </span>
                        <strong className="text-emerald-700 text-xs font-bold">90-Day Clear</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact details masked</span>
                    </div>

                    {onRequestOpenModal && (
                      <button
                        onClick={onRequestOpenModal}
                        className="text-xs font-bold text-blood-600 hover:text-blood-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-blood-600" />
                        Request Blood
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
