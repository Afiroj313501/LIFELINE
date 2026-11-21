import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BANGLADESH_CENTER, getLocationCoordinates } from '../../data/bangladeshGeo';
import { LocateFixed, Loader2 } from 'lucide-react';

export interface MapBloodRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  urgencyLevel: 'CRITICAL' | 'URGENT' | 'NORMAL';
  hospitalName: string;
  division: string;
  district: string;
  upazila: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface MapDonorLocation {
  id: string;
  displayName: string;
  bloodGroup: string;
  division: string;
  district: string;
  upazila: string;
  latitude?: number | null;
  longitude?: number | null;
  totalDonations: number;
}

interface EmergencyMapProps {
  requests?: MapBloodRequest[];
  donors?: MapDonorLocation[];
  selectedDivision?: string;
  selectedDistrict?: string;
  height?: string;
  onRequestSelect?: (requestId: string) => void;
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  requests = [],
  donors = [],
  selectedDivision,
  selectedDistrict,
  height = '500px',
  onRequestSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Directly locate user via browser GPS Geolocation
  const locateUserDirectly = useCallback((zoomIn: boolean = true) => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Locating your direct position...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setLocationStatus('Direct location detected');

        if (mapInstanceRef.current && zoomIn) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, {
            duration: 1.5,
          });
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not retrieve direct location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied by browser';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out';
        }
        setLocationStatus(msg);
        console.warn('Geolocation warning:', msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [BANGLADESH_CENTER.lat, BANGLADESH_CENTER.lng],
      zoom: BANGLADESH_CENTER.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Auto-detect user direct location when map opens
    locateUserDirectly(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [locateUserDirectly]);

  // Update Center / Zoom on region change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedDivision || selectedDistrict) {
      const target = getLocationCoordinates(selectedDivision, selectedDistrict);
      mapInstanceRef.current.flyTo([target.lat, target.lng], target.zoom, {
        duration: 1.2,
      });
    }
  }, [selectedDivision, selectedDistrict]);

  // Render Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    // Render Blood Request Markers
    requests.forEach((req) => {
      const coords = getLocationCoordinates(req.division, req.district);
      const lat = req.latitude ?? coords.lat + (Math.random() - 0.5) * 0.04;
      const lng = req.longitude ?? coords.lng + (Math.random() - 0.5) * 0.04;

      const urgencyColor =
        req.urgencyLevel === 'CRITICAL'
          ? 'bg-red-600 ring-4 ring-red-300 animate-pulse'
          : req.urgencyLevel === 'URGENT'
          ? 'bg-amber-500 ring-3 ring-amber-200'
          : 'bg-blue-600 ring-2 ring-blue-200';

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs shadow-lg cursor-pointer transform hover:scale-110 transition-transform ${urgencyColor}">
            ${req.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon });

      const popupHtml = `
        <div class="p-2 min-w-[200px] text-slate-800 font-sans">
          <div class="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5">
            <span class="font-bold text-sm text-red-600">${req.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')} Needed</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
              req.urgencyLevel === 'CRITICAL'
                ? 'bg-red-100 text-red-700'
                : req.urgencyLevel === 'URGENT'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }">
              ${req.urgencyLevel}
            </span>
          </div>
          <div class="text-xs space-y-1">
            <p><strong>Hospital:</strong> ${req.hospitalName}</p>
            <p><strong>Location:</strong> ${req.upazila}, ${req.district}</p>
            <p><strong>Units Required:</strong> ${req.unitsNeeded} Bag(s)</p>
          </div>
          <button
            id="view-request-${req.id}"
            class="mt-2.5 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-2 rounded text-center transition"
          >
            View Details
          </button>
          <a
            href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${req.hospitalName}, ${req.upazila}, ${req.district}, Bangladesh`)}"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1.5 block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold py-1 px-2 rounded text-center transition border border-slate-200"
          >
            📍 Direct Google Maps
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-request-${req.id}`);
        if (btn && onRequestSelect) {
          btn.onclick = () => onRequestSelect(req.id);
        }
      });

      layer.addLayer(marker);
    });

    // Render Privacy-Safe Donor Representation (Zero-trust radius circles)
    donors.forEach((donor) => {
      const coords = getLocationCoordinates(donor.division, donor.district);
      // Intentional offset to avoid pinpointing exact residences
      const lat = coords.lat + (Math.random() - 0.5) * 0.06;
      const lng = coords.lng + (Math.random() - 0.5) * 0.06;

      const circle = L.circle([lat, lng], {
        radius: 1200, // 1.2km privacy blur circle
        color: '#10b981',
        fillColor: '#34d399',
        fillOpacity: 0.25,
        weight: 1.5,
      });

      const popupHtml = `
        <div class="p-2 min-w-[180px] text-slate-800 font-sans">
          <div class="flex items-center gap-1.5 border-b pb-1 mb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="font-bold text-xs text-emerald-700">Eligible Donor</span>
          </div>
          <div class="text-xs space-y-0.5">
            <p><strong>Donor:</strong> ${donor.displayName}</p>
            <p><strong>Blood Group:</strong> <span class="text-red-600 font-semibold">${donor.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}</span></p>
            <p><strong>Area:</strong> ${donor.upazila}, ${donor.district}</p>
            <p><strong>Lifetime Donations:</strong> ${donor.totalDonations}</p>
          </div>
          <p class="text-[10px] text-slate-400 mt-1 italic">Exact coordinates masked for donor privacy</p>
        </div>
      `;

      circle.bindPopup(popupHtml);
      layer.addLayer(circle);
    });

    // Render User Direct Location Marker if available
    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-blue-500 opacity-70 animate-ping"></span>
            <span class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      });

      userMarker.bindPopup(`
        <div class="p-2 min-w-[170px] text-slate-800 font-sans text-xs">
          <div class="flex items-center gap-1.5 font-bold text-blue-600 mb-1 border-b pb-1">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Your Direct GPS Location
          </div>
          <p class="text-xs text-slate-600">You are currently located here.</p>
          <p class="text-[10px] text-slate-400 mt-1">Lat: ${userCoords.lat.toFixed(4)}, Lng: ${userCoords.lng.toFixed(4)}</p>
        </div>
      `);

      layer.addLayer(userMarker);
    }
  }, [requests, donors, onRequestSelect, userCoords]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Direct Location Button Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={() => locateUserDirectly(true)}
          disabled={isLocating}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/95 hover:bg-white text-navy-900 hover:text-blood-600 text-xs font-bold rounded-xl shadow-md border border-slate-200 transition backdrop-blur-sm active:scale-95 disabled:opacity-60"
          title="Detect and center your direct GPS location"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin text-blood-600" />
          ) : (
            <LocateFixed className="w-4 h-4 text-blood-600" />
          )}
          <span>{userCoords ? 'My Direct Location' : 'Direct Location'}</span>
        </button>

        {locationStatus && (
          <div className="bg-navy-900/90 text-white text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-sm shadow animate-in fade-in max-w-xs text-right">
            {locationStatus}
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-slate-200 text-xs space-y-1.5 max-w-xs">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">
          Live Emergency Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
          <span className="text-slate-600 font-medium">Your Direct GPS Position</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 ring-2 ring-red-300"></span>
          <span className="text-slate-600">Critical Blood Request</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
          <span className="text-slate-600">Urgent Blood Request</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-1 ring-blue-200"></span>
          <span className="text-slate-600">Standard Blood Request</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-400/50 border border-emerald-600"></span>
          <span className="text-slate-600">Available Donors (Masked Area)</span>
        </div>
      </div>
    </div>
  );
};
