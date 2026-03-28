import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Map from '../components/Map';
import RoutePanel from '../components/RoutePanel';
import RouteInputPanel from '../components/RouteInputPanel';
import TimeFilter, { getCategoryFromHour } from '../components/TimeFilter';
import SOSButton from '../components/SOSButton';
import QuickReport from '../components/QuickReport';
import ExperienceFeed from '../components/ExperienceFeed';
import { incidentsAPI } from '../utils/api';
import { fetchRoutes, selectBestRoutes } from '../utils/routing';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import JourneySimulator from '../components/JourneySimulator';
import AlertBanner from '../components/AlertBanner';
import LiveRiskHUD from '../components/LiveRiskHUD';
import { createWomanMarker, updateWomanMarker } from '../components/WomanMarker';
import { safeZones } from '../data/safeZonesChandigarh';

const OfflineBanner = () => (!navigator.onLine ? (
  <div style={{ background: '#CC0000', color: 'white', textAlign: 'center', padding: '8px', zIndex: 1000, position: 'relative', fontSize: '14px', fontWeight: 'bold' }}>
    Offline Mode - Showing Cached Data
  </div>
) : null);

export default function MapPage() {
  const [userPosition, setUserPosition] = useState(null);
  const [originCoords, setOriginCoords] = useState(null); // null = GPS
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [routeContext, setRouteContext] = useState(null); // tracks readable location strings
  const [transportMode, setTransportMode] = useState('walking');
  const [incidents, setIncidents] = useState([]);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(() => getCategoryFromHour(new Date().getHours()));
  const [isNightMode, setIsNightMode] = useState(false);
  const [routes, setRoutes] = useState({ safeRoute: null, fastestRoute: null });
  const [rawRoutes, setRawRoutes] = useState([]);
  const recalculateTimeoutRef = useRef(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
  const [isExperienceFeedOpen, setIsExperienceFeedOpen] = useState(false);
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [toast, setToast] = useState('');

  // Simulation State Hooks
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPosition, setSimulationPosition] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [liveRiskScore, setLiveRiskScore] = useState(100);
  const womanMarkerRef = useRef(null);
  const simulatorRef = useRef(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const safeLineRef = useRef(null);
  const fastLineRef = useRef(null);
  const selectedLineRef = useRef(null);
  const glowLineRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => {
          console.warn('GPS error:', err);
          setUserPosition([30.7333, 76.7794]);
          setToast('Using default location — please enable GPS');
          setTimeout(() => setToast(''), 4000);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setUserPosition([30.7333, 76.7794]);
    }
  }, []);

  // Check real-time clock for styling override
  useEffect(() => {
    const checkNightMode = () => {
      const currentHr = new Date().getHours();
      setIsNightMode(currentHr >= 20 || currentHr < 6);
    };
    checkNightMode();
    const interval = setInterval(checkNightMode, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRouteSearch = async ({ originCoords: reqOrigin, destCoords: reqDest, originText, destText, transportMode: selectedMode }) => {
    setOriginCoords(reqOrigin);
    setDestinationCoords(reqDest);
    setTransportMode(selectedMode);
    setSelectedRoute(null);
    setRouteContext({ origin: originText, destination: destText });

    const actualOrigin = reqOrigin || (userPosition ? { lat: userPosition[0], lng: userPosition[1] } : { lat: 30.7333, lng: 76.7794 });
    await fetchAndDisplayRoutes(actualOrigin.lat, actualOrigin.lng, reqDest.lat, reqDest.lng, selectedMode);
  };

  const fetchAndDisplayRoutes = async (originLat, originLng, destLat, destLng, mode) => {
    setIsLoading(true);
    try {
      let fetchedIncidents = [];
      try {
        const incRes = await incidentsAPI.getByArea(originLat, originLng, 6000);
        fetchedIncidents = incRes.data || [];
      } catch (incErr) {
        console.error('Incidents API failed, falling back to empty array so routing continues:', incErr);
      }

      setIncidents(fetchedIncidents);
      const fetchedRoutes = await fetchRoutes(originLat, originLng, destLat, destLng, mode);
      setRawRoutes(fetchedRoutes);

      const currentFiltered = fetchedIncidents.filter(inc => inc.timeOfDay === selectedTimeOfDay);
      const options = { transportMode: mode, currentHour: new Date().getHours() };
      const { safeRoute, fastestRoute } = selectBestRoutes(fetchedRoutes, currentFiltered, options);
      setRoutes({ safeRoute, fastestRoute });
      setIsRoutePanelOpen(true);
    } catch (err) { console.error('Error fetching system logic:', err); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!mapInstance) return;
    [safeLineRef, fastLineRef, selectedLineRef, glowLineRef].forEach(ref => {
      if (ref.current) { mapInstance.removeLayer(ref.current); ref.current = null; }
    });
    let boundsToFit = null;
    if (selectedRoute) {
      const isSafe = selectedRoute.type === 'safe';

      if (isSafe) {
        selectedLineRef.current = L.polyline(selectedRoute.coordinates, {
          color: '#9B59B6', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: null
        }).addTo(mapInstance);

        glowLineRef.current = L.polyline(selectedRoute.coordinates, {
          color: '#E8A4C0', weight: 2, opacity: 0.7, dashArray: null
        }).addTo(mapInstance);
      } else {
        selectedLineRef.current = L.polyline(selectedRoute.coordinates, {
          color: '#475569', weight: 4, opacity: 0.6, dashArray: '8 6', lineCap: 'round'
        }).addTo(mapInstance);
      }

      boundsToFit = selectedLineRef.current.getBounds();
    } else if (routes.safeRoute) {
      if (routes.fastestRoute) {
        fastLineRef.current = L.polyline(routes.fastestRoute.coordinates, {
          color: '#475569', weight: 4, opacity: 0.6, dashArray: '8 6', lineCap: 'round'
        }).addTo(mapInstance);
      }

      safeLineRef.current = L.polyline(routes.safeRoute.coordinates, {
        color: '#9B59B6', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: null
      }).addTo(mapInstance);

      glowLineRef.current = L.polyline(routes.safeRoute.coordinates, {
        color: '#E8A4C0', weight: 2, opacity: 0.7, dashArray: null
      }).addTo(mapInstance);

      if (safeLineRef.current.bringToFront) safeLineRef.current.bringToFront();
      if (glowLineRef.current.bringToFront) glowLineRef.current.bringToFront();

      boundsToFit = safeLineRef.current.getBounds();
    }
    if (boundsToFit) { mapInstance.fitBounds(boundsToFit, { padding: [60, 60] }); }
  }, [mapInstance, routes, selectedRoute]);

  const handleSelectRoute = (route) => {
    const isSafe = routes.safeRoute && route.id === routes.safeRoute.id;
    setSelectedRoute({ ...route, type: isSafe ? 'safe' : 'fastest' });
    setRoutes({ safeRoute: null, fastestRoute: null });
    setIsRoutePanelOpen(false);
  };

  const filteredIncidents = incidents.filter(inc => inc.timeOfDay === selectedTimeOfDay);

  useEffect(() => {
    if (!rawRoutes || rawRoutes.length === 0) return;

    if (recalculateTimeoutRef.current) clearTimeout(recalculateTimeoutRef.current);

    recalculateTimeoutRef.current = setTimeout(() => {
      // Direct functional filter ensures we don't depend on continuous render references!
      const currentFiltered = incidents.filter(inc => inc.timeOfDay === selectedTimeOfDay);
      const options = { transportMode, currentHour: new Date().getHours() };
      const { safeRoute, fastestRoute } = selectBestRoutes(rawRoutes, currentFiltered, options);

      setRoutes({ safeRoute, fastestRoute });

      // Automatically snap the user back to the RoutePanel preview so they see the shift natively!
      setSelectedRoute(null);
      setIsRoutePanelOpen(true);
    }, 500);

    return () => clearTimeout(recalculateTimeoutRef.current);
  }, [selectedTimeOfDay, rawRoutes, incidents, transportMode]);

  const handleTimeChange = (timeCategory) => {
    setSelectedTimeOfDay(timeCategory);
  };

  // --- SIMULATION HANDLERS ---
  const handlePositionUpdate = (lat, lng, bearing) => {
    setSimulationPosition({ lat, lng, bearing });
    if (!mapInstance) return;

    if (womanMarkerRef.current) {
      updateWomanMarker(womanMarkerRef.current, lat, lng, bearing);
    } else {
      const icon = createWomanMarker(bearing);
      womanMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 2000 }).addTo(mapInstance);
    }
    mapInstance.panTo([lat, lng], { animate: true, duration: 0.5 });
  };

  const handleScoreUpdate = (score) => {
    setLiveRiskScore(score);
  };

  const handleAlertChange = (alert) => {
    setActiveAlert(alert);
    if (alert?.type === 'arrived') {
      setTimeout(() => setIsSimulating(false), 2000);
    }
  };

  const handleSimulationEnd = () => {
    setIsSimulating(false);
    if (womanMarkerRef.current && mapInstance) {
      mapInstance.removeLayer(womanMarkerRef.current);
      womanMarkerRef.current = null;
    }
    if (mapInstance) {
      mapInstance.dragging.enable();
    }
  };

  // ADD THIS FUNCTION
  const handleManualEndJourney = () => {
    setActiveAlert(null); // This is what finally hides the "Journey Complete" pop-up
    handleSimulationEnd(); // Clean up the map
    if (mapInstance) {
      mapInstance.setZoom(14); // Reset to city view
    }
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setActiveAlert(null);
    setLiveRiskScore(100);
    setSimulationPosition(null);
    setIsRoutePanelOpen(false);
  };

  useEffect(() => {
    if (!mapInstance) return;
    if (isSimulating) {
      mapInstance.dragging.disable();
      mapInstance.setZoom(16);
    } else {
      mapInstance.dragging.enable();
      mapInstance.setZoom(14);
    }
  }, [isSimulating, mapInstance]);
  // -------------------------

  return (
    <div style={{ backgroundColor: '#0D1B2A', height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <OfflineBanner />
      {toast && (
        <div style={{ position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)', background: '#92400E', color: 'white', padding: '8px 16px', borderRadius: '20px', zIndex: 1000, fontSize: '14px' }}>
          {toast}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '60px', zIndex: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', background: 'linear-gradient(to bottom, rgba(13,27,42,0.95), transparent)' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
          <span style={{ color: '#E8A4C0' }}>Safe</span><span style={{ color: '#FFFFFF' }}>Route</span>
        </h1>
        <button onClick={() => navigate('/profile')} style={{ background: '#1A0A2E', border: '1px solid #6828B8', color: 'white', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</button>
      </div>

      {/* {isNightMode && (
        <div style={{
          position: 'absolute',
          top: '150px',
          left: '16px',
          background: '#7F1D1D',
          color: 'white',
          fontSize: '12px',
          borderLeft: '4px solid #E8A4C0',
          borderRadius: '8px',
          padding: '4px 10px',
          zIndex: 500,
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
        }}>
          Night Mode — Higher Risk Areas Active
        </div>
      )} */}

      {isNightMode && (
        <style>{`
          .leaflet-tile { filter: brightness(0.75) contrast(1.15) saturate(0.9) !important; }
        `}</style>
      )}

      <RouteInputPanel onSearch={handleRouteSearch} isGpsActive={!!userPosition} />

      <div style={{ height: '100%', width: '100%', opacity: isLoading ? 0.5 : 1 }}>
        <Map incidents={filteredIncidents} userPosition={userPosition} originCoords={originCoords} destinationCoords={destinationCoords} onMapReady={setMapInstance} />
      </div>

      <AlertBanner
        alert={activeAlert}
        clearAlert={() => setActiveAlert(null)}
        onReport={() => setIsQuickReportOpen(true)}
        onEndJourney={handleManualEndJourney} // Point to the new manual handler
      />

      <LiveRiskHUD
        score={liveRiskScore}
        isSimulating={isSimulating}
        transportMode={transportMode}
      />

      <JourneySimulator
        ref={simulatorRef}
        routeCoordinates={routes.safeRoute?.coordinates}
        incidents={incidents}
        safeZones={safeZones}
        onPositionUpdate={handlePositionUpdate}
        onAlertChange={handleAlertChange}
        onScoreUpdate={handleScoreUpdate}
        onSimulationEnd={handleSimulationEnd}
        transportMode={transportMode}
        isActive={isSimulating}
      />

      {/* Floating Action Buttons */}
      <div style={{ position: 'absolute', top: '280px', right: '20px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => setIsExperienceFeedOpen(true)}
          style={{ background: '#1A0A2E', color: 'white', border: '1px solid #6828B8', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer', fontWeight: 'bold' }}>
          <span style={{ fontSize: '16px' }}>💬</span> Community Feed
        </button>
        <button
          onClick={() => setIsQuickReportOpen(true)}
          style={{ background: '#1A0A2E', color: '#E8A4C0', border: '1px solid #E8A4C0', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', cursor: 'pointer', fontWeight: 'bold' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span> Report Vibe
        </button>
      </div>

      <TimeFilter onTimeChange={handleTimeChange} />

      <QuickReport
        isOpen={isQuickReportOpen}
        onClose={() => setIsQuickReportOpen(false)}
        locationCoords={originCoords || { lat: userPosition?.[0] || 30.7333, lng: userPosition?.[1] || 76.7794 }}
      />

      <ExperienceFeed
        isOpen={isExperienceFeedOpen}
        onClose={() => setIsExperienceFeedOpen(false)}
        originCoords={originCoords || { lat: userPosition?.[0] || 30.7333, lng: userPosition?.[1] || 76.7794 }}
        destCoords={destinationCoords || { lat: 30.7333, lng: 76.7794 }}
        onReport={() => setIsQuickReportOpen(true)}
        routeContext={routeContext}
      />

      {/* FIX: Use the logic-heavy SOS button component */}
      <SOSButton
        userPosition={userPosition}
        onSOSTriggered={() => simulatorRef.current?.pause()}
      />

      {isRoutePanelOpen && (
        <RoutePanel safeRoute={routes.safeRoute} fastestRoute={routes.fastestRoute} transportMode={transportMode} onSelectRoute={handleSelectRoute} onSimulateJourney={handleStartSimulation} onClose={() => setIsRoutePanelOpen(false)} />
      )}
    </div>
  );
}