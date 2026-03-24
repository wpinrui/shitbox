import type { ChillPreset } from '@engine/index';
import './ChillModal.css';

interface ChillModalProps {
  presets: ChillPreset[];
  onChill: (hours: number) => void;
  onCancel: () => void;
}

export function ChillModal({ presets, onChill, onCancel }: ChillModalProps) {
  return (
    <div className="chill-backdrop" onClick={onCancel}>
      <div className="chill-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chill-modal__title">Chill</div>
        <div className="chill-modal__subtitle">
          Kick back and let time pass. No energy cost.
        </div>

        <div className="chill-modal__presets">
          {presets.map((preset) => (
            <button
              key={preset.label}
              className="chill-preset"
              onClick={() => onChill(preset.hours)}
            >
              <span className="chill-preset__label">{preset.label}</span>
              {preset.hours > 4 && (
                <span className="chill-preset__detail">{preset.hours} hrs</span>
              )}
            </button>
          ))}
        </div>

        <button className="btn-secondary chill-modal__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
