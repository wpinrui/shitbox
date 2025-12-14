import { GameTime } from '@engine/types';
import { getTimeOfDay } from '@engine/index';

interface GameHeaderProps {
  time: GameTime;
}

export function GameHeader({ time }: GameHeaderProps) {
  const timeOfDay = getTimeOfDay(time.currentHour);

  return (
    <header className="game-header">
      <h1>Day {time.currentDay}</h1>
      <span className="time">
        {String(time.currentHour).padStart(2, '0')}:
        {String(time.currentMinute).padStart(2, '0')}
        <span className="time-period"> ({timeOfDay})</span>
      </span>
    </header>
  );
}
