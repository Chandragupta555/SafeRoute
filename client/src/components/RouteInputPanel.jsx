import React, { useState, useRef } from 'react';

export default function RouteInputPanel({ onSearch, onModeChange, isGpsActive = true }) {
  const [originText, setOriginText] = useState(isGpsActive ? 'Using your current location' : '');
  const [destText, setDestText] = useState('');
  const [transportMode, setTransportMode] = useState('walking');

  // null means strictly 'use GPS'
  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  const [originResults, setOriginResults] = useState([]);
  const [destResults, setDestResults] = useState([]);

  const [activeInput, setActiveInput] = useState(null); // 'origin' or 'dest'
  const originTimeout = useRef(null);
  const destTimeout = useRef(null);

  const fetchNominatim = async (query, setResults) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in&viewbox=76.6,30.6,76.9,30.9&bounded=1`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleOriginChange = (e) => {
    const val = e.target.value;
    setOriginText(val);
    setActiveInput('origin');
    if (originTimeout.current) clearTimeout(originTimeout.current);
    originTimeout.current = setTimeout(() => fetchNominatim(val, setOriginResults), 500);
  };

  const handleDestChange = (e) => {
    const val = e.target.value;
    setDestText(val);
    setActiveInput('dest');
    if (destTimeout.current) clearTimeout(destTimeout.current);
    destTimeout.current = setTimeout(() => fetchNominatim(val, setDestResults), 500);
  };

  const selectOrigin = (place) => {
    setOriginText(place.display_name);
    setOriginCoords({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
    setOriginResults([]);
    setActiveInput(null);
  };

  const selectDest = (place) => {
    setDestText(place.display_name);
    setDestCoords({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
    setDestResults([]);
    setActiveInput(null);
  };

  const resetToGps = () => {
    setOriginText('Using your current location');
    setOriginCoords(null); // signal to use gps
    setOriginResults([]);
    setActiveInput(null);
  };

  const swapInputs = () => {
    setOriginText(destText);
    setDestText(originText);
    setOriginCoords(destCoords);
    setDestCoords(originCoords);
    setOriginResults([]);
    setDestResults([]);
  };

  const handleSearch = () => {
    if (!destCoords) alert("Destination is required.");
    onSearch({ originCoords, destCoords, originText, destText, transportMode });
  };

  const handleModeChange = (id) => {
    setTransportMode(id);
    if (onModeChange) onModeChange(id);
  };

  const transportModes = [
    { id: 'walking', icon: 'bi-person-walking', label: 'Walk' },
    { id: 'auto', icon: 'bi-taxi-front', label: 'Auto' },
    { id: 'bus', icon: 'bi-bus-front', label: 'Bus' },
    { id: 'cab', icon: 'bi-car-front', label: 'Cab' },
    { id: 'bike', icon: 'bi-bicycle', label: 'Bike' }
  ];

  const isSearchReady = destCoords !== null && (originCoords !== null || isGpsActive);

  // return (
  //   <div style={{
  //     position: 'absolute',
  //     top: '70px',
  //     left: '12px',
  //     right: '12px',
  //     zIndex: 1000,
  //     background: '#1A0A2E',
  //     borderRadius: '16px',
  //     border: '1px solid rgba(104,40,184,0.35)',
  //     padding: '12px 16px 20px 16px',
  //     display: 'flex',
  //     flexDirection: 'column',
  //     boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  //   }}>
  //     <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>

  //       {/* Left vertical visual connector */}
  //       <div style={{ position: 'absolute', left: '11px', top: '22px', bottom: '66px', borderLeft: '2px dotted #64748B', zIndex: 1 }}></div>

  //       {/* ORIGIN */}
  //       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: activeInput === 'origin' ? 20 : 2 }}>
  //         <div style={{ width: '12px', height: '12px', background: '#6828B8', borderRadius: '50%', flexShrink: 0 }}></div>
  //         <div style={{ flexGrow: 1, position: 'relative' }}>
  //           <input
  //             type="text"
  //             value={originText}
  //             onChange={handleOriginChange}
  //             onFocus={() => setActiveInput('origin')}
  //             placeholder="Your location"
  //             style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '10px 30px 10px 12px', color: 'white', fontSize: '15px', outline: 'none' }}
  //           />
  //           {originText !== 'Using your current location' && (
  //             <button
  //               onClick={resetToGps}
  //               title="Use my location"
  //               style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#E8A4C0' }}
  //             >
  //               📍
  //             </button>
  //           )}

  //           {/* Origin Dropdown */}
  //           {activeInput === 'origin' && originResults.length > 0 && (
  //             <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, backgroundColor: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.6)', marginTop: '4px', overflow: 'hidden' }}>
  //               {originResults.map((r, i) => (
  //                 <div key={i} onClick={() => selectOrigin(r)} style={{ padding: '10px', color: 'white', borderBottom: '1px solid #333', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
  //                   {r.display_name}
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //       {/* SWAP BUTTON */}
  //       <button onClick={swapInputs} style={{ position: 'absolute', right: '0', top: '26px', background: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
  //         ⇅
  //       </button>

  //       {/* DESTINATION */}
  //       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: activeInput === 'dest' ? 20 : 2 }}>
  //         <div style={{ width: '12px', height: '12px', background: '#E8A4C0', borderRadius: '50%', flexShrink: 0 }}></div>
  //         <div style={{ flexGrow: 1, position: 'relative', paddingRight: '32px' }}>
  //           <input
  //             type="text"
  //             value={destText}
  //             onChange={handleDestChange}
  //             onFocus={() => setActiveInput('dest')}
  //             placeholder="Where do you want to go?"
  //             style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '15px', outline: 'none' }}
  //           />

  //           {/* Dest Dropdown */}
  //           {activeInput === 'dest' && destResults.length > 0 && (
  //             <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, backgroundColor: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.6)', marginTop: '4px', overflow: 'hidden' }}>
  //               {destResults.map((r, i) => (
  //                 <div key={i} onClick={() => selectDest(r)} style={{ padding: '10px', color: 'white', borderBottom: '1px solid #333', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
  //                   {r.display_name}
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //     </div>

  //     <div style={{ marginTop: '16px' }}>
  //       <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
  //         I am travelling by
  //       </div>
  //       <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
  //         {transportModes.map(mode => {
  //           const isSelected = transportMode === mode.id;
  //           return (
  //             <div
  //               key={mode.id}
  //               onClick={() => handleModeChange(mode.id)}
  //               style={{
  //                 minWidth: '64px',
  //                 height: '64px',
  //                 display: 'flex',
  //                 flexDirection: 'column',
  //                 alignItems: 'center',
  //                 justifyContent: 'center',
  //                 background: isSelected ? 'rgba(104,40,184,0.3)' : 'rgba(255,255,255,0.05)',
  //                 border: isSelected ? '1.5px solid #E8A4C0' : '1px solid rgba(255,255,255,0.1)',
  //                 borderRadius: '12px',
  //                 cursor: 'pointer',
  //                 transition: 'all 0.2s',
  //                 flexShrink: 0
  //               }}
  //             >
  //               <div style={{ fontSize: '20px', marginBottom: '2px' }}>{mode.icon}</div>
  //               <div style={{ fontSize: '11px', color: isSelected ? '#E8A4C0' : '#94A3B8', fontWeight: isSelected ? 'bold' : 'normal' }}>{mode.label}</div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     </div>

  //     <button
  //       onClick={handleSearch}
  //       disabled={!isSearchReady}
  //       style={{ width: '100%', padding: '12px', background: isSearchReady ? '#6828B8' : '#33145c', color: isSearchReady ? 'white' : '#94A3B8', border: 'none', borderRadius: '8px', marginTop: '16px', fontWeight: 'bold', fontSize: '16px', cursor: isSearchReady ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
  //     >
  //       Find Safe Route
  //     </button>
  //   </div>
  // );
  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      left: 'max(16px, 50% - 600px)',
      right: 'max(16px, calc(50% - 600px))',
      width: 'auto',
      maxWidth: '1200px',
      margin: '0 auto',
      zIndex: 500,
      background: '#1A0A2E',
      borderRadius: '12px',
      border: '1px solid rgba(104,40,184,0.35)',
      padding: '10px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* ORIGIN */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: activeInput === 'origin' ? 20 : 2 }}>
        <div style={{ width: '12px', height: '12px', background: '#6828B8', borderRadius: '50%', flexShrink: 0 }}></div>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <input
            type="text"
            value={originText}
            onChange={handleOriginChange}
            onFocus={() => setActiveInput('origin')}
            placeholder="Your location"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '10px 30px 10px 12px', color: 'white', fontSize: '13px', outline: 'none', minWidth: '0' }}
          />
          {originText !== 'Using your current location' && (
            <button
              onClick={resetToGps}
              title="Use my location"
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#E8A4C0', display: 'flex', alignItems: 'center' }}
            >
              📍
            </button>
          )}

          {/* Origin Dropdown */}
          {activeInput === 'origin' && originResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, backgroundColor: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.6)', marginTop: '8px', overflow: 'hidden' }}>
              {originResults.map((r, i) => (
                <div key={i} onClick={() => selectOrigin(r)} style={{ padding: '10px 12px', color: 'white', borderBottom: '1px solid #333', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SWAP BUTTON */}
      <button onClick={swapInputs} style={{ background: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
        ⇅
      </button>

      {/* DESTINATION */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: activeInput === 'dest' ? 20 : 2 }}>
        <div style={{ width: '12px', height: '12px', background: '#E8A4C0', borderRadius: '50%', flexShrink: 0 }}></div>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <input
            type="text"
            value={destText}
            onChange={handleDestChange}
            onFocus={() => setActiveInput('dest')}
            placeholder="Where do you want to go?"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '13px', outline: 'none', minWidth: '0' }}
          />

          {/* Dest Dropdown */}
          {activeInput === 'dest' && destResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 9999, backgroundColor: '#1A0A2E', border: '1px solid #6828B8', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.6)', marginTop: '8px', overflow: 'hidden' }}>
              {destResults.map((r, i) => (
                <div key={i} onClick={() => selectDest(r)} style={{ padding: '10px 12px', color: 'white', borderBottom: '1px solid #333', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          I am travelling by
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {transportModes.map(mode => {
            const isSelected = transportMode === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                style={{
                  minWidth: '64px',
                  height: '64px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'rgba(104,40,184,0.3)' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1.5px solid #E8A4C0' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                <div style={{ marginBottom: '2px' }}>
                  <i className={`bi ${mode.icon}`} style={{ fontSize: '18px', color: isSelected ? '#E8A4C0' : '#94A3B8', transition: 'color 0.2s' }}></i>
                </div>
                <div style={{ fontSize: '11px', color: isSelected ? '#E8A4C0' : '#94A3B8', fontWeight: isSelected ? 'bold' : 'normal' }}>{mode.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!isSearchReady}
        style={{ padding: '10px 24px', background: isSearchReady ? '#6828B8' : '#33145c', color: isSearchReady ? 'white' : '#94A3B8', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: isSearchReady ? 'pointer' : 'not-allowed', transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap' }}
      >
        Find Route
      </button>
    </div>
  );
}
