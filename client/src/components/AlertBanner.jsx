import React, { useEffect, useState } from 'react';

export default function AlertBanner({ alert, clearAlert, onReport, onEndJourney }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      if (alert.type !== 'arrived') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            if (clearAlert) clearAlert();
          }, 300);
        }, 4000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [alert, clearAlert]);

  if (!alert && !isVisible) return null;

  const shakeStyle = alert?.type === 'high_danger' ? { animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' } : {};

  if (alert?.type === 'arrived') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13,27,42,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', transition: 'opacity 0.4s ease', opacity: isVisible ? 1 : 0
      }}>
        <div style={{
          background: '#1A0A2E', padding: '32px 24px', borderRadius: '24px',
          border: '1px solid #22C55E', boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
          textAlign: 'center', width: '100%', maxWidth: '340px'
        }}>
          <div style={{ width: '64px', height: '64px', background: '#052E16', border: '3px solid #6EE7B7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(110,231,183,0.3)' }}>
            <span style={{ fontSize: '28px' }}>🛡️</span>
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: '#E8A4C0', fontSize: '24px' }}>Journey Complete</h2>
          <p style={{ margin: '0 0 24px 0', color: '#94A3B8', fontSize: '15px' }}>You arrived safely</p>

          <button onClick={onReport} style={{ width: '100%', padding: '14px', background: 'rgba(232,164,192,0.1)', border: '1px solid #E8A4C0', color: '#E8A4C0', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px', cursor: 'pointer' }}>
            Share experience
          </button>
          <button onClick={onEndJourney} style={{ width: '100%', padding: '14px', background: '#6828B8', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
            End Journey
          </button>
        </div>
      </div>
    );
  }

  // Define logic for different alerts
  const isDanger = alert?.type === 'danger';
  const isHighDanger = alert?.type === 'high_danger';
  const isSafe = alert?.type === 'safe_zone';

  const bg = isHighDanger ? 'linear-gradient(to right, #450A0A, #7F1D1D)' : isDanger ? 'linear-gradient(to right, #7F1D1D, #991B1B)' : 'linear-gradient(to right, #052E16, #14532D)';
  const borderLeft = isHighDanger ? '4px solid #EF4444' : isDanger ? '4px solid #FCA5A5' : '4px solid #6EE7B7';

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideDownAlert {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes shake {
            10%, 90% { transform: translate3d(-1px, 0, 0); }
            20%, 80% { transform: translate3d(2px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
            40%, 60% { transform: translate3d(4px, 0, 0); }
          }
      `}} />
      <div style={{
        position: 'fixed', top: '70px', left: '16px', right: '16px', zIndex: 1200,
        background: bg, borderLeft: borderLeft, borderRadius: '12px', padding: '14px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        ...shakeStyle
      }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
          {isHighDanger && "🚨 "} {alert?.message}
        </div>
      </div>
    </>
  );
}