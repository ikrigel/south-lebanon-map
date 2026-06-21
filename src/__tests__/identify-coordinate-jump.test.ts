import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import L from 'leaflet';

/**
 * Test to identify which code is calling map movement functions with invalid coordinates
 * Issue: After correct setView call, map jumps to invalid coordinates
 */

describe('Identify Coordinate Jump Source', () => {
  let map: L.Map;
  let container: HTMLDivElement;

  // Track all map movement calls
  const callLog: Array<{
    method: string;
    lat: number;
    lng: number;
    zoom: number | null;
    isValid: boolean;
    time: number;
  }> = [];

  beforeEach(() => {
    callLog.length = 0;
    container = document.createElement('div');
    container.id = 'test-map';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    map = L.map(container).setView([32.5958, 35.4057], 15);

    // Track setView calls
    const originalSetView = map.setView.bind(map);
    map.setView = function (center, zoom, options) {
      const latlng = Array.isArray(center)
        ? L.latLng(center[0], center[1])
        : L.latLng(center);

      const isValid = Math.abs(latlng.lat) <= 85 && Math.abs(latlng.lng) <= 180;

      callLog.push({
        method: 'setView',
        lat: latlng.lat,
        lng: latlng.lng,
        zoom: zoom || this.getZoom(),
        isValid,
        time: Date.now(),
      });

      console.log(`[CALL] setView(${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}, zoom=${zoom}) [${isValid ? '✅' : '❌'}]`);
      return originalSetView(center, zoom, options);
    };

    // Track flyTo calls
    const originalFlyTo = map.flyTo.bind(map);
    map.flyTo = function (center, zoom, options) {
      const latlng = Array.isArray(center)
        ? L.latLng(center[0], center[1])
        : L.latLng(center);

      const isValid = Math.abs(latlng.lat) <= 85 && Math.abs(latlng.lng) <= 180;

      callLog.push({
        method: 'flyTo',
        lat: latlng.lat,
        lng: latlng.lng,
        zoom: zoom || this.getZoom(),
        isValid,
        time: Date.now(),
      });

      console.log(`[CALL] flyTo(${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}, zoom=${zoom}) [${isValid ? '✅' : '❌'}]`);
      return originalFlyTo(center, zoom, options);
    };

    // Track panTo calls
    const originalPanTo = map.panTo.bind(map);
    map.panTo = function (center, options) {
      const latlng = Array.isArray(center)
        ? L.latLng(center[0], center[1])
        : L.latLng(center);

      const isValid = Math.abs(latlng.lat) <= 85 && Math.abs(latlng.lng) <= 180;

      callLog.push({
        method: 'panTo',
        lat: latlng.lat,
        lng: latlng.lng,
        zoom: this.getZoom(),
        isValid,
        time: Date.now(),
      });

      console.log(`[CALL] panTo(${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}) [${isValid ? '✅' : '❌'}]`);
      return originalPanTo(center, options);
    };

    // Track moveend events
    map.on('moveend', () => {
      const center = map.getCenter();
      console.log(`[EVENT] moveend -> lat=${center.lat.toFixed(4)}, lng=${center.lng.toFixed(4)}, zoom=${map.getZoom()}`);
    });
  });

  afterEach(() => {
    map.remove();
    document.body.removeChild(container);
  });

  it('should detect if any setView/flyTo calls have invalid coordinates', async () => {
    console.log('\n=== TEST: GPS UPDATE EFFECT Simulation ===\n');

    // Simulate GPS UPDATE EFFECT call
    const correctLat = 32.6004;
    const correctLon = 35.4068;
    const correctZoom = 15;

    console.log(`Simulating GPS UPDATE EFFECT with setView(${correctLat}, ${correctLon}, ${correctZoom})\n`);
    map.setView([correctLat, correctLon], correctZoom, {
      animate: true,
      duration: 0.3,
    } as L.ZoomPanOptions);

    // Wait for animation
    await new Promise(resolve => {
      let moveendCount = 0;
      const handler = () => {
        moveendCount++;
        if (moveendCount >= 2) {
          map.off('moveend', handler);
          setTimeout(resolve, 100);
        }
      };
      map.on('moveend', handler);
    });

    // Analyze
    console.log('\n=== MOVEMENT CALLS ===\n');
    callLog.forEach((call, i) => {
      console.log(`${i + 1}. ${call.method}(${call.lat.toFixed(4)}, ${call.lng.toFixed(4)}, zoom=${call.zoom}) [${call.isValid ? '✅' : '❌ INVALID'}]`);
    });

    const invalidCalls = callLog.filter(c => !c.isValid);
    if (invalidCalls.length > 0) {
      console.log(`\n⚠️  FOUND ${invalidCalls.length} CALLS WITH INVALID COORDINATES!`);
      invalidCalls.forEach(call => {
        console.log(`   ${call.method}(${call.lat.toFixed(4)}, ${call.lng.toFixed(4)}) - OUTSIDE BOUNDS`);
      });
    } else {
      console.log('\n✅ All calls have valid coordinates');
    }

    expect(invalidCalls.length).toBe(0, `Found ${invalidCalls.length} invalid coordinate calls`);
  });

  it('should not make calls after map reaches destination', async () => {
    console.log('\n=== TEST: Monitor calls after reaching destination ===\n');

    const destinationLat = 32.5958;
    const destinationLon = 35.4057;
    const zoom = 17;

    console.log('Calling map.flyTo to destination...\n');
    callLog.length = 0;
    map.flyTo([destinationLat, destinationLon], zoom, { duration: 0.5 });

    await new Promise(resolve => {
      let moveendCount = 0;
      const handler = () => {
        moveendCount++;
        const center = map.getCenter();
        console.log(`  moveend #${moveendCount}: at (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`);
        if (moveendCount >= 2) {
          map.off('moveend', handler);
          // Wait extra to see if another call happens
          setTimeout(resolve, 200);
        }
      };
      map.on('moveend', handler);
    });

    console.log('\n=== CALLS MADE ===\n');
    callLog.forEach((call, i) => {
      console.log(`${i + 1}. ${call.method}(${call.lat.toFixed(4)}, ${call.lng.toFixed(4)}) [${call.isValid ? '✅' : '❌'}]`);
    });

    const invalidCalls = callLog.filter(c => !c.isValid);
    expect(invalidCalls.length).toBe(0, `Should not call movement functions with invalid coordinates. Found: ${invalidCalls.length}`);
  });

  it('should verify Leaflet conversion from valid to invalid happens internally', async () => {
    console.log('\n=== TEST: Leaflet Internal State Corruption ===\n');

    // Call with valid coordinates
    const validLat = 32.6004;
    const validLon = 35.4068;
    console.log(`Calling setView with VALID: (${validLat}, ${validLon})`);

    map.setView([validLat, validLon], 15, { animate: true, duration: 0.3 } as L.ZoomPanOptions);

    // Check map center during animation
    const statesDuringAnimation: Array<{ zoom: number; lat: number; lng: number }> = [];

    await new Promise(resolve => {
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        statesDuringAnimation.push({ zoom, lat: center.lat, lng: center.lng });
        checkCount++;
        if (checkCount > 20 || !map.isMoving()) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 15);
    });

    console.log('\n=== MAP STATE DURING ANIMATION ===\n');
    statesDuringAnimation.forEach((state, i) => {
      const isValid = Math.abs(state.lat) <= 85 && Math.abs(state.lng) <= 180;
      console.log(`Frame ${i}: (${state.lat.toFixed(4)}, ${state.lng.toFixed(4)}, zoom=${state.zoom.toFixed(1)}) [${isValid ? '✅' : '❌'}]`);
    });

    // Check if any intermediate state was invalid
    const invalidStates = statesDuringAnimation.filter(s => Math.abs(s.lat) > 85 || Math.abs(s.lng) > 180);
    if (invalidStates.length > 0) {
      console.log(`\n⚠️  FOUND ${invalidStates.length} INVALID INTERMEDIATE STATES!`);
      invalidStates.forEach(state => {
        console.log(`   (${state.lat.toFixed(4)}, ${state.lng.toFixed(4)}) at zoom ${state.zoom.toFixed(1)}`);
      });
    }

    const finalCenter = map.getCenter();
    const finalZoom = map.getZoom();
    console.log(`\nFinal state: (${finalCenter.lat.toFixed(4)}, ${finalCenter.lng.toFixed(4)}, zoom=${finalZoom})`);
  });
});
