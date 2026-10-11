import React from 'react';

function AnalyticsDashboard() {
  const metrics = {
    timeToConfirmation: '2m 14s',
    nonNearestRouting: '32%',
    dashboardLatency: '180ms',
    govReserveAuditRate: '100%'
  };

  return (
    <div className="procedural-view dashboard-container">
      <header style={{ borderBottom: '2px solid #E3E8EE', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1F2937' }}>System Analytics & Metrics</h1>
          <p style={{ margin: 0, color: '#4B5563' }}>Performance against Success Metrics</p>
        </div>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          style={{ padding: '8px 16px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Avg. Time to Hospital Confirmation</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)' }}>{metrics.timeToConfirmation}</div>
        </div>
        
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Non-Nearest Routing (Time optimized)</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)' }}>{metrics.nonNearestRouting}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Dashboard Sync Latency</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-info)' }}>{metrics.dashboardLatency}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Gov Reserve Audit Trailed</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{metrics.govReserveAuditRate}</div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
