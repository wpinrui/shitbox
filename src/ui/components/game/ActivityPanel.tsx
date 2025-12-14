import { useState } from 'react';

interface ActivityPanelProps {
  foodCost: number;
  canAffordFood: boolean;
  onActivity: (activityId: string, params?: { hours?: number }) => void;
}

export function ActivityPanel({ foodCost, canAffordFood, onActivity }: ActivityPanelProps) {
  const [sleepHours, setSleepHours] = useState(8);

  return (
    <div className="activity-section">
      <h3>Actions</h3>
      <div className="activity-buttons">
        <button
          onClick={() => onActivity('eat')}
          disabled={!canAffordFood}
          className="activity-btn eat"
        >
          Eat (${foodCost})
        </button>

        <div className="sleep-control">
          <label>
            Sleep: {sleepHours}h
            <input
              type="range"
              min={1}
              max={12}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
            />
          </label>
          <button
            onClick={() => onActivity('sleep', { hours: sleepHours })}
            className="activity-btn sleep"
          >
            Sleep ({sleepHours}h)
          </button>
        </div>

        <button onClick={() => onActivity('wait', { hours: 1 })} className="activity-btn wait">
          Wait (1h)
        </button>
      </div>
    </div>
  );
}
