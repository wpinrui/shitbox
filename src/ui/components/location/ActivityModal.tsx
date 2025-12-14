import { useState } from 'react';
import type { ActivityDefinition, GameState } from '@engine/index';
import './ActivityModal.css';

interface ActivityModalProps {
  activity: ActivityDefinition;
  gameState: GameState;
  onExecute: (params: { hours?: number }) => void;
  onCancel: () => void;
}

export function ActivityModal({
  activity,
  gameState,
  onExecute,
  onCancel,
}: ActivityModalProps) {
  const isVariableTime = activity.time.type === 'variable';
  const minHours = activity.time.minHours ?? 1;
  const maxHours = activity.time.maxHours ?? 8;

  const [hours, setHours] = useState(minHours);

  // Calculate estimated costs based on selected hours
  const getEstimatedEnergy = () => {
    if (activity.energy.type === 'recover') {
      const base = activity.energy.base ?? 0;
      const perHour = isVariableTime ? hours : (activity.time.hours ?? 1);
      return `+${base * perHour}`;
    }
    if (activity.energy.type === 'none') {
      return '0';
    }
    const base = activity.energy.base ?? 0;
    if (activity.energy.type === 'perHour') {
      const perHour = isVariableTime ? hours : (activity.time.hours ?? 1);
      const min = Math.floor(base * perHour * 0.8);
      const max = Math.ceil(base * perHour * 1.2);
      return `~${min}-${max}`;
    }
    // Fixed energy cost with variance
    const min = Math.floor(base * 0.8);
    const max = Math.ceil(base * 1.2);
    return `~${min}-${max}`;
  };

  const getEstimatedMoney = () => {
    if (activity.money.type === 'none') {
      return null;
    }
    const base = activity.money.base ?? 0;
    const variance = activity.money.variance ?? 0;

    if (activity.money.type === 'earn') {
      if (activity.money.mode === 'perHour') {
        const perHour = isVariableTime ? hours : (activity.time.hours ?? 1);
        const min = Math.floor((base - variance) * perHour);
        const max = Math.ceil((base + variance) * perHour);
        return `+$${min}-${max}`;
      }
      return `+$${base - variance}-${base + variance}`;
    }

    if (activity.money.type === 'spend') {
      return `-$${base}`;
    }

    return null;
  };

  const getStatGains = () => {
    return activity.statGain.map((gain) => ({
      stat: gain.stat,
      amount: gain.per === 'hour'
        ? `+${gain.amount}/h`
        : `+${gain.amount}`,
    }));
  };

  const handleExecute = () => {
    onExecute(isVariableTime ? { hours } : {});
  };

  const currentEnergy = gameState.player.energy;
  const estimatedEnergyStr = getEstimatedEnergy();
  const estimatedMoney = getEstimatedMoney();
  const statGains = getStatGains();

  return (
    <div className="activity-modal-overlay" onClick={onCancel}>
      <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{activity.name}</h2>
        <p className="modal-description">{activity.description}</p>

        {isVariableTime && (
          <div className="hours-selector">
            <label>Duration: {hours} hour{hours > 1 ? 's' : ''}</label>
            <input
              type="range"
              min={minHours}
              max={maxHours}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
            <div className="hours-range">
              <span>{minHours}h</span>
              <span>{maxHours}h</span>
            </div>
          </div>
        )}

        <div className="estimated-costs">
          <div className="cost-row">
            <span className="cost-label">Time</span>
            <span className="cost-value">
              {isVariableTime ? hours : activity.time.hours} hour{(isVariableTime ? hours : activity.time.hours ?? 1) > 1 ? 's' : ''}
            </span>
          </div>

          <div className="cost-row">
            <span className="cost-label">Energy</span>
            <span className="cost-value energy">
              {estimatedEnergyStr} ⚡
              <span className="current">(have {currentEnergy})</span>
            </span>
          </div>

          {estimatedMoney && (
            <div className="cost-row">
              <span className="cost-label">Money</span>
              <span className={`cost-value ${activity.money.type === 'earn' ? 'earn' : 'spend'}`}>
                {estimatedMoney}
              </span>
            </div>
          )}

          {statGains.length > 0 && (
            <div className="cost-row">
              <span className="cost-label">Stats</span>
              <span className="cost-value stats">
                {statGains.map((g) => `${g.amount} ${g.stat}`).join(', ')}
              </span>
            </div>
          )}
        </div>

        <p className="estimated-note">(estimated - actual results may vary)</p>

        <div className="modal-buttons">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="execute-button" onClick={handleExecute}>
            Do It
          </button>
        </div>
      </div>
    </div>
  );
}
