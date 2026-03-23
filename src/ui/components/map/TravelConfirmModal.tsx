import {
  type LocationDefinition,
  type GridPosition,
  calculateDistanceMeters,
  calculateTravelTime,
  getWalkingCost,
} from '@engine/index';
import './TravelConfirmModal.css';

interface TravelConfirmModalProps {
  location: LocationDefinition;
  playerPosition: GridPosition;
  playerFitness: number;
  hasCarHere: boolean;
  onWalk: () => void;
  onDrive: () => void;
  onCancel: () => void;
}

export function TravelConfirmModal({
  location,
  playerPosition,
  playerFitness,
  hasCarHere,
  onWalk,
  onDrive,
  onCancel,
}: TravelConfirmModalProps) {
  const distanceMeters = calculateDistanceMeters(playerPosition, location.position);
  const distanceKm = (distanceMeters / 1000).toFixed(1);
  const walkTime = calculateTravelTime(playerPosition, location.position, 'walk');
  const driveTime = calculateTravelTime(playerPosition, location.position, 'drive');
  const walkCost = getWalkingCost(playerPosition, location.position, playerFitness);
  const walkMinutes = Math.round(walkTime * 60);
  const driveMinutes = Math.round(driveTime * 60);

  return (
    <div className="travel-backdrop" onClick={onCancel}>
      <div className="travel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="travel-modal__title">{location.name}</div>
        <div className="travel-modal__subtitle">{distanceKm} km away</div>

        <div className="travel-modal__options">
          <div className="travel-option" onClick={onWalk}>
            <span className="travel-option__icon">🚶</span>
            <div className="travel-option__info">
              <span className="travel-option__label">Walk</span>
              <span className="travel-option__detail">
                {walkMinutes} min · ⚡{walkCost.energyCost}
              </span>
            </div>
          </div>

          <div
            className={`travel-option${!hasCarHere ? ' travel-option--disabled' : ''}`}
            onClick={hasCarHere ? onDrive : undefined}
          >
            <span className="travel-option__icon">🚗</span>
            <div className="travel-option__info">
              <span className="travel-option__label">Drive</span>
              <span className="travel-option__detail">
                {hasCarHere ? `${driveMinutes} min` : 'No car here'}
              </span>
            </div>
          </div>
        </div>

        <button className="travel-modal__cancel btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
