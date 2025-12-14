import {
  type LocationDefinition,
  type GridPosition,
  calculateDistanceMeters,
  calculateTravelTime,
  formatDistance,
  formatTravelTime,
} from '@engine/index';
import './LocationInfoPanel.css';

interface LocationInfoPanelProps {
  location: LocationDefinition;
  playerPosition: GridPosition;
  hasCarHere: boolean;
  onWalk: () => void;
  onDrive: () => void;
  onClose: () => void;
}

export function LocationInfoPanel({
  location,
  playerPosition,
  hasCarHere,
  onWalk,
  onDrive,
  onClose,
}: LocationInfoPanelProps) {
  const distanceMeters = calculateDistanceMeters(playerPosition, location.entryPoint);
  const walkTime = calculateTravelTime(playerPosition, location.entryPoint, 'walk');
  const driveTime = calculateTravelTime(playerPosition, location.entryPoint, 'drive');

  const isAtLocation = distanceMeters === 0;

  return (
    <div className="location-info-panel">
      <button className="close-button" onClick={onClose}>
        &times;
      </button>

      <h2 className="location-name">{location.name}</h2>
      <p className="location-description">{location.description}</p>

      <ul className="location-summary">
        {location.summary.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {!isAtLocation && (
        <>
          <div className="travel-info">
            <div className="distance">
              <span className="label">Distance:</span>
              <span className="value">{formatDistance(distanceMeters)}</span>
            </div>
            <div className="travel-times">
              <div className="travel-option">
                <span className="mode">Walk:</span>
                <span className="time">{formatTravelTime(walkTime)}</span>
              </div>
              <div className="travel-option">
                <span className="mode">Drive:</span>
                <span className="time">{formatTravelTime(driveTime)}</span>
              </div>
            </div>
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
        </>
      )}

      {isAtLocation && (
        <div className="at-location-notice">
          <p>You are here!</p>
        </div>
      )}
    </div>
  );
}
