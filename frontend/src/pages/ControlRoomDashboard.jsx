import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

let socketInstance = null;
const getSocket = (url) => {
  if (!socketInstance) socketInstance = io(url);
  return socketInstance;
};

const dotIcon = (color, size=16) => {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #0F172A;box-shadow:0 0 15px ${color}88;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
};

const demoData = {
  'LF-1025': {
    patientLoc: [13.0418, 80.2341],
    candidates: [
      { name: 'Apollo Hospital', loc: [13.0604, 80.2496], score: '0.87', cap: 95, av: 80, eta: '20 min' },
      { name: 'Govt. General', loc: [13.0839, 80.2761], score: '0.72', cap: 88, av: 40, eta: '30 min' },
      { name: 'Stanley Medical', loc: [13.1006, 80.2847], score: '0.61', cap: 76, av: 30, eta: '27 min' }
    ],
    routePrimary: [[13.0418, 80.2341], [13.0475, 80.2390], [13.0530, 80.2430], [13.0570, 80.2465], [13.0604, 80.2496]],
    routeAlternate: [[13.0418, 80.2341], [13.0560, 80.2500], [13.0700, 80.2620], [13.0780, 80.2700], [13.0839, 80.2761]],
    callout: {
      title: 'Apollo Hospital, Greams Road',
      text: '10.2 km, 20 min — chosen over Govt. General Hospital (4.8 km, 30 min) due to heavy traffic on the shorter route.'
    },
    icuGrid: [
      { id: 'I01', type: 'normal', status: 'avail' }, { id: 'I02', type: 'normal', status: 'occ' },
      { id: 'I03', type: 'normal', status: 'avail' }, { id: 'I04', type: 'normal', status: 'occ' },
      { id: 'I05', type: 'normal', status: 'occ' },   { id: 'I06', type: 'normal', status: 'occ' },
      { id: 'I07', type: 'normal', status: 'occ' },   { id: 'I08', type: 'normal', status: 'occ' },
      { id: 'G01', type: 'gov', status: 'avail' },    { id: 'G02', type: 'gov', status: 'avail' },
      { id: 'G03', type: 'gov', status: 'reserved' }, { id: 'G04', type: 'gov', status: 'occ' },
    ]
  },
  'LF-1026': {
    patientLoc: [13.0033, 80.2555], 
    candidates: [
      { name: 'Govt. General', loc: [13.0839, 80.2761], score: '0.92', cap: 90, av: 60, eta: '11 min' },
      { name: 'Fortis Malar', loc: [13.0132, 80.2599], score: '0.85', cap: 70, av: 20, eta: '14 min' },
      { name: 'Apollo Hospital', loc: [13.0604, 80.2496], score: '0.65', cap: 95, av: 10, eta: '25 min' }
    ],
    routePrimary: [[13.0033, 80.2555], [13.0300, 80.2600], [13.0500, 80.2650], [13.0839, 80.2761]],
    routeAlternate: [[13.0033, 80.2555], [13.0100, 80.2580], [13.0132, 80.2599]],
    callout: {
      title: 'Govt. General Hospital',
      text: '8.5 km, 11 min — chosen over Fortis Malar due to required cardiac trauma team availability.'
    },
    icuGrid: [
      { id: 'I01', type: 'normal', status: 'occ' }, { id: 'I02', type: 'normal', status: 'occ' },
      { id: 'I03', type: 'normal', status: 'occ' }, { id: 'I04', type: 'normal', status: 'occ' },
      { id: 'G01', type: 'gov', status: 'avail' },  { id: 'G02', type: 'gov', status: 'occ' },
      { id: 'G03', type: 'gov', status: 'avail' },  { id: 'G04', type: 'gov', status: 'avail' },
    ]
  },
  'LF-1027': {
    patientLoc: [12.9784, 80.2185], 
    candidates: [
      { name: 'Dr. Kamakshi Memorial', loc: [12.9555, 80.2033], score: '0.89', cap: 85, av: 50, eta: '8 min' },
      { name: 'Apollo Speciality', loc: [12.9344, 80.1462], score: '0.78', cap: 80, av: 40, eta: '15 min' }
    ],
    routePrimary: [[12.9784, 80.2185], [12.9650, 80.2100], [12.9555, 80.2033]],
    routeAlternate: [[12.9784, 80.2185], [12.9500, 80.1800], [12.9344, 80.1462]],
    callout: {
      title: 'Dr. Kamakshi Memorial',
      text: '4.2 km, 8 min — nearest capable trauma center with available neurosurgeon.'
    },
    icuGrid: [
      { id: 'I01', type: 'normal', status: 'avail' }, { id: 'I02', type: 'normal', status: 'avail' },
      { id: 'I03', type: 'normal', status: 'occ' }, { id: 'I04', type: 'normal', status: 'avail' },
      { id: 'G01', type: 'gov', status: 'occ' },  { id: 'G02', type: 'gov', status: 'occ' },
    ]
  },
  'LF-1028': {
    patientLoc: [13.0850, 80.2100], 
    candidates: [
      { name: 'Sundaram Medical', loc: [13.0800, 80.2150], score: '0.94', cap: 70, av: 90, eta: '7 min' },
      { name: 'Govt. Kilpauk Medical', loc: [13.0805, 80.2415], score: '0.82', cap: 90, av: 30, eta: '12 min' }
    ],
    routePrimary: [[13.0850, 80.2100], [13.0820, 80.2120], [13.0800, 80.2150]],
    routeAlternate: [[13.0850, 80.2100], [13.0830, 80.2250], [13.0805, 80.2415]],
    callout: {
      title: 'Sundaram Medical',
      text: '1.5 km, 7 min — chosen for proximity and immediate availability of respiratory support.'
    },
    icuGrid: [
      { id: 'I01', type: 'normal', status: 'avail' }, { id: 'I02', type: 'normal', status: 'avail' },
      { id: 'I03', type: 'normal', status: 'avail' }, { id: 'I04', type: 'normal', status: 'avail' },
      { id: 'G01', type: 'gov', status: 'avail' }, { id: 'G02', type: 'gov', status: 'avail' },
    ]
  }
};

