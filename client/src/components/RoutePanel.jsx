import React from 'react';

export default function RoutePanel({ safeRoute, fastestRoute, onSelectRoute, onClose }) {
  if (!safeRoute || !fastestRoute) return null;

  // Check if they are actually the exact same OSMR alternative path
  const isSameRoute = safeRoute.rawRoute === fastestRoute.rawRoute;

  const renderRouteStats = (route) => (
    <>
      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#E8A4C0', lineHeight: 1 }}>
        {route.score} <span style={{ fontSize: '16px', color: '#94A3B8' }}>/100</span>
      </div>
      <div style={{ 
        color: route.label === 'Safe' ? '#166534' : route.label === 'Moderate' ? '#EA580C' : '#CC0000',
        fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', marginTop: '4px'
      }}>
        {route.label}
      </div>
      <div style={{ color: '#FFFFFF', fontSize: '14px', margin: '4px 0' }}>
        ⏱ {route.durationMinutes} min
      </div>
      <div style={{ color: '#94A3B8', fontSize: '14px', margin: '4px 0' }}>
        📍 {route.distanceKm} km
      </div>
      <div style={{ color: '#E8A4C0', fontSize: '12px', marginTop: '8px' }}>
        ⚠️ {route.nearbyIncidents} incidents nearby
      </div>
      {route.nearbySafeZones > 0 && (
        <div style={{ color: '#22C55E', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
          🛡️ Passes near {route.nearbySafeZones} safe zones
        </div>
      )}
    </>
  );

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%',
      backgroundColor: '#1A0A2E', borderRadius: '24px 24px 0 0',
      borderTop: '1px solid rgba(232,164,192,0.2)', zIndex: 1000,
      maxHeight: '45vh', overflowY: 'auto', padding: '0 20px 24px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ width: '40px', height: '4px', backgroundColor: '#6828B8', borderRadius: '2px', margin: '12px auto' }}></div>
      <h3 style={{ color: '#FFFFFF', fontSize: '18px', textAlign: 'center', margin: '0 0 20px 0' }}>Choose Your Route</h3>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {isSameRoute ? (
          <div style={{ flex: 1, backgroundColor: 'rgba(104,40,184,0.25)', border: '1px solid #6828B8', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
               <span style={{ background: '#6828B8', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>SAFE ROUTE</span>
               <span style={{ background: '#64748B', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>FASTEST</span>
             </div>
             {renderRouteStats(safeRoute)}
          </div>
        ) : (
          <>
            <div style={{ flex: 1, backgroundColor: 'rgba(104,40,184,0.25)', border: '1px solid #6828B8', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
              <div style={{ background: '#6828B8', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '12px' }}>SAFE ROUTE</div>
              {renderRouteStats(safeRoute)}
            </div>
            <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '16px', textAlign: 'center', opacity: fastestRoute.score < safeRoute.score ? 0.7 : 1 }}>
              <div style={{ background: '#64748B', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '12px' }}>FASTEST</div>
              {renderRouteStats(fastestRoute)}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn btn-primary" 
          style={{ flex: 1, padding: '14px', borderRadius: '12px' }} 
          onClick={() => { onSelectRoute(safeRoute); onClose(); }}
        >
          Take Safe Route
        </button>
        
        {!isSameRoute && (
          <button 
            style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #64748B', color: '#FFFFFF', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} 
            onClick={() => { onSelectRoute(fastestRoute); onClose(); }}
          >
            Take Fastest
          </button>
        )}
      </div>
    </div>
  );
}
