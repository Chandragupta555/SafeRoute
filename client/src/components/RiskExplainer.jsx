import React, { useEffect, useState } from 'react';

export default function RiskExplainer({ isOpen, onClose, routeStats, locationCoords }) {
  const [communityCount, setCommunityCount] = useState(0);

  useEffect(() => {
    if (isOpen && locationCoords) {
      // Fetch community count
      fetch(`/api/incidents/count?lat=${locationCoords.lat}&lng=${locationCoords.lng}&radius=5000&days=7`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.count !== undefined) setCommunityCount(data.count);
      })
      .catch(err => console.error("Error fetching incident count:", err));
    }
  }, [isOpen, locationCoords]);

  if (!isOpen || !routeStats || !routeStats.factors) return null;

  const { factors } = routeStats;

  const renderBar = (factorValue, color, isNegative = false) => {
    const rawPct = Math.abs(factorValue) * 100;
    // Map the percentage directly so 40% = full visual bar since most weights cap around there
    const visualWidth = Math.min(rawPct * 2.5, 100); 
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${visualWidth}%`, height: '100%', background: color, borderRadius: '4px' }}></div>
        </div>
        <div style={{ width: '45px', textAlign: 'right', fontSize: '13px', color: '#E2E8F0', fontWeight: 'bold' }}>
          {isNegative ? '-' : '+'}{rawPct.toFixed(0)}%
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1A0A2E', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        padding: '24px', borderTop: '1px solid rgba(232,164,192,0.3)',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✕
        </button>

        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', color: 'white' }}>How your safety score is calculated</h2>
        <p style={{ margin: '0 0 24px 0', color: '#E8A4C0', fontSize: '14px', fontWeight: 'bold' }}>6 factors analyzed in real time</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 1: Perception score</div>
            {renderBar(factors.perceptionScore, '#6828B8')}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 2: Recency of reports</div>
            {renderBar(factors.recencyScore, '#E8A4C0')}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 3: Travel mode risk</div>
            {renderBar(factors.transportRisk, '#14B8A6')}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 4: Time of day</div>
            {renderBar(factors.timeRisk, '#f7d519')}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 5: Incident density</div>
            {renderBar(factors.incidentDensity, '#EF4444')}
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>Factor 6: Safe zones nearby</div>
            {renderBar(factors.safeZoneBonus, '#22C55E', true)}
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#CBD5E1', fontSize: '13px', lineHeight: '1.5' }}>
            Score updates automatically as community members share their experiences. The more women use SafeRoute, the more accurate your score becomes.
          </p>
        </div>

        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '12px' }}>
            <span style={{ color: '#E8A4C0', fontWeight: 'bold', fontSize: '14px' }}>{communityCount} women</span> have shared experiences on routes near you in the last 7 days
          </p>
        </div>
      </div>
    </div>
  );
}
