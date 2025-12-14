import {
  Warehouse,
  Wrench,
  Cog,
  Fuel,
  Landmark,
  GraduationCap,
  Droplets,
  Gavel,
  Car,
  Building2,
  ParkingCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  type LocationDefinition,
  type GridPosition,
  calculateDistanceMeters,
  calculateTravelTime,
  formatDistance,
  formatTravelTime,
  getWalkingCost,
} from '@engine/index';
import './LocationCard.css';

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  Warehouse,
  Wrench,
  Cog,
  Fuel,
  Landmark,
  GraduationCap,
  Droplets,
  Gavel,
  Car,
  Building2,
  ParkingCircle,
};

interface LocationCardProps {
  location: LocationDefinition;
  playerPosition: GridPosition;
  playerFitness: number;
  hasCarHere: boolean;
  isCurrentLocation: boolean;
  onWalk: () => void;
  onDrive: () => void;
}

export function LocationCard({
  location,
  playerPosition,
  playerFitness,
  hasCarHere,
  isCurrentLocation,
  onWalk,
  onDrive,
}: LocationCardProps) {
  const Icon = iconMap[location.icon] ?? Warehouse;

  const distanceMeters = calculateDistanceMeters(playerPosition, location.position);
  const walkTime = calculateTravelTime(playerPosition, location.position, 'walk');
  const driveTime = calculateTravelTime(playerPosition, location.position, 'drive');
  const walkCost = getWalkingCost(playerPosition, location.position, playerFitness);

  return (
    <div className={`location-card ${isCurrentLocation ? 'current' : ''}`}>
      <div className="location-card-header">
        <div className="location-icon">
          <Icon size={24} />
        </div>
        <div className="location-title">
          <h3 className="location-name">{location.name}</h3>
          <p className="location-address">{location.address}</p>
        </div>
        {isCurrentLocation && (
          <span className="current-badge">You are here</span>
        )}
      </div>

      <ul className="location-summary">
        {location.summary.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {!isCurrentLocation && (
        <div className="location-travel">
          <div className="travel-stats">
            <span className="distance">{formatDistance(distanceMeters)}</span>
            <span className="travel-time">
              Walk: {formatTravelTime(walkTime)} (-{walkCost.energyCost} energy)
            </span>
            <span className="travel-time">
              Drive: {formatTravelTime(driveTime)}
            </span>
          </div>
          <div className="travel-buttons">
            <button className="walk-button" onClick={onWalk}>
              Walk
            </button>
            <button
              className="drive-button"
              onClick={onDrive}
              disabled={!hasCarHere}
              title={!hasCarHere ? 'No car at your location' : ''}
            >
              Drive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
