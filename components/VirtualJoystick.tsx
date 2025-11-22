import React, { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Stick position relative to center
  const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Touch start position
  
  // Config
  const maxRadius = 50;

  const handleStart = (clientX: number, clientY: number) => {
    setActive(true);
    setOrigin({ x: clientX, y: clientY });
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!active) return;

    const dx = clientX - origin.x;
    const dy = clientY - origin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let stickX = dx;
    let stickY = dy;

    if (distance > maxRadius) {
      stickX = Math.cos(angle) * maxRadius;
      stickY = Math.sin(angle) * maxRadius;
    }

    setPosition({ x: stickX, y: stickY });
    
    // Normalize output -1 to 1
    onMove(stickX / maxRadius, stickY / maxRadius);
  };

  const handleEnd = () => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // Touch events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, origin]);

  // Mouse events for testing on desktop without keys
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if(active) handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    if(active) handleEnd();
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-10 w-full h-full select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {active && (
        <div 
          className="absolute w-32 h-32 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-sm pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-75"
          style={{ left: origin.x, top: origin.y }}
        >
          <div 
            className="absolute w-12 h-12 rounded-full bg-white/50 shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` 
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VirtualJoystick;