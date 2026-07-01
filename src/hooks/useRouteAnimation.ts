import { useEffect, useRef } from 'react';

interface RouteAnimationProps {
  route: { path: [number, number][]; km: number; durationMin?: number } | null;
  isAnimating: boolean;
  speed: number; // multiplier (1 = real-time, 2 = 2x speed, 0.5 = half speed)
  onPositionUpdate: (lat: number, lon: number) => void;
  onAnimationComplete: () => void;
}

export const useRouteAnimation = ({
  route,
  isAnimating,
  speed = 1,
  onPositionUpdate,
  onAnimationComplete,
}: RouteAnimationProps) => {
  const animationRef = useRef<{
    startTime: number;
    totalDurationMs: number;
    currentIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!route?.path || route.path.length < 2 || !isAnimating) return;

    // Start or resume animation
    if (!animationRef.current) {
      const estimatedDurationMin = route.durationMin || (route.km / 50) * 60; // Assume 50 km/h average
      const totalDurationMs = estimatedDurationMin * 60 * 1000 / speed; // Adjust for speed multiplier

      animationRef.current = {
        startTime: Date.now(),
        totalDurationMs,
        currentIndex: 0,
      };
    }

    const animationState = animationRef.current;
    const elapsedMs = Date.now() - animationState.startTime;
    const progress = Math.min(elapsedMs / animationState.totalDurationMs, 1);

    // Find current position along path based on progress
    const totalDistance = route.path.length - 1;
    const targetIndex = progress * totalDistance;
    const currentIndex = Math.floor(targetIndex);
    const nextIndex = Math.min(currentIndex + 1, route.path.length - 1);
    const segmentProgress = targetIndex - currentIndex;

    // Interpolate between current and next point
    const [currentLat, currentLon] = route.path[currentIndex];
    const [nextLat, nextLon] = route.path[nextIndex];

    const interpolatedLat = currentLat + (nextLat - currentLat) * segmentProgress;
    const interpolatedLon = currentLon + (nextLon - currentLon) * segmentProgress;

    onPositionUpdate(interpolatedLat, interpolatedLon);

    // Check if animation is complete
    if (progress >= 1) {
      onAnimationComplete();
      animationRef.current = null;
      return;
    }

    // Schedule next update (60 FPS)
    const timeoutId = setTimeout(() => {}, 1000 / 60);

    return () => clearTimeout(timeoutId);
  }, [route, isAnimating, speed, onPositionUpdate, onAnimationComplete]);

  const stopAnimation = () => {
    animationRef.current = null;
  };

  const resumeAnimation = () => {
    if (animationRef.current) {
      animationRef.current.startTime = Date.now() - (Date.now() - animationRef.current.startTime);
    }
  };

  return { stopAnimation, resumeAnimation };
};
