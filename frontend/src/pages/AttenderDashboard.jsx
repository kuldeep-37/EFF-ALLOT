import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

let socketInstance = null;
const getSocket = (url) => {
  if (!socketInstance) socketInstance = io(url);
  return socketInstance;
};

const dotIcon = (color, size = 16) => {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #0F172A;box-shadow:0 0 10px ${color}88;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const MapBounds = ({ bounds }) => {
  const map = useMap();
  const boundsString = JSON.stringify(bounds);
  useEffect(() => {
    if (bounds && bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [60, 60] });
  }, [map, boundsString]);
  return null;
};

const demoPatientLocs = {
  'LF-1025': [13.0418, 80.2341],
  'LF-1026': [13.0033, 80.2555],
  'LF-1027': [12.9784, 80.2185],
  'LF-1028': [13.0850, 80.2100]
};

function AttenderDashboard() {
  const urlParams = new URLSearchParams(window.location.search);
  const [caseId, setCaseId] = useState(urlParams.get('caseId') || 'LF-1025');
  const patientLoc = demoPatientLocs[caseId] || [13.0418, 80.2341];

  const [assignment, setAssignment] = useState(null);
  const [connected, setConnected] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const socket = getSocket(API_URL);

  useEffect(() => {
    // Reset assignment when case changes to force loading state
    setAssignment(null);
    
    // Fetch current state on load

    const fetchState = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cases/${caseId}`);
        const data = await res.json();
        if (data.hospital_id) {
          setAssignment({
            name: data.hospital_id.name,
            loc: [data.hospital_id.location.lat, data.hospital_id.location.lng],
            eta: data.routing_info?.etaMinutes,
            route: data.routing_info?.distanceKm,
            reason: data.routing_info?.reason,
            timestamp: Date.now()
          });
        }
      } catch (e) {
        console.error('Failed to fetch case state:', e);
      }
    };
    fetchState();

    if (socket.connected) {
      setConnected(true);
      socket.emit('join', caseId);
      console.log('Already connected! Joined room:', caseId, 'as', socket.id);
    }

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', caseId);
      console.log('Joined room:', caseId, 'as', socket.id);
    });
    
    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('Socket disconnected:', reason);
    });
    
    // Listen for Control Room changing tabs
    socket.on('action', (actionData) => {
      if (actionData.type === 'admin_view_changed') {
        setCaseId(actionData.payload.caseId);
      }
    });
    
    socket.on('case:hospitalAssigned', (data) => {
      console.log('[ATTENDER] RAW case:hospitalAssigned:', JSON.stringify(data, null, 2));
      try {
        setAssignment({
          name: data.hospital_id?.name ?? data.hospitalName,
          loc: [
            data.hospital_id?.location?.lat ?? data.coordinates?.lat,
            data.hospital_id?.location?.lng ?? data.coordinates?.lng
          ],
          eta: data.routing_info?.etaMinutes ?? data.eta,
          route: data.routing_info?.distanceKm ?? data.routePolyline,
          reason: data.routing_info?.reason ?? data.reason,
          timestamp: Date.now()
        });
        console.log('[ATTENDER] setAssignment called successfully');
      } catch (err) {
        console.error('[ATTENDER] FAILED to parse payload:', err, data);
      }
    });

    return () => {
      socket.emit('leave_case', caseId);
      socket.off('case:hospitalAssigned');
      socket.off('action');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [API_URL, caseId]);

  const routePoly = assignment ? [patientLoc, assignment.loc] : []; // simple straight line for demo

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 overflow-hidden font-sans relative">
      
      {/* Map Background Layer */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[13.0680, 80.2450]} zoom={12} className="w-full h-full" zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" maxZoom={19} subdomains="abcd" />
          {assignment && <MapBounds bounds={[patientLoc, assignment.loc]} />}
          <Marker position={patientLoc} icon={dotIcon('#F43F5E', 24)} />
          {assignment && (
            <>
              <Marker 
                position={assignment.loc} 
                icon={dotIcon('#10B981', 24)}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <span className="font-bold text-slate-800">{assignment.name}</span>
                </Tooltip>
              </Marker>
              <Polyline 
                positions={routePoly} 
                pathOptions={{ color: '#10B981', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
              />
            </>
          )}
        </MapContainer>
        {/* Subtle gradient overlay to make UI elements pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80 pointer-events-none"></div>
      </div>

      {/* Top Floating Header */}
      <div className="z-10 p-4 pt-6">
        <div className="glass-panel rounded-2xl flex items-center justify-between p-4 px-6 border border-white/10">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Case</span>
            <span className="text-2xl font-black text-white font-mono">{caseId}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Indicator */}
            <div className="flex items-center gap-2 mr-2">
              <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <div className="bg-rose-500/20 border border-rose-500/50 text-rose-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              CRITICAL
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1"></div>

      {/* Bottom Floating Dashboard Panel */}
      <div className="z-10 p-4 pb-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/30 rounded-full blur-2xl"></div>
          
          {assignment ? (
            <>
              {/* Visible Confirmation Banner for the live receipt requirement */}
              <div className="mb-4 bg-emerald-500/20 border border-emerald-500/50 p-2 rounded-xl text-center">
                <span className="text-emerald-400 font-bold text-sm">Hospital assigned: {assignment.name} — ETA {assignment.eta} min</span>
              </div>

              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                <h3 className="text-emerald-400 font-semibold uppercase tracking-wider text-sm">Target: {assignment.name}</h3>
              </div>
              
              <div className="flex items-end gap-4 mb-4 relative z-10">
                <p className="text-5xl font-black text-white tracking-tighter">{assignment.eta}<span className="text-2xl text-slate-400 font-medium ml-1">min</span></p>
                <p className="text-xl text-slate-400 font-medium mb-1">/ {assignment.route} km</p>
              </div>
              
              <p className="text-slate-300 text-sm mb-6 pb-6 border-b border-white/10 relative z-10">
                <span className="text-primary font-medium">{assignment.reason}</span>
              </p>
            </>
          ) : (
             <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold">Awaiting hospital assignment from Control Room</p>
             </div>
          )}

          <div className="flex gap-4 relative z-10">
            <button 
              onClick={async () => {
                try {
                  await fetch(`${API_URL}/api/cases/${caseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-mock-role': 'Attender' },
                    body: JSON.stringify({ status: 'AmbulanceAcknowledged' })
                  });
                  // Also emit the action for the Control Room dashboard
                  socket.emit('action', { type: 'attender_acknowledged', payload: { caseId } });
                  alert('Acknowledged');
                } catch (e) {
                  console.error(e);
                }
              }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-2xl transition-colors border border-white/10"
            >
              Acknowledge
            </button>
            <button 
              onClick={() => {
                socket.emit('action', { type: 'fault_declared', payload: { caseId } });
                alert('Fault declared. Control Room notified.');
              }}
              className="flex-1 bg-rose-500/80 hover:bg-rose-600 text-white font-semibold py-4 rounded-2xl transition-colors shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/50"
            >
              Declare Fault
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AttenderDashboard;
