import { useEffect, useState, useRef } from 'react';
import './AnimatedClock.css';

interface AnimatedClockProps {
  day: number;
  hour: number;
  minute: number;
  animationDuration?: number;
}

function getTimeOfDayIcon(hour: number): string {
  if (hour >= 6 && hour < 12) return '🌅'; // Morning
  if (hour >= 12 && hour < 18) return '☀️'; // Afternoon
  if (hour >= 18 && hour < 21) return '🌆'; // Evening
  return '🌙'; // Night
}

function formatTime(hour: number, minute: number): string {
  const h = hour % 24;
  const minStr = String(minute).padStart(2, '0');
  if (h === 0) return `12:${minStr} AM`;
  if (h === 12) return `12:${minStr} PM`;
  if (h < 12) return `${h}:${minStr} AM`;
  return `${h - 12}:${minStr} PM`;
}

export function AnimatedClock({ day, hour, minute, animationDuration = 500 }: AnimatedClockProps) {
  const [displayDay, setDisplayDay] = useState(day);
  const [displayHour, setDisplayHour] = useState(hour);
  const [displayMinute, setDisplayMinute] = useState(minute);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousDay = useRef(day);
  const previousHour = useRef(hour);
  const previousMinute = useRef(minute);

  useEffect(() => {
    if (day === previousDay.current && hour === previousHour.current && minute === previousMinute.current) return;

    const startDay = previousDay.current;
    const startHour = previousHour.current;
    const startMinute = previousMinute.current;
    const endDay = day;
    const endHour = hour;
    const endMinute = minute;
    const startTime = Date.now();

    // Calculate total minutes difference
    const startTotal = startDay * 24 * 60 + startHour * 60 + startMinute;
    const endTotal = endDay * 24 * 60 + endHour * 60 + endMinute;
    const diff = endTotal - startTotal;

    setIsAnimating(true);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const currentTotal = Math.round(startTotal + diff * progress);
      const currentDay = Math.floor(currentTotal / (24 * 60));
      const remainingMinutes = currentTotal % (24 * 60);
      const currentHour = Math.floor(remainingMinutes / 60);
      const currentMinute = remainingMinutes % 60;

      setDisplayDay(currentDay);
      setDisplayHour(currentHour);
      setDisplayMinute(currentMinute);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
    previousDay.current = day;
    previousHour.current = hour;
    previousMinute.current = minute;
  }, [day, hour, minute, animationDuration]);

  const icon = getTimeOfDayIcon(displayHour);
  const timeString = formatTime(displayHour, displayMinute);

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
