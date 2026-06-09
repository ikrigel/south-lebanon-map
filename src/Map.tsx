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

  // ---- visual compass rotation (compass mode) + user rotation (manual) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compassDeg = props.compassMode ? -props.mapBearing : 0;
    // User rotation is additive on top of compass mode
    const totalDeg = compassDeg + props.userRotation;
    el.style.setProperty('--map-rotation', `${totalDeg}deg`);
    el.classList.toggle('compass-follow', props.compassMode);
    el.classList.toggle('map-rotated', props.userRotation !== 0 || props.compassMode);
    // Keep refs in sync
    userRotationRef.current = totalDeg;        // total (compass+user) — for predrag
    userOnlyRotationRef.current = props.userRotation; // user only — for touch rotate
  }, [props.compassMode, props.mapBearing, props.userRotation]);

  // ---- Two-finger rotate (touch) + Right-click drag (desktop) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // --- touch two-finger rotation ---
    // Strategy: let Leaflet handle pinch-zoom freely.
    // We detect TWIST (angle change without significant distance change) and
    // apply rotation on top. Both can happen simultaneously.
    let prevAngle = 0;
    let prevDist = 0;
    let tracking = false;
    // Accumulated rotation delta — updated incrementally each touchmove
    // so large cumulative rotation works even if each step is small.
    let accumulatedDelta = 0;
    // Whether we have "committed" to a rotate gesture (past the dead-zone).
    // Once committed, we keep tracking until touchend.
    let committed = false;

    const getTouchAngle = (t1: Touch, t2: Touch) =>
      Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);

    const getTouchDist = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Normalise angle difference to [-180, 180]
    const angleDiff = (a: number, b: number) => {
      let d = a - b;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { tracking = false; committed = false; accumulatedDelta = 0; return; }
      // Do NOT preventDefault — let Leaflet handle pinch-zoom normally
      prevAngle = getTouchAngle(e.touches[0], e.touches[1]);
      prevDist  = getTouchDist(e.touches[0], e.touches[1]);
      accumulatedDelta = 0;
      committed = false;
      tracking = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 2) return;
      const currentAngle = getTouchAngle(e.touches[0], e.touches[1]);
      const currentDist  = getTouchDist(e.touches[0], e.touches[1]);

      // Incremental step for this frame
      const stepAngle = angleDiff(currentAngle, prevAngle);
      const distChange = Math.abs(currentDist - prevDist) / Math.max(prevDist, 1);

      // Accept rotation step when angle dominates over zoom change.
      // distChange < 0.4 allows realistic two-finger twists that also
      // change spread slightly. stepAngle threshold 1° prevents drift noise.
      if (Math.abs(stepAngle) > 1 && distChange < 0.4) {
        accumulatedDelta += stepAngle;
      }

      // Commit to rotate gesture once accumulated delta exceeds 3° dead-zone
      if (!committed && Math.abs(accumulatedDelta) > 3) {
        committed = true;
      }

      if (committed && !props.rotationLocked) {
        // Use ref (not props.userRotation) so this handler doesn't need
        // props.userRotation in the deps array — which would cause the
        // effect (and its local state) to reset on every rotation update.
        props.onUserRotationChange(userOnlyRotationRef.current + stepAngle);
      }

      // Update baseline for next frame (incremental tracking)
      prevAngle = currentAngle;
      prevDist  = currentDist;
      // Let Leaflet handle pinch-zoom — no preventDefault
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        tracking = false;
        committed = false;
        accumulatedDelta = 0;
      }
    };

    // --- right-click drag rotation (desktop) ---
    let dragStartX = 0;
    let dragStartRotation = 0;
    let dragging = false;

    const onContextMenuDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      // Stop Leaflet from getting this right-click
      e.preventDefault();
      e.stopPropagation();
      dragStartX = e.clientX;
      dragStartRotation = userOnlyRotationRef.current;
      dragging = true;
    };

    const onContextMenuMove = (e: MouseEvent) => {
      if (!dragging || props.rotationLocked) return;
      const delta = (e.clientX - dragStartX) * 0.5; // 0.5 deg per pixel
      props.onUserRotationChange(dragStartRotation + delta);
    };

    const onContextMenuUp = () => { dragging = false; };

    const suppressContextMenu = (e: Event) => {
      if (dragging || Math.abs((userOnlyRotationRef.current - dragStartRotation)) > 2) e.preventDefault();
    };

    // Touch: passive listeners — we never call preventDefault, so Leaflet
    // pinch-zoom works normally. We just read coordinates on top of it.
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    // Right-click drag: capture phase so we beat Leaflet's context-menu handler
    el.addEventListener('mousedown', onContextMenuDown, { capture: true });
    window.addEventListener('mousemove', onContextMenuMove);
    window.addEventListener('mouseup', onContextMenuUp);
    el.addEventListener('contextmenu', suppressContextMenu, { capture: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onContextMenuDown, { capture: true } as EventListenerOptions);
      window.removeEventListener('mousemove', onContextMenuMove);
      window.removeEventListener('mouseup', onContextMenuUp);
      el.removeEventListener('contextmenu', suppressContextMenu, { capture: true } as EventListenerOptions);
    };
  // props.userRotation intentionally omitted — we read it via userOnlyRotationRef
  // so the effect (and its local gesture state) is NOT reset on every rotation update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onUserRotationChange]);

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

  // ---- Hebrew map labels with controlled density ----
  useEffect(() => {
    const group = layersRef.current.labels;
    if (!group) return;
    group.clearLayers();
    if (!props.visible.cityLabels) return;

    const compactTownIds = new Set([
      'tyre',
      'sidon',
      'nabat',
      'naqoura',
      'alma',
      'dhayra',
      'aitaa',
      'rmeish',
      'yater',
      'bintj',
      'tibnin',
      'braachit',
      'haris',
      'hadatha',
      'beit-yahoun',
      'rachaf',
      'kafra',
      'khirbet-selm',
      'deir-ntar',
      'majdal-selm',
      'tulin',
      'souaneh',
      'froun',
      'ghandouriyeh',
      'burj-el-shemali',
      'rashidiyeh',
      'sarafand',
      'zahrani-area',
      'ghaziyeh',
      'marjay',
      'khiam',
      'kfark',
      'mais',
      'kawkaba',
      'mari',
      'hasbaya',
      'shebaa',
      'metula',
      'kiryat',
      'shlomi',
    ]);
    if (props.visible.settlementLabels) {
      // When sect-coloring is active, show ALL LB settlements so every settlement
      // gets a colored border + dot. IL settlements stay compact-only (no sect data).
      const townsToLabel = props.largeLabels || props.allLabels
        ? towns
        : towns.filter(t => compactTownIds.has(t.id) || (props.visible.sectColors && t.side === 'LB'));
      townsToLabel.forEach(t => {
        const icon = L.divIcon({
          className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} settlement-label ${t.side === 'IL' ? 'il-label' : 'lb-label'}${(props.visible.sectColors && t.sect) ? ` sect-${t.sect}` : ''}`,
          html: labelHtml(t.name_he, props.largeLabels ? t.name_en : undefined, props.visible.sectColors ? t.sect : undefined),
          iconSize: undefined,
          iconAnchor: [0, 10],
        });
        L.marker([t.lat, t.lon], { icon, interactive: false }).addTo(group);
      });
    }

    if (props.visible.unifil) {
      const unifilToLabel = props.largeLabels
        ? unifilPoints.filter(u => u.kind !== 'reference')
        : unifilPoints.filter(u => u.kind === 'hq');
      unifilToLabel.forEach(u => {
        const icon = L.divIcon({
          className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} unifil-label`,
          html: labelHtml(u.name_he, props.largeLabels ? u.name_en : undefined),
          iconSize: undefined,
          iconAnchor: [0, 12],
        });
        L.marker([u.lat, u.lon], { icon, interactive: false }).addTo(group);
      });
    }

    const isRidgeLike = (type: string) => type === 'ridge' || type === 'mountain' || type === 'valley';
    const isWaterLike = (type: string) => type === 'river' || type === 'wadi' || type === 'water';
    const compactRidgeIds = new Set(['jabal-amel', 'bint-jbeil-ridge', 'nabatieh-plateau', 'silvester-ridge']);
    const compactWaterIds = new Set(['litani', 'awali', 'zahrani', 'hasbani']);
    const terrainToLabel = terrainFeatures.filter(f => {
      if (isRidgeLike(f.type) && !props.visible.ridgeLabels) return false;
      if (isWaterLike(f.type) && !props.visible.waterLabels) return false;
      if (props.largeLabels || props.allLabels) return true;
      return compactRidgeIds.has(f.id) || compactWaterIds.has(f.id);
    });
    terrainToLabel.forEach(f => {
      const icon = L.divIcon({
        className: `map-label-icon ${props.largeLabels ? 'label-expanded' : 'label-compact'} terrain-label terrain-${f.type}`,
        html: labelHtml(f.name_he, props.largeLabels ? f.name_en : undefined),
        iconSize: undefined,
        iconAnchor: [0, 12],
      });
      L.marker([f.lat, f.lon], { icon, interactive: false }).addTo(group);
    });
  }, [
    props.largeLabels,
    props.allLabels,
    props.visible.cityLabels,
    props.visible.settlementLabels,
    props.visible.ridgeLabels,
    props.visible.waterLabels,
    props.visible.unifil,
    props.visible.sectColors,  // צביעת עדה משפיעה על תגיות בעברית
  ]);

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

  // ---- multi-route overlays — Effect A: PATH DRAW -------------------------
  // Redraws all route polylines from scratch ONLY when actual path data changes.
  // isActive styling is handled by Effect B — no clearLayers on card selection.
  useEffect(() => {
    const group = layersRef.current.route;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    routePolylineRefs.current.clear();

    if (!props.navigationRoute) return;

    const { start, end } = props.navigationRoute;
    const a: [number, number] = [start.lat, start.lon];
    const b: [number, number] = [end.lat, end.lon];
    const overlays = props.routeOverlays ?? [];
    const mode = props.routeDisplayMode ?? 'road';

    // In 'road' mode show drive+foot. But if both have no path yet
    // (still loading or fetch failed) also include aerial so the user
    // sees the geodesic arc immediately and the map pans to the right area.
    const drivePathLen = overlays.find(o => o.id === 'drive')?.path.length ?? 0;
    const footPathLen  = overlays.find(o => o.id === 'foot')?.path.length  ?? 0;
    const aerialFallback = mode === 'road' && drivePathLen < 2 && footPathLen < 2;
    const visibleIds: Set<string> = new Set(
      mode === 'aerial'                    ? ['aerial'] :
      mode === 'road' && !aerialFallback   ? ['drive', 'foot'] :
                                             ['drive', 'foot', 'aerial']
    );

    let allRenderedPoints: [number, number][] = [];

    // Draw inactive overlays first (z-order), then active on top
    const sortedOverlays = [
      ...overlays.filter(o => visibleIds.has(o.id) && !o.isActive),
      ...overlays.filter(o => visibleIds.has(o.id) &&  o.isActive),
    ];

    sortedOverlays.forEach(o => {
      if (o.path.length < 2) return;
      // When aerial is shown as a fallback (drive+foot still loading),
      // render it as active so it's clearly visible, not faded.
      const isActive = aerialFallback && o.id === 'aerial' ? true : o.isActive;
      // CSS class encodes both lineStyle and active state.
      // stroke-dasharray is set ONLY in CSS (not as Leaflet dashArray option)
      // because CSS animation of stroke-dashoffset requires CSS stroke-dasharray,
      // not the SVG attribute that Leaflet normally writes via setAttribute.
      const lineClass = isActive
        ? `route-line route-line-${o.lineStyle}`
        : `route-line-inactive route-line-inactive-${o.lineStyle}`;
      const pl = L.polyline(o.path, {
        color: o.color,
        weight: isActive ? 6 : 2.5,
        opacity: isActive ? 0.95 : 0.40,
        // NO dashArray here — handled entirely by CSS class
        className: lineClass,
      }).addTo(group);
      // Leaflet writes stroke-dasharray + stroke-width as SVG *attributes*.
      // CSS animation of stroke-dashoffset only works when stroke-dasharray is a
      // CSS *property*. Remove the SVG attrs so the CSS class is the sole source.
      const svgEl = (pl as any)._path as SVGPathElement | undefined;
      if (svgEl) {
        svgEl.removeAttribute('stroke-dasharray');
        svgEl.removeAttribute('stroke-width');
      }
      routePolylineRefs.current.set(o.id, pl);
      allRenderedPoints = [...allRenderedPoints, ...o.path];

      if (isActive && o.path.length >= 2) {
        const midIdx = Math.floor(o.path.length / 2);
        const mid = o.path[midIdx] ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];
        // Compute progress (0-100%) based on how far the live position is along the path.
        const lp = props.liveLocation;
        let progressPct = 0;
        if (lp && o.path.length >= 2) {
          // Find closest path point to live location.
          let minDist = Infinity;
          let closestIdx = 0;
          o.path.forEach((pt, i) => {
            const d = Math.abs(pt[0] - lp.lat) + Math.abs(pt[1] - lp.lon);
            if (d < minDist) { minDist = d; closestIdx = i; }
          });
          progressPct = Math.round((closestIdx / (o.path.length - 1)) * 100);
        }
        const distStr = o.km < 10 ? o.km.toFixed(2) : o.km.toFixed(1);
        const etaStr  = o.durationMin ? ` · ~${Math.round(o.durationMin)} דק\'` : '';
        const progStr = lp && progressPct > 0 ? ` · ${progressPct}% הושלם` : '';
        if (props.visible.navLabels) {
          L.marker(mid, {
            icon: L.divIcon({
              className: 'route-distance-label',
              html: `${distStr} ק״מ${etaStr}${progStr}`,
              iconSize: undefined,
            }),
            interactive: false,
          }).addTo(group);
        }
      }
    });

    // Start and destination pin labels — only when navLabels is on.
    // • Start pin: shown only when not navigating live (GPS covers it).
    // • Destination pin: always useful — shows name + total route distance.
    const isNavigatingLive = !!props.liveLocation;
    [
      {
        point: a,
        color: '#6ed1c2',
        show: !isNavigatingLive,  // hide start when GPS arrow is on the map
        tooltip: escapeHtml(start.label),
        permanent: true,
        offset: [0, -10] as [number, number],
      },
      {
        point: b,
        color: '#d49a3a',
        show: true,
        tooltip: `🎯 ${escapeHtml(end.label)}`,
        permanent: true,
        offset: [0, -10] as [number, number],
      },
    ].forEach(({ point, color, show, tooltip, permanent, offset }) => {
      const cm = L.circleMarker(point, {
        radius: 7,
        color,
        weight: 2,
        fillColor: '#0b0d10',
        fillOpacity: 1,
      });
      if (show && props.visible.navLabels) {
        cm.bindTooltip(tooltip, {
          permanent,
          direction: 'top',
          offset,
          className: 'route-tooltip',
        });
      }
      cm.addTo(group);
    });

    if (!props.liveLocation && allRenderedPoints.length >= 2) {
      // Always include the user-chosen start+end in the bounds so the map
      // pans to the correct area (OSRM may snap to a road far from the click).
      const boundsPoints: [number, number][] = [
        ...allRenderedPoints,
        [start.lat, start.lon],
        [end.lat,   end.lon],
      ];
      map.fitBounds(boundsPoints, { padding: [60, 60], maxZoom: 16, animate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Stable fingerprint: only re-draw when path data actually changes
    (props.routeOverlays ?? []).map(o => `${o.id}:${o.path.length}`).join(','),
    props.navigationRoute?.start.lat,
    props.navigationRoute?.start.lon,
    props.navigationRoute?.end.lat,
    props.navigationRoute?.end.lon,
    props.routeDisplayMode,
    Boolean(props.liveLocation),
    props.visible.navLabels,
  ]);

  // ---- multi-route overlays — Effect B: ACTIVE STYLE UPDATE ---------------
  // Switches weight/opacity on existing polylines when user selects a route card.
  // No clearLayers — animation continues uninterrupted.
  useEffect(() => {
    const overlays = props.routeOverlays ?? [];
    const mode = props.routeDisplayMode ?? 'road';
    const visibleIds: Set<string> = new Set(
      mode === 'road'   ? ['drive', 'foot'] :
      mode === 'aerial' ? ['aerial'] :
      ['drive', 'foot', 'aerial']
    );
    overlays.forEach(o => {
      const pl = routePolylineRefs.current.get(o.id);
      if (!pl) return;
      const visible = visibleIds.has(o.id);
      const isActive = o.isActive && visible;
      // Update style without dashArray — that stays in CSS
      pl.setStyle({
        weight:  isActive ? 6 : 2.5,
        opacity: visible ? (isActive ? 0.95 : 0.40) : 0,
      });
      // Update CSS class directly on SVG path (Leaflet ignores className in setStyle)
      const lineClass = isActive
        ? `route-line route-line-${o.lineStyle}`
        : `route-line-inactive route-line-inactive-${o.lineStyle}`;
      const el = (pl as any)._path as SVGPathElement | undefined;
      if (el) {
        el.className.baseVal = lineClass;
        // setStyle re-writes stroke-width as an SVG attr — remove it so CSS wins
        el.removeAttribute('stroke-dasharray');
        el.removeAttribute('stroke-width');
      }
      if (isActive) pl.bringToFront();
    });
  }, [props.routeOverlays]);

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
