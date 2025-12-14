/**
 * Map data loading and management.
 * Handles the town map, locations, and tile generation.
 */

import type { GridPosition } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface MapData {
  version: string;
  tileSize: number;
  tileSpacing: number;
  tilesetWidth: number;
  tilesetHeight: number;
  tileset: string;
  width: number;
  height: number;
  metersPerTile: number;
  tileTypes: Record<string, number>;
  locations: LocationDefinition[];
  roads: RoadDefinition[];
  walkSpeed: number; // km/h
  driveSpeed: number; // km/h
  towCost: number;
}

export interface LocationDefinition {
  id: string;
  name: string;
  description: string;
  summary: string[];
  bounds: { x: number; y: number; w: number; h: number };
  entryPoint: GridPosition;
  activitiesFile: string | null;
  tileStyle: 'industrial' | 'commercial' | 'residential' | 'parking';
}

export interface RoadDefinition {
  type: 'horizontal' | 'vertical';
  x?: number;
  y?: number;
  xStart?: number;
  xEnd?: number;
  yStart?: number;
  yEnd?: number;
}

export interface TileInfo {
  tileIndex: number;
  isWalkable: boolean;
  isRoad: boolean;
  locationId: string | null;
}

// ============================================================================
// Cache
// ============================================================================

const mapCache = {
  data: null as MapData | null,
  tileGrid: null as TileInfo[][] | null,
  locationById: new Map<string, LocationDefinition>(),
};

// ============================================================================
// Loading Functions
// ============================================================================

/**
 * Load map data from JSON file.
 */
export async function loadMapData(): Promise<MapData> {
  if (mapCache.data) {
    return mapCache.data;
  }

  const data = await window.electronAPI.loadData('map.json');
  mapCache.data = data as MapData;

  // Index locations by ID
  for (const loc of mapCache.data.locations) {
    mapCache.locationById.set(loc.id, loc);
  }

  // Generate tile grid
  mapCache.tileGrid = generateTileGrid(mapCache.data);

  return mapCache.data;
}

/**
 * Generate the tile grid from declarative map data.
 */
function generateTileGrid(mapData: MapData): TileInfo[][] {
  const { width, height, tileTypes, locations, roads } = mapData;

  // Initialize with grass
  const grid: TileInfo[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileInfo[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        tileIndex: tileTypes.grass,
        isWalkable: true,
        isRoad: false,
        locationId: null,
      });
    }
    grid.push(row);
  }

  // Add roads
  for (const road of roads) {
    if (road.type === 'horizontal' && road.y !== undefined) {
      for (let x = road.xStart ?? 0; x <= (road.xEnd ?? width - 1); x++) {
        if (x >= 0 && x < width && road.y >= 0 && road.y < height) {
          grid[road.y][x] = {
            tileIndex: tileTypes.road_h,
            isWalkable: true,
            isRoad: true,
            locationId: null,
          };
        }
      }
    } else if (road.type === 'vertical' && road.x !== undefined) {
      for (let y = road.yStart ?? 0; y <= (road.yEnd ?? height - 1); y++) {
        if (road.x >= 0 && road.x < width && y >= 0 && y < height) {
          // Check for intersection with horizontal road
          const existingTile = grid[y][road.x];
          if (existingTile.isRoad) {
            grid[y][road.x] = {
              tileIndex: tileTypes.road_intersection,
              isWalkable: true,
              isRoad: true,
              locationId: null,
            };
          } else {
            grid[y][road.x] = {
              tileIndex: tileTypes.road_v,
              isWalkable: true,
              isRoad: true,
              locationId: null,
            };
          }
        }
      }
    }
  }

  // Add location tiles
  for (const loc of locations) {
    const { bounds, id, tileStyle } = loc;
    const tileIndex = getTileForStyle(tileStyle, tileTypes);

    for (let y = bounds.y; y < bounds.y + bounds.h; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.w; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          grid[y][x] = {
            tileIndex,
            isWalkable: true,
            isRoad: false,
            locationId: id,
          };
        }
      }
    }
  }

  return grid;
}

/**
 * Get tile index based on location style.
 */
function getTileForStyle(
  style: string,
  tileTypes: Record<string, number>
): number {
  switch (style) {
    case 'industrial':
      return tileTypes.concrete;
    case 'commercial':
      return tileTypes.wood_floor;
    case 'residential':
      return tileTypes.brick_grey;
    case 'parking':
      return tileTypes.pavement;
    default:
      return tileTypes.grass;
  }
}

// ============================================================================
// Accessor Functions
// ============================================================================

/**
 * Get map data. Throws if not loaded.
 */
export function getMapData(): MapData {
  if (!mapCache.data) {
    throw new Error('Map data not loaded. Call loadMapData() first.');
  }
  return mapCache.data;
}

/**
 * Get the tile grid. Throws if not loaded.
 */
export function getTileGrid(): TileInfo[][] {
  if (!mapCache.tileGrid) {
    throw new Error('Map data not loaded. Call loadMapData() first.');
  }
  return mapCache.tileGrid;
}

/**
 * Get tile info at a specific position.
 */
export function getTileAt(position: GridPosition): TileInfo | null {
  const grid = mapCache.tileGrid;
  if (!grid) return null;

  const { x, y } = position;
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
    return null;
  }

  return grid[y][x];
}

/**
 * Get location definition by ID.
 */
export function getLocation(locationId: string): LocationDefinition | undefined {
  return mapCache.locationById.get(locationId);
}

/**
 * Get all locations.
 */
export function getAllLocations(): LocationDefinition[] {
  return mapCache.data?.locations ?? [];
}

/**
 * Get location at a specific position (if any).
 */
export function getLocationAtPosition(position: GridPosition): LocationDefinition | null {
  const tile = getTileAt(position);
  if (!tile || !tile.locationId) return null;
  return mapCache.locationById.get(tile.locationId) ?? null;
}

/**
 * Check if a position is on a road.
 */
export function isRoadTile(position: GridPosition): boolean {
  const tile = getTileAt(position);
  return tile?.isRoad ?? false;
}

/**
 * Check if a position is walkable.
 */
export function isWalkable(position: GridPosition): boolean {
  const tile = getTileAt(position);
  return tile?.isWalkable ?? false;
}

/**
 * Calculate Manhattan distance between two positions.
 */
export function calculateDistance(from: GridPosition, to: GridPosition): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

/**
 * Calculate distance in meters between two positions.
 */
export function calculateDistanceMeters(from: GridPosition, to: GridPosition): number {
  const mapData = mapCache.data;
  if (!mapData) return 0;
  return calculateDistance(from, to) * mapData.metersPerTile;
}

/**
 * Calculate travel time in hours.
 */
export function calculateTravelTime(
  from: GridPosition,
  to: GridPosition,
  mode: 'walk' | 'drive'
): number {
  const mapData = mapCache.data;
  if (!mapData) return 0;

  const distanceKm = calculateDistanceMeters(from, to) / 1000;
  const speed = mode === 'walk' ? mapData.walkSpeed : mapData.driveSpeed;

  return distanceKm / speed;
}

/**
 * Format distance for display.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format travel time for display.
 */
export function formatTravelTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Check if map data is loaded.
 */
export function isMapLoaded(): boolean {
  return mapCache.data !== null;
}

/**
 * Clear map cache (for testing).
 */
export function clearMapCache(): void {
  mapCache.data = null;
  mapCache.tileGrid = null;
  mapCache.locationById.clear();
}
