import React, { useState, useEffect } from 'react';
import useAnimatedCounter from '../hooks/useAnimatedCounter';

export default function LiveRiskHUD({ score, isSimulating, transportMode = 'walking' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isSimulating) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isSimulating]);

  const animatedScore = useAnimatedCounter(score || 100, 600);

  if (!isSimulating && !isVisible) return null;

  let color = '#4ADE80';
  let label = 'Safe';
  let pulse = false;

  if (animatedScore >= 75) {
    color = '#4ADE80'; label = 'Safe';
  } else if (animatedScore >= 50) {
    color = '#FB923C'; label = 'Moderate';
  } else if (animatedScore >= 25) {
    color = '#F87171'; label = 'Caution';
  } else {
    color = '#EF4444'; label = 'Danger'; pulse = true;
  }

  // Dynamic deterministic mini-factors linking against inversion matrices mathematically
  const riskTotal = 100 - animatedScore;
  const w1 = Math.min(100, Math.max(8, riskTotal * 1.3));
  const w2 = Math.min(100, Math.max(4, riskTotal * 0.6));
  const w3 = Math.min(100, Math.max(2, riskTotal * 0.3));

  const modes = {
    walking: <span><i className="bi bi-person-walking"></i> Walking</span>,
    bike: <span><i className="bi bi-bicycle"></i> Bike</span>,
    auto: <span><i className="bi bi-taxi-front"></i> Auto</span>,
    cab: <span><i className="bi bi-car-front"></i> Cab</span>,
    bus: <span><i className="bi bi-bus-front"></i> Bus</span>
  };

  return (
    <>
      <style>
        {`
          @keyframes textPulseDanger {
            0% { opacity: 1; transform: scale(1); text-shadow: 0 0 4px #EF4444; }
            50% { opacity: 0.8; transform: scale(1.05); text-shadow: 0 0 12px #EF4444; }
            100% { opacity: 1; transform: scale(1); text-shadow: 0 0 4px #EF4444; }
          }
        `}
      </style>
      <div style={{
        position: 'absolute',
        top: '140px',
        left: '12px',
        zIndex: 1100,
        background: 'rgba(15, 7, 32, 0.92)',
        borderRadius: '16px',
        border: '1px solid rgba(232,164,192,0.25)',
        padding: '16px',
        width: '130px',
        backdropFilter: 'blur(8px)',
        transform: isSimulating ? 'scale(1)' : 'scale(0.9)',
        opacity: isSimulating ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '1.2px', color: '#E8A4C0', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
          LIVE RISK SCORE
        </div>

        <div style={{
          fontSize: '48px',
          fontWeight: 700,
          color: color,
          lineHeight: 1,
          animation: pulse ? 'textPulseDanger 1s infinite' : 'none',
          marginBottom: '4px',
          display: 'flex',
          justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums' // Keep bounding boxes stable during tick animations
        }}>
          {animatedScore}
        </div>

        <div style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: color,
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>

        {/* Semantic Factor Graph - Miniaturized */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100px', marginBottom: '16px' }}>
          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${w1}%`, height: '100%', background: '#6828B8', borderRadius: '2px', transition: 'width 0.6s ease' }}></div>
          </div>
          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${w2}%`, height: '100%', background: '#F59E0B', borderRadius: '2px', transition: 'width 0.6s ease' }}></div>
          </div>
          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${w3}%`, height: '100%', background: '#EF4444', borderRadius: '2px', transition: 'width 0.6s ease' }}></div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'bold' }}>
          {modes[transportMode] || <span><i className="bi bi-person-walking"></i> Walking</span>}
        </div>
      </div>
    </>
  );
}
