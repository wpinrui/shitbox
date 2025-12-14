import type { ActivityDefinition } from '@engine/index';
import './ActivityCard.css';

interface ActivityCardProps {
  activity: ActivityDefinition;
  canPerform: boolean;
  reason?: string;
  onClick: () => void;
}

export function ActivityCard({
  activity,
  canPerform,
  reason,
  onClick,
}: ActivityCardProps) {
  // Format time display
  const getTimeDisplay = () => {
    if (activity.time.type === 'fixed') {
      return `${activity.time.hours}h`;
    }
    return `${activity.time.minHours}-${activity.time.maxHours}h`;
  };

  // Format energy display
  const getEnergyDisplay = () => {
    if (activity.energy.type === 'recover') {
      return `+${activity.energy.base}/h`;
    }
    if (activity.energy.type === 'none') {
      return '0';
    }
    const base = activity.energy.base ?? 0;
    if (activity.energy.type === 'perHour') {
      return `~${base}/h`;
    }
    return `-${base}`;
  };

  // Format money display
  const getMoneyDisplay = () => {
    if (activity.money.type === 'none') {
      return null;
    }
    if (activity.money.type === 'earn') {
      const base = activity.money.base ?? 0;
      const variance = activity.money.variance ?? 0;
      if (variance > 0) {
        return `+$${base - variance}-${base + variance}`;
      }
      return `+$${base}`;
    }
    if (activity.money.type === 'spend') {
      return `-$${activity.money.base ?? 0}`;
    }
    return null;
  };

  const moneyDisplay = getMoneyDisplay();

  return (
    <div
      className={`activity-card ${canPerform ? '' : 'disabled'}`}
      onClick={canPerform ? onClick : undefined}
      title={!canPerform ? reason : undefined}
    >
      <h3 className="activity-name">{activity.name}</h3>
      <p className="activity-description">{activity.description}</p>

      <div className="activity-stats">
        <span className="stat time">{getTimeDisplay()}</span>
        <span className="stat energy">{getEnergyDisplay()} ⚡</span>
        {moneyDisplay && (
          <span className={`stat money ${activity.money.type === 'earn' ? 'earn' : 'spend'}`}>
            {moneyDisplay}
          </span>
        )}
      </div>

      {!canPerform && reason && (
        <div className="locked-reason">{reason}</div>
      )}
    </div>
  );
}
