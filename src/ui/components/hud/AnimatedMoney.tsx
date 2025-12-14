import { useEffect, useState, useRef } from 'react';
import './AnimatedMoney.css';

interface AnimatedMoneyProps {
  value: number;
  animationDuration?: number;
}

export function AnimatedMoney({ value, animationDuration = 1000 }: AnimatedMoneyProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [changeClass, setChangeClass] = useState<'up' | 'down' | ''>('');
  const previousValue = useRef(value);

  useEffect(() => {
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = Date.now();

    // Set the change class for color animation
    setChangeClass(diff > 0 ? 'up' : 'down');

    // Animate the number ticking
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const currentValue = Math.round(startValue + diff * easeProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Clear the change class after animation
        setTimeout(() => setChangeClass(''), 200);
      }
    };

    requestAnimationFrame(animate);
    previousValue.current = value;
  }, [value, animationDuration]);

  return (
    <div className={`animated-money ${changeClass}`}>
      <span className="currency">$</span>
      <span className="amount">{displayValue.toLocaleString()}</span>
    </div>
  );
}
