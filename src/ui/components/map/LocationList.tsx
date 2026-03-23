import {
  type GridPosition,
  type LocationDefinition,
  type Region,
  getLocationsByRegion,
  getLocationAtPosition,
} from '@engine/index';
import { LocationCard } from './LocationCard';
import './LocationList.css';

interface LocationListProps {
  playerPosition: GridPosition;
  playerFitness: number;
  onSelect: (location: LocationDefinition) => void;
}

export function LocationList({
  playerPosition,
  playerFitness,
  onSelect,
}: LocationListProps) {
  const locationsByRegion = getLocationsByRegion();
  const currentLocation = getLocationAtPosition(playerPosition);

  // Fixed region order per mockup: North, West, East, South
  const regionOrder: Region[] = ['North', 'West', 'East', 'South'];

  return (
    <div className="map-body">
      {regionOrder.map((region) => {
        const locations = locationsByRegion.get(region) ?? [];
        if (locations.length === 0) return null;

        return [
          <div key={`label-${region}`} className="region-label">{region}</div>,
          ...locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              playerPosition={playerPosition}
              playerFitness={playerFitness}
              isCurrentLocation={currentLocation?.id === location.id}
              onSelect={() => onSelect(location)}
            />
          )),
        ];
      })}
    </div>
  );
}
