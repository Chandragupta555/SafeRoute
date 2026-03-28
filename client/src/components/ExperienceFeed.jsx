import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ExperienceFeed({ isOpen, onClose, originCoords, destCoords, onReport }) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Transport Emoji mapping
  const modeIcons = {
    walking: '🚶',
    cab: '🚗',
    bus: '🚌',
    auto: '🛺',
    bike: '🚲'
  };

  // Score Color Mapping
  const getScoreColor = (score) => {
    if (score <= 3) return '#EF4444'; // Red
    if (score <= 6) return '#F97316'; // Orange
    return '#22C55E'; // Green
  };

  const timeAgo = (dateStr) => {
    const diff = new Date() - new Date(dateStr);
    const hours = Math.floor(diff / 1000 / 60 / 60);
    if (hours < 24) return `${hours || 1} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  useEffect(() => {
    if (isOpen && originCoords && destCoords) {
      const fetchExp = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const url = `http://localhost:5000/api/incidents/route-experiences?lat1=${originCoords.lat}&lng1=${originCoords.lng}&lat2=${destCoords.lat}&lng2=${destCoords.lng}`;
          
          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setExperiences(response.data);
        } catch (error) {
          console.error("Failed to fetch experiences", error);
        } finally {
          setLoading(false);
        }
      };
      // Give a tiny buffer so panel slides instantly then fetches
      const t = setTimeout(fetchExp, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, originCoords, destCoords]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-320px',
      width: '320px',
      height: '100vh',
      backgroundColor: '#1A0A2E',
      borderLeft: '1px solid rgba(232,164,192,0.2)',
      zIndex: 2000,
      transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.5)' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '18px' }}>Route Experiences</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ color: '#E8A4C0', textAlign: 'center', padding: '20px' }}>Analyzing corridor...</div>
        ) : experiences.length === 0 ? (
          <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px', fontSize: '14px' }}>No experiences logged on this route corridor yet.</div>
        ) : (
          experiences.map(exp => (
            <div key={exp._id} style={{
              backgroundColor: 'rgba(104,40,184,0.12)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '10px',
              border: '1px solid rgba(104,40,184,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: getScoreColor(exp.safetyScore),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '14px'
                  }}>
                    {exp.safetyScore}
                  </div>
                  <span style={{ fontSize: '16px' }}>{modeIcons[exp.transportMode] || '🚶'}</span>
                </div>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>{timeAgo(exp.timeOfIncident)}</span>
              </div>
              
              {exp.experienceText && (
                <p style={{ color: 'white', fontSize: '14px', margin: '8px 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                  "{exp.experienceText}"
                </p>
              )}
              
              <div style={{ color: '#E8A4C0', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                {exp.isAnonymous ? 'Anonymous SafeRoute User' : 'Community Member'}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => { onClose(); onReport(); }} style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #6828B8 0%, #E8A4C0 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          Share your experience
        </button>
      </div>
    </div>
  );
}
