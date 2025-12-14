import './HoursSlider.css';

interface HoursSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (hours: number) => void;
  label?: string;
}

export function HoursSlider({
  value,
  min,
  max,
  onChange,
  label = 'Hours',
}: HoursSliderProps) {
  return (
    <div className="hours-slider">
      <label className="hours-slider-label">
        {label}: <span className="hours-value">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="hours-slider-input"
      />
      <div className="hours-range">
        <span>{min}h</span>
        <span>{max}h</span>
      </div>
    </div>
  );
}
