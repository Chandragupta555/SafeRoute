import { haversineDistance } from './routing';
import { safeZones } from '../data/safeZonesChandigarh';

/**
 * FUNCTION 1 — interpolateRoute(routeCoordinates, stepDistanceMeters = 15)
 * Takes the raw route coordinate array, inserts intermediate points every stepDistanceMeters meters,
 * yielding a smooth dense array for simulation.
 */
export function interpolateRoute(routeCoordinates, stepDistanceMeters = 15) {
  if (!routeCoordinates || routeCoordinates.length < 2) return routeCoordinates;
  
  const densePath = [];
  
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const p1 = routeCoordinates[i];
    const p2 = routeCoordinates[i+1];
    
    densePath.push(p1);
    
    const dist = haversineDistance(p1[0], p1[1], p2[0], p2[1]);
    
    // If the gap is larger than our step distance, fill it in
    if (dist > stepDistanceMeters) {
      const numSteps = Math.floor(dist / stepDistanceMeters);
      const latStep = (p2[0] - p1[0]) / (numSteps + 1);
      const lngStep = (p2[1] - p1[1]) / (numSteps + 1);
      
      for (let j = 1; j <= numSteps; j++) {
        densePath.push([
          p1[0] + (latStep * j),
          p1[1] + (lngStep * j)
        ]);
      }
    }
  }
  
  densePath.push(routeCoordinates[routeCoordinates.length - 1]);
  return densePath;
}

/**
 * FUNCTION 2 — calculateBearing(lat1, lng1, lat2, lng2)
 * Calculate the compass bearing between two points in degrees (0-360).
 */
export function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lng2 - lng1);
  
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
            
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * FUNCTION 3 — getPositionAlongRoute(interpolatedPath, progressPercent)
 * Given a 0-100 progress value, return the exact [lat, lng] at that position.
 */
export function getPositionAlongRoute(interpolatedPath, progressPercent) {
  if (!interpolatedPath || interpolatedPath.length === 0) return null;
  
  let p = progressPercent;
  if (p <= 0) p = 0;
  if (p >= 100) p = 100;
  
  const totalPoints = interpolatedPath.length;
  const exactIndex = (p / 100) * (totalPoints - 1);
  const idx = Math.floor(exactIndex);
  
  const currentPos = interpolatedPath[idx];
  
  let bearing = 0;
  if (idx < totalPoints - 1) {
    const nextPos = interpolatedPath[idx + 1];
    bearing = calculateBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
  } else if (idx > 0) {
    const prevPos = interpolatedPath[idx - 1];
    bearing = calculateBearing(prevPos[0], prevPos[1], currentPos[0], currentPos[1]);
  }
  
  return {
    lat: currentPos[0],
    lng: currentPos[1],
    bearing,
    pointIndex: idx,
    totalPoints
  };
}

/**
 * ALERTS COOLDOWN STATE
 */
const alertCooldowns = {
  high_danger: 0,
  danger: 0,
  safe_zone: 0,
  arrived: 0
};

/**
 * FUNCTION 4 — checkZoneAlerts(currentLat, currentLng, incidents, safeZones, destLat, destLng)
 * Ensure an 8-second cooldown (8000ms) to avoid notification spam.
 */
export function checkZoneAlerts(currentLat, currentLng, incidents = [], safeZoneData = [], destLat = null, destLng = null) {
  const now = Date.now();
  const COOLDOWN_MS = 8000;
  
  // 1. Destination check
  if (destLat && destLng) {
    const destDist = haversineDistance(currentLat, currentLng, destLat, destLng);
    if (destDist <= 50 && (now - alertCooldowns.arrived > COOLDOWN_MS)) {
      alertCooldowns.arrived = now;
      return { type: 'arrived', message: 'You have arrived safely' };
    }
  }

  // 2. High Danger incidents (score <= 2)
  for (const incident of incidents) {
    if (incident.safetyScore <= 2) {
      if (!incident.location || !incident.location.coordinates) continue;
      const incLng = incident.location.coordinates[0];
      const incLat = incident.location.coordinates[1];
      if (haversineDistance(currentLat, currentLng, incLat, incLng) <= 150) {
        if (now - alertCooldowns.high_danger > COOLDOWN_MS) {
          alertCooldowns.high_danger = now;
          return { type: 'high_danger', message: 'High risk zone detected — consider rerouting' };
        }
        return null;
      }
    }
  }
  
  // 3. Danger incidents (score <= 4)
  for (const incident of incidents) {
    if (incident.safetyScore > 2 && incident.safetyScore <= 4) {
      if (!incident.location || !incident.location.coordinates) continue;
      const incLng = incident.location.coordinates[0];
      const incLat = incident.location.coordinates[1];
      if (haversineDistance(currentLat, currentLng, incLat, incLng) <= 150) {
        if (now - alertCooldowns.danger > COOLDOWN_MS) {
          alertCooldowns.danger = now;
          return { type: 'danger', message: 'Entering elevated risk area — stay alert' };
        }
        return null; 
      }
    }
  }

  // 4. Safe Zones
  for (const zone of safeZoneData) {
    if (haversineDistance(currentLat, currentLng, zone.lat, zone.lng) <= 300) {
      if (now - alertCooldowns.safe_zone > COOLDOWN_MS) {
        alertCooldowns.safe_zone = now;
        if (zone.type === 'police') {
          return { type: 'safe_zone', message: `Police station nearby — ${zone.name}` };
        } else if (zone.type === 'hospital') {
          return { type: 'safe_zone', message: `Hospital nearby — you are in a monitored area` };
        } else {
          return { type: 'safe_zone', message: `Safe zone nearby — ${zone.name}` };
        }
      }
      return null;
    }
  }
  
  return null;
}

