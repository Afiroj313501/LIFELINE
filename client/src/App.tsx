import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Search, 
  AlertCircle, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { CascadingLocationSelect, LocationValue } from './components/common/CascadingLocationSelect';
import { EmergencyMap, MapBloodRequest, MapDonorLocation } from './components/map/EmergencyMap';

export const App: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [locationFilter, setLocationFilter] = useState<LocationValue>({
    division: '',
    district: '',
    upazila: '',
  });

  // Sample seed emergency requests for live visualization
  const sampleRequests: MapBloodRequest[] = [
    {
      id: 'req-dhaka-1',
      patientName: 'Kazi Farhana',
      bloodGroup: 'O_POSITIVE',
      unitsNeeded: 2,
      urgencyLevel: 'CRITICAL',
      hospitalName: 'Dhaka Medical College Hospital',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Shahbagh',
    },
    {
      id: 'req-ctg-1',
      patientName: 'Tanvir Hossain',
      bloodGroup: 'B_POSITIVE',
      unitsNeeded: 1,
      urgencyLevel: 'URGENT',
      hospitalName: 'Chittagong Medical College Hospital',
      division: 'Chattogram',
      district: 'Chattogram',
      upazila: 'Panchlaish',
    },
    {
      id: 'req-syl-1',
      patientName: 'Nazmun Nahar',
      bloodGroup: 'AB_NEGATIVE',
      unitsNeeded: 1,
      urgencyLevel: 'NORMAL',
      hospitalName: 'Sylhet MAG Osmani Medical College',
      division: 'Sylhet',
      district: 'Sylhet',
      upazila: 'Sylhet Sadar',
    },
    {
      id: 'req-raj-1',
      patientName: 'Ariful Islam',
      bloodGroup: 'O_NEGATIVE',
      unitsNeeded: 3,
      urgencyLevel: 'CRITICAL',
      hospitalName: 'Rajshahi Medical College Hospital',
      division: 'Rajshahi',
      district: 'Rajshahi',
      upazila: 'Rajpara',
    },
  ];

  // Privacy-masked sample donors
  const sampleDonors: MapDonorLocation[] = [
    {
      id: 'donor-1',
      displayName: 'Rahim A.',
      bloodGroup: 'O_POSITIVE',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      totalDonations: 6,
    },
    {
      id: 'donor-2',
      displayName: 'Fatima Z.',
      bloodGroup: 'O_NEGATIVE',
      division: 'Dhaka',
      district: 'Dhaka',
      upazila: 'Mirpur',
      totalDonations: 4,
    },
    {
      id: 'donor-3',
      displayName: 'Kamal U.',
      bloodGroup: 'B_POSITIVE',
      division: 'Chattogram',
      district: 'Chattogram',
      upazila: 'Halishahar',
      totalDonations: 11,
    },
    {
      id: 'donor-4',
      displayName: 'Shirin B.',
      bloodGroup: 'AB_NEGATIVE',
      division: 'Sylhet',
      district: 'Sylhet',
      upazila: 'Kotwali',
      totalDonations: 2,
    },
  ];

  useEffect(() => {
    // Check connection with backend proxy /api/v1/health or /health
    fetch('/health')
      .then((res) => {
        if (res.ok) setApiStatus('connected');
        else setApiStatus('disconnected');
      })
      .catch(() => setApiStatus('disconnected'));
  }, []);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredRequests = sampleRequests.filter((req) => {
    if (locationFilter.division && req.division !== locationFilter.division) return false;
    if (locationFilter.district && req.district !== locationFilter.district) return false;
    return true;
  });

  const filteredDonors = sampleDonors.filter((donor) => {
    if (locationFilter.division && donor.division !== locationFilter.division) return false;
    if (locationFilter.district && donor.district !== locationFilter.district) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Banner: Emergency Notice */}
      <aside aria-label="Urgent Notice" className="bg-navy-900 text-white text-xs sm:text-sm py-2 px-4 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blood-500 animate-pulse" />
            <span className="font-medium text-slate-300">National Emergency Blood Network</span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-400">Bangladesh Divisions & Districts Coordinated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs">API Status:</span>
            {apiStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Online
              </span>
            ) : apiStatus === 'checking' ? (
              <span className="text-amber-400 text-xs font-semibold">Connecting...</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-semibold">
                <Activity className="w-3.5 h-3.5" /> Standalone Dev
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blood-600 flex items-center justify-center text-white shadow-md shadow-blood-600/30">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-navy-900">
                Life<span className="text-blood-600">Line</span>
              </span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600 -mt-1">
                Emergency Blood Network
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-blood-600 font-bold transition-colors">Home</a>
            <a href="#live-map" className="hover:text-blood-600 transition-colors">Emergency Map</a>
            <a href="#find-donors" className="hover:text-blood-600 transition-colors">Find Donors</a>
            <a href="#requests" className="hover:text-blood-600 transition-colors">Emergency Requests</a>
            <a href="#become-donor" className="hover:text-blood-600 transition-colors">Become a Donor</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-bold text-navy-900 hover:text-blood-600 transition-colors">
              Sign In
            </button>
            <button className="px-4 py-2 text-sm font-bold text-white bg-blood-600 hover:bg-blood-700 active:bg-blood-800 rounded-lg shadow-sm shadow-blood-600/20 transition-all">
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-white via-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blood-50 border border-blood-200 text-blood-700 text-xs font-bold uppercase tracking-wider mb-6">
                <ShieldCheck className="w-4 h-4 text-blood-600" />
                Verified & Privacy-Protected Healthcare Network
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-900 tracking-tight leading-[1.15]">
                When seconds count, <br />
                <span className="text-blood-600">every drop of blood</span> matters.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
                LifeLine connects emergency patients with verified blood donors across all 8 divisions and 64 districts in Bangladesh with rapid notification matching.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a 
                  href="#live-map"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-white bg-blood-600 hover:bg-blood-700 active:bg-blood-800 shadow-lg shadow-blood-600/30 transition-all group"
                >
                  <AlertCircle className="w-5 h-5" />
                  View Live Map & Requests
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                <a 
                  href="#find-donors"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold text-navy-900 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <Search className="w-5 h-5 text-slate-500" />
                  Find Compatible Donors
                </a>
              </div>

              {/* Quick Blood Group Availability Selector */}
              <div className="mt-10 pt-6 border-t border-slate-200">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-3">
                  Quick Search by Blood Group
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {bloodGroups.map((group) => (
                    <button
                      key={group}
                      className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:border-blood-500 hover:text-blood-600 hover:bg-blood-50/50 font-bold text-sm text-slate-700 shadow-sm transition-all"
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 7: Live Emergency & Location Map Section */}
        <section id="live-map" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 text-blood-600 font-bold text-xs uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4 fill-blood-600" />
                  Live Geospatial Coordination
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
                  Emergency Blood & Donor Radar
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select your administrative region to zoom in on active hospital requests and nearby available donors.
                </p>
              </div>

              {/* Reset filter button */}
              {(locationFilter.division || locationFilter.district || locationFilter.upazila) && (
                <button
                  onClick={() => setLocationFilter({ division: '', district: '', upazila: '' })}
                  className="text-xs font-bold text-blood-600 hover:text-blood-700 underline self-start md:self-auto"
                >
                  Reset Region Filter
                </button>
              )}
            </div>

            {/* Cascading Administrative Region Selector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm mb-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Filter by Administrative Hierarchy (বিভাগ, জেলা, উপজেলা)
              </div>
              <CascadingLocationSelect
                value={locationFilter}
                onChange={setLocationFilter}
              />
            </div>

            {/* Interactive Leaflet Map */}
            <EmergencyMap
              requests={filteredRequests}
              donors={filteredDonors}
              selectedDivision={locationFilter.division}
              selectedDistrict={locationFilter.district}
              height="520px"
              onRequestSelect={(id) => {
                alert(`Viewing details for request ID: ${id}`);
              }}
            />
          </div>
        </section>

        {/* Core Pillars Feature Grid */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blood-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blood-100 flex items-center justify-center text-blood-600 mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Bangladesh Geo-Targeted</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Dual-mode location targeting covering all Divisions, Districts, and Upazilas for accurate rural and urban donor discovery.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blood-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center text-navy-900 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Privacy by Design</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Donor phone numbers and home addresses are never published publicly. Contact sharing occurs only upon verified emergency mutual consent.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blood-200 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">Verified Emergency Lifecycle</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Deterministic state machine moderation prevents panic spam and guarantees that volunteer coordination reaches genuine patients.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy-900 text-slate-400 py-12 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blood-600 flex items-center justify-center text-white">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <span className="text-lg font-black text-white">Life<span className="text-blood-500">Line</span></span>
              <span className="text-xs text-slate-400">| Emergency Blood & Donor Network</span>
            </div>

            <p className="text-xs text-slate-400 text-center md:text-right">
              Initial Target: Bangladesh (8 Divisions, 64 Districts) • Designed for Global Scale.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
