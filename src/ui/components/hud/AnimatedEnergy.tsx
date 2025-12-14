import { useEffect, useState, useRef } from 'react';
import './AnimatedEnergy.css';

interface AnimatedEnergyProps {
  value: number;
  max: number;
  animationDuration?: number;
}

function getEnergyEmoji(energy: number): string {
  if (energy >= 80) return '😄';
  if (energy >= 50) return '😐';
  if (energy >= 20) return '😩';
  if (energy >= 10) return '😵';
  return '💀';
}

function getEnergyColor(energy: number): string {
  if (energy >= 80) return '#88ff88';
  if (energy >= 50) return '#ffff88';
  if (energy >= 20) return '#ffaa44';
  return '#ff4444';
}

export function AnimatedEnergy({ value, max, animationDuration = 800 }: AnimatedEnergyProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = Date.now();

    setIsAnimating(true);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Linear for energy bar (feels more natural)
      const currentValue = Math.round(startValue + diff * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
    previousValue.current = value;
  }, [value, animationDuration]);

  const percentage = Math.max(0, Math.min(100, (displayValue / max) * 100));
  const emoji = getEnergyEmoji(displayValue);
  const color = getEnergyColor(displayValue);

  return (
    <div className={`animated-energy ${isAnimating ? 'animating' : ''}`}>
      <div className="energy-emoji">{emoji}</div>
      <div className="energy-bar-container">
        <div
          className="energy-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="energy-value" style={{ color }}>
        {displayValue}
      </div>
    </div>
  );
}
