import type { SleepOption } from '@engine/index';
import './SleepModal.css';

interface SleepModalProps {
  mode: 'voluntary' | 'crash';
  /** Best rate/label/hours for voluntary; all options for crash */
  options: SleepOption[];
  bestLabel: string;
  bestRate: number;
  bestHours: number;
  onSleep: (rate: number) => void;
  onCancel?: () => void; // Only for voluntary
}

export function SleepModal({
  mode,
  options,
  bestLabel,
  bestRate,
  bestHours,
  onSleep,
  onCancel,
}: SleepModalProps) {
  if (mode === 'voluntary') {
    return (
      <div className="sleep-backdrop">
        <div className="sleep-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sleep-modal__title">Sleep</div>
          <div className="sleep-modal__subtitle">{bestLabel}</div>

          <div className="sleep-modal__info">
            <div className="sleep-modal__row">
              <span className="sleep-modal__row-label">Recovery rate</span>
              <span className="sleep-modal__row-value">{bestRate} energy/hr</span>
            </div>
            <div className="sleep-modal__row">
              <span className="sleep-modal__row-label">Sleep duration</span>
              <span className="sleep-modal__row-value">{bestHours} hr{bestHours !== 1 ? 's' : ''}</span>
            </div>
            <div className="sleep-modal__row">
              <span className="sleep-modal__row-label">Wake up at</span>
              <span className="sleep-modal__row-value">100 energy</span>
            </div>
          </div>

          <div className="sleep-modal__buttons">
            <button className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" onClick={() => onSleep(bestRate)}>Sleep</button>
          </div>
        </div>
      </div>
    );
  }

  // Crash prompt — mandatory, no cancel
  return (
    <div className="sleep-backdrop sleep-backdrop--crash">
      <div className="sleep-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sleep-modal__title sleep-modal__title--crash">You're exhausted.</div>
        <div className="sleep-modal__subtitle">You must rest before continuing.</div>

        <div className="sleep-modal__options">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="sleep-option"
              onClick={() => onSleep(opt.rate)}
            >
              <span className="sleep-option__icon">
                {opt.id === 'home' ? '🏠' : opt.id === 'car' ? '🚗' : '😴'}
              </span>
              <span className="sleep-option__info">
                <span className="sleep-option__label">{opt.label}</span>
                <span className="sleep-option__detail">
                  {opt.rate} energy/hr &middot; {opt.hours} hr{opt.hours !== 1 ? 's' : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
