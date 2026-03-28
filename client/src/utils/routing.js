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

export async function fetchRoutes(originLat, originLng, destLat, destLng) {
  try {
    // OSRM coordinates are formatted as {longitude},{latitude}
    // Force up to 3 alternatives to completely bypass aggressive merging
    const url = `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}?alternatives=3&overview=full&geometries=geojson&steps=false`;
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

export function scoreRouteSafety(routeCoordinates, incidents) {
  let score = 100;
  let nearbyIncidentsCount = 0;
  let nearbySafeZonesCount = 0;
  
  const currentHour = new Date().getHours();
  // Daytime considered 6:00 AM to 5:59 PM
  const isDaytime = currentHour >= 6 && currentHour < 18;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Track incidents we've already counted so we don't multiply deductions for the same incident
  const countedIncidents = new Set();

  for (const incident of incidents) {
    if (!incident.location || !incident.location.coordinates) continue;
    
    // GeoJSON [lng, lat]
    const incLng = incident.location.coordinates[0];
    const incLat = incident.location.coordinates[1];
    const incDate = new Date(incident.reportedAt);

    let isNearRoute = false;
    
    // Check if incident is within 300m of ANY point on the route
    // (Optimization: we step by 3 coordinate pairs to significantly speed this up)
    for (let i = 0; i < routeCoordinates.length; i += 3) {
      const [rLat, rLng] = routeCoordinates[i];
      if (haversineDistance(rLat, rLng, incLat, incLng) <= 300) {
        isNearRoute = true;
        break;
      }
    }

    if (isNearRoute && !countedIncidents.has(incident._id)) {
      countedIncidents.add(incident._id);
      nearbyIncidentsCount++;
      
      let deduction = incident.severity * 8;
      
      // Amplifiers
      if (incDate > sevenDaysAgo) deduction *= 2;
      if (incident.timeOfDay === 'night' || incident.timeOfDay === 'evening') deduction *= 1.5;
      
      // Bonus: daytime is safer
      if (isDaytime) deduction *= 0.5;
      
      score -= deduction;
    }
  }

  // Iterate exactly against hardcoded safe zones in Chandigarh
  const countedSafeZones = new Set();
  for (const zone of safeZones) {
    let isNearRoute = false;
    // Step by 3 arrays to massively improve raycasting performance
    for (let i = 0; i < routeCoordinates.length; i += 3) {
      const [rLat, rLng] = routeCoordinates[i];
      if (haversineDistance(rLat, rLng, zone.lat, zone.lng) <= 500) {
        isNearRoute = true;
        break;
      }
    }
    
    if (isNearRoute && !countedSafeZones.has(zone.name)) {
      countedSafeZones.add(zone.name);
      nearbySafeZonesCount++;
    }
  }

  // Calculate Safe Zone bonuses
  const safeZoneBonus = Math.min(20, nearbySafeZonesCount * 8);
  score += safeZoneBonus;

  score = Math.max(0, Math.min(100, Math.round(score)));
  
  let label = 'Caution';
  if (score >= 75) label = 'Safe';
  else if (score >= 50) label = 'Moderate';

  return { score, nearbyIncidents: nearbyIncidentsCount, nearbySafeZones: nearbySafeZonesCount, label };
}

export function selectBestRoutes(routes, incidents) {
  if (!routes || routes.length === 0) return { safeRoute: null, fastestRoute: null };

  const scoredRoutes = routes.map(route => {
    const safety = scoreRouteSafety(route.coordinates, incidents);
    return { ...route, ...safety };
  });

  // Fastest Route -> Sort by pure duration ascending (Always included even if score is poor)
  const durationSorted = [...scoredRoutes].sort((a, b) => a.durationMinutes - b.durationMinutes);
  let fastestRoute = durationSorted[0];

  // Safe Route -> Sort by purely safety score descending
  const safetySorted = [...scoredRoutes].sort((a, b) => b.score - a.score);
  let safeRoute = safetySorted[0];

  // Make sure we present distinct choices to the user if alternatives exist.
  // If the absolute safest route is ALSO the absolute fastest, let's expose the 
  // secondary fastest alternative as the "Fastest" route, to guarantee visual distinction.
  if (safeRoute.rawRoute === fastestRoute.rawRoute && durationSorted.length > 1) {
    fastestRoute = durationSorted[1];
  }

  return { safeRoute, fastestRoute };
}
