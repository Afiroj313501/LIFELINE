import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(identifier, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-navy-900 to-navy-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blood-500 animate-pulse"></span>
            <span className="text-xs font-bold text-blood-400 uppercase tracking-wider">
              LifeLine Secure Sign In
            </span>
          </div>
          <h2 className="text-2xl font-black">Welcome Back</h2>
          <p className="text-xs text-slate-300 mt-1">
            Enter your email or Bangladesh mobile number to access your emergency coordinator profile.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identifier Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Mobile Number / ইমেইল বা মোবাইল
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="017XXXXXXXX or user@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password / পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blood-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blood-600 hover:bg-blood-700 active:bg-blood-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-blood-600/25 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In to LifeLine'}
          </button>

          {/* Switch to Register */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-blood-600 hover:text-blood-700 underline"
            >
              Register here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
