import { useState, useRef, useEffect } from 'react';
import type { OwnedCar, CarDefinition, ConditionRating } from '@engine/types';
import { getConditionRating } from '@engine/index';
import './CarSelector.css';

interface CarSelectorProps {
  cars: OwnedCar[];
  carDefs: Map<string, CarDefinition>;
  selectedId: string;
  onSelect: (instanceId: string) => void;
}

const RATING_LABELS: Record<ConditionRating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  scrap: 'Broken',
};

export function CarSelector({ cars, carDefs, selectedId, onSelect }: CarSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedCar = cars.find((c) => c.instanceId === selectedId);
  const selectedDef = selectedCar ? carDefs.get(selectedCar.carId) : undefined;
  const selectedName = selectedDef
    ? `${selectedDef.year} ${selectedDef.make} ${selectedDef.model}`
    : 'Select a car';

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="car-selector-row" ref={wrapRef}>
      <span className="car-selector-label">Working on</span>
      <div style={{ position: 'relative' }}>
        <button
          className="car-selector-btn"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{selectedName}</span>
          <span className="car-selector-btn__arrow">{'\u25BE'}</span>
        </button>

        {open && (
          <div className="car-dropdown">
            {cars.map((car) => {
              const def = carDefs.get(car.carId);
              if (!def) return null;
              const name = `${def.year} ${def.make} ${def.model}`;
              const engineRating = getConditionRating(car.engineCondition);
              const bodyRating = getConditionRating(car.bodyCondition);
              const isActive = car.instanceId === selectedId;
              return (
                <div
                  key={car.instanceId}
                  className={`car-option${isActive ? ' car-option--active' : ''}`}
                  onClick={() => {
                    onSelect(car.instanceId);
                    setOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="car-option__name">{name}</div>
                      <div className="car-option__stats">
                        Engine: {RATING_LABELS[engineRating]} {'\u00B7'} Body: {RATING_LABELS[bodyRating]}
                      </div>
                    </div>
                    {isActive && <span className="car-option__check">{'\u2713'}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
