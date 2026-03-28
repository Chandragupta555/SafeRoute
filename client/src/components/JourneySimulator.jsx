import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  interpolateRoute, 
  calculateBearing, 
  checkZoneAlerts, 
  calculateLiveRiskScore 
} from '../utils/simulationEngine';
import { haversineDistance } from '../utils/routing';

const JourneySimulator = forwardRef(({
  routeCoordinates,
  incidents = [],
  safeZones = [],
  onPositionUpdate,
  onAlertChange,
  onScoreUpdate,
  onSimulationEnd,
  transportMode = 'walking',
  isActive
}, ref) => {
  const [interpolatedPath, setInterpolatedPath] = useState([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  
  const timerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    pause: () => {
      setIsPlaying(false);
    }
  }));

  // 1. Interpolate route path geometry upon Mount/Activation
  useEffect(() => {
    if (isActive && routeCoordinates && routeCoordinates.length > 0) {
      const dense = interpolateRoute(routeCoordinates, 15); // Densify path to 15m intervals
      setInterpolatedPath(dense);
      setCurrentPointIndex(0);
      setIsPlaying(true); 

      // Measure total real distance to display nicely in the UI
      let dist = 0;
      for (let i = 0; i < routeCoordinates.length - 1; i++) {
        dist += haversineDistance(
          routeCoordinates[i][0], routeCoordinates[i][1],
          routeCoordinates[i+1][0], routeCoordinates[i+1][1]
        );
      }
      setTotalDistanceKm(Math.max(0.1, dist / 1000));
    } else {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive, routeCoordinates]);

  // 2. Control Timers & Interval Progression Speed
  useEffect(() => {
    if (!isActive || !isPlaying || interpolatedPath.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    let intervalMs = 400; // Normal (1x)
    if (speed === 2) intervalMs = 150; // Fast (2x)
    if (speed === 4) intervalMs = 60; // Very Fast (4x)

    timerRef.current = setInterval(() => {
      setCurrentPointIndex(prev => {
        const nextIdx = prev + 1;
        
        if (nextIdx >= interpolatedPath.length - 1) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          if (onSimulationEnd) onSimulationEnd();
          return interpolatedPath.length - 1;
        }
        
        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isActive, isPlaying, speed, interpolatedPath, onSimulationEnd]);

  // 3. Process Live Metrics per Navigation Tick
  useEffect(() => {
    if (!isActive || interpolatedPath.length === 0) return;

    const currentPos = interpolatedPath[currentPointIndex];
    if (!currentPos) return;

    let bearing = 0;
    if (currentPointIndex < interpolatedPath.length - 1) {
      const nextPos = interpolatedPath[currentPointIndex + 1];
      bearing = calculateBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
    } else if (currentPointIndex > 0) {
      const prevPos = interpolatedPath[currentPointIndex - 1];
      bearing = calculateBearing(prevPos[0], prevPos[1], currentPos[0], currentPos[1]);
    }

    // 1. Dispatch strict GPS marker to parents
    if (onPositionUpdate) onPositionUpdate(currentPos[0], currentPos[1], bearing);

    // 2. Dispatch geofence collision scanner alerts
    const destLat = interpolatedPath[interpolatedPath.length - 1][0];
    const destLng = interpolatedPath[interpolatedPath.length - 1][1];
    const alertObject = checkZoneAlerts(currentPos[0], currentPos[1], incidents, safeZones, destLat, destLng);
    
    if (alertObject && onAlertChange) {
      onAlertChange(alertObject);
    }

    // 3. Run algorithmic point-based Risk Score (0-100 gauge)
    const currentHour = new Date().getHours();
    const liveScore = calculateLiveRiskScore(currentPos[0], currentPos[1], incidents, transportMode, currentHour);
    
    if (onScoreUpdate) {
      onScoreUpdate(liveScore);
    }

  }, [currentPointIndex]);

  if (!isActive) return null;

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentPointIndex(0);
    if (onSimulationEnd) onSimulationEnd(); 
  };

  const progressPercent = interpolatedPath.length > 0 
    ? (currentPointIndex / (interpolatedPath.length - 1)) * 100 
    : 0;

  const currentDistKm = (totalDistanceKm * (progressPercent / 100)).toFixed(1);
  const totalStr = totalDistanceKm.toFixed(1);

  return (
    <div style={{
      position: 'fixed',
      bottom: '60px', 
      left: 0,
      width: '100%',
      height: '80px',
      background: 'rgba(26,10,46,0.95)',
      borderTop: '1px solid rgba(232,164,192,0.2)',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dynamic Geometric Progress Fill */}
      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: '#6828B8', transition: 'width 0.1s linear' }}></div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Main Play / Pause Controller */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6828B8', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', paddingLeft: isPlaying ? '0' : '2px' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Granular Modal Multipliers */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '3px', gap: '2px' }}>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  background: speed === s ? '#E8A4C0' : 'transparent',
                  color: speed === s ? '#1A0A2E' : '#94A3B8',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  minWidth: '32px'
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Abort / Kill Switch */}
          <button 
            onClick={handleStop}
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'transparent', border: '1px solid #475569', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', marginLeft: '4px' }}
            title="Stop Simulation"
          >
            ✕
          </button>
          
        </div>

        {/* Analytical Progress Node */}
        <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 'bold' }}>
          {currentDistKm} km <span style={{ opacity: 0.5, fontWeight: 'normal' }}>of</span> {totalStr} km
        </div>
      </div>
    </div>
  );
});

export default JourneySimulator;
