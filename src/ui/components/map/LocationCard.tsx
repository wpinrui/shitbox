import {
  type LocationDefinition,
  type GridPosition,
  calculateDistanceMeters,
  calculateTravelTime,
  getWalkingCost,
} from '@engine/index';
import './LocationCard.css';

interface LocationCardProps {
  location: LocationDefinition;
  playerPosition: GridPosition;
  playerFitness: number;
  isCurrentLocation: boolean;
  onSelect: () => void;
}

export function LocationCard({
  location,
  playerPosition,
  playerFitness,
  isCurrentLocation,
  onSelect,
}: LocationCardProps) {
  const distanceMeters = calculateDistanceMeters(playerPosition, location.position);
  const walkTime = calculateTravelTime(playerPosition, location.position, 'walk');
  const driveTime = calculateTravelTime(playerPosition, location.position, 'drive');
  const walkCost = getWalkingCost(playerPosition, location.position, playerFitness);

  const distanceKm = (distanceMeters / 1000).toFixed(1);
  const walkMinutes = Math.round(walkTime * 60);
  const driveMinutes = Math.round(driveTime * 60);

  const handleClick = () => {
    if (isCurrentLocation) return;
    onSelect();
  };

  return (
    <div
      className={`loc ${isCurrentLocation ? 'loc--current' : ''}`}
      onClick={handleClick}
    >
      {isCurrentLocation && <div className="loc__badge">You are here</div>}

      <div
        className="loc__photo"
        style={{ backgroundImage: `url('/assets/backgrounds/${location.backgroundImage}')` }}
      />

      <div className="loc__body">
        <div className="loc__name">{location.name}</div>
        <div className="loc__desc">{location.description}</div>

        <div className="loc__tags">
          {location.summary.map((tag, i) => (
            <span key={i} className="loc__tag">{tag}</span>
          ))}
        </div>

        {!isCurrentLocation && (
          <div className="loc__travel">
            <span>{distanceKm} km</span>
            <span className="loc__travel-sep">·</span>
            <span>🚶 {walkMinutes} min · ⚡{walkCost.energyCost}</span>
            <span className="loc__travel-sep">·</span>
            <span>🚗 {driveMinutes} min</span>
          </div>
        )}
      </div>
    </div>
  );
}
