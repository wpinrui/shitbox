import { useEffect, useState } from 'react';
import './FadeTransition.css';

interface FadeTransitionProps {
  isActive: boolean;
  duration?: number;
  onFadeComplete?: () => void;
  children?: React.ReactNode;
}

export function FadeTransition({
  isActive,
  duration = 500,
  onFadeComplete,
  children,
}: FadeTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'black' | 'fadeIn'>('idle');

  useEffect(() => {
    if (isActive && phase === 'idle') {
      // Start fade out
      setPhase('fadeOut');

      // After fade out completes, go to black
      const fadeOutTimer = setTimeout(() => {
        setPhase('black');

        // Notify that fade is complete (activity can execute)
        if (onFadeComplete) {
          onFadeComplete();
        }

        // After a moment, fade back in
        const holdTimer = setTimeout(() => {
          setPhase('fadeIn');

          // Reset to idle after fade in
          const fadeInTimer = setTimeout(() => {
            setPhase('idle');
          }, duration);

          return () => clearTimeout(fadeInTimer);
        }, 300);

        return () => clearTimeout(holdTimer);
      }, duration);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [isActive, phase, duration, onFadeComplete]);

  // Reset when isActive becomes false
  useEffect(() => {
    if (!isActive && phase !== 'idle') {
      setPhase('fadeIn');
      const timer = setTimeout(() => {
        setPhase('idle');
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, phase, duration]);

  if (phase === 'idle') {
    return null;
  }

  return (
    <div
      className={`fade-transition ${phase}`}
      style={{ '--fade-duration': `${duration}ms` } as React.CSSProperties}
    >
      {phase === 'black' && children}
    </div>
  );
}
