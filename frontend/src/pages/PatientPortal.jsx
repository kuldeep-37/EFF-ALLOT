import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;
const getSocket = (url) => {
  if (!socketInstance) socketInstance = io(url);
  return socketInstance;
};

function PatientPortal() {
  const [caseId, setCaseId] = useState(localStorage.getItem('activePatientCaseId') || null);
  const [phone, setPhone] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  
  // Status Tracking
  const [stage, setStage] = useState('Dispatched'); // Dispatched, En Route, Arrived, Hospital Selected, En Route to Hospital
  const [eta, setEta] = useState('Calculating...');
  
  // Optional Form
  const [condition, setCondition] = useState('');
  const [patientsCount, setPatientsCount] = useState('1');
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    
    const socket = getSocket('http://localhost:5000');
    
    // In a real app, we would authenticate the socket connection with a short-lived token here
    // and join the specific case room: socket.emit('join_case_patient', { caseId, token })

    socket.on('action', (data) => {
      // Live updates
      if (data.type === 'eta_update' && data.payload.caseId === caseId) {
        setEta(data.payload.eta);
      }
      if (data.type === 'case_updated' && data.caseId === caseId) {
        // map backend status to UI stages
        if (data.status === 'Ambulance En Route') setStage('En Route');
        if (data.status === 'Ambulance Arrived') setStage('Arrived');
        if (data.status === 'Hospital Preparing') setStage('Hospital Selected');
        if (data.status === 'En Route to Hospital') setStage('En Route to Hospital');
      }
    });

    return () => {
      socket.off('action');
    };
  }, [caseId]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!phone) return alert('Please enter a callback phone number.');
    
    setIsDispatching(true);
    
    // Simulate getting geolocation
    setTimeout(() => {
      const newCaseId = 'LF-' + Math.floor(Math.random() * 9000 + 1000);
      setCaseId(newCaseId);
      localStorage.setItem('activePatientCaseId', newCaseId);
      
      const socket = getSocket('http://localhost:5000');
      socket.emit('action', {
        type: 'request_ambulance',
        payload: { 
          id: newCaseId, 
          sevText: 'PENDING TRIAGE', 
          sevClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20', 
          meta: `Callback: ${phone}`, 
          eta: 'Locating...' 
        }
      });
      setIsDispatching(false);
    }, 1500);
  };

  const submitOptionalDetails = (e) => {
    e.preventDefault();
    const socket = getSocket('http://localhost:5000');
    socket.emit('action', {
      type: 'patient_details_update',
      payload: { caseId, condition, patientsCount }
    });
    setFormSubmitted(true);
  };

  // UI rendering components
  const stages = ['Dispatched', 'En Route', 'Arrived', 'Hospital Selected', 'En Route to Hospital'];
  const currentStageIndex = stages.indexOf(stage) >= 0 ? stages.indexOf(stage) : 0;

  return (
    <div className="min-h-screen bg-[#0E1621] font-sans text-[#E7EDF3] flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex justify-center items-center border-b border-[#28374A] bg-[#16212E]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#2DD4BF] animate-pulse"></div>
          <h1 className="text-xl font-bold font-mono tracking-widest text-[#E7EDF3]">EFF-ALLOT</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {!caseId ? (
            <div className="bg-[#1C2836] border border-[#28374A] rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Call for Help</h2>
                <p className="text-[#93A4B8] text-sm">We will use your device location to dispatch the nearest emergency response unit.</p>
              </div>

              <form onSubmit={handleDispatch} className="space-y-6">
                <div>
                  <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-2">Callback Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+91 "
                    className="w-full bg-[#16212E] border border-[#28374A] rounded-md px-4 py-4 text-[#E7EDF3] text-lg placeholder-[#93A4B8]/50 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-all"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isDispatching}
                  className="w-full bg-rose-600 text-white font-bold py-4 rounded-md text-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                >
                  {isDispatching ? 'Acquiring Location...' : 'Request Ambulance Now'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Live Status Tracker */}
              <div className="bg-[#1C2836] border border-[#28374A] rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#93A4B8] mb-1">Active Emergency</p>
                    <h2 className="text-2xl font-bold text-[#E7EDF3] font-mono">{caseId}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono uppercase text-[#93A4B8] mb-1">Live ETA</p>
                    <h2 className="text-2xl font-bold text-[#2DD4BF]">{eta}</h2>
                  </div>
                </div>

                <div className="relative pt-4 pb-2">
                  {/* Progress Line */}
                  <div className="absolute left-[15px] top-6 bottom-4 w-0.5 bg-[#28374A]"></div>
                  <div className="absolute left-[15px] top-6 w-0.5 bg-[#2DD4BF] transition-all duration-1000" style={{ height: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}></div>
                  
                  <div className="space-y-8 relative z-10">
                    {stages.map((s, idx) => (
                      <div key={s} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                          idx < currentStageIndex ? 'bg-[#2DD4BF] border-[#2DD4BF] text-[#0E1621]' :
                          idx === currentStageIndex ? 'bg-[#0E1621] border-[#2DD4BF] text-[#2DD4BF]' :
                          'bg-[#16212E] border-[#28374A] text-[#28374A]'
                        }`}>
                          {idx < currentStageIndex ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${idx === currentStageIndex ? 'bg-[#2DD4BF] animate-ping' : 'bg-transparent'}`}></div>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${idx <= currentStageIndex ? 'text-[#E7EDF3]' : 'text-[#93A4B8]'}`}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Form */}
              {!formSubmitted && (
                <div className="bg-[#1C2836] border border-[#28374A] rounded-xl p-6 shadow-2xl">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#E7EDF3]">Provide Details (Optional)</h3>
                    <p className="text-sm text-[#93A4B8]">The ambulance is already on the way. Providing details helps responders prepare.</p>
                  </div>
                  <form onSubmit={submitOptionalDetails} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-2">Patient Condition / Symptoms</label>
                      <textarea 
                        rows="3"
                        className="w-full bg-[#16212E] border border-[#28374A] rounded-md px-4 py-3 text-[#E7EDF3] placeholder-[#93A4B8]/50 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-all"
                        placeholder="E.g., chest pain, breathing difficulty..."
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-2">Number of Patients</label>
                      <select 
                        className="w-full bg-[#16212E] border border-[#28374A] rounded-md px-4 py-3 text-[#E7EDF3] focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-all"
                        value={patientsCount}
                        onChange={(e) => setPatientsCount(e.target.value)}
                      >
                        <option>1</option>
                        <option>2</option>
                        <option>3+</option>
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-[#28374A] text-[#E7EDF3] font-bold py-3 rounded-md hover:bg-[#28374A]/80 transition-colors border border-[#28374A] hover:border-[#93A4B8]"
                    >
                      Send Details
                    </button>
                  </form>
                </div>
              )}

              {formSubmitted && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-400 font-medium">Details sent to emergency responders.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PatientPortal;
