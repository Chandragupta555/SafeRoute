import axios from 'axios';

// SafeRoute Routing Engine
// Uses OSRM open source routing + time-weighted safety scoring algorithm
// This is rule-based scoring, not machine learning — honest and fast

import { safeZones } from '../data/safeZonesChandigarh';

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

export async function fetchRoutes(originLat, originLng, destLat, destLng, transportMode = 'walking') {
  try {
    // OSRM coordinates are formatted as {longitude},{latitude}
    // Multiplex profile between driving algorithms vs pedestrian pathways
    const profile = ['auto', 'cab', 'bus'].includes(transportMode) ? 'driving' : 'foot';
    
    // Force up to 3 alternatives to completely bypass aggressive merging
    const url = `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?alternatives=3&overview=full&geometries=geojson&steps=false`;
    const response = await axios.get(url);
    
    if (!response.data || !response.data.routes) return [];

    return response.data.routes.slice(0, 3).map(route => {
      // OSRM returns array of [lng, lat], Leaflet polyline expects [lat, lng]
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      return {
        coordinates,
        durationMinutes: Math.round(route.duration / 60),
        distanceKm: (route.distance / 1000).toFixed(2),
        rawRoute: route
      };
    });
  } catch (err) {
    console.error('Error fetching routes from OSRM:', err);
    return [];
  }
}

/*
 * SafeRoute Dynamic Risk Engine (ML-Proxy)
 * 
 * This scoring system algorithmically mimics machine-learning contextual evaluations by
 * applying independent risk-vector polynomials against 6 explicitly defensible parameters.
 * 
 * FACTOR 1 — Perception Density (40%): Aggregates and averages the psychological safetyScore (1-10) of localized incidents.
 * FACTOR 2 — Recency Score (20%): Time-decay weighting favoring incidents logged <24hrs (4.0x) vs older (0.8x).
 * FACTOR 3 — Transport Mode Risk Multiplier (15%): Exposure modifiers grading 'walking' (1.4x) to 'cab' (0.6x).
 * FACTOR 4 — Temporal Ambient Risk (15%): Heuristic mapping of natural daylight/nighttime threat profiles.
 * FACTOR 5 — Incident Volume (5%): Density per localized kilometer (Capped at 10/km).
 * FACTOR 6 — Safe Zone Reducers (5%): Proximity discounting for structural safety (Police, Hospitals).
 * 
 * All factors sum towards a maximum Risk ceiling (1.0).
 * Final Safety Score = Math.round((1 - Total Risk) * 100)
 */

export function calculateDynamicRiskScore(routeCoordinates, incidents, options = {}) {
  const { 
    transportMode = 'walking', 
    currentHour = new Date().getHours() 
  } = options;

  let nearbyIncidents = [];
  let nearbySafeZonesCount = 0;

  // 1) Find nearby incidents & safe zones
  const countedIncidents = new Set();
  const countedSafeZones = new Set();
  
  for (let i = 0; i < routeCoordinates.length; i += 3) {
    const rLat = routeCoordinates[i][0];
    const rLng = routeCoordinates[i][1];

    for (const incident of incidents) {
      if (!incident.location || !incident.location.coordinates) continue;
      const incLng = incident.location.coordinates[0];
      const incLat = incident.location.coordinates[1];
      
      if (!countedIncidents.has(incident._id) && haversineDistance(rLat, rLng, incLat, incLng) <= 300) {
        countedIncidents.add(incident._id);
        nearbyIncidents.push(incident);
      }
    }

    for (const zone of safeZones) {
      if (!countedSafeZones.has(zone.name) && haversineDistance(rLat, rLng, zone.lat, zone.lng) <= 500) {
        countedSafeZones.add(zone.name);
        nearbySafeZonesCount++;
      }
    }
  }

  // Calculate route physical length
  let routeLengthMeters = 0;
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    routeLengthMeters += haversineDistance(routeCoordinates[i][0], routeCoordinates[i][1], routeCoordinates[i+1][0], routeCoordinates[i+1][1]);
  }
  const routeLengthKm = Math.max(0.1, routeLengthMeters / 1000);

  // FACTOR 1: Perception Density Score (40%)
  let factor1 = 0;
  let avgSafetyScore = 10;
  let highPerceptionCount = 0; // safetyScore 1-3
  
  if (nearbyIncidents.length > 0) {
    const sumScores = nearbyIncidents.reduce((sum, inc) => {
      const s = inc.safetyScore || 5; // fallback for legacy data
      if (s <= 3) highPerceptionCount++;
      return sum + s;
    }, 0);
    avgSafetyScore = sumScores / nearbyIncidents.length;
    let riskFromPerception = (11 - avgSafetyScore) / 10;
    factor1 = riskFromPerception * 0.40;
  }

  // FACTOR 2: Recency Score (20%)
  let factor2 = 0;
  let avgRecencyWeight = 0;
  
  if (nearbyIncidents.length > 0) {
    const now = new Date();
    const sumWeights = nearbyIncidents.reduce((sum, inc) => {
      const incDate = new Date(inc.timeOfIncident || inc.reportedAt || now);
      const diffHrs = Math.max(0, (now - incDate) / (1000 * 60 * 60));
      
      let pWeight = 0.8;
      if (diffHrs <= 24) pWeight = 4.0;
      else if (diffHrs <= 24 * 7) pWeight = 2.5;
      else if (diffHrs <= 120 * 24) pWeight = 1.5; // Roughly expanding 30 days due to demo seed data bounds
      return sum + pWeight;
    }, 0);
    
    avgRecencyWeight = sumWeights / nearbyIncidents.length;
    // Normalize: min 0.8, max 4.0
    let normalizedRecency = (avgRecencyWeight - 0.8) / 3.2; 
    factor2 = Math.max(0, Math.min(1, normalizedRecency)) * 0.20;
  }

  // FACTOR 3: Transport Mode Risk Multiplier (15%)
  const multipliers = { walking: 1.4, bike: 1.2, auto: 0.9, bus: 0.8, cab: 0.6 };
  const modeMultiplier = multipliers[transportMode] || 1.4;
  let factor3 = ((modeMultiplier - 0.6) / 0.8) * 0.15;

  // FACTOR 4: Time of Day Risk (15%)
  let timeRisk = 0.25; 
  if (currentHour >= 0 && currentHour <= 4) timeRisk = 0.95;
  else if (currentHour >= 5 && currentHour <= 6) timeRisk = 0.75;
  else if (currentHour >= 7 && currentHour <= 19) timeRisk = 0.25;
  else if (currentHour >= 20 && currentHour <= 21) timeRisk = 0.55;
  else if (currentHour >= 22 && currentHour <= 23) timeRisk = 0.80;
  let factor4 = timeRisk * 0.15;

  // FACTOR 5: Incident Volume Score (5%)
  let incidentDensity = nearbyIncidents.length / routeLengthKm;
  let factor5 = Math.min(incidentDensity / 10, 1) * 0.05;

  // FACTOR 6: Safe Zone Proximity Bonus (5% - REDUCES RISK)
  let factor6 = -Math.min(nearbySafeZonesCount * 0.02, 0.05);

  // Tally and Normalize
  let totalRisk = factor1 + factor2 + factor3 + factor4 + factor5 + factor6;
  totalRisk = Math.max(0, Math.min(1, totalRisk));
  
  let score = Math.round((1 - totalRisk) * 100);

  let label = 'Caution';
  if (score >= 75) label = 'Safe';
  else if (score >= 50) label = 'Moderate';

  return { 
    totalScore: score, 
    label,
    factors: {
      perceptionScore: Number(factor1.toFixed(2)),
      recencyScore: Number(factor2.toFixed(2)),
      transportRisk: Number(factor3.toFixed(2)),
      timeRisk: Number(factor4.toFixed(2)),
      incidentDensity: Number(factor5.toFixed(2)),
      safeZoneBonus: Number(factor6.toFixed(2))
    },
    nearbyIncidents: nearbyIncidents.length, 
    safeZonesNearby: nearbySafeZonesCount, 
    highPerceptionCount,
    avgRecencyWeight,
    routeLengthKm
  };
}

