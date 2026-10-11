import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Patient');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username || 'TestUser');
    
    if (role === 'Patient') navigate('/patient');
    if (role === 'Attender') navigate('/attender');
    if (role === 'Hospital') navigate('/hospital');
    if (role === 'ControlRoom') navigate('/control-room');
  };

  const roles = [
    { id: 'Patient', label: 'Patient Portal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'Attender', label: 'Ambulance Attender', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
    { id: 'Hospital', label: 'Hospital Admin', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'ControlRoom', label: 'Control Room', icon: 'M9 19V6l12-3v13M9 19c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm12 0c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z M2 12h4l2-2 4 8 2-6 4 2' } // Combined music note and activity for Control Room? Wait, just use a generic icon
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0E1621] font-sans text-[#E7EDF3]">
      <div className="w-full max-w-5xl bg-[#16212E] border border-[#28374A] flex flex-col md:flex-row shadow-2xl relative z-10 rounded-xl overflow-hidden">
        
        {/* Left Side - Context */}
        <div className="w-full md:w-5/12 bg-[#1C2836] border-r border-[#28374A] p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-3 h-3 bg-[#2DD4BF] animate-pulse"></div>
              <h1 className="text-xl font-bold font-mono tracking-widest text-[#E7EDF3]">EFF-ALLOT</h1>
            </div>
            
            <h2 className="text-3xl font-medium text-[#E7EDF3] mb-6 leading-tight">
              Emergency<br/>Resource<br/>Coordination
            </h2>
            <p className="text-[#93A4B8] text-sm leading-relaxed max-w-[280px]">
              Platform for coordinating real-time case routing, ambulance dispatch, hospital resource availability, and government ICU allocation.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 md:mt-0 pt-8 border-t border-[#28374A]">
            <p className="text-xs text-[#93A4B8] font-mono tracking-wider uppercase mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#2DD4BF]"></div>
              <span className="text-sm font-medium text-[#2DD4BF]">All regions operational</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 p-10 lg:p-14 flex flex-col justify-center bg-[#16212E]">
          <div className="mb-10">
            <h3 className="text-2xl font-medium text-[#E7EDF3] mb-2">Access Portal</h3>
            <p className="text-sm text-[#93A4B8]">Select your authorization level and authenticate.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-3">Role Authorization</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-4 border rounded-md cursor-pointer transition-colors flex flex-col gap-2 ${
                      role === r.id 
                        ? 'border-[#2DD4BF] bg-[#2DD4BF]/10' 
                        : 'border-[#28374A] bg-[#1C2836] hover:border-[#93A4B8]'
                    }`}
                  >
                    <svg className={`w-5 h-5 ${role === r.id ? 'text-[#2DD4BF]' : 'text-[#93A4B8]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {r.id === 'Patient' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                      {r.id === 'Attender' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />}
                      {r.id === 'Hospital' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
                      {r.id === 'ControlRoom' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                    </svg>
                    <span className={`text-sm font-medium ${role === r.id ? 'text-[#2DD4BF]' : 'text-[#E7EDF3]'}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {role !== 'Patient' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-2">Username</label>
                  <input 
                    type="text" 
                    placeholder="admin@eff-allot.org" 
                    className="w-full bg-[#16212E] border border-[#28374A] rounded-md px-4 py-3 text-[#E7EDF3] placeholder-[#93A4B8]/50 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-all"
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono tracking-wider uppercase text-[#93A4B8] mb-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-[#16212E] border border-[#28374A] rounded-md px-4 py-3 text-[#E7EDF3] placeholder-[#93A4B8]/50 focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] transition-all"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                </div>
              </div>
            )}
            
            <button type="submit" className="w-full bg-[#2DD4BF] text-[#0E1621] font-bold mt-8 py-3 rounded-md hover:bg-[#2DD4BF]/90 transition-colors">
              {role === 'Patient' ? 'Proceed to Call for Help' : 'Authenticate'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
