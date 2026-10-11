import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import PatientPortal from './pages/PatientPortal';
import AttenderDashboard from './pages/AttenderDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import ControlRoomDashboard from './pages/ControlRoomDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function App() {
  return (
    <Router>
      <div className="dashboard-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient" element={<PatientPortal />} />
          <Route path="/attender" element={<AttenderDashboard />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/control-room" element={<ControlRoomDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
