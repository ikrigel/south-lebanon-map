import { describe, it, expect, beforeEach, vi } from 'vitest';
import L from 'leaflet';

/**
 * Test to reproduce CENTER ME jumping bug
 * Issue: Map reaches correct location but then jumps to invalid coordinates
 */

describe('CENTER ME bug reproduction', () => {
  let map: L.Map;
  let container: HTMLDivElement;
  const setViewCalls: Array<{ lat: number; lng: number; zoom: number; time: number }> = [];
  const moveendCalls: Array<{ lat: number; lng: number; zoom: number; time: number }> = [];

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'map';
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    map = L.map(container).setView([32.5958, 35.4057], 15);

    // Track all setView calls
    const originalSetView = map.setView.bind(map);
    map.setView = function (center, zoom, options) {
      const latlng = L.latLng(center);
      setViewCalls.push({
        lat: latlng.lat,
        lng: latlng.lng,
        zoom: zoom || this.getZoom(),
        time: Date.now(),
      });
      console.log(`[TEST] map.setView(${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}, zoom=${zoom})`);
      return originalSetView(center, zoom, options);
    };

    // Track all moveend events
    map.on('moveend', () => {
      const center = map.getCenter();
      moveendCalls.push({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
        time: Date.now(),
      });
      console.log(`[TEST moveend] lat=${center.lat.toFixed(4)}, lng=${center.lng.toFixed(4)}, zoom=${map.getZoom()}`);
    });
  });

  it('should reach correct location without jumping to invalid coordinates', async () => {
    const gpsLocation = { lat: 32.5958, lon: 35.4057 };
    const correctZoom = 17;

    // Simulate CENTER ME clicking
    console.log('\n=== SIMULATING CENTER ME CLICK ===');
    map.flyTo([gpsLocation.lat, gpsLocation.lon], correctZoom, { duration: 0.7 });

    // Wait for animation to complete
    await new Promise(resolve => {
      map.once('moveend', resolve);
    });

    console.log('\n=== ANIMATION COMPLETE ===');

    // Check that map is at correct location
    const finalCenter = map.getCenter();
    console.log(`Final position: lat=${finalCenter.lat.toFixed(4)}, lng=${finalCenter.lng.toFixed(4)}, zoom=${map.getZoom()}`);

    expect(Math.abs(finalCenter.lat - gpsLocation.lat)).toBeLessThan(0.001);
    expect(Math.abs(finalCenter.lng - gpsLocation.lon)).toBeLessThan(0.001);
    expect(map.getZoom()).toBe(correctZoom);

    // Analyze all movements
    console.log('\n=== ALL MOVEMENTS ===');
    console.log('setView calls:');
    setViewCalls.forEach((call, i) => {
      const isValid = Math.abs(call.lat) <= 85 && Math.abs(call.lng) <= 180;
      console.log(`  ${i}: lat=${call.lat.toFixed(4)}, lng=${call.lng.toFixed(4)}, zoom=${call.zoom} [${isValid ? 'VALID' : 'INVALID'}]`);
    });

    console.log('moveend events:');
    moveendCalls.forEach((call, i) => {
      const isValid = Math.abs(call.lat) <= 85 && Math.abs(call.lng) <= 180;
      console.log(`  ${i}: lat=${call.lat.toFixed(4)}, lng=${call.lng.toFixed(4)}, zoom=${call.zoom} [${isValid ? 'VALID' : 'INVALID'}]`);
    });

    // Check for invalid coordinate jumps
    const invalidMoveends = moveendCalls.filter(
      call => Math.abs(call.lat) > 85 || Math.abs(call.lng) > 180
    );

    if (invalidMoveends.length > 0) {
      console.log(`\n⚠️  FOUND ${invalidMoveends.length} INVALID MOVEMENTS!`);
      invalidMoveends.forEach(call => {
        console.log(`  INVALID: lat=${call.lat.toFixed(4)}, lng=${call.lng.toFixed(4)}`);
      });
    }

    expect(invalidMoveends).toHaveLength(0, 'Should not have any invalid coordinate movements');
  });

  it('should log which effect is causing the jump', async () => {
    // This test helps identify what's calling setView with wrong coordinates
    // by monitoring the call stack

    const gpsLocation = { lat: 32.5958, lon: 35.4057 };

    console.log('\n=== TRACKING EFFECT CALLS ===');
    console.log('Watch for which code path calls setView with invalid coordinates');

    map.flyTo([gpsLocation.lat, gpsLocation.lon], 17, { duration: 0.7 });

    // Wait and watch
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Report findings
    console.log('\nsetView calls made:');
    setViewCalls.forEach((call, i) => {
      const isValid = Math.abs(call.lat) <= 85 && Math.abs(call.lng) <= 180;
      console.log(`  Call ${i}: ${isValid ? '✅' : '❌'} (${call.lat.toFixed(4)}, ${call.lng.toFixed(4)})`);
    });

    // The question: which effect is making the invalid call?
    // Answer should come from console logs showing [GPS UPDATE EFFECT], [RESIZE EFFECT], etc.
    expect(setViewCalls.length).toBeGreaterThan(0);
  });
});
