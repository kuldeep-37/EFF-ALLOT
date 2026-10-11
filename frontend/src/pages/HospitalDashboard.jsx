import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;
const getSocket = (url) => {
  if (!socketInstance) socketInstance = io(url);
  return socketInstance;
};

const initialBedState = [
  { id: 'I01', type: 'normal', status: 'avail' }, { id: 'I02', type: 'normal', status: 'occ' },
  { id: 'I03', type: 'normal', status: 'avail' }, { id: 'I04', type: 'normal', status: 'occ' },
  { id: 'I05', type: 'normal', status: 'occ' },   { id: 'I06', type: 'normal', status: 'occ' },
  { id: 'I07', type: 'normal', status: 'occ' },   { id: 'I08', type: 'normal', status: 'occ' },
  { id: 'G01', type: 'gov', status: 'avail' },    { id: 'G02', type: 'gov', status: 'avail' },
  { id: 'G03', type: 'gov', status: 'reserved' }, { id: 'G04', type: 'gov', status: 'occ' },
];

function HospitalDashboard() {
  const [incomingCases, setIncomingCases] = useState([
    { 
      id: 'LF-1025', 
      sevText: 'CRITICAL', 
      sevClass: 'text-rose-400 bg-rose-500/20 border border-rose-500/30', 
      eta: '20 min', 
      status: 'Assigned',
      condition: 'Multiple Trauma',
      resources: ['Trauma Team', 'ICU', 'O- Blood']
    }
  ]);

  const [confirmedCases, setConfirmedCases] = useState([]);
  const [bedState, setBedState] = useState(initialBedState);

  useEffect(() => {
    const socket = getSocket('http://localhost:5000');
    socket.on('action', (data) => {
      if (data.type === 'request_ambulance') {
        setIncomingCases(prev => [{ 
          id: data.payload.id, 
          sevText: data.payload.sevText, 
          sevClass: data.payload.sevClass, 
          eta: data.payload.eta, 
          status: 'Assigned',
          condition: data.payload.meta || 'Undisclosed',
          resources: ['ICU', 'Ventilator']
        }, ...prev]);
      } else if (data.type === 'bed_reserved') {
        setBedState(prev => prev.map(b => b.id === data.payload.bedId ? { ...b, status: 'reserved' } : b));
        setConfirmedCases(prev => prev.map(c => c.id === data.payload.case_id ? { ...c, assignedBed: `Gov ICU (${data.payload.bedId})` } : c));
      } else if (data.type === 'eta_update') {
        setIncomingCases(prev => prev.map(c => c.id === data.payload.caseId ? { ...c, eta: data.payload.eta } : c));
        setConfirmedCases(prev => prev.map(c => c.id === data.payload.caseId ? { ...c, eta: data.payload.eta } : c));
      }
    });
    return () => socket.off('action');
  }, []);

  const handleBedClick = (bed) => {
    // Only Normal ICU beds are editable by hospital
    if (bed.type !== 'normal') return;
    
    let newStatus = bed.status;
    if (bed.status === 'avail') newStatus = 'occ';
    else if (bed.status === 'occ') newStatus = 'avail';
    
    setBedState(prev => prev.map(b => b.id === bed.id ? { ...b, status: newStatus } : b));
    
    // Broadcast availability change so Matching Engine (Control Room) sees it
    const socket = getSocket('http://localhost:5000');
    socket.emit('action', { type: 'hospital_bed_update', payload: { bedId: bed.id, status: newStatus } });
  };

  const getBedStyle = (bed) => {
    if (bed.type === 'normal') {
      return bed.status === 'avail' 
        ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-pointer hover:bg-slate-700' 
        : 'bg-rose-500/10 text-rose-500 border-rose-500/20 cursor-pointer hover:bg-rose-500/20';
    }
    // Gov beds (read-only style)
    if (bed.status === 'avail') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] opacity-80';
    if (bed.status === 'reserved') return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] opacity-80';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30 opacity-80';
  };

  const handleAccept = (c) => {
    setIncomingCases(prev => prev.filter(x => x.id !== c.id));
    setConfirmedCases(prev => [c, ...prev]);
    
    const socket = getSocket('http://localhost:5000');
    socket.emit('action', { type: 'case_updated', caseId: c.id, status: 'Hospital Preparing' });
  };

  const handleReject = async (c) => {
    try {
      const res = await fetch(`http://localhost:5000/api/engine/reject/${c.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-role': 'Hospital'
        },
        body: JSON.stringify({ hospitalId: 'Apollo Hospital' })
      });
      if (res.ok) {
        setIncomingCases(prev => prev.filter(x => x.id !== c.id));
      } else {
        alert('Failed to reject case. The backend returned an error: ' + await res.text());
      }
    } catch (err) {
      alert('Network Error: Could not connect to the backend server. Please make sure the Node server (server.js) is running on port 5000!');
      console.error('Error rejecting case', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-slate-800/50 px-8 py-5 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Apollo Hospital</h1>
            <p className="text-xs text-slate-400 font-medium">Administration Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-400">SYSTEM ONLINE</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
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

      <main className="flex-1 p-8 relative z-10 flex flex-col lg:flex-row gap-8 max-w-[1600px] w-full mx-auto">
        
        {/* Left Column: Incoming & Prep */}
        <div className="flex-[2] flex flex-col gap-6">
          
          {/* Pre-Arrival Prep Notification Panel */}
          {confirmedCases.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div> Active Pre-Arrival Preps
              </h2>
              <div className="space-y-4">
                {confirmedCases.map(c => (
                  <div key={c.id} className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div>
                        <span className="font-mono font-bold text-white text-lg mr-3">{c.id}</span>
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${c.sevClass}`}>{c.sevText}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-400 tracking-tighter">{c.eta}</div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Live ETA</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 relative z-10 mt-3">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Condition</div>
                        <div className="text-sm text-slate-300">{c.condition}</div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Required Resources</div>
                        <div className="flex gap-2 flex-wrap">
                          {c.resources.map((res, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-xs font-medium text-slate-300">{res}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Bed</div>
                        <div className="text-sm font-mono text-emerald-400 font-bold">{c.assignedBed || 'Pending Assignment'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Incoming Emergencies</h2>
              <p className="text-slate-400 text-sm">Assigned by TOPSIS. Awaiting acceptance.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {incomingCases.map(c => (
              <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono font-bold text-white text-lg">{c.id}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${c.sevClass}`}>{c.sevText}</span>
                    </div>
                    <p className="text-slate-300 text-sm mb-3"><span className="text-slate-500">Condition:</span> {c.condition}</p>
                    <div className="flex gap-2 flex-wrap mb-4">
                      {c.resources.map((res, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-400">{res}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between items-end min-w-[140px] border-l border-slate-800/50 pl-6">
                    <div className="text-right mb-4">
                      <div className="text-2xl font-mono font-bold text-primary">{c.eta}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Live ETA</div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
            {incomingCases.length === 0 && (
              <div className="glass-panel p-8 text-center rounded-2xl text-slate-500 border border-slate-800/50 border-dashed">
                No pending cases awaiting acceptance.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Resource Status Grid */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Resource Capacity</h2>
            <p className="text-slate-400 text-sm mb-6">Click Normal beds to toggle availability.</p>
          </div>
          
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Normal ICU Inventory</h3>
            <div className="grid grid-cols-4 gap-2 mb-8">
              {bedState.filter(b => b.type === 'normal').map(bed => (
                <div 
                  key={bed.id} 
                  onClick={() => handleBedClick(bed)}
                  className={`aspect-square rounded-xl flex items-center justify-center border font-mono text-xs font-bold transition-all ${getBedStyle(bed)}`}
                >
                  {bed.id}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end mb-4 pt-6 border-t border-slate-800/50">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Govt Reserved ICU</h3>
                <p className="text-[10px] text-rose-400 mt-1 uppercase font-semibold">Read-Only (Control Room Lock)</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {bedState.filter(b => b.type === 'gov').map(bed => (
                <div 
                  key={bed.id} 
                  className={`aspect-square rounded-xl flex items-center justify-center border font-mono text-xs font-bold transition-all ${getBedStyle(bed)}`}
                  title="Locked by Control Room"
                >
                  {bed.id}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HospitalDashboard;
