import {
  type GridPosition,
  type LocationDefinition,
  type Region,
  getLocationsByRegion,
  getLocationAtPosition,
  getMapData,
} from '@engine/index';
import { LocationCard } from './LocationCard';
import './LocationList.css';

interface LocationListProps {
  playerPosition: GridPosition;
  playerFitness: number;
  hasCarHere: boolean;
  onWalk: (location: LocationDefinition) => void;
  onDrive: (location: LocationDefinition) => void;
}

export function LocationList({
  playerPosition,
  playerFitness,
  hasCarHere,
  onWalk,
  onDrive,
}: LocationListProps) {
  const mapData = getMapData();
  const locationsByRegion = getLocationsByRegion();
  const currentLocation = getLocationAtPosition(playerPosition);

  // Get player's current region (if at a location)
  const playerRegion = currentLocation?.region;

  // Order regions: player's region first, then the rest in defined order
  const orderedRegions: Region[] = [];
  const allRegions = mapData.regions as Region[];

  if (playerRegion) {
    orderedRegions.push(playerRegion);
  }
  for (const region of allRegions) {
    if (region !== playerRegion) {
      orderedRegions.push(region);
    }
  }

  return (
    <div className="location-list">
      <div className="location-list-header">
        <h2>{mapData.townName}</h2>
        <p className="town-subtitle">Navigate to any location</p>
      </div>

      <div className="regions-container">
        {orderedRegions.map((region) => {
          const locations = locationsByRegion.get(region) ?? [];
          if (locations.length === 0) return null;

          return (
            <section key={region} className="region-section">
              <h3 className="region-header">
                {region} {mapData.townName}
              </h3>
              <div className="region-locations">
                {locations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    playerPosition={playerPosition}
                    playerFitness={playerFitness}
                    hasCarHere={hasCarHere}
                    isCurrentLocation={currentLocation?.id === location.id}
                    onWalk={() => onWalk(location)}
                    onDrive={() => onDrive(location)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
