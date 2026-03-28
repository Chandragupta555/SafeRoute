import L from 'leaflet';

export function createWomanMarker(bearing = 0) {
  const html = `
    <div style="position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
      <!-- Pulsing Ring -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 2px solid #E8A4C0; border-radius: 50%; animation: markerPulse 2s infinite; opacity: 0.5;"></div>
      
      <!-- Rotator -->
      <div class="woman-rotator" style="width: 40px; height: 40px; transform: rotate(${bearing}deg); transition: transform 0.3s linear; display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 40 40" width="35" height="35" style="filter: drop-shadow(0px 0px 3px rgba(0,0,0,0.8));">
          {/* Add a filter: drop-shadow above to create an outline */}
          
          {/* Head with a subtle dark border */}
          <circle cx="20" cy="8" r="4.5" style="fill: #1A0A2E; stroke: #E8A4C0; stroke-width: 1;" />
          <circle cx="20" cy="8" r="3.5" style="fill: #E8A4C0;" />
          
          {/* Body lines with increased stroke-width for visibility */}
          <g style="stroke: #E8A4C0; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round;">
            <line x1="20" y1="12" x2="20" y2="24" />
            <line x1="20" y1="14" x2="14" y2="22" />
            <line x1="20" y1="14" x2="26" y2="20" />
            <line x1="20" y1="24" x2="16" y2="34" />
            <line x1="20" y1="24" x2="24" y2="34" />
          </g>
        </svg>
      </div>
      
      <style>
        @keyframes markerPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    </div>
  `;

  return L.divIcon({
    className: 'custom-woman-marker',
    html: html,
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });
}

export function updateWomanMarker(marker, lat, lng, bearing) {
  if (!marker) return;
  marker.setLatLng([lat, lng]);

  const el = marker.getElement();
  if (el) {
    const rotator = el.querySelector('.woman-rotator');
    if (rotator) {
      rotator.style.transform = `rotate(${bearing}deg)`;
    }
  }
}
