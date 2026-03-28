import React, { useState, useEffect } from 'react';

export const getCategoryFromHour = (hour) => {
  if (hour >= 0 && hour <= 4) return 'night';
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 20) return 'evening';
  return 'night'; // 21-23
};

export const formatTime = (hour) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
};

export default function TimeFilter({ onTimeChange }) {
  const [hour, setHour] = useState(new Date().getHours());

  const handleChange = (e) => {
    const h = parseInt(e.target.value, 10);
    setHour(h);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeChange(getCategoryFromHour(hour));
    }, 150);
    return () => clearTimeout(timer);
  }, [hour, onTimeChange]);

  const isNight = getCategoryFromHour(hour) === 'night';
  const icon = isNight ? '🌙' : '☀️';

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px', 
      left: '200px',
      right: '100px',
      width: 'calc(100% - 300px)',
      background: 'rgba(26,10,46,0.92)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      padding: '10px 16px',
      zIndex: 1000,
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      border: '1px solid rgba(104,40,184,0.3)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <style>{`
        .time-slider {
          accent-color: #6828B8;
          width: 100%;
          cursor: pointer;
        }
      `}</style>
      
      <div style={{ fontSize: '18px' }}>{icon}</div>
      <div style={{ color: 'white', fontSize: '14px', whiteSpace: 'nowrap' }}>
        Showing risk at <span style={{ color: '#E8A4C0', fontWeight: 'bold' }}>{formatTime(hour)}</span>
      </div>
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <input 
          type="range" 
          min="0" 
          max="23" 
          step="1" 
          value={hour} 
          onChange={handleChange} 
          className="time-slider"
        />
      </div>
    </div>
  );
}
