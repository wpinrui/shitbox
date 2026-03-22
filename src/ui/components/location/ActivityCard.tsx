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
  const getTimeDisplay = () => {
    if (activity.time.type === 'fixed') {
      return `${activity.time.hours} hr${(activity.time.hours ?? 1) !== 1 ? 's' : ''}`;
    }
    return `${activity.time.minHours}–${activity.time.maxHours} hrs`;
  };

  const getEnergyDisplay = () => {
    if (activity.energy.type === 'recover') {
      return { text: `+${activity.energy.base} / hr`, type: 'earn' as const };
    }
    if (activity.energy.type === 'none') {
      return null;
    }
    const base = activity.energy.base ?? 0;
    if (activity.energy.type === 'perHour') {
      return { text: `${base} / hr`, type: 'neutral' as const };
    }
    return { text: `${base}`, type: 'neutral' as const };
  };

  const getMoneyDisplay = () => {
    if (activity.money.type === 'none') return null;
    if (activity.money.type === 'earn') {
      const base = activity.money.base ?? 0;
      const variance = activity.money.variance ?? 0;
      if (activity.money.mode === 'perHour') {
        return { text: `+$${base} / hr`, type: 'earn' as const, icon: '💰' };
      }
      if (variance > 0) {
        return { text: `+$${base - variance}-${base + variance}`, type: 'earn' as const, icon: '💰' };
      }
      return { text: `+$${base}`, type: 'earn' as const, icon: '💰' };
    }
    if (activity.money.type === 'spend') {
      return { text: `-$${activity.money.base ?? 0}`, type: 'spend' as const, icon: '💰' };
    }
    return null;
  };

  const energyInfo = getEnergyDisplay();
  const moneyInfo = getMoneyDisplay();

  const itemOutcome = activity.outcomes?.find((o) => o.type === 'items');

  return (
    <div
      className={`card ${canPerform ? '' : 'card--disabled'}`}
      onClick={canPerform ? onClick : undefined}
      title={!canPerform ? reason : undefined}
    >
      <div className="card__name">{activity.name}</div>
      <div className="card__desc">{activity.description}</div>
      <div className="card__divider" />

      {/* Time cost */}
      <div className="card__cost">
        <span className="card__cost-icon card__cost-icon--time">⏱</span>
        <span className="card__cost-text card__cost-text--neutral">{getTimeDisplay()}</span>
      </div>

      {/* Energy cost */}
      {energyInfo && (
        <div className="card__cost">
          <span className="card__cost-icon card__cost-icon--energy">⚡</span>
          <span className={`card__cost-text card__cost-text--${energyInfo.type === 'earn' ? 'earn' : 'neutral'}`}>
            {energyInfo.text}
          </span>
        </div>
      )}

      {/* Money cost/earn */}
      {moneyInfo && (
        <div className="card__cost">
          <span className={`card__cost-icon card__cost-icon--${moneyInfo.type}`}>{moneyInfo.icon}</span>
          <span className={`card__cost-text card__cost-text--${moneyInfo.type}`}>{moneyInfo.text}</span>
        </div>
      )}

      {/* Item outcomes */}
      {itemOutcome && !moneyInfo && (
        <div className="card__cost">
          <span className="card__cost-icon card__cost-icon--earn">🔧</span>
          <span className="card__cost-text card__cost-text--neutral">Find parts</span>
        </div>
      )}

      {!canPerform && reason && (
        <div className="card__locked">{reason}</div>
      )}
    </div>
  );
}
