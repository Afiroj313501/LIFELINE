import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import {
  X,
  User as UserIcon,
  Heart,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Activity,
  LogOut,
  Sliders
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DonorProfileData {
  profile: {
    id: string;
    bloodGroup: string;
    division: string;
    district: string;
    upazila: string;
    isAvailable: boolean;
    totalDonations: number;
    lastDonationDate: string | null;
  } | null;
  eligibility?: {
    isMedicallyEligible: boolean;
    daysUntilEligible: number;
    weightQualified: boolean | null;
  };
}

interface AdminMetrics {
  users: {
    total: number;
    donors: number;
    volunteers: number;
    organizations: number;
  };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    fulfilled: number;
  };
  moderation: {
    pendingReports: number;
  };
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const [donorData, setDonorData] = useState<DonorProfileData | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Fetch Donor Profile if user is a donor
    apiClient<DonorProfileData>('/donors/me')
      .then((res) => {
        if (res.data) setDonorData(res.data);
      })
      .catch(() => {
        // User may not have created donor profile yet
        setDonorData(null);
      });

    // If Admin, fetch system metrics
    if (user.role === 'ADMIN') {
      apiClient<AdminMetrics>('/admin/metrics')
        .then((res) => {
          if (res.data) setAdminMetrics(res.data);
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleToggleAvailability = async () => {
    if (!donorData?.profile) return;
    const newStatus = !donorData.profile.isAvailable;
    setIsTogglingAvailability(true);

    // Optimistic update
    setDonorData((prev) =>
      prev && prev.profile
        ? { ...prev, profile: { ...prev.profile, isAvailable: newStatus } }
        : prev
    );

    try {
      await apiClient('/donors/me/availability', {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: newStatus }),
      });
      setToastMessage(newStatus ? 'You are now marked Available for emergency calls' : 'Your availability has been paused');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      // Revert on failure
      setDonorData((prev) =>
        prev && prev.profile
          ? { ...prev, profile: { ...prev.profile, isAvailable: !newStatus } }
          : prev
      );
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const bgFormatted = donorData?.profile?.bloodGroup
    ? donorData.profile.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-navy-900 to-navy-800 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blood-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blood-600/30">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{user.firstName} {user.lastName}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blood-500/20 text-blood-300 border border-blood-500/30 uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{user.email} • {user.phoneNumber}</p>
            </div>
          </div>

          {/* Admin Tab Switcher */}
          {user.role === 'ADMIN' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-navy-700">
              <button
                onClick={() => setActiveTab('profile')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'profile' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Profile & Donor Status
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === 'admin' ? 'bg-blood-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Admin System Telemetry
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <>
              {/* Donor Availability Live Toggle */}
              {donorData?.profile && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blood-600" />
                      Emergency Donor Availability
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {donorData.profile.isAvailable
                        ? 'You are active and ready to receive regional emergency donor calls.'
                        : 'Your profile is temporarily paused from emergency broadcasts.'}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleAvailability}
                    disabled={isTogglingAvailability}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      donorData.profile.isAvailable ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        donorData.profile.isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Donor Stats Grid */}
              {donorData?.profile ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-blood-600 fill-blood-600" />
                    Clinical Donor Details
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-blood-50/70 border border-blood-200/80">
                      <span className="text-[10px] font-bold text-blood-700 uppercase tracking-wider block">
                        Blood Group
                      </span>
                      <strong className="text-xl font-black text-blood-800">{bgFormatted}</strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Donations
                      </span>
                      <strong className="text-xl font-black text-navy-900">
                        {donorData.profile.totalDonations} <span className="text-xs font-semibold text-slate-500">Times</span>
                      </strong>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Eligibility
                      </span>
                      <strong className="text-xs font-bold text-emerald-800 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        90-Day Clear
                      </strong>
                    </div>
                  </div>

                  {/* Location Area */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs text-slate-700">
                    <MapPin className="w-4 h-4 text-blood-600 flex-shrink-0" />
                    <div>
                      <strong className="text-navy-900">Primary Donation Region:</strong>{' '}
                      {donorData.profile.upazila}, {donorData.profile.district}, {donorData.profile.division}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Registered General Account
                  </div>
                  <p className="text-blue-700 leading-relaxed">
                    You can post emergency blood requests anytime. To volunteer as an active blood donor, you can enroll your blood group in your settings.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Admin Telemetry View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Platform Telemetry (Live DB)
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Healthy
                </span>
              </div>

              {adminMetrics ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Users</span>
                      <strong className="block text-lg font-black text-navy-900">{adminMetrics.users.total}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                      <span className="text-[10px] font-bold text-red-600 uppercase">Donors</span>
                      <strong className="block text-lg font-black text-red-700">{adminMetrics.users.donors}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Volunteers</span>
                      <strong className="block text-lg font-black text-emerald-700">{adminMetrics.users.volunteers}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">Hospitals</span>
                      <strong className="block text-lg font-black text-blue-700">{adminMetrics.users.organizations}</strong>
                    </div>
                  </div>

                  {/* FSM Status Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                      Blood Requests by State Machine Status
                    </div>
                    {Object.entries(adminMetrics.requests.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="font-medium text-slate-600">{status}</span>
                        <strong className="font-bold text-navy-900">{count}</strong>
                      </div>
                    ))}
                    <div className="pt-2 flex items-center justify-between font-bold text-blood-700">
                      <span>Total Fulfilled Donations</span>
                      <span>{adminMetrics.requests.fulfilled} Bags</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">Loading platform metrics...</div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
