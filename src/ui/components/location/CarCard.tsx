import type { OwnedCar, CarDefinition, ConditionRating } from '@engine/types';
import { getConditionRating } from '@engine/index';
import './CarCard.css';

interface CarCardProps {
  car: OwnedCar;
  carDef: CarDefinition;
  estimatedValue: number;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const RATING_LABELS: Record<ConditionRating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  scrap: 'Broken',
};

function conditionClass(rating: ConditionRating): string {
  if (rating === 'scrap') return 'broken';
  return rating;
}

function conditionWidth(value: number): string {
  // Broken shows a sliver, not 0
  if (value <= 0) return '2px';
  return `${value}%`;
}

export function CarCard({
  car,
  carDef,
  estimatedValue,
  compact = false,
  selected = false,
  onClick,
}: CarCardProps) {
  const engineRating = getConditionRating(car.engineCondition);
  const bodyRating = getConditionRating(car.bodyCondition);
  const carName = `${carDef.year} ${carDef.make} ${carDef.model}`;
  const hasImage = carDef.imageUrl !== '';

  return (
    <div
      className={`car-card${compact ? ' car-card--compact' : ''}${selected ? ' car-card--selected' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {/* Image */}
      <div className="car-card__image">
        {hasImage ? (
          <>
            <div
              className="car-card__image-bg"
              style={{ backgroundImage: `url('${carDef.imageUrl}')` }}
            />
            <div className="car-card__image-fade" />
          </>
        ) : (
          <>
            <div className="car-card__image-fade" />
            <div className="car-card__image-placeholder">No image available</div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="car-card__info">
        <div className="car-card__name">{carName}</div>

        {!compact && carDef.bio && (
          <div className="car-card__bio">{carDef.bio}</div>
        )}

        <div className="car-stats">
          <div className="cond-row">
            <span className="cond-row__label">Engine</span>
            <div className="cond-row__track">
              <div
                className={`cond-row__fill cond-row__fill--${conditionClass(engineRating)}`}
                style={{ width: conditionWidth(car.engineCondition) }}
              />
            </div>
            <span className={`cond-row__rating cond-row__rating--${conditionClass(engineRating)}`}>
              {car.engineCondition <= 0
                ? 'Broken'
                : `${Math.round(car.engineCondition)}% \u00B7 ${RATING_LABELS[engineRating]}`}
            </span>
          </div>
          <div className="cond-row">
            <span className="cond-row__label">Body</span>
            <div className="cond-row__track">
              <div
                className={`cond-row__fill cond-row__fill--${conditionClass(bodyRating)}`}
                style={{ width: conditionWidth(car.bodyCondition) }}
              />
            </div>
            <span className={`cond-row__rating cond-row__rating--${conditionClass(bodyRating)}`}>
              {car.bodyCondition <= 0
                ? 'Broken'
                : `${Math.round(car.bodyCondition)}% \u00B7 ${RATING_LABELS[bodyRating]}`}
            </span>
          </div>
        </div>

        <div className="car-card__footer">
          <span className="car-card__fuel">
            Fuel: {Math.round(car.fuel)} / {car.fuelCapacity} L
          </span>
          <span className="car-card__value">
            {compact ? `Est. ~$${estimatedValue}` : `Est. value ~$${estimatedValue}`}
          </span>
        </div>
      </div>
    </div>
  );
}
