import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import {
  blueLine, litaniRiver, litaniBufferZone, zahraniRiver, awaliRiver,
  towns, unifilPoints, influenceZones, terrainFeatures,
  droneAttacks,
  Incident, Town,
} from './data/geo';
import { TYPE_COLOR, TYPE_LABEL, escapeHtml, fmtDate, fmtKm, haversineKm } from './util';
import type { MapHandle, LayerVis, MapProps } from './mapTypes';
import { POP_RADIUS, TILESETS, SECT_COLORS, NAVIGATION_FOLLOW_MIN_ZOOM, labelHtml, poiSizePx, poiShapeClass, poiSymbol, poiIconHtml, buildTownInfoHtml, townPopup, navBtn } from './mapHtml';
import { useMapInit } from './hooks/useMapInit';
import { useMapRotation } from './hooks/useMapRotation';
import { useMapRoute } from './hooks/useMapRoute';
import { useMapLabels } from './hooks/useMapLabels';
import { useMapLiveLocation } from './hooks/useMapLiveLocation';
import { useMapClickHandler } from './hooks/useMapClickHandler';
import { useMapPopupButtons } from './hooks/useMapPopupButtons';
import { useMapRecording } from './hooks/useMapRecording';
import { useMapPois } from './hooks/useMapPois';
import { useMapMultiRoute } from './hooks/useMapMultiRoute';
import { useMapIncidents } from './hooks/useMapIncidents';
import { useMapMeasureAndDistance } from './hooks/useMapMeasureAndDistance';
import { useDroneVisualization } from './hooks/useDroneVisualization';

// Re-export types for use by other modules
export type { MapHandle, LayerVis, MapProps };