/**
 * FUNCTION 5 — calculateLiveRiskScore(currentLat, currentLng, incidents, transportMode, currentHour)
 * Same 6-factor calculation mapped explicitly onto the single localized viewport.
 */
export function calculateLiveRiskScore(currentLat, currentLng, incidents, transportMode, currentHour) {
  let nearbyIncidents = [];
  let nearbySafeZonesCount = 0;
  
  // Track nearby items
  for (const incident of incidents) {
    if (!incident.location || !incident.location.coordinates) continue;
    const incLng = incident.location.coordinates[0];
    const incLat = incident.location.coordinates[1];
    
    if (haversineDistance(currentLat, currentLng, incLat, incLng) <= 300) {
      nearbyIncidents.push(incident);
    }
  }

  for (const zone of safeZones) {
    if (haversineDistance(currentLat, currentLng, zone.lat, zone.lng) <= 500) {
      nearbySafeZonesCount++;
    }
  }

  // FACTOR 1: Perception
  let factor1 = 0;
  if (nearbyIncidents.length > 0) {
    const sumScores = nearbyIncidents.reduce((s, inc) => s + (inc.safetyScore || 5), 0);
    const avgScore = sumScores / nearbyIncidents.length;
    factor1 = ((11 - avgScore) / 10) * 0.40;
  }

  // FACTOR 2: Recency
  let factor2 = 0;
  if (nearbyIncidents.length > 0) {
    const now = new Date();
    const sumWeights = nearbyIncidents.reduce((sum, inc) => {
      const incDate = new Date(inc.timeOfIncident || inc.reportedAt || now);
      const diffHrs = Math.max(0, (now - incDate) / (1000 * 60 * 60));
      let pWeight = 0.8;
      if (diffHrs <= 24) pWeight = 4.0;
      else if (diffHrs <= 24 * 7) pWeight = 2.5;
      else if (diffHrs <= 120 * 24) pWeight = 1.5;
      return sum + pWeight;
    }, 0);
    const avgRecency = sumWeights / nearbyIncidents.length;
    factor2 = Math.max(0, Math.min(1, (avgRecency - 0.8) / 3.2)) * 0.20;
  }

  // FACTOR 3: Transport Multiplier
  const multipliers = { walking: 1.4, bike: 1.2, auto: 0.9, bus: 0.8, cab: 0.6 };
  const modeMultiplier = multipliers[transportMode] || 1.4;
  let factor3 = ((modeMultiplier - 0.6) / 0.8) * 0.15;

  // FACTOR 4: Time of Day
  let timeRisk = 0.25;
  if (currentHour >= 0 && currentHour <= 4) timeRisk = 0.95;
  else if (currentHour >= 5 && currentHour <= 6) timeRisk = 0.75;
  else if (currentHour >= 7 && currentHour <= 19) timeRisk = 0.25;
  else if (currentHour >= 20 && currentHour <= 21) timeRisk = 0.55;
  else if (currentHour >= 22 && currentHour <= 23) timeRisk = 0.80;
  let factor4 = timeRisk * 0.15;

  // FACTOR 5: Incident Density locally mapping against ~0.3km static viewport
  let incidentDensity = nearbyIncidents.length / 0.3;
  let factor5 = Math.min(incidentDensity / 10, 1) * 0.05;
  
  // FACTOR 6: Safe Zone Proximity
  let factor6 = -Math.min(nearbySafeZonesCount * 0.02, 0.05);

  let totalRisk = factor1 + factor2 + factor3 + factor4 + factor5 + factor6;
  totalRisk = Math.max(0, Math.min(1, totalRisk));
  
  return Math.round((1 - totalRisk) * 100);
}
