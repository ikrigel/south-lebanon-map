import { useEffect } from 'react';

export const useMapRotation = (
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  mapRef: React.MutableRefObject<any>,
  compassMode: boolean,
  bearingToDestination: number,
  userRotation: number,
  onUserRotationChange: (rotation: number) => void,
  userRotationRef: React.MutableRefObject<number>,
  userOnlyRotationRef: React.MutableRefObject<number>,
  rotationLocked: boolean,
) => {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compassDeg = compassMode ? -bearingToDestination : 0;
    const totalDeg = compassDeg + userRotation;
    el.style.setProperty('--map-rotation', `${totalDeg}deg`);
    el.classList.toggle('compass-follow', compassMode);
    el.classList.toggle('map-rotated', userRotation !== 0 || compassMode);
    userRotationRef.current = totalDeg;
    userOnlyRotationRef.current = userRotation;
  }, [compassMode, bearingToDestination, userRotation]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let prevAngle = 0;
    let prevDist = 0;
    let tracking = false;
    let accumulatedDelta = 0;
    let committed = false;

    const getTouchAngle = (t1: Touch, t2: Touch) =>
      Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);

    const getTouchDist = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const angleDiff = (a: number, b: number) => {
      let d = a - b;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) { tracking = false; committed = false; accumulatedDelta = 0; return; }
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
      const stepAngle = angleDiff(currentAngle, prevAngle);
      const distChange = Math.abs(currentDist - prevDist) / Math.max(prevDist, 1);

      if (Math.abs(stepAngle) > 1 && distChange < 0.4) {
        accumulatedDelta += stepAngle;
      }

      if (!committed && Math.abs(accumulatedDelta) > 3) {
        committed = true;
      }

      if (committed && !rotationLocked) {
        onUserRotationChange(userOnlyRotationRef.current + stepAngle);
      }

      prevAngle = currentAngle;
      prevDist  = currentDist;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        tracking = false;
        committed = false;
        accumulatedDelta = 0;
      }
    };

    let dragStartX = 0;
    let dragStartRotation = 0;
    let dragging = false;

    const onContextMenuDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      e.preventDefault();
      e.stopPropagation();
      dragStartX = e.clientX;
      dragStartRotation = userOnlyRotationRef.current;
      dragging = true;
    };

    const onContextMenuMove = (e: MouseEvent) => {
      if (!dragging || rotationLocked) return;
      const delta = (e.clientX - dragStartX) * 0.5;
      onUserRotationChange(dragStartRotation + delta);
    };

    const onContextMenuUp = () => { dragging = false; };

    const suppressContextMenu = (e: Event) => {
      if (dragging || Math.abs((userOnlyRotationRef.current - dragStartRotation)) > 2) e.preventDefault();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUserRotationChange]);
};