const MapView = forwardRef<MapHandle, MapProps>(function MapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRotationRef = useRef(0);
  const userOnlyRotationRef = useRef(0);

  const { mapRef, layersRef, savedViewRef, routePolylineRefs, liveFollowDetachedRef, lastLiveFollowRef } = useMapInit(
    containerRef,
    userRotationRef,
    props.theme,
    props.visible.sectColors,
    props.initialCenter,
    props.onMapViewChange,
  );

  useMapRotation(
    containerRef,
    mapRef,
    props.compassMode,
    props.bearingToDestination,
    props.userRotation,
    props.onUserRotationChange,
    userRotationRef,
    userOnlyRotationRef,
    props.rotationLocked,
  );

  useMapRoute(
    mapRef,
    layersRef,
    routePolylineRefs,
    props.routeOverlays,
    props.navigationRoute,
    props.routeDisplayMode,
    props.liveLocation,
    props.visible.navLabels,
  );

  useMapLabels(layersRef, props.largeLabels, props.allLabels, props.visible);

  useImperativeHandle(ref, () => ({
    snapshotCenter: () => {
      // Called SYNCHRONOUSLY before any layout change (before rAF).
      // Leaflet's ResizeObserver may fire during the rAF gap and corrupt
      // getCenter(), so we snapshot here while the layout is still stable.
      const map = mapRef.current;
      if (!map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      // CRITICAL: Only save VALID coordinates. If map is at wrong location, don't update snapshot
      // This prevents cascading corruption where invalid coords get saved and restored
      if (Math.abs(center.lat) <= 85 && Math.abs(center.lng) <= 180) {
        console.log(`[snapshotCenter] ✅ Saving valid location: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
        savedViewRef.current = { center, zoom };
      } else {
        console.error(`⚠️ [snapshotCenter] INVALID location, NOT saving: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
      }
    },
    invalidateSize: () => {
      // App.tsx already waited double-rAF so the CSS grid is applied.
      //
      // Root cause: when the container resizes, Leaflet recalculates
      // _pixelOrigin = project(center) - viewHalf + panePos.
      // viewHalf changes with the container, so _pixelOrigin drifts and
      // the visible area shifts east/west. _rawPanBy only moves the pane
      // but does not fix _pixelOrigin, so it cannot cure the drift.
      //
      // Fix: capture the geo-center from snapshotCenter() (taken before any
      // layout change), let Leaflet invalidate tile bounds, then call setView
      // with the saved center and the CURRENT zoom (which invalidateSize
      // never changes). This forces _pixelOrigin to be recalculated correctly
      // for the new container size, keeping the viewport locked on the same
      // geographic point.
      const map = mapRef.current;
      if (!map) return;
      const saved = savedViewRef.current;
      const zoom = map.getZoom(); // invalidateSize never changes zoom

      // CRITICAL: Only use saved center if it's VALID
      // If snapshotCenter() saved invalid coords, use current map center instead
      let center = map.getCenter();
      if (saved && Math.abs(saved.center.lat) <= 85 && Math.abs(saved.center.lng) <= 180) {
        center = saved.center;
        console.log(`[Map.invalidateSize] Using saved location: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
      } else if (!saved) {
        console.log(`[Map.invalidateSize] No saved location, using current: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
      } else {
        console.error(`⚠️ [Map.invalidateSize] Saved location invalid, using current: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
      }

      map.invalidateSize({ animate: false, pan: false });
      // setView recalculates _pixelOrigin for the new container size,
      // anchoring it on the saved geo-center without changing zoom.
      console.log(`[Map.invalidateSize] map.setView(lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}, zoom=${zoom})`);
      if (Math.abs(center.lat) <= 85 && Math.abs(center.lng) <= 180) {
        map.setView(center, zoom, { animate: false, noMoveStart: true } as L.ZoomPanOptions);
      } else {
        console.error(`⚠️ [Map.invalidateSize] FINAL CHECK: coords still invalid! lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)} - NOT setting view`);
      }
    },
  }), [mapRef, savedViewRef]);
  // Always-fresh refs — updated every render so closures are never stale
  const onNavigateRef = useRef(props.onNavigateToPoint);
  const onSetNavStartRef = useRef(props.onSetNavStart);
  onNavigateRef.current  = props.onNavigateToPoint;
  onSetNavStartRef.current = props.onSetNavStart;
  // propsRef: keeps handleClick closure fresh without re-registering the listener
  const propsRef = useRef(props);
  propsRef.current = props;

  useMapLiveLocation(mapRef, layersRef, liveFollowDetachedRef, lastLiveFollowRef, props.liveLocation, props.navigationRoute, props.mapBearing, props.bearingToDestination, props.distanceToDestination, props.navFollowZoom, props.visible.navLabels, props.liveCenterRequestId, props.onLiveFollowDetachedChange);

  useMapClickHandler(containerRef, mapRef, propsRef);

  useMapPopupButtons(mapRef, onNavigateRef, onSetNavStartRef);

  // Global Leaflet event logging to catch ALL map movements
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      console.log(`[LEAFLET moveend] map center now: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}, zoom=${map.getZoom()}`);
    };

    const handleZoom = () => {
      const center = map.getCenter();
      console.log(`[LEAFLET zoom] map zoom now: ${map.getZoom()}, center: lat=${center.lat.toFixed(4)}, lon=${center.lng.toFixed(4)}`);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoom', handleZoom);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoom', handleZoom);
    };
  }, []);

  useEffect(() => {
    const base = layersRef.current.base;
    if (!base) return;
    if (props.visible.topo) {
      base.setUrl(TILESETS.topo);
      base.options.subdomains = ['a', 'b', 'c'] as unknown as string;
      base.options.maxNativeZoom = 17;
      base.options.maxZoom = 19;
      base.getAttribution = () => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
    } else {
      base.setUrl(TILESETS[props.theme]);
      base.options.subdomains = 'abcd';
      base.options.maxNativeZoom = 19;
      base.options.maxZoom = 19;
      base.getAttribution = () => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }
  }, [props.theme, props.visible.topo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.focusTarget) return;

    console.log(`[focusTarget EFFECT RUN] id=${props.focusTarget.id} lat=${props.focusTarget.lat.toFixed(4)} lon=${props.focusTarget.lon.toFixed(4)}`);

    // Setup focus layer
    if (!layersRef.current.focus) layersRef.current.focus = L.layerGroup().addTo(map);
    const focusGroup = layersRef.current.focus;
    focusGroup.clearLayers();

    // For map clicks: check if within 500m of a town, otherwise show coordinates
    if (props.focusTarget.id?.startsWith('map-click')) {
      const clickPoint: [number, number] = [props.focusTarget.lat, props.focusTarget.lon];
      const NEARBY_RADIUS_KM = 0.5; // 500 meters

      // Find nearby towns (Lebanese side only)
      const nearbyTown = towns
        .filter(t => t.side === 'LB')
        .map(t => ({
          ...t,
          distance: haversineKm(clickPoint, [t.lat, t.lon]),
        }))
        .filter(t => t.distance <= NEARBY_RADIUS_KM)
        .sort((a, b) => a.distance - b.distance)[0];

      let popupContent: string;
      let markerLatLng: [number, number];
      let markerIcon: L.Icon;

      if (nearbyTown) {
        // Show town details popup but with clicked location for navigation
        const infoHtml = buildTownInfoHtml(nearbyTown, props.visible.sectColors);
        const coords = `${props.focusTarget.lat.toFixed(5)}, ${props.focusTarget.lon.toFixed(5)}`;
        // Create hybrid popup: town info with toggle + click location navigation buttons
        popupContent = `<div class="town-popup" dir="rtl">
          <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
            <button class="popup-nav-btn popup-nav-full" data-nav-lat="${props.focusTarget.lat}" data-nav-lon="${props.focusTarget.lon}" data-nav-label="${coords.replace(/"/g, '&quot;')}" data-nav-role="end">▶ נווט לכאן — יעד</button>
            <button class="popup-nav-btn popup-nav-btn-start popup-nav-full" data-nav-lat="${props.focusTarget.lat}" data-nav-lon="${props.focusTarget.lon}" data-nav-label="${coords.replace(/"/g, '&quot;')}" data-nav-role="start">🚦 הגדר כנקודת מוצא</button>
          </div>
          <button class="popup-info-toggle" data-info-toggle="1">פרטים ▼</button>
          <div class="town-popup-info" style="display:none">${infoHtml}</div>
        </div>`;
        // Place marker at clicked location, not town location
        markerLatLng = [props.focusTarget.lat, props.focusTarget.lon];
        markerIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjZjZjNDUzIiBzdHJva2U9IiMwZjc2NmUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      } else {
        // Show coordinates popup for clicks away from towns
        const coords = `${props.focusTarget.lat.toFixed(5)}, ${props.focusTarget.lon.toFixed(5)}`;
        popupContent = `<div style="text-align:right;direction:rtl"><strong>${coords}</strong>${navBtn(props.focusTarget.lat, props.focusTarget.lon, coords)}</div>`;
        markerLatLng = [props.focusTarget.lat, props.focusTarget.lon];
        markerIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjZjZjNDUzIiBzdHJva2U9IiMwZjc2NmUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      }

      // Create marker with popup bound, then open popup
      const marker = L.marker(markerLatLng, { icon: markerIcon })
        .bindPopup(popupContent, { maxWidth: 280 })
        .addTo(focusGroup);

      // Open popup after marker is added to map
      marker.openPopup();
    } else {
      // For search results, incidents: animate map and show label
      const lat = props.focusTarget.lat;
      const lon = props.focusTarget.lon;
      const zoom = props.focusTarget.zoom ?? 12;

      console.log(`[Map.tsx focusTarget RECEIVED] lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, id=${props.focusTarget.id}`);

      // VALIDATE coordinates before setting view
      if (Math.abs(lat) > 85 || Math.abs(lon) > 180) {
        console.error(`⚠️ [Map.tsx] INVALID focusTarget coords: lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)} - NOT setting view`);
        console.error(`⚠️ [Map.tsx] focusTarget object:`, props.focusTarget);
        return; // Don't set invalid view
      }

      const method = props.focusTarget.id === 'restore-last-map-view' ? 'setView' : 'flyTo';
      console.log(`[Map.tsx focusTarget] ✅ map.${method}(lat=${lat.toFixed(4)}, lon=${lon.toFixed(4)}, zoom=${zoom})`);
      console.log(`[MAP_MOVE] ✅ FOCUS_TARGET → ${method}(${lat.toFixed(4)}, ${lon.toFixed(4)}, zoom=${zoom})`);

      if (props.focusTarget.id === 'restore-last-map-view') {
        console.log(`[focusTarget-restore] Restoring saved map view`);
        map.setView(
          [lat, lon],
          zoom,
          { animate: false, noMoveStart: true },
        );
      } else {
        console.log(`[focusTarget-flyto] Animating to target (id=${props.focusTarget.id})`);
        console.log(`[focusTarget-flyto] ABOUT TO CALL map.flyTo - map.getCenter() BEFORE: lat=${map.getCenter().lat.toFixed(4)}, lon=${map.getCenter().lng.toFixed(4)}`);
        map.flyTo([lat, lon], zoom, {
          animate: true,
          duration: 0.7,
        });
        console.log(`[focusTarget-flyto] map.flyTo CALL COMPLETED (animation scheduled, not finished yet)`);
      }

      // Show label on map
      if (props.focusTarget.label) {
        L.circleMarker([props.focusTarget.lat, props.focusTarget.lon], {
          radius: 11,
          color: '#f6c453',
          weight: 3,
          fillColor: '#0f766e',
          fillOpacity: 0.92,
        })
          .bindTooltip(props.focusTarget.label, {
            direction: 'top',
            offset: [0, -10],
            permanent: true,
            className: 'focus-tooltip',
          })
          .addTo(focusGroup);
      }
    }
    console.log(`[focusTarget EFFECT END] Completed setup for id=${props.focusTarget.id}`);
  }, [props.focusTarget]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const detachLiveFollow = () => {
      if (!props.liveLocation || liveFollowDetachedRef.current) return;
      liveFollowDetachedRef.current = true;
      props.onLiveFollowDetachedChange(true);
    };
    map.on('dragstart', detachLiveFollow);
    return () => {
      map.off('dragstart', detachLiveFollow);
    };
  }, [props.liveLocation, props.onLiveFollowDetachedChange]);

  useEffect(() => {
    if (props.liveLocation) return;
    liveFollowDetachedRef.current = false;
    lastLiveFollowRef.current = null;
    props.onLiveFollowDetachedChange(false);
  }, [props.liveLocation, props.onLiveFollowDetachedChange]);
  useEffect(() => {
    const map = mapRef.current;
    const L_ = layersRef.current;
    if (!map) return;
    const setVis = (group: L.LayerGroup | undefined, vis: boolean) => {
      if (!group) return;
      if (vis && !map.hasLayer(group)) group.addTo(map);
      if (!vis && map.hasLayer(group)) map.removeLayer(group);
    };
    // סדר שכבות: hez קודם (interactive:false), אחרכך pop מעליו כדי שהקליקים יעבדו
    setVis(L_.hez, props.visible.hez);
    setVis(L_.pop, props.visible.pop);
    setVis(L_.unifil, props.visible.unifil);
    setVis(L_.blueLine, props.visible.blueLine);
    setVis(L_.litani, props.visible.litani);
    setVis(L_.rivers, props.visible.rivers);
  }, [props.visible]);

  useEffect(() => {
    const map = mapRef.current;
    const L_ = layersRef.current;
    if (!map || !L_.pop) return;
    const wasVisible = map.hasLayer(L_.pop);
    if (wasVisible) map.removeLayer(L_.pop);
    const popGroup = L.layerGroup();
    const useSectColors = props.visible.sectColors;
    towns.filter(t => t.side === 'LB').forEach(t => {
      const sectColor = (useSectColors && t.sect) ? (SECT_COLORS[t.sect] ?? '#d0b58a') : '#d0b58a';
      L.circleMarker([t.lat, t.lon], {
        radius: POP_RADIUS[t.pop_band],
        color: sectColor,
        weight: 1.5,
        fillColor: sectColor,
        fillOpacity: 0.22,
        pane: 'popPane',  // keep circles above label pane after rebuild
      })
        .bindPopup(
          townPopup(t.lat, t.lon, t.name_he, buildTownInfoHtml(t, useSectColors)),
          { minWidth: 200 }
        )
        .addTo(popGroup);
    });
    L_.pop = popGroup;
    if (wasVisible && props.visible.pop) popGroup.addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.visible.sectColors]);
  useMapIncidents(layersRef, mapRef, props.filteredIncidents, props.selectedIncident, props.onSelectIncident);

  useDroneVisualization({
    mapRef,
    layersRef,
    droneAttacks: props.droneAttacks || droneAttacks,
    visible: props.visible.drones,
  });

  useMapMeasureAndDistance({
    layersRef,
    measureMode: props.measureMode,
    manualMeasure: props.manualMeasure,
    distanceLine: props.distanceLine,
  });
  useMapRecording(layersRef, props.recordedTrack);

  useMapPois(layersRef, props.customPois, props.poiDraft, props.poiDraftStyle);

  useMapMultiRoute(layersRef, props.multiRouteDraft, props.activeMultiRoute);

  return (
    <div
      id="map"
      ref={containerRef}
      className={props.largeLabels ? 'labels-large' : ''}
      data-testid="map-canvas"
    />
  );
});

export default MapView;