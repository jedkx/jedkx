// ============================================
// MOTION TRACKER COMPONENT - Radar Style Footer
// ============================================

import React, { useRef, useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

interface MotionTrackerProps {
  forceAlert?: boolean;
}

export const MotionTracker: React.FC<MotionTrackerProps> = ({ forceAlert = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [blipPosition, setBlipPosition] = useState({ x: 0, y: 0, angle: 0 });
  const [radarRotation, setRadarRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Radar rotation animation (4 seconds per rotation)
  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return;

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const rotation = (elapsed / 4000) * 360; // 4 seconds = 360 degrees
      setRadarRotation(rotation % 360);
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [prefersReducedMotion, isVisible]);

  // Mouse tracking - map footer area to radar
  useEffect(() => {
    if (prefersReducedMotion || !isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      // Find footer element to map its area to radar
      const footer = containerRef.current.closest('footer');
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();

      // Calculate mouse position relative to footer
      const footerCenterX = footerRect.left + footerRect.width / 2;
      const footerCenterY = footerRect.top + footerRect.height / 2;
      const mouseDeltaX = e.clientX - footerCenterX;
      const mouseDeltaY = e.clientY - footerCenterY;

      // Map footer dimensions to radar dimensions
      const footerRadiusX = footerRect.width / 2;
      const footerRadiusY = footerRect.height / 2;
      const radarRadius = 135; // Radar visual radius

      // Scale mouse position from footer space to radar space
      const scaleX = radarRadius / footerRadiusX;
      const scaleY = radarRadius / footerRadiusY;

      let blipX = mouseDeltaX * scaleX;
      let blipY = mouseDeltaY * scaleY;

      // Clamp to radar circle
      const distance = Math.sqrt(blipX * blipX + blipY * blipY);
      if (distance > radarRadius) {
        const scale = radarRadius / distance;
        blipX *= scale;
        blipY *= scale;
      }

      // Calculate angle
      const angle = Math.atan2(blipY, blipX) * (180 / Math.PI);

      setBlipPosition({
        x: blipX,
        y: blipY,
        angle: angle,
      });
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [prefersReducedMotion, isVisible]);

  // Check if radar line is near the blip (with proper angle normalization)
  const normalizeAngle = (angle: number) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  };

  const radarAngle = normalizeAngle(radarRotation);
  const blipAngle = normalizeAngle(blipPosition.angle);

  // Calculate shortest angle difference
  let angleDiff = Math.abs(radarAngle - blipAngle);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  const isRadarNear = angleDiff < 20; // 20 degree tolerance

  // Calculate fade effect based on distance from radar
  const fadeDistance = Math.min(angleDiff / 20, 1); // 0 = on radar, 1 = far from radar
  const blipOpacity = forceAlert ? 1 : isPressed ? 1 : isRadarNear ? 1 - fadeDistance * 0.7 : 0; // Gradual fade
  const blipColor = forceAlert || isPressed ? '#ff3333' : '#ffffff';

  return (
    <div className="relative">
      <div ref={containerRef} className="tracker-ui">
        {/* Grid */}
        <div className="tracker-grid" />

        {/* Radar Waves - Expanding circles from center */}
        <div className="radar-wave" />
        <div className="radar-wave" />
        <div className="radar-wave" />
        <div className="radar-wave" />
        <div className="radar-wave" />

        {/* Scanning line */}
        <div
          className="tracker-scan"
          style={{
            transform: `rotate(${radarRotation}deg)`,
            transition: 'none',
          }}
        />

        {/* Blip */}
        <div
          className={`sensor-blip ${isPressed || forceAlert ? 'blip-pressed' : ''}`}
          style={{
            transform: `translate(${blipPosition.x}px, ${blipPosition.y}px)`,
            background: blipColor,
            opacity: blipOpacity,
            boxShadow:
              isPressed || forceAlert
                ? `0 0 20px 5px rgba(255, 51, 51, 0.8)`
                : `0 0 ${10 + (1 - fadeDistance) * 10}px ${2 + (1 - fadeDistance) * 3}px rgba(255, 255, 255, ${0.5 + (1 - fadeDistance) * 0.3})`,
            transition:
              'opacity 0.3s ease, transform 0.15s ease-out, box-shadow 0.3s ease, background 0.3s ease',
          }}
        />
      </div>

      {/* Pulsing ring */}
      <div className="sensor-ring" />
    </div>
  );
};
