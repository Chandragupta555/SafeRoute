import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sosAPI } from '../utils/api';

export default function SOSButton({ userPosition }) {
  const [state, setState] = useState('idle');
  const [countdown, setCountdown] = useState(null);
  const [toast, setToast] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const countdownIntervalRef = useRef(null);

  // Recover pending offline SOS
  useEffect(() => {
    const handleOnline = async () => {
      const pending = localStorage.getItem('saferoute_pending_sos');
      if (pending && isAuthenticated) {
        try {
          const parsed = JSON.parse(pending);
          setToast('Internet restored. Sending queued SOS...');
          // FIX: Send as an object with latitude/longitude keys
          await sosAPI.trigger({
            latitude: parsed.lat,
            longitude: parsed.lng
          });
          localStorage.removeItem('saferoute_pending_sos');
          setState('active');
          setToast('Alert sent to trusted contacts!');
          setTimeout(() => setToast(''), 4000);
        } catch (err) {
          console.error('Failed to send pending SOS', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated]);

  const handleSOSFire = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!userPosition) {
      setToast('Waiting for location data...');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setState('sending');
    const [lat, lng] = userPosition;

    if (!navigator.onLine) {
      localStorage.setItem('saferoute_pending_sos', JSON.stringify({ lat, lng, timestamp: Date.now() }));
      setState('offline');
      setToast('No internet — SMS will fire when connection returns');
      setTimeout(() => setToast(''), 5000);
      return;
    }

    try {
      // FIX: The core handshake fix. Sending the keys the backend wants.
      await sosAPI.trigger({
        latitude: lat,
        longitude: lng,
        message: "EMERGENCY: I need help! My location is attached."
      });

      setState('active');
      setToast('Alert sent successfully!');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send SOS';
      setToast(msg);
      setState('idle');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const handleTapStart = (e) => {
    if (!isAuthenticated) return;
    let count = 3;
    setCountdown(count);
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        handleSOSFire();
      }
    }, 1000);
  };

  const handleTapEnd = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (countdown !== null && countdown > 0) {
      setCountdown(null);
      setState('confirming');
    }
  };

  const preventContextMenu = (e) => { e.preventDefault(); };

  const getButtonStyles = () => {
    const base = {
      position: 'fixed', bottom: '100px', right: '20px', zIndex: 2000,
      width: '72px', height: '72px', borderRadius: '50%',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontWeight: 'bold', fontSize: '16px', color: 'white',
      border: '3px solid #E8A4C0', cursor: 'pointer',
      userSelect: 'none', transition: 'all 0.3s ease',
      WebkitTapHighlightColor: 'transparent',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      outline: 'none', padding: 0
    };
    if (state === 'active') return { ...base, backgroundColor: '#166534', borderColor: '#4ADE80' };
    if (state === 'offline') return { ...base, backgroundColor: '#92400E', borderColor: '#FCD34D' };
    return { ...base, backgroundColor: '#CC0000', animation: 'sosPulse 2s infinite' };
  };

  return (
    <>
      <style>{`
        @keyframes sosPulse {
          0% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(204, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes blinkDot { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 2100, fontWeight: 'bold', textAlign: 'center', minWidth: '200px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}

      {state === 'confirming' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#1A0A2E', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px', border: '1px solid #CC0000', textAlign: 'center' }}>
            <h2 style={{ color: '#CC0000', margin: '0 0 16px 0' }}>Send SOS?</h2>
            <p style={{ color: '#E2E8F0', marginBottom: '24px' }}>Your location will be sent to trusted contacts.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setState('idle')} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #64748B', color: 'white', borderRadius: '8px' }}>Cancel</button>
              <button onClick={handleSOSFire} style={{ flex: 1, padding: '12px', background: '#CC0000', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>SEND NOW</button>
            </div>
          </div>
        </div>
      )}

      <button
        style={getButtonStyles()}
        onMouseDown={handleTapStart}
        onMouseUp={handleTapEnd}
        onMouseLeave={() => { if (countdown !== null) handleTapEnd(); }}
        onTouchStart={handleTapStart}
        onTouchEnd={handleTapEnd}
        onContextMenu={preventContextMenu}
      >
        {state === 'sending' ? (
          <div style={{ width: '24px', height: '24px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : countdown !== null ? (
          <span style={{ fontSize: '32px' }}>{countdown}</span>
        ) : state === 'active' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'blinkDot 1s infinite' }} />
            <span>LIVE</span>
          </div>
        ) : (
          <span>SOS</span>
        )}
      </button>
    </>
  );
}