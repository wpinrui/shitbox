import { useRef, useEffect, useState, useCallback } from 'react';
import {
  getMapData,
  getTileGrid,
  getAllLocations,
  type TileInfo,
  type LocationDefinition,
} from '@engine/index';
import tilesetImage from '@/assets/tilesets/modern-city/Tilemap/tilemap_packed.png';
import './TileMap.css';

interface TileMapProps {
  onLocationClick?: (location: LocationDefinition) => void;
  playerPosition?: { x: number; y: number };
  carPositions?: Array<{ x: number; y: number; instanceId: string }>;
  selectedLocationId?: string | null;
}

export function TileMap({
  onLocationClick,
  playerPosition,
  carPositions = [],
  selectedLocationId,
}: TileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const mapData = getMapData();
  const tileGrid = getTileGrid();
  const locations = getAllLocations();

  const { width, height, tileSize, tileSpacing, tilesetWidth } = mapData;
  const tileWithSpacing = tileSize + tileSpacing;
  const mapWidthPx = width * tileSize;
  const mapHeightPx = height * tileSize;

  // Center on player when position changes
  useEffect(() => {
    if (playerPosition && containerRef.current) {
      const container = containerRef.current;
      const centerX = playerPosition.x * tileSize - container.clientWidth / 2 + tileSize / 2;
      const centerY = playerPosition.y * tileSize - container.clientHeight / 2 + tileSize / 2;
      container.scrollTo({
        left: Math.max(0, centerX),
        top: Math.max(0, centerY),
        behavior: 'smooth',
      });
    }
  }, [playerPosition, tileSize]);

  // Calculate background position for a tile index
  const getTileBackgroundPosition = useCallback(
    (tileIndex: number) => {
      const col = tileIndex % tilesetWidth;
      const row = Math.floor(tileIndex / tilesetWidth);
      return `-${col * tileWithSpacing}px -${row * tileWithSpacing}px`;
    },
    [tilesetWidth, tileWithSpacing]
  );

  // Handle tile click
  const handleTileClick = useCallback(
    (tile: TileInfo) => {
      if (tile.locationId && onLocationClick) {
        const location = locations.find((loc) => loc.id === tile.locationId);
        if (location) {
          onLocationClick(location);
        }
      }
    },
    [locations, onLocationClick]
  );

  // Handle tile hover
  const handleTileHover = useCallback((tile: TileInfo | null) => {
    setHoveredLocation(tile?.locationId ?? null);
  }, []);

  // Check if a position has the player
  const isPlayerPosition = useCallback(
    (x: number, y: number) => {
      return playerPosition?.x === x && playerPosition?.y === y;
    },
    [playerPosition]
  );

  // Check if a position has a car
  const getCarAtPosition = useCallback(
    (x: number, y: number) => {
      return carPositions.find((car) => car.x === x && car.y === y);
    },
    [carPositions]
  );

  // Check if a location is highlighted
  const isLocationHighlighted = useCallback(
    (locationId: string | null) => {
      return locationId === hoveredLocation || locationId === selectedLocationId;
    },
    [hoveredLocation, selectedLocationId]
  );

  return (
    <div className="tilemap-container" ref={containerRef}>
      <div
        className="tilemap"
        style={{
          width: mapWidthPx,
          height: mapHeightPx,
          backgroundImage: `url(${tilesetImage})`,
        }}
      >
        {/* Render tiles */}
        {tileGrid.map((row, y) =>
          row.map((tile, x) => {
            const hasPlayer = isPlayerPosition(x, y);
            const car = getCarAtPosition(x, y);
            const isHighlighted = isLocationHighlighted(tile.locationId);
            const isClickable = tile.locationId !== null;

            return (
              <div
                key={`${x}-${y}`}
                className={`tile ${isClickable ? 'clickable' : ''} ${
                  isHighlighted ? 'highlighted' : ''
                }`}
                style={{
                  left: x * tileSize,
                  top: y * tileSize,
                  width: tileSize,
                  height: tileSize,
                  backgroundImage: `url(${tilesetImage})`,
                  backgroundPosition: getTileBackgroundPosition(tile.tileIndex),
                }}
                onClick={() => handleTileClick(tile)}
                onMouseEnter={() => handleTileHover(tile)}
                onMouseLeave={() => handleTileHover(null)}
              >
                {/* Player marker */}
                {hasPlayer && <div className="player-marker" />}

                {/* Car marker */}
                {car && !hasPlayer && <div className="car-marker" />}
              </div>
            );
          })
        )}

        {/* Location labels */}
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`location-label ${
              isLocationHighlighted(loc.id) ? 'highlighted' : ''
            }`}
            style={{
              left: (loc.bounds.x + loc.bounds.w / 2) * tileSize,
              top: loc.bounds.y * tileSize - 20,
            }}
          >
            {loc.name}
          </div>
        ))}
      </div>
    </div>
  );
}
