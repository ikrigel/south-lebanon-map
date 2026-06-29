import { useState, useRef, useEffect } from 'react';

export function GpsSpeedTestPage() {
  const [status, setStatus] = useState('');
  const [speed, setSpeed] = useState(0);
  const [details, setDetails] = useState('');
  const [testing, setTesting] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastRef = useRef<{ lat: number; lon: number; time: number } | null>(null);

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startTest = () => {
    if (!navigator.geolocation) {
      setStatus('❌ Geolocation not supported');
      return;
    }

    setTesting(true);
    setStatus('⏳ Waiting for GPS...');

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        const now = Date.now();

        setStatus(`✅ GPS locked (±${Math.round(acc)}m) - Walk or drive to test`);

        if (lastRef.current) {
          const distKm = haversineKm(lastRef.current.lat, lastRef.current.lon, lat, lon);
          const distM = distKm * 1000;
          const timeS = (now - lastRef.current.time) / 1000;
          const timeH = timeS / 3600;

          let calc = null;
          if (timeH > 0 && distM > 0.1) {
            calc = distKm / timeH;
            if (calc > 300) calc = null;
          } else if (distM <= 0.1) {
            calc = 0;
          }

          const displaySpeed = calc !== null ? Math.round(calc) : -1;
          setSpeed(displaySpeed);
          setDetails(
            `Lat: ${lat.toFixed(5)}\nLon: ${lon.toFixed(5)}\nDistance: ${distM.toFixed(1)}m\nTime: ${timeS.toFixed(1)}s\nAccuracy: ±${Math.round(acc)}m\nCalculated: ${calc !== null ? calc.toFixed(2) : 'N/A'} km/h`
          );
        }

        lastRef.current = { lat, lon, time: now };
      },
      (err) => setStatus(`❌ GPS Error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopTest = () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setTesting(false);
    lastRef.current = null;
  };

  return (
    <div style={{
      background: '#0f1620',
      color: '#fff',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ textAlign: 'center', color: '#4da6ff', marginBottom: '20px' }}>
        🌍 Real GPS Speed Test v4.8.1-REACT
      </h1>
      <p style={{ textAlign: 'center', color: '#4da6ff', fontSize: '12px' }}>
        Version: 4.8.1-REACT | Deployed: 2026-06-29
      </p>

      <div style={{
        background: '#1a2332',
        borderRadius: '8px',
        padding: '20px',
        margin: '20px 0'
      }}>
        <p style={{ color: '#999', fontSize: '13px', marginBottom: '15px' }}>
          This test uses your actual device GPS location to calculate real speed.
        </p>

        <button
          onClick={startTest}
          disabled={testing}
          style={{
            background: testing ? '#666' : '#4da6ff',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginRight: '10px'
          }}
        >
          📍 Start GPS Test
        </button>

        <button
          onClick={stopTest}
          disabled={!testing}
          style={{
            background: !testing ? '#666' : '#ff6666',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: !testing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ⏹️ Stop Test
        </button>

        {status && (
          <div style={{
            background: '#2a3f4a',
            color: '#90ee90',
            padding: '15px',
            borderRadius: '6px',
            margin: '15px 0',
            fontWeight: 'bold'
          }}>
            {status}
          </div>
        )}

        {testing && (
          <div>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#00ff00',
              textAlign: 'center',
              padding: '30px',
              background: '#1a2a1a',
              borderRadius: '6px',
              margin: '20px 0',
              fontFamily: 'monospace'
            }}>
              {speed === -1 ? '—' : `${speed} קמ״ש`}
            </div>

            <div style={{
              fontSize: '12px',
              color: '#999',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              lineHeight: '1.6'
            }}>
              {details}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
