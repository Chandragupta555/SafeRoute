import React, { useState } from 'react';
import axios from 'axios';

export default function QuickReport({ isOpen, onClose, locationCoords }) {
  const [safetyScore, setSafetyScore] = useState(null);
  const [transportMode, setTransportMode] = useState('');
  const [timeToggle, setTimeToggle] = useState('now');
  const [customTime, setCustomTime] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen && !showSuccess) return null;

  const handleSubmit = async () => {
    if (!safetyScore || !transportMode) return alert("Please select a safety score and transport mode.");

    setIsSubmitting(true);
    try {
      let timeOfIncident = new Date();
      if (timeToggle === 'earlier') {
        timeOfIncident.setHours(timeOfIncident.getHours() - 3);
      } else if (timeToggle === 'custom' && customTime) {
        const [hh, mm] = customTime.split(':');
        timeOfIncident.setHours(parseInt(hh), parseInt(mm), 0);
      }

      const payload = {
        safetyScore,
        transportMode,
        timeOfIncident,
        experienceText,
        isAnonymous,
        latitude: locationCoords?.lat || 30.7333,
        longitude: locationCoords?.lng || 76.7794
      };

      const token = localStorage.getItem('token');

      // ADD THIS DEFENSIVE CHECK
      if (!token) {
        alert("Authentication Error: You must be logged in to share a route experience.");
        setIsSubmitting(false);
        return;
      }

      await axios.post('https://saferoute-hackmol.onrender.com/api/incidents', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setSafetyScore(null);
        setTransportMode('');
        setExperienceText('');
        setTimeToggle('now');
      }, 3000);
    } catch (e) {
      console.error(e);
      alert("Error submitting report. Please check if you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: '#1A0A2E', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 -10px 40px rgba(0,0,0,0.8)', borderTop: '2px solid #E8A4C0' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>Thank you</h2>
        <p style={{ color: '#E8A4C0', fontSize: '16px', lineHeight: 1.4, margin: 0 }}>You just made this route safer for someone tonight.</p>
      </div>
    );
  }

  const renderScoreCircle = (num) => {
    let baseColor = num <= 3 ? '#EF4444' : num <= 6 ? '#F97316' : '#22C55E';
    const isSelected = safetyScore === num;
    return (
      <div
        key={num}
        onClick={() => setSafetyScore(num)}
        style={{
          width: '8%', aspectRatio: '1/1', borderRadius: '50%', background: baseColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
          transform: isSelected ? 'scale(1.3)' : 'scale(1)',
          border: isSelected ? '2px solid white' : 'none',
          boxShadow: isSelected ? `0 0 12px ${baseColor}` : 'none',
          transition: 'all 0.2s',
          flexShrink: 0
        }}>
        {num}
      </div>
    );
  };

  const modes = [
    { id: 'walking', icon: 'bi-person-walking', label: 'Walk' },
    { id: 'bus',     icon: 'bi-bus-front',      label: 'Bus'  },
    { id: 'auto',    icon: 'bi-taxi-front',     label: 'Auto' },
    { id: 'cab',     icon: 'bi-car-front',      label: 'Cab'  },
    { id: 'bike',    icon: 'bi-bicycle',        label: 'Bike' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, height: '85vh', background: '#1A0A2E', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.8)', borderTop: '1px solid rgba(104,40,184,0.5)' }}>
      <div style={{ width: '40px', height: '4px', background: '#94A3B8', borderRadius: '2px', margin: '12px auto' }} onClick={onClose}></div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '24px', margin: '0 0 4px 0' }}>How safe did you feel?</h2>
            <div style={{ color: '#94A3B8', fontSize: '14px' }}>Your perception matters — there's no wrong answer</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '28px', cursor: 'pointer', padding: 0 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '12px 0' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(renderScoreCircle)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px', fontWeight: 'bold' }}>
            <span style={{ color: '#EF4444' }}>Unsafe</span>
            <span style={{ color: '#F97316' }}>Uncomfortable</span>
            <span style={{ color: '#22C55E' }}>Safe</span>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 12px 0' }}>How were you travelling?</h3>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
            {modes.map(m => {
              const isSel = transportMode === m.id;
              return (
                <div key={m.id} onClick={() => setTransportMode(m.id)} style={{
                  width: '60px', height: '60px', borderRadius: '12px', flexShrink: 0,
                  background: isSel ? 'rgba(104,40,184,0.3)' : 'rgba(255,255,255,0.05)',
                  border: isSel ? '2px solid #6828B8' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ marginBottom: '4px' }}>
                    <i className={`bi ${m.icon}`} style={{ fontSize: '22px', color: isSel ? '#E8A4C0' : '#94A3B8', transition: 'color 0.2s' }}></i>
                  </div>
                  <div style={{ color: isSel ? 'white' : '#94A3B8', fontSize: '11px', fontWeight: 'bold' }}>{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 12px 0' }}>When did this happen?</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['now', 'earlier', 'custom'].map(opt => (
              <button key={opt} onClick={() => setTimeToggle(opt)} style={{
                background: timeToggle === opt ? '#1A0A2E' : 'rgba(255,255,255,0.05)',
                color: timeToggle === opt ? '#E8A4C0' : '#94A3B8',
                border: timeToggle === opt ? '1px solid #E8A4C0' : '1px solid rgba(255,255,255,0.2)',
                padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
              }}>
                {opt === 'now' ? 'Just now' : opt === 'earlier' ? 'Earlier today' : 'Custom time'}
              </button>
            ))}
          </div>
          {timeToggle === 'custom' && (
            <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{
              marginTop: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid #6828B8',
              color: 'white', padding: '10px', borderRadius: '8px', outline: 'none'
            }} />
          )}
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'white', fontSize: '18px', margin: '0 0 8px 0' }}>What made you feel this way? <span style={{ fontSize: '14px', color: '#94A3B8' }}>(optional)</span></h3>
          <textarea
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            placeholder="You can share as much or as little as you want..."
            maxLength={500}
            style={{
              width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', color: 'white',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px',
              resize: 'none', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px' }}>
            <label style={{ color: '#E8A4C0', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <input type="checkbox" checked={!isAnonymous} onChange={e => setIsAnonymous(!e.target.checked)} style={{ accentColor: '#E8A4C0', width: '18px', height: '18px' }} />
              Share with my name
            </label>
            <span style={{ color: '#94A3B8' }}>{experienceText.length}/500</span>
          </div>
        </div>

        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{ height: '80px', background: '#0D1B2A', borderRadius: '12px', border: '1px dashed #64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
            <span style={{ fontSize: '24px' }}>📍 Map Preview</span>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '12px', marginTop: '8px' }}>Tap map to adjust location</div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: '100%', padding: '16px', background: '#E8A4C0', color: '#1A0A2E',
            border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold',
            cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1, marginBottom: '20px'
          }}>
          {isSubmitting ? 'Sharing...' : 'Share Experience'}
        </button>
      </div>
    </div>
  );
}
