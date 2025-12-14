/**
 * Map data loading and management.
 * Handles the town map, locations, and distance calculations.
 */

import type { GridPosition } from '../types';

// ============================================================================
// Types
// ============================================================================

export type Region = 'Central' | 'North' | 'South' | 'East' | 'West';
export type LocationCategory = 'Industrial' | 'Commercial' | 'Residential' | 'Parking';

export interface MapData {
  version: string;
  townName: string;
  gridSize: number;
  metersPerTile: number;
  walkSpeed: number; // km/h
  driveSpeed: number; // km/h
  towCost: number;
  regions: Region[];
  locations: LocationDefinition[];
}

export interface LocationDefinition {
  id: string;
  name: string;
  description: string;
  summary: string[];
  icon: string;
  category: LocationCategory;
  region: Region;
  position: GridPosition;
  address: string;
  activitiesFile: string | null;
}

// ============================================================================
// Cache
// ============================================================================

const mapCache = {
  data: null as MapData | null,
  locationById: new Map<string, LocationDefinition>(),
  locationByPosition: new Map<string, LocationDefinition>(),
};

/**
 * Get position key for map lookup.
 */
function positionKey(pos: GridPosition): string {
  return `${pos.x},${pos.y}`;
}

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

  // Index locations by ID and position
  for (const loc of mapCache.data.locations) {
    mapCache.locationById.set(loc.id, loc);
    mapCache.locationByPosition.set(positionKey(loc.position), loc);
  }

  return mapCache.data;
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
 * Get locations grouped by region.
 */
export function getLocationsByRegion(): Map<Region, LocationDefinition[]> {
  const byRegion = new Map<Region, LocationDefinition[]>();
  const regions: Region[] = mapCache.data?.regions ?? ['Central', 'North', 'South', 'East', 'West'];

  // Initialize empty arrays for each region
  for (const region of regions) {
    byRegion.set(region, []);
  }

  // Group locations
  for (const loc of getAllLocations()) {
    const list = byRegion.get(loc.region);
    if (list) {
      list.push(loc);
    }
  }

  return byRegion;
}

/**
 * Get location at a specific position (if any).
 */
export function getLocationAtPosition(position: GridPosition): LocationDefinition | null {
  return mapCache.locationByPosition.get(positionKey(position)) ?? null;
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
  mapCache.locationById.clear();
  mapCache.locationByPosition.clear();
}
