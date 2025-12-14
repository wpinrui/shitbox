import { useState } from 'react';
import type { ActivityDefinition, GameState } from '@engine/index';
import {
  calculateEnergyCost,
  calculateEnergyRecovery,
  calculateMoneyEarned,
  calculateMoneyCost,
  getEconomyConfig,
} from '@engine/index';
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

  // Calculate estimated energy using actual engine calculations
  const getEstimatedEnergy = () => {
    const params = isVariableTime ? { hours } : {};

    if (activity.energy.type === 'recover') {
      const economyConfig = getEconomyConfig();
      const recovery = calculateEnergyRecovery(gameState, activity, params, economyConfig);
      return `+${recovery}`;
    }

    if (activity.energy.type === 'none') {
      return '0';
    }

    // Use actual calculation with stat modifiers applied
    const cost = calculateEnergyCost(gameState, activity, params);
    return `-${cost}`;
  };

  const getEstimatedMoney = () => {
    if (activity.money.type === 'none') {
      return null;
    }

    const params = isVariableTime ? { hours } : {};
    const variance = activity.money.variance ?? 0;

    if (activity.money.type === 'earn') {
      // Use actual calculation with stat modifiers applied
      const baseEarnings = calculateMoneyEarned(gameState, activity, params);
      const min = baseEarnings - variance;
      const max = baseEarnings + variance;

      if (variance > 0) {
        return `+$${min}-${max}`;
      }
      return `+$${baseEarnings}`;
    }

    if (activity.money.type === 'spend') {
      const cost = calculateMoneyCost(gameState, activity, params);
      return `-$${cost}`;
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
