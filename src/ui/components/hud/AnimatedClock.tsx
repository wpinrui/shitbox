import { useEffect, useState, useRef } from 'react';
import './AnimatedClock.css';

interface AnimatedClockProps {
  day: number;
  hour: number;
  animationDuration?: number;
}

function getTimeOfDayIcon(hour: number): string {
  if (hour >= 6 && hour < 12) return '🌅'; // Morning
  if (hour >= 12 && hour < 18) return '☀️'; // Afternoon
  if (hour >= 18 && hour < 21) return '🌆'; // Evening
  return '🌙'; // Night
}

function formatHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export function AnimatedClock({ day, hour, animationDuration = 500 }: AnimatedClockProps) {
  const [displayDay, setDisplayDay] = useState(day);
  const [displayHour, setDisplayHour] = useState(hour);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousDay = useRef(day);
  const previousHour = useRef(hour);

  useEffect(() => {
    if (day === previousDay.current && hour === previousHour.current) return;

    const startDay = previousDay.current;
    const startHour = previousHour.current;
    const endDay = day;
    const endHour = hour;
    const startTime = Date.now();

    // Calculate total hours difference
    const startTotal = startDay * 24 + startHour;
    const endTotal = endDay * 24 + endHour;
    const diff = endTotal - startTotal;

    setIsAnimating(true);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const currentTotal = Math.round(startTotal + diff * progress);
      const currentDay = Math.floor(currentTotal / 24);
      const currentHour = currentTotal % 24;

      setDisplayDay(currentDay);
      setDisplayHour(currentHour);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
    previousDay.current = day;
    previousHour.current = hour;
  }, [day, hour, animationDuration]);

  const icon = getTimeOfDayIcon(displayHour);
  const timeString = formatHour(displayHour);

  return (
    <div className={`animated-clock ${isAnimating ? 'animating' : ''}`}>
      <div className="clock-icon">{icon}</div>
      <div className="clock-info">
        <div className="clock-day">Day {displayDay}</div>
        <div className="clock-time">{timeString}</div>
      </div>
    </div>
  );
}
