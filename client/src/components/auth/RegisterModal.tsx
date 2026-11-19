import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CascadingLocationSelect, LocationValue } from '../common/CascadingLocationSelect';
import {
  X,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
  Heart,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToSignIn,
}) => {
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDonor, setIsDonor] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [location, setLocation] = useState<LocationValue>({
    division: 'Dhaka',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
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

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, and a number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
        role: isDonor ? 'DONOR' : 'RECIPIENT',
      };

      if (isDonor) {
        if (!location.division || !location.district || !location.upazila) {
          throw new Error('Please select your Division, District, and Upazila for donor matching.');
        }

        payload.donorProfile = {
          bloodGroup,
          gender,
          division: location.division,
          district: location.district,
          upazila: location.upazila,
        };
      }

      await register(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-navy-900 to-navy-800 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blood-500 animate-pulse"></span>
            <span className="text-xs font-bold text-blood-400 uppercase tracking-wider">
              LifeLine Registration
            </span>
          </div>
          <h2 className="text-2xl font-black">Join LifeLine Network</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Register to request blood or save lives as a verified emergency donor.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rafiq"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Hasan"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rafiq@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                BD Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01712345678"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Format: 017XXXXXXXX or +88017XXXXXXXX</span>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Create Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Validation Pill Rules */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                  hasMinLength ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasMinLength && <Check className="w-2.5 h-2.5" />} 8+ chars
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                  hasUpperCase ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasUpperCase && <Check className="w-2.5 h-2.5" />} 1 uppercase (A-Z)
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                  hasLowerCase ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasLowerCase && <Check className="w-2.5 h-2.5" />} 1 lowercase (a-z)
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                  hasNumber ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {hasNumber && <Check className="w-2.5 h-2.5" />} 1 number (0-9)
              </span>
            </div>
          </div>

          {/* Donor Opt-in Toggle */}
          <div className="p-3.5 rounded-2xl bg-blood-50/60 border border-blood-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDonor}
                onChange={(e) => setIsDonor(e.target.checked)}
                className="w-4 h-4 rounded text-blood-600 focus:ring-blood-500 border-slate-300"
              />
              <div>
                <span className="font-bold text-xs text-navy-900 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-blood-600 fill-blood-600" />
                  I want to register as an Emergency Blood Donor
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Receive emergency notifications when a compatible patient in your area needs blood.
                </p>
              </div>
            </label>

            {/* Donor Profile Options */}
            {isDonor && (
              <div className="mt-4 pt-3 border-t border-blood-200/80 space-y-3">
                {/* Blood Group Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Blood Group / রক্তের গ্রুপ *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {bloodGroups.map((bg) => (
                      <button
                        key={bg.value}
                        type="button"
                        onClick={() => setBloodGroup(bg.value)}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          bloodGroup === bg.value
                            ? 'bg-blood-600 text-white border-blood-600 shadow-sm shadow-blood-600/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blood-300'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender / লিঙ্গ *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blood-500"
                  >
                    <option value="MALE">Male (পুরুষ)</option>
                    <option value="FEMALE">Female (মহিলা)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Cascading Location */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Donor Location / জেলা ও উপজেলা *
                  </label>
                  <CascadingLocationSelect
                    value={location}
                    onChange={setLocation}
                    showLabels={false}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Privacy guarantee: Your phone number and address remain strictly private until mutual consent.</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blood-600 hover:bg-blood-700 active:bg-blood-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blood-600/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Registering...' : 'Complete Registration'}
          </button>

          {/* Switch to Sign In */}
          <p className="text-center text-xs text-slate-500 pt-1">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="font-bold text-blood-600 hover:text-blood-700 underline"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
