import { useState, useEffect, useCallback } from 'react';
import type { ActivityDefinition } from '@engine/index';
import './ActivityModal.css';

type ModalPhase = 'hours' | 'progress' | 'outcome';

interface ActivityResult {
  success: boolean;
  narrative?: string;
  error?: string;
  delta?: {
    player?: { money?: number; energy?: number };
    time?: { hours?: number };
    stats?: Record<string, number>;
  };
  hoursWorked?: number;
}

interface ActivityModalProps {
  activity: ActivityDefinition;
  gameState: unknown;
  onExecute: (params: { hours?: number }) => ActivityResult | void;
  onClose: () => void;
}

export function ActivityModal({
  activity,
  onExecute,
  onClose,
}: ActivityModalProps) {
  const isVariableTime = activity.time.type === 'variable';
  const minHours = activity.time.minHours ?? 1;
  const maxHours = activity.time.maxHours ?? 8;
  const fixedHours = activity.time.hours ?? 1;

  const [phase, setPhase] = useState<ModalPhase>(isVariableTime ? 'hours' : 'progress');
  const [hours, setHours] = useState(minHours);
  const [result, setResult] = useState<ActivityResult | null>(null);

  const actualHours = isVariableTime ? hours : fixedHours;

  // Execute the activity when entering progress phase
  const executeAndProgress = useCallback(() => {
    const params = isVariableTime ? { hours } : {};
    const res = onExecute(params);
    if (res && typeof res === 'object') {
      setResult(res as ActivityResult);
    }
    setPhase('progress');
  }, [isVariableTime, hours, onExecute]);

  // Auto-execute for fixed-time activities on mount
  useEffect(() => {
    if (!isVariableTime) {
      const params = {};
      const res = onExecute(params);
      if (res && typeof res === 'object') {
        setResult(res as ActivityResult);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Transition from progress → outcome after progress bar completes
  useEffect(() => {
    if (phase === 'progress') {
      const timer = setTimeout(() => setPhase('outcome'), 2800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleGo = () => {
    executeAndProgress();
  };

  // Build result rows from the execution result
  const resultRows: Array<{ icon: string; label: string; value: string; type: 'earn' | 'spend' | 'neutral' }> = [];

  if (result?.delta) {
    const d = result.delta;
    if (d.player?.money && d.player.money > 0) {
      resultRows.push({ icon: '💰', label: 'Money earned', value: `+$${d.player.money}`, type: 'earn' });
    } else if (d.player?.money && d.player.money < 0) {
      resultRows.push({ icon: '💰', label: 'Money spent', value: `-$${Math.abs(d.player.money)}`, type: 'spend' });
    }
    if (d.player?.energy && d.player.energy < 0) {
      resultRows.push({ icon: '⚡', label: 'Energy spent', value: `${d.player.energy}`, type: 'spend' });
    } else if (d.player?.energy && d.player.energy > 0) {
      resultRows.push({ icon: '⚡', label: 'Energy recovered', value: `+${d.player.energy}`, type: 'earn' });
    }
    if (d.time?.hours) {
      resultRows.push({ icon: '⏱', label: 'Time elapsed', value: `${d.time.hours} hr${d.time.hours !== 1 ? 's' : ''}`, type: 'neutral' });
    }
    if (d.stats) {
      for (const [stat, gain] of Object.entries(d.stats)) {
        if (gain && gain !== 0) {
          const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
          resultRows.push({ icon: '💪', label: statName, value: `+${gain.toFixed(2)}`, type: 'earn' });
        }
      }
    }
  }

  // Fallback: if no structured result, show narrative
  if (resultRows.length === 0 && result?.narrative) {
    resultRows.push({ icon: '📋', label: result.narrative, value: '', type: 'neutral' });
  }
  if (resultRows.length === 0 && result?.error) {
    resultRows.push({ icon: '❌', label: result.error, value: '', type: 'spend' });
  }

  // If no result data at all (onExecute returned void), show time as the only row
  if (resultRows.length === 0) {
    resultRows.push({ icon: '⏱', label: 'Time elapsed', value: `${actualHours} hr${actualHours !== 1 ? 's' : ''}`, type: 'neutral' });
  }

  return (
    <div className="activity-modal-overlay" onClick={phase === 'outcome' ? onClose : undefined}>
      <div className="activity-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Phase: Hours Picker (variable-time only) ── */}
        {phase === 'hours' && (
          <div className="modal-hours">
            <div className="modal-hours__title">{activity.name}</div>
            <div className="modal-hours__desc">{activity.description}</div>
            <div className="modal-hours__slider">
              <label className="modal-hours__label">
                {hours} hour{hours !== 1 ? 's' : ''}
              </label>
              <input
                type="range"
                min={minHours}
                max={maxHours}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="modal-hours__input"
              />
              <div className="modal-hours__range">
                <span>{minHours}h</span>
                <span>{maxHours}h</span>
              </div>
            </div>
            <div className="modal-hours__buttons">
              <button className="modal-hours__cancel" onClick={onClose}>Cancel</button>
              <button className="modal-hours__go" onClick={handleGo}>Go</button>
            </div>
          </div>
        )}

        {/* ── Phase: Progress Bar ── */}
        {phase === 'progress' && (
          <div className="modal-progress">
            <div className="modal-progress__title">{activity.name}</div>
            <div className="modal-progress__desc">
              {activity.description.replace(/\.$/, '...')}
            </div>
            <div className="modal-progress__bar-track">
              <div className="modal-progress__bar-fill" />
            </div>
            <div className="modal-progress__time">
              {actualHours} hour{actualHours !== 1 ? 's' : ''} passing...
            </div>
          </div>
        )}

        {/* ── Phase: Outcome ── */}
        {phase === 'outcome' && (
          <div className="modal-outcome">
            <div className="modal-outcome__title">{activity.name}</div>
            <div className="modal-outcome__subtitle">
              {actualHours} hour{actualHours !== 1 ? 's' : ''} completed
            </div>
            <div className="modal-outcome__divider" />

            <div className="modal-outcome__results">
              {resultRows.map((row, i) => (
                <div
                  key={i}
                  className="modal-outcome__result"
                  style={{ animationDelay: `${0.1 + i * 0.2}s` }}
                >
                  <span className="modal-outcome__result-icon">{row.icon}</span>
                  <span className="modal-outcome__result-label">{row.label}</span>
                  {row.value && (
                    <span className={`modal-outcome__result-value modal-outcome__result-value--${row.type}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              className="modal-outcome__close"
              style={{ animationDelay: `${0.1 + resultRows.length * 0.2 + 0.3}s` }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
