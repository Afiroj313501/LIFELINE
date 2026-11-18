import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CascadingLocationSelect, LocationValue } from '../common/CascadingLocationSelect';
import { apiClient } from '../../services/api';
import { X, AlertCircle, Building2, User, Clock, Heart, PlusCircle } from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated?: (newRequest: any) => void;
  onRequireSignIn?: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
  onRequireSignIn,
}) => {
  const { user } = useAuth();

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [medicalReason, setMedicalReason] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [urgencyLevel, setUrgencyLevel] = useState<'CRITICAL' | 'URGENT' | 'NORMAL'>('CRITICAL');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalBedNumber, setHospitalBedNumber] = useState('');
  const [hoursNeeded, setHoursNeeded] = useState(12);

  const [location, setLocation] = useState<LocationValue>({
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Shahbagh',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const bloodGroups = [
    { value: 'O_POSITIVE', label: 'O+' },
    { value: 'O_NEGATIVE', label: 'O-' },
    { value: 'A_POSITIVE', label: 'A+' },
    { value: 'A_NEGATIVE', label: 'A-' },
    { value: 'B_POSITIVE', label: 'B+' },
    { value: 'B_NEGATIVE', label: 'B-' },
    { value: 'AB_POSITIVE', label: 'AB+' },
    { value: 'AB_NEGATIVE', label: 'AB-' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onRequireSignIn) {
        onClose();
        onRequireSignIn();
      }
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (!location.division || !location.district || !location.upazila) {
        throw new Error('Please select hospital Division, District, and Upazila.');
      }

      // Calculate future ISO timestamp
      const requiredByDate = new Date(Date.now() + hoursNeeded * 60 * 60 * 1000).toISOString();

      const payload = {
        patientName,
        patientAge: patientAge === '' ? undefined : Number(patientAge),
        patientGender,
        medicalReason: medicalReason || undefined,
        bloodGroup,
        unitsNeeded: Number(unitsNeeded),
        urgencyLevel,
        hospitalName,
        hospitalBedNumber: hospitalBedNumber || undefined,
        division: location.division,
        district: location.district,
        upazila: location.upazila,
        requiredByDate,
      };

      const res = await apiClient<any>('/blood-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (onRequestCreated && res.data) {
        onRequestCreated(res.data);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create emergency request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blood-700 to-blood-600 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-blood-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span className="text-xs font-bold text-blood-100 uppercase tracking-wider">
              Emergency Action
            </span>
          </div>
          <h2 className="text-2xl font-black">Post Emergency Blood Request</h2>
          <p className="text-xs text-blood-100 mt-0.5">
            Broadcast an immediate request across verified volunteer donors and hospital networks.
          </p>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>You must be signed in to submit an emergency blood request.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRequireSignIn) onRequireSignIn();
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg whitespace-nowrap transition"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Blood Group Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-blood-600 fill-blood-600" />
              Blood Group Required / প্রয়োজনীয় রক্তের গ্রুপ *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {bloodGroups.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setBloodGroup(bg.value)}
                  className={`py-2 rounded-xl text-sm font-bold transition-all border ${
                    bloodGroup === bg.value
                      ? 'bg-blood-600 text-white border-blood-600 shadow-md shadow-blood-600/30 scale-105'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blood-300'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency & Units Needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Urgency Level / জরুরি অবস্থা *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['CRITICAL', 'URGENT', 'NORMAL'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgencyLevel(level)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      urgencyLevel === level
                        ? level === 'CRITICAL'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : level === 'URGENT'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Units Needed / পরিমাণ (ব্যাগ) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 font-bold"
                  required
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">Bag(s)</span>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Patient Information / রোগীর বিবরণ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Tanvir Rahman"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Age / বয়স
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 34"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Gender / লিঙ্গ
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                >
                  <option value="MALE">Male (পুরুষ)</option>
                  <option value="FEMALE">Female (মহিলা)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Medical Reason / রোগ বা কারণ
                </label>
                <input
                  type="text"
                  value={medicalReason}
                  onChange={(e) => setMedicalReason(e.target.value)}
                  placeholder="e.g. Surgery, Dengue, Thalassemia"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
            </div>
          </div>

          {/* Hospital & Location */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Hospital & Location / হাসপাতাল ও অবস্থান
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Dhaka Medical College Hospital"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Cabin / Bed No.
                </label>
                <input
                  type="text"
                  value={hospitalBedNumber}
                  onChange={(e) => setHospitalBedNumber(e.target.value)}
                  placeholder="e.g. Ward 3, Bed 12"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Hospital Geographic Region *
              </label>
              <CascadingLocationSelect
                value={location}
                onChange={setLocation}
                showLabels={false}
              />
            </div>
          </div>

          {/* Required within timeline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Needed Within / সময়সীমা
            </label>
            <select
              value={hoursNeeded}
              onChange={(e) => setHoursNeeded(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500"
            >
              <option value={2}>Immediate (&lt; 2 Hours)</option>
              <option value={6}>Within 6 Hours</option>
              <option value={12}>Within 12 Hours</option>
              <option value={24}>Within 24 Hours</option>
              <option value={48}>Within 48 Hours</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blood-600 hover:bg-blood-700 active:bg-blood-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blood-600/30 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            {isSubmitting ? 'Broadcasting Request...' : 'Publish Emergency Request'}
          </button>
        </form>
      </div>
    </div>
  );
};
