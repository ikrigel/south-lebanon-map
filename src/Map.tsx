import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import {
  blueLine, litaniRiver, litaniBufferZone, zahraniRiver, awaliRiver,
  towns, unifilPoints, influenceZones, terrainFeatures,
  Incident, Town,
} from './data/geo';
import { TYPE_COLOR, TYPE_LABEL, escapeHtml, fmtDate, fmtKm, haversineKm } from './util';
import type { MapHandle, LayerVis, MapProps } from './mapTypes';
import { POP_RADIUS, TILESETS, SECT_COLORS, NAVIGATION_FOLLOW_MIN_ZOOM, labelHtml, poiSizePx, poiShapeClass, poiSymbol, poiIconHtml, buildTownInfoHtml, townPopup, navBtn } from './mapHtml';
import { useMapInit } from './hooks/useMapInit';
import { useMapRotation } from './hooks/useMapRotation';
import { useMapRoute } from './hooks/useMapRoute';
import { useMapLabels } from './hooks/useMapLabels';
import { useMapRecording } from './hooks/useMapRecording';
import { useMapPois } from './hooks/useMapPois';
import { useMapMultiRoute } from './hooks/useMapMultiRoute';
import { useMapIncidents } from './hooks/useMapIncidents';

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
    props.mapBearing,
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
      savedViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
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
      const center = saved ? saved.center : map.getCenter();
      const zoom = map.getZoom(); // invalidateSize never changes zoom
      map.invalidateSize({ animate: false, pan: false });
      // setView recalculates _pixelOrigin for the new container size,
      // anchoring it on the saved geo-center without changing zoom.
      map.setView(center, zoom, { animate: false, noMoveStart: true } as L.ZoomPanOptions);
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

  // ---- switch base-map brightness/theme ----
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

  // ---- focus map from search results ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.focusTarget) return;
    // 'restore-last-map-view': use instant setView so savedViewRef is correct
    // immediately and not subject to async flyTo moveend timing issues.
    // All other focus targets (search results, incidents) use animated flyTo.
    if (props.focusTarget.id === 'restore-last-map-view') {
      map.setView(
        [props.focusTarget.lat, props.focusTarget.lon],
        props.focusTarget.zoom ?? 12,
        { animate: false, noMoveStart: true },
      );
    } else {
      map.flyTo([props.focusTarget.lat, props.focusTarget.lon], props.focusTarget.zoom ?? 12, {
        animate: true,
        duration: 0.7,
      });
    }
    if (props.focusTarget.label) {
      if (!layersRef.current.focus) layersRef.current.focus = L.layerGroup().addTo(map);
      const focusGroup = layersRef.current.focus;
      focusGroup.clearLayers();
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
  }, [props.focusTarget]);

  // ---- detach automatic live-location follow after manual map movement ----
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

  // keep the click handler fresh, including custom app modes above Leaflet layers
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.leaflet-control, .leaflet-popup')) return;
      if (target?.closest('[data-nav-lat]')) return;  // popup nav button — handled by popupopen
      // Suppress coord-popup when clicking Leaflet interactive layers (circle markers, polylines)
      // or marker icons / tooltips.  SVG circleMarkers carry .leaflet-interactive on the SVG path.
      // Use propsRef.current so this closure always sees up-to-date props
      // without needing to re-register the listener on every render.
      const p = propsRef.current;
      if (!p.pointPickMode && target?.closest(
        '.leaflet-marker-icon, .leaflet-tooltip, .leaflet-interactive'
      )) return;
      // ---- rotation-aware click → LatLng conversion ----------------------
      // Leaflet's mouseEventToLatLng uses getBoundingClientRect() to compute
      // the scale factor. When the container has CSS rotate()+scale(), the
      // bounding-rect width ≠ offsetWidth → wrong scale → wrong coords.
      // Fix: un-rotate the click point around the container center, then
      // un-scale by the CSS scale factor, then pass to containerPointToLatLng.
      const latLng = (() => {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = event.clientX - cx;
        const dy = event.clientY - cy;
        const deg = userRotationRef.current;
        const rad = (deg * Math.PI) / 180;
        const cos = Math.cos(-rad);
        const sin = Math.sin(-rad);
        const ux = dx * cos - dy * sin;
        const uy = dx * sin + dy * cos;
        const logicalW = container.offsetWidth;
        const logicalH = container.offsetHeight;
        const containerPt = L.point(
          logicalW / 2 + ux * (logicalW / rect.width),
          logicalH / 2 + uy * (logicalH / rect.height),
        );
        return map.containerPointToLatLng(containerPt);
      })();
      // In normal (non-mode) navigation: open a coord popup with a nav button.
      if (!p.pointPickMode && p.onNavigateToPoint) {
        const coordLabel = `${latLng.lat.toFixed(5)}°N, ${latLng.lng.toFixed(5)}°E`;

        // Find nearest town within 500 m to show info toggle
        const NEARBY_KM = 0.5;
        const nearbyTown = towns
          .filter(t => t.side === 'LB')
          .map(t => ({ t, d: haversineKm([latLng.lat, latLng.lng], [t.lat, t.lon]) }))
          .filter(({ d }) => d <= NEARBY_KM)
          .sort((a, b) => a.d - b.d)[0]?.t ?? null;

        const nearbySection = nearbyTown
          ? `<button class="popup-info-toggle" data-info-toggle="1" style="margin-top:6px">פרטים ▼</button>` +
            `<div class="town-popup-info" style="display:none;margin-top:4px">${buildTownInfoHtml(nearbyTown, p.visible.sectColors)}</div>`
          : '';

        const popHtml =
          `<div class="town-popup" dir="rtl" style="min-width:200px">
            <div class="town-popup-nav">
              <button class="popup-nav-btn popup-nav-full" data-nav-lat="${latLng.lat}" data-nav-lon="${latLng.lng}" data-nav-label="${coordLabel.replace(/"/g, '&quot;')}" data-nav-role="end">▶ נווט לכאן — יעד</button>
              <button class="popup-nav-btn popup-nav-btn-start popup-nav-full" data-nav-lat="${latLng.lat}" data-nav-lon="${latLng.lng}" data-nav-label="${coordLabel.replace(/"/g, '&quot;')}" data-nav-role="start">🚦 הגדר כנקודת מוצא</button>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8b97a8;margin-top:6px;text-align:center">${coordLabel}</div>
            ${nearbySection}
          </div>`;
        L.popup({ offset: [0, -4], closeButton: true, className: 'coord-popup' })
          .setLatLng([latLng.lat, latLng.lng])
          .setContent(popHtml)
          .openOn(map);
      }
      p.onMapClick(latLng.lat, latLng.lng);
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  // Mount-once: propsRef.current always has the latest props, no stale closure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- popup button wiring via popupopen ----
  // We wire buttons directly on the popup DOM each time it opens.
  // This is more reliable on mobile than delegated listeners on the map
  // container, because Leaflet's touch handling can swallow bubbling events.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onPopupOpen = (e: L.PopupEvent) => {
      const content = e.popup.getElement()?.querySelector<HTMLElement>('.leaflet-popup-content');
      if (!content) return;

      // ---- nav buttons ----
      content.querySelectorAll<HTMLButtonElement>('[data-nav-lat]').forEach(btn => {
        // touchend fires on mobile; the browser then also fires a synthetic click.
        // We use a flag to ensure the callback fires exactly once per gesture.
        let touchFired = false;
        const fire = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
          if (ev.type === 'touchend') {
            touchFired = true;
          } else if (ev.type === 'click' && touchFired) {
            // Suppress the synthetic click that follows touchend
            touchFired = false;
            return;
          }
          const lat = parseFloat(btn.dataset.navLat ?? '');
          const lon = parseFloat(btn.dataset.navLon ?? '');
          const label = btn.dataset.navLabel ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          const role = btn.dataset.navRole ?? 'end';
          if (!isNaN(lat) && !isNaN(lon)) {
            if (role === 'start') onSetNavStartRef.current?.(lat, lon, label);
            else onNavigateRef.current?.(lat, lon, label);
            map.closePopup();
          }
        };
        btn.addEventListener('touchend', fire, { passive: false });
        btn.addEventListener('click', fire);
      });

      // ---- info toggle ----
      content.querySelectorAll<HTMLButtonElement>('[data-info-toggle]').forEach(toggleBtn => {
        const infoDiv = toggleBtn.nextElementSibling as HTMLElement | null;
        if (!infoDiv) return;
        // Same double-fire guard as nav buttons: touchend fires first on mobile,
        // then the browser emits a synthetic click — suppress that click.
        let touchFired = false;
        const fire = (ev: Event) => {
          ev.stopPropagation();
          if (ev.type === 'touchend') {
            touchFired = true;
          } else if (ev.type === 'click' && touchFired) {
            touchFired = false;
            return;
          }
          const isOpen = infoDiv.style.display !== 'none';
          infoDiv.style.display = isOpen ? 'none' : 'block';
          toggleBtn.textContent = isOpen ? 'פרטים ▼' : 'פרטים ▲';
        };
        toggleBtn.addEventListener('touchend', fire, { passive: false });
        toggleBtn.addEventListener('click', fire);
      });
    };

    map.on('popupopen', onPopupOpen);
    return () => { map.off('popupopen', onPopupOpen); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // mount-once; callbacks accessed via navRef closure

  // ---- toggle layer visibility ----
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

  // ---- Rebuild pop layer when sectColors toggle changes ----
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

  // ---- render incidents + highlight ----
  useMapIncidents(layersRef, mapRef, props.filteredIncidents, props.selectedIncident, props.onSelectIncident);

  // ---- manual measure points ----
  useEffect(() => {
    const group = layersRef.current.measure;
    if (!group) return;
    group.clearLayers();
    if (!props.measureMode && props.manualMeasure.length === 0) return;
    props.manualMeasure.forEach((p, i) => {
      L.circleMarker(p, {
        radius: 5,
        color: '#6ed1c2',
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      })
        .bindTooltip(`${i + 1}`, { permanent: true, direction: 'top', offset: [0, -6] })
        .addTo(group);
    });
    if (props.manualMeasure.length === 2) {
      const [a, b] = props.manualMeasure;
      L.polyline([a, b], {
        color: '#6ed1c2',
        weight: 2,
        dashArray: '4 4',
      }).addTo(group);
    }
  }, [props.manualMeasure, props.measureMode]);

  // ---- distance from incident to border line ----
  useEffect(() => {
    const group = layersRef.current.distance;
    if (!group) return;
    group.clearLayers();
    if (!props.distanceLine) return;
    const [a, b] = props.distanceLine;
    L.polyline([a, b], {
      color: '#6ed1c2',
      weight: 2.5,
      dashArray: '6 3',
    }).addTo(group);
    L.circleMarker(b, {
      radius: 4,
      color: '#6ed1c2',
      weight: 2,
      fillColor: '#0b0d10',
      fillOpacity: 1,
    }).addTo(group);
  }, [props.distanceLine]);


  // ---- live device location and automatic follow zoom ----
  useEffect(() => {
    const group = layersRef.current.live;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    if (!props.liveLocation) return;
    const p: [number, number] = [props.liveLocation.lat, props.liveLocation.lon];
    const heading = typeof props.liveLocation.heading === 'number' && isFinite(props.liveLocation.heading)
      ? props.liveLocation.heading
      : props.mapBearing;
    L.marker(p, {
      icon: L.divIcon({
        className: 'live-location-arrow',
        html: `<span class="live-location-ring"></span><span class="live-location-heading" style="transform: rotate(${heading}deg)">▲</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    })
      .addTo(group);
    // Live-location tooltip: show remaining distance to destination when
    // navLabels is on and a navigation route is active. No tooltip when off.
    const layers = group.getLayers();
    const liveMarker = layers[layers.length - 1] as L.Marker | undefined;
    if (liveMarker && props.visible.navLabels && props.navigationRoute) {
      const remKm = haversineKm(
        [props.liveLocation!.lat, props.liveLocation!.lon],
        [props.navigationRoute.end.lat, props.navigationRoute.end.lon],
      );
      const remStr = remKm < 1
        ? `${Math.round(remKm * 1000)} מ'׳`
        : remKm < 10
        ? `${remKm.toFixed(2)} ק״מ`
        : `${remKm.toFixed(1)} ק״מ`;
      liveMarker.bindTooltip(`נותר: ${remStr} ליעד`, {
        permanent: true,
        direction: 'bottom',
        offset: [0, 14],
        className: 'route-tooltip nav-remain-tooltip',
      });
    }
    if (props.liveLocation.accuracy && props.liveLocation.accuracy > 0) {
      L.circle(p, {
        radius: props.liveLocation.accuracy,
        color: '#4fb3a6',
        weight: 1,
        fillColor: '#4fb3a6',
        fillOpacity: 0.08,
      }).addTo(group);
    }
    const previousFollow = lastLiveFollowRef.current;
    const now = Date.now();
    const movedEnough = !previousFollow || Math.abs(previousFollow.lat - p[0]) > 0.00002 || Math.abs(previousFollow.lon - p[1]) > 0.00002;
    const timeEnough = !previousFollow || now - previousFollow.at > 1500;
    // Use the user-selected nav scale zoom if provided; otherwise maintain current zoom
    // but never fall below the minimum follow zoom.
    const targetZoom = props.navFollowZoom != null
      ? props.navFollowZoom
      : Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
    const needsZoomChange = props.navFollowZoom != null && Math.abs(map.getZoom() - targetZoom) > 0.3;
    if (!liveFollowDetachedRef.current && (movedEnough || timeEnough || needsZoomChange || map.getZoom() < NAVIGATION_FOLLOW_MIN_ZOOM)) {
      map.flyTo(p, targetZoom, {
        animate: true,
        duration: 0.45,
      });
      lastLiveFollowRef.current = { lat: p[0], lon: p[1], at: now };
    }
  }, [props.liveLocation, props.navigationRoute, props.mapBearing, props.navFollowZoom, props.visible.navLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !props.liveLocation || props.liveCenterRequestId === 0) return;
    const p: [number, number] = [props.liveLocation.lat, props.liveLocation.lon];
    liveFollowDetachedRef.current = false;
    props.onLiveFollowDetachedChange(false);
    const targetZoom = props.navFollowZoom != null
      ? props.navFollowZoom
      : Math.max(map.getZoom(), NAVIGATION_FOLLOW_MIN_ZOOM);
    map.flyTo(p, targetZoom, {
      animate: true,
      duration: 0.45,
    });
    lastLiveFollowRef.current = { lat: p[0], lon: p[1], at: Date.now() };
  }, [props.liveCenterRequestId]);

  // ---- recorded GPS track ----
  useMapRecording(layersRef, props.recordedTrack);

  // ---- user-created points of interest ----
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
