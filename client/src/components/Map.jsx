import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Fix Leaflet's default icon missing issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { safeZones } from '../data/safeZonesChandigarh';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function Map({ incidents = [], userPosition, originCoords, destinationCoords, onMapReady }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const safeZonesLayerRef = useRef(null);

  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(false);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      const initialCenter = userPosition || [30.7333, 76.7794]; // Default Chandigarh

      const map = L.map(mapRef.current, { zoomControl: false }).setView(initialCenter, 14);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB dark theme tiles
      // L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Layer group for incident markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      safeZonesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      if (onMapReady) {
        onMapReady(map);
      }
    }

    return () => {
      // Cleanupmap if needed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle user position changes
  useEffect(() => {
    if (mapInstanceRef.current && userPosition) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: '<div class="user-locator-ring"></div><div class="user-locator-dot"></div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        userMarkerRef.current = L.marker(userPosition, { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      } else {
        userMarkerRef.current.setLatLng(userPosition);
      }
    }
  }, [userPosition]);

  // Handle custom Origin and Destination Markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (originCoords) {
      if (!originMarkerRef.current) {
        const originIcon = L.divIcon({
          className: 'origin-marker-wrapper',
          html: `<div style="width: 24px; height: 24px; background: #6828B8; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 2px solid white;">A</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        originMarkerRef.current = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      } else {
        originMarkerRef.current.setLatLng([originCoords.lat, originCoords.lng]);
      }
    } else {
      if (originMarkerRef.current) {
        mapInstanceRef.current.removeLayer(originMarkerRef.current);
        originMarkerRef.current = null;
      }
    }

    if (destinationCoords) {
      if (!destMarkerRef.current) {
        const destIcon = L.divIcon({
          className: 'dest-marker-wrapper',
          html: `<div style="width: 24px; height: 24px; background: #E8A4C0; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 2px solid white;">B</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        destMarkerRef.current = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon, zIndexOffset: 1000 }).addTo(mapInstanceRef.current);
      } else {
        destMarkerRef.current.setLatLng([destinationCoords.lat, destinationCoords.lng]);
      }
    } else {
      if (destMarkerRef.current) {
        mapInstanceRef.current.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
    }
  }, [originCoords, destinationCoords]);

  // Handle incidents rendering and heatmap calculations
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear existing layers
    markersLayerRef.current.clearLayers();
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const heatPoints = [];

    incidents.forEach(incident => {
      if (!incident.location || !incident.location.coordinates) return;

      const lng = incident.location.coordinates[0];
      const lat = incident.location.coordinates[1];

      // Heatmap Intensity Scoring
      let intensity = 0.5; // low default
      if (incident.severity === 3) intensity = 1.0;
      else if (incident.severity === 2) intensity = 0.7;

      heatPoints.push([lat, lng, intensity]);

      // DivIcon Incident Markers
      let iconHtml = '';
      let iconSize = 10;
      let anchor = 5;
      let color = '#F59E0B';

      if (incident.severity === 3) {
        iconSize = 18;
        anchor = 9;
        color = '#9E3060';
        iconHtml = `<div style="width: 18px; height: 18px; background: #9E3060; border-radius: 50%; opacity: 0.9; box-shadow: 0 0 0 4px rgba(158,48,96,0.3);"></div>`;
      } else if (incident.severity === 2) {
        iconSize = 14;
        anchor = 7;
        color = '#EA580C';
        iconHtml = `<div style="width: 14px; height: 14px; background: #EA580C; border-radius: 50%; opacity: 0.85;"></div>`;
      } else {
        iconSize = 10;
        anchor = 5;
        color = '#F59E0B';
        iconHtml = `<div style="width: 10px; height: 10px; background: #F59E0B; border-radius: 50%; opacity: 0.8;"></div>`;
      }

      const customIcon = L.divIcon({
        className: 'incident-marker',
        html: iconHtml,
        iconSize: [iconSize, iconSize],
        iconAnchor: [anchor, anchor]
      });

      const circle = L.marker([lat, lng], { icon: customIcon });

      // Formatting logic
      const categoryLabel = incident.category ?
        incident.category.charAt(0).toUpperCase() + incident.category.slice(1).replace('_', ' ') : 'Unknown';

      const timeLabel = incident.timeOfDay ? incident.timeOfDay.charAt(0).toUpperCase() + incident.timeOfDay.slice(1) : 'Unknown time';

      circle.bindTooltip(`
        <div>
          <strong style="color: ${color};">${categoryLabel}</strong><br/>
          <span style="color: #94A3B8; font-size: 11px;">${timeLabel}</span>
        </div>
      `, { direction: 'top', className: 'custom-leaflet-tooltip' });

      circle.addTo(markersLayerRef.current);
    });

    // Mount heatmap if toggled on
    if (showHeatmap && heatPoints.length > 0) {
      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 14,
        max: 1.0,
        gradient: {
          0.4: '#FCD34D', // Amber/Yellow
          0.6: '#EA580C', // Orange
          0.8: '#CC0000', // Red
          1.0: '#9E3060'  // Purple/Dark Rose
        }
      }).addTo(mapInstanceRef.current);
    }
  }, [incidents, showHeatmap]);

  // Handle Safe Zones toggle mounting
  useEffect(() => {
    if (!mapInstanceRef.current || !safeZonesLayerRef.current) return;

    safeZonesLayerRef.current.clearLayers();

    if (showSafeZones) {
      safeZones.forEach(zone => {
        let iconHtml = '';
        if (zone.type === 'police') {
          iconHtml = `<div style="width: 20px; height: 20px; background: #1E3A5F; border: 2px solid #93C5FD; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">P</div>`;
        } else if (zone.type === 'hospital') {
          iconHtml = `<div style="width: 20px; height: 20px; background: #14532D; border: 2px solid #6EE7B7; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">H</div>`;
        } else {
          iconHtml = `<div style="width: 20px; height: 20px; background: #1A0A2E; border: 2px solid #E8A4C0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">S</div>`;
        }

        const customIcon = L.divIcon({
          className: 'safe-zone-marker',
          html: iconHtml,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([zone.lat, zone.lng], { icon: customIcon });
        marker.bindPopup(`<strong style="color: #6828B8;">${zone.name}</strong><br/>Type: ${zone.type.toUpperCase()}<br/><span style="color: #94A3B8; font-size: 11px;">This is a designated safe zone</span>`);
        marker.addTo(safeZonesLayerRef.current);
      });
    }
  }, [showSafeZones]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', background: '#0D1B2A' }}>
      <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>

      {/* Settings Toggle Floating Panel */}
      <div style={{
        position: 'absolute',
        bottom: '200px',
        left: '20px',
        zIndex: 1000,
        background: '#1A0A2E',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #6828B8',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
            style={{ accentColor: '#E8A4C0', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Incident Heatmap
        </label>
        <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={showSafeZones}
            onChange={(e) => setShowSafeZones(e.target.checked)}
            style={{ accentColor: '#6828B8', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          Safe Zones
        </label>
      </div>

      {/* Map Legend */}
      {/* <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '16px',
        zIndex: 1000,
        background: 'rgba(26,10,46,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(104,40,184,0.4)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '4px' }}>Risk Levels</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#9E3060', borderRadius: '50%' }}></div>
          <span style={{ color: 'white', fontSize: '12px' }}>High Risk (Assault/Theft)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#EA580C', borderRadius: '50%' }}></div>
          <span style={{ color: 'white', fontSize: '12px' }}>Medium Risk (Harassment)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '50%' }}></div>
          <span style={{ color: 'white', fontSize: '12px' }}>Caution (Poor Lighting)</span>
        </div>
      </div> */}
    </div>
  );
}