export function breakTie(routeA, routeB, options = {}) {
  // Tiebreaker 1: More safe zones
  if (routeA.safeZonesNearby !== routeB.safeZonesNearby) {
    if (routeA.safeZonesNearby > routeB.safeZonesNearby) return { ...routeA, tiebreakReason: `Chosen: passes ${routeA.safeZonesNearby} safe zones` };
    return { ...routeB, tiebreakReason: `Chosen: passes ${routeB.safeZonesNearby} safe zones` };
  }

  // Tiebreaker 2: Fewer HIGH-perception incidents (safetyScore 1-3)
  if (routeA.highPerceptionCount !== routeB.highPerceptionCount) {
    if (routeA.highPerceptionCount < routeB.highPerceptionCount) return { ...routeA, tiebreakReason: "Chosen: fewer severe incidents" };
    return { ...routeB, tiebreakReason: "Chosen: fewer severe incidents" };
  }

  // Tiebreaker 3: Shorter distance
  if (routeA.routeLengthKm !== routeB.routeLengthKm) {
    if (routeA.routeLengthKm < routeB.routeLengthKm) return { ...routeA, tiebreakReason: "Chosen: shorter exposed distance" };
    return { ...routeB, tiebreakReason: "Chosen: shorter exposed distance" };
  }

  // Tiebreaker 4: Fresher data
  if (routeA.avgRecencyWeight !== routeB.avgRecencyWeight) {
    if (routeA.avgRecencyWeight > routeB.avgRecencyWeight) return { ...routeA, tiebreakReason: "Chosen: fresher community data" };
    return { ...routeB, tiebreakReason: "Chosen: fresher community data" };
  }

  return { ...routeA, tiebreakReason: "Chosen: algorithmically equivalent baseline" };
}

export function selectBestRoutes(routes, incidents, options = {}) {
  if (!routes || routes.length === 0) return { safeRoute: null, fastestRoute: null };

  const scoredRoutes = routes.map(route => {
    const safety = calculateDynamicRiskScore(route.coordinates, incidents, options);
    return { ...route, ...safety, tiebreakReason: null };
  });

  const durationSorted = [...scoredRoutes].sort((a, b) => a.durationMinutes - b.durationMinutes);
  let fastestRoute = durationSorted[0];

  const safetySorted = [...scoredRoutes].sort((a, b) => b.totalScore - a.totalScore);
  let safeRoute = safetySorted[0];

  // Evaluate Deep Tiebreaker Logic
  if (safetySorted.length > 1) {
    const r1 = safetySorted[0];
    const r2 = safetySorted[1];
    
    if (Math.abs(r1.totalScore - r2.totalScore) <= 5) {
      safeRoute = breakTie(r1, r2, options);
    }
  }

  if (safeRoute.rawRoute === fastestRoute.rawRoute && durationSorted.length > 1) {
    fastestRoute = durationSorted[1];
  }

  return { safeRoute, fastestRoute, tiebreakReason: safeRoute.tiebreakReason };
}
