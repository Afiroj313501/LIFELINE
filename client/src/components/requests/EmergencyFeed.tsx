import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import {
  Heart,
  AlertCircle,
  Building2,
  Clock,
  CheckCircle2,
  MapPin,
  HandHeart,
  Flame,
  Search,
  Filter,
  X
} from 'lucide-react';

export interface EmergencyRequestItem {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  urgencyLevel: 'CRITICAL' | 'URGENT' | 'NORMAL';
  hospitalName: string;
  division: string;
  district: string;
  upazila: string;
  medicalReason?: string | null;
  status: string;
  requiredByDate: string;
  createdAt: string;
  _count?: {
    donorResponses: number;
  };
}

interface EmergencyFeedProps {
  requests: EmergencyRequestItem[];
  onRequireSignIn?: () => void;
  onRequestUpdated?: () => void;
}

export const EmergencyFeed: React.FC<EmergencyFeedProps> = ({
  requests,
  onRequireSignIn,
  onRequestUpdated,
}) => {
  const { user } = useAuth();
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [unitsPledged, setUnitsPledged] = useState(1);
  const [donorNote, setDonorNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bloodGroups = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filtered = requests.filter((req) => {
    const bgFormatted = req.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
    if (selectedBloodGroup !== 'ALL' && bgFormatted !== selectedBloodGroup) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchHospital = req.hospitalName.toLowerCase().includes(q);
      const matchDistrict = req.district.toLowerCase().includes(q);
      const matchPatient = req.patientName.toLowerCase().includes(q);
      if (!matchHospital && !matchDistrict && !matchPatient) return false;
    }
    return true;
  });

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onRequireSignIn) onRequireSignIn();
      return;
    }
    if (!respondingId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient(`/blood-requests/${respondingId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          unitsPledged: Number(unitsPledged),
          note: donorNote || undefined,
        }),
      });

      setSuccessMessage('Thank you! Your donation pledge has been submitted. The requester has been notified.');
      setRespondingId(null);
      setDonorNote('');
      if (onRequestUpdated) onRequestUpdated();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="requests" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-blood-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 fill-blood-600" />
              Live Emergency Triage
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Active Blood Requests
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Immediate whole blood and component needs verified across hospitals in Bangladesh.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital or district..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 shadow-sm"
            />
          </div>
        </div>

        {/* Blood Group Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5" /> Group:
          </span>
          {bloodGroups.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedBloodGroup(bg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                selectedBloodGroup === bg
                  ? 'bg-blood-600 text-white border-blood-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blood-300'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Global Feedback Banners */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Request Cards Grid */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-navy-900">No matching requests found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try selecting another blood group filter or clearing your search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((req) => {
              const bgFormatted = req.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
              const isCritical = req.urgencyLevel === 'CRITICAL';
              const isUrgent = req.urgencyLevel === 'URGENT';

              const urgencyBadgeClass = isCritical
                ? 'bg-red-100 text-red-700 border-red-200'
                : isUrgent
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-blue-100 text-blue-700 border-blue-200';

              const responsesCount = req._count?.donorResponses ?? 0;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blood-200 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    {/* Card Header: Group & Urgency */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blood-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blood-600/30">
                          {bgFormatted}
                        </div>
                        <div>
                          <div className="text-base font-black text-navy-900 leading-tight">
                            {req.patientName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-blood-600">{req.unitsNeeded} Bag(s)</span>
                            <span>•</span>
                            <span>{req.medicalReason || 'Emergency Patient'}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${urgencyBadgeClass} ${
                          isCritical ? 'animate-pulse' : ''
                        }`}
                      >
                        {req.urgencyLevel}
                      </span>
                    </div>

                    {/* Location & Hospital */}
                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex items-start gap-2 text-slate-700">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">{req.hospitalName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-blood-500 flex-shrink-0" />
                        <span>
                          {req.upazila}, {req.district}, {req.division}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>
                          Needed by:{' '}
                          <strong className="text-slate-800">
                            {new Date(req.requiredByDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Response count */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Donors Responded:{' '}
                        <strong className="text-navy-900">{responsesCount}</strong>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-600">
                        Status: {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={() => {
                        if (!user && onRequireSignIn) {
                          onRequireSignIn();
                        } else {
                          setRespondingId(req.id);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-blood-600 hover:bg-blood-700 active:bg-blood-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 group"
                    >
                      <HandHeart className="w-4 h-4 transition-transform group-hover:scale-110" />
                      I Can Donate Blood
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Pledge Blood Donation */}
        {respondingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setRespondingId(null)} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HandHeart className="w-5 h-5 text-blood-600" />
                  <h3 className="text-lg font-bold text-navy-900">Pledge Blood Donation</h3>
                </div>
                <button
                  onClick={() => setRespondingId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Confirming will notify the patient's family and hospital staff that you intend to donate.
                Only pledge if you are medically healthy and available to reach the hospital.
              </p>

              <form onSubmit={handleRespond} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Units You Can Donate (Bags)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={unitsPledged}
                    onChange={(e) => setUnitsPledged(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Optional Note for Requester
                  </label>
                  <textarea
                    rows={2}
                    value={donorNote}
                    onChange={(e) => setDonorNote(e.target.value)}
                    placeholder="e.g. I can arrive by 4 PM. Ready for screening."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRespondingId(null)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-blood-600 hover:bg-blood-700 rounded-xl shadow-md shadow-blood-600/30 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Pledge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