const MapBounds = ({ bounds }) => {
  const map = useMap();
  const boundsString = JSON.stringify(bounds);
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds);
      map.fitBounds(leafletBounds, { padding: [60, 60] });
    }
  }, [map, boundsString]);
  return null;
};

function ControlRoomDashboard() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [activeCase, setActiveCase] = useState('LF-1025');
  const [assignedByCase, setAssignedByCase] = useState({});
  const [bedState, setBedState] = useState(demoData['LF-1025'].icuGrid);
  const [showSettings, setShowSettings] = useState(false);
  const [cases, setCases] = useState([
    { id: 'LF-1025', sevText: 'CRITICAL', sevClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20', meta: 'Road accident · T. Nagar', eta: 'ETA: 20 min' },
    { id: 'LF-1026', sevText: 'HIGH', sevClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', meta: 'Cardiac event · Adyar', eta: 'ETA: 11 min' },
    { id: 'LF-1027', sevText: 'CRITICAL', sevClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20', meta: 'Fall · Velachery', eta: 'Awaiting match' },
    { id: 'LF-1028', sevText: 'HIGH', sevClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', meta: 'Breathing · Anna Nagar', eta: 'ETA: 7 min' },
  ]);
  const [events, setEvents] = useState([
    '14:42 Control Room → G01 → RESERVED',
    '14:46 Apollo Hospital → Confirmed',
    '14:51 AMB-17 → ETA 20 min'
  ]);

  const activeData = demoData[activeCase] || demoData['LF-1025'];

  const [candidates, setCandidates] = useState(demoData['LF-1025'].candidates);

  useEffect(() => {
    setBedState(demoData[activeCase]?.icuGrid || demoData['LF-1025'].icuGrid);

    const fetchData = async () => {
      // Fetch Case state from DB to get real assignment
      try {
        const caseRes = await fetch(`${API_URL}/api/cases/${activeCase}`, {
          headers: { 'x-mock-role': 'ControlRoom' }
        });
        if (caseRes.ok) {
          const caseData = await caseRes.json();
          if (caseData.hospital_id) {
            setAssignedByCase(prev => ({
              ...prev,
              [activeCase]: {
                hospitalName: caseData.hospital_id.name,
                hospitalLoc: [caseData.hospital_id.location.lat, caseData.hospital_id.location.lng],
                distanceKm: caseData.routing_info?.distanceKm || '0',
                etaMinutes: caseData.routing_info?.etaMinutes || 0,
                reason: caseData.routing_info?.reason || 'Assigned'
              }
            }));
          }
        }
      } catch (err) {
        console.error('Case fetch error', err);
      }

      // Fetch live match for active case
      try {
        const patientLoc = demoData[activeCase]?.patientLoc || [13.0418, 80.2341];
        const res = await fetch(`${API_URL}/api/engine/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-mock-role': 'ControlRoom' },
          body: JSON.stringify({ requirements: ['ICU'], location: { lat: patientLoc[0], lng: patientLoc[1] } })
        });
        const matches = await res.json();
        if (matches && matches.length > 0) {
          setCandidates(matches.map((m, i) => ({
            _id: m.hospital._id,
            id: m.hospital._id,
            name: m.hospital.name,
            loc: [m.hospital.location.lat, m.hospital.location.lng],
            score: m.score.toFixed(2),
            cap: 90, av: 50,
            eta: `${m.eta} min`,
            etaMinutes: m.eta,
            distanceKm: m.distance,
            reason: m.route?.reason || ''
          })));
        } else {
          setCandidates(demoData[activeCase]?.candidates || demoData['LF-1025'].candidates);
        }
      } catch (err) {
        console.error('Match error', err);
        console.warn('Using demo fallback candidates - matching engine call failed');
        setCandidates(demoData[activeCase]?.candidates || demoData['LF-1025'].candidates);
      }
    };
    
    fetchData();
  }, [activeCase, API_URL]);

  useEffect(() => {
    const socket = getSocket(API_URL);
    
    socket.on('action', (data) => {
      if (data.type === 'request_ambulance') {
        setCases(prev => [data.payload, ...prev]);
        logEvent(`New Emergency Request: ${data.payload.id}`);
      } else if (data.type === 'bed_reserved') {
        setBedState(prev => prev.map(b => b.id === data.payload.bedId ? { ...b, status: 'reserved' } : b));
        logEvent(`Gov ICU ${data.payload.bedId} → RESERVED`);
      } else if (data.type === 'fault_declared') {
        logEvent(`AMB FAULT declared for ${data.payload.caseId}`);
      } else if (data.type === 'attender_acknowledged') {
        logEvent(`AMB Acknowledged for ${data.payload.caseId}`);
      } else if (data.type === 'case_updated') {
        setCases(prev => prev.map(c => c.id === data.caseId ? { ...c, eta: data.status } : c));
        logEvent(`Case ${data.caseId} updated: ${data.status}`);
      } else if (data.type === 'hospital_bed_update') {
        setBedState(prev => prev.map(b => b.id === data.payload.bedId ? { ...b, status: data.payload.status } : b));
        logEvent(`Hospital updated bed ${data.payload.bedId} → ${data.payload.status.toUpperCase()}`);
      } else if (data.type === 'case_rejected') {
        logEvent(`Case ${data.payload.caseId} REJECTED by ${data.payload.hospital}. TOPSIS re-ranking...`);
      }
    });
    
    return () => socket.off('action');
  }, []);

  const logEvent = (text) => {
    const ts = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setEvents(prev => [`${ts} ${text}`, ...prev].slice(0, 10));
  };

  const handleAssignHospital = async (hospital) => {
    if (!hospital._id && !hospital.id) {
      console.error('Cannot assign - hospital has no _id, likely using fallback demo data');
      return;
    }
    
    const assignedCase = activeCase;
    
    try {
      const res = await fetch(`${API_URL}/api/cases/${assignedCase}/assign-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mock-role': 'ControlRoom' },
        body: JSON.stringify({
          hospitalId: hospital._id,
          routingInfo: {
            etaMinutes: hospital.etaMinutes,
            distanceKm: hospital.distanceKm,
            reason: hospital.reason
          }
        })
      });
      if (res.ok) {
        logEvent(`Assigned ${hospital.name} to Case ${assignedCase}`);
        setAssignedByCase(prev => ({
          ...prev,
          [assignedCase]: {
            hospitalName: hospital.name,
            hospitalLoc: hospital.loc,
            distanceKm: hospital.distanceKm,
            etaMinutes: hospital.etaMinutes,
            reason: hospital.reason
          }
        }));
      } else {
        logEvent(`Failed to assign ${hospital.name}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBedClick = (bed) => {
    if (bed.type !== 'gov') return;
    let newStatus = bed.status;
    if (bed.status === 'avail') { newStatus = 'reserved'; }
    else if (bed.status === 'reserved') { newStatus = 'occ'; }
    else if (bed.status === 'occ') { newStatus = 'avail'; }

    if (newStatus === 'reserved') {
      fetch(`${API_URL}/api/engine/reserve-gov-bed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-role': 'ControlRoom'
        },
        body: JSON.stringify({ hospitalId: activeData.candidates[0].name, bedId: bed.id, caseId: activeCase })
      }).catch(console.error);
    } else {
      // Just for this demo, update local state if it's occ/avail
      setBedState(prev => prev.map(b => b.id === bed.id ? { ...b, status: newStatus } : b));
      logEvent(`${bed.id} → ${newStatus.toUpperCase()}`);
    }
  };

  const getBedStyle = (bed) => {
    if (bed.type === 'normal') return bed.status === 'avail' ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    if (bed.status === 'avail') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer hover:bg-emerald-500/20';
    if (bed.status === 'reserved') return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer hover:bg-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30 cursor-pointer hover:bg-rose-500/20';
  };

  const currentAssignment = assignedByCase[activeCase] || null;
  const displayHospital = currentAssignment 
    ? { 
        name: currentAssignment.hospitalName, 
        loc: currentAssignment.hospitalLoc, 
        distanceKm: currentAssignment.distanceKm, 
        eta: `${currentAssignment.etaMinutes} min`, 
        reason: currentAssignment.reason 
      }
    : candidates[0];

  return (
    <div className="h-screen flex flex-col bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 glass-panel border-b border-slate-800/50 px-6 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <span className="font-bold text-white tracking-wider text-lg">EFF-ALLOT</span>
          <span className="ml-4 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">Central Control</span>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="text-right leading-tight">
              <div className="text-rose-400 font-bold font-mono">4</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500">Critical</div>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="text-right leading-tight">
              <div className="text-emerald-400 font-bold font-mono">36</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500">ICU Free</div>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-white transition-colors text-sm font-semibold ml-2"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Cases */}
        <div className="w-[320px] glass-panel border-r border-slate-800/50 flex flex-col z-10">
          <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/30">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Cases</h2>
            <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">4</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cases.map(c => (
              <div 
                key={c.id} 
                onClick={() => {
                  setActiveCase(c.id);
                  const socket = getSocket(API_URL);
                  socket.emit('action', { type: 'admin_view_changed', payload: { caseId: c.id } });
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  activeCase === c.id 
                    ? 'bg-primary/10 border-primary/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono font-bold text-sm text-white">{c.id}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${c.sevClass}`}>{c.sevText}</span>
                </div>
                <div className="text-xs text-slate-400 mb-2 truncate">{c.meta}</div>
                <div className={`text-[11px] font-mono font-semibold ${activeCase === c.id ? 'text-primary' : 'text-slate-500'}`}>{c.eta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative bg-slate-950 z-0">
          <MapContainer center={[13.0680, 80.2450]} zoom={12} className="w-full h-full" zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={19} subdomains="abcd" />
            <MapBounds bounds={[activeData.patientLoc, displayHospital?.loc || activeData.patientLoc]} />

            <>
              <Marker position={activeData.patientLoc} icon={dotIcon('#F43F5E', 20)} />
              {candidates.map((cand, idx) => (
                <Marker 
                  key={idx} 
                  position={cand.loc} 
                  icon={dotIcon(idx === 0 ? '#10B981' : '#64748B', idx === 0 ? 18 : 14)} 
                />
              ))}

              {currentAssignment ? (
                <Polyline 
                  positions={[activeData.patientLoc, currentAssignment.hospitalLoc]} 
                  pathOptions={{ color: '#3B82F6', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
                />
              ) : (
                candidates[0] && (
                  <Polyline 
                    positions={[activeData.patientLoc, candidates[0].loc]} 
                    pathOptions={{ color: '#475569', weight: 4, opacity: 0.7, dashArray: '10,10', lineCap: 'round' }} 
                  />
                )
              )}
            </>
          </MapContainer>
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none"></div>

          {/* Floating Route Info */}
          <div className="absolute top-6 left-6 z-[400] glass-panel p-5 rounded-2xl max-w-sm border border-primary/30 shadow-[0_8px_32px_rgba(59,130,246,0.15)]">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-primary uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Active Route
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">
              {displayHospital?.name || 'Loading...'}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              {displayHospital 
                ? `${displayHospital.distanceKm} km, ${displayHospital.eta} — ${displayHospital.reason}` 
                : 'Fetching candidates...'}
            </p>
          </div>
        </div>

        {/* Right Sidebar - Hospital Ranking */}
        <div className="w-[360px] glass-panel border-l border-slate-800/50 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="p-4 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/30">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Target Analytics</h2>
            <span className="font-mono text-xs text-primary font-bold">{activeCase}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {/* TOPSIS Ranks */}
            <div className="space-y-4 mb-8">
              {candidates.map((h, i) => {
                const cls = i === 0 ? 'border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.1)] bg-slate-900' : (i === 2 ? 'border-slate-800 bg-slate-900/50 opacity-75' : 'border-slate-800 bg-slate-900/50');
                const tCls = i === 0 ? 'bg-primary' : 'bg-slate-600';
                return (
                <div key={i} className={`p-4 rounded-2xl border ${cls}`}>
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-sm font-bold text-white mr-2">{h.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${i===0 ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>#{i+1}</span>
                      <div className="text-xs text-slate-400 mt-1">{h.eta} • {h.distanceKm} km</div>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary">{h.score}</span>
                  </div>
                  
                  {i === 0 && h.reason && (
                    <div className="text-xs text-primary mb-3 bg-primary/10 p-2 rounded">{h.reason}</div>
                  )}

                  <div className="space-y-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 w-16 uppercase tracking-wider">Capability</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${tCls}`} style={{width: `${h.cap}%`}}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 w-16 uppercase tracking-wider">Avail</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${tCls}`} style={{width: `${h.av}%`}}></div>
                      </div>
                    </div>
                  </div>
                  
                  {i === 0 && (
                    <button 
                      onClick={() => handleAssignHospital(h)}
                      className="w-full py-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-colors"
                    >
                      Assign Hospital
                    </button>
                  )}
                </div>
              )})}
            </div>

            {/* ICU Grid */}
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{activeData.candidates[0].name} ICU Allocation</h3>
              <div className="grid grid-cols-4 gap-2">
                {bedState.map(bed => (
                  <div 
                    key={bed.id} 
                    onClick={() => handleBedClick(bed)}
                    className={`aspect-square rounded-xl flex items-center justify-center border font-mono text-xs font-bold transition-all ${getBedStyle(bed)}`}
                  >
                    {bed.id}
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={async () => {
                if (bedState.find(b=>b.id==='G01')?.status === 'avail') {
                  try {
                    await fetch(`${API_URL}/api/engine/reserve-gov-bed`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-mock-role': 'ControlRoom'
                      },
                      body: JSON.stringify({ hospitalId: activeData.candidates[0].name, bedId: 'G01', caseId: activeCase })
                    });
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
              className={`w-full mt-2 py-3 rounded-xl font-bold text-sm transition-all ${
                bedState.find(b=>b.id==='G01')?.status === 'avail'
                  ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {bedState.find(b=>b.id==='G01')?.status === 'avail' ? 'Reserve Gov ICU (G01)' : 'G01 Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <footer className="h-8 glass-panel border-t border-slate-800/50 flex items-center px-4 overflow-hidden relative z-20 bg-slate-900/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-4">Live Audit Log</span>
        <div className="flex-1 whitespace-nowrap overflow-hidden relative flex items-center">
          <div className="text-[11px] font-mono text-slate-500 inline-block animate-[scroll-left_30s_linear_infinite]">
            {events.join('  •  ')}  •  {events.join('  •  ')}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ControlRoomDashboard;
