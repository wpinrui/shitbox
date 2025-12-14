/**
 * Travel system - handles movement between locations
 * Calculates costs for walking and driving
 */

import type { GridPosition, GameState, OwnedCar, StateDelta } from '../types';
import { calculateDistanceMeters, getMapData, getLocation } from '../data';
import { getEconomyConfig } from '../data';

// ============================================================================
// Types
// ============================================================================

export interface TravelCost {
  timeHours: number;
  energyCost: number;
  fuelCost: number;
}

export interface TravelResult {
  success: boolean;
  error?: string;
  newPosition?: GridPosition;
  delta?: StateDelta;
  narrative?: string;
}

// ============================================================================
// Cost Calculations
// ============================================================================

/**
 * Calculate the energy cost for walking a certain distance.
 * Fitness stat reduces energy cost.
 */
export function calculateWalkingEnergyCost(
  distanceMeters: number,
  fitnessLevel: number
): number {
  // Base: 1 energy per 100 meters
  const baseEnergyCost = distanceMeters / 100;

  // Fitness reduces energy cost per economy config
  const economyConfig = getEconomyConfig();
  const energyCostReductionPerPoint = economyConfig.statEffects.fitness.energyCostReductionPerPoint;
  const fitnessModifier = 1 - fitnessLevel * energyCostReductionPerPoint;

  return Math.max(1, Math.round(baseEnergyCost * fitnessModifier));
}

/**
 * Calculate the fuel cost for driving a certain distance.
 * Based on car's fuel efficiency (liters per 100km).
 */
export function calculateDrivingFuelCost(
  distanceMeters: number,
  fuelEfficiency: number = 10 // liters per 100km default
): number {
  const distanceKm = distanceMeters / 1000;
  return (distanceKm / 100) * fuelEfficiency;
}

/**
 * Get travel costs for walking to a destination.
 */
export function getWalkingCost(
  from: GridPosition,
  to: GridPosition,
  fitnessLevel: number
): TravelCost {
  const mapData = getMapData();
  const distanceMeters = calculateDistanceMeters(from, to);
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / mapData.walkSpeed;

  return {
    timeHours,
    energyCost: calculateWalkingEnergyCost(distanceMeters, fitnessLevel),
    fuelCost: 0,
  };
}

/**
 * Get travel costs for driving to a destination.
 */
export function getDrivingCost(
  from: GridPosition,
  to: GridPosition,
  fuelEfficiency: number = 10
): TravelCost {
  const mapData = getMapData();
  const distanceMeters = calculateDistanceMeters(from, to);
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / mapData.driveSpeed;

  return {
    timeHours,
    energyCost: 0,
    fuelCost: calculateDrivingFuelCost(distanceMeters, fuelEfficiency),
  };
}

// ============================================================================
// Travel Validation
// ============================================================================

/**
 * Check if the player can walk to a destination.
 */
export function canWalk(
  state: GameState,
  to: GridPosition
): { canTravel: boolean; reason?: string } {
  const from = state.player.position;
  const fitnessLevel = state.player.stats.fitness;
  const cost = getWalkingCost(from, to, fitnessLevel);

  if (state.player.energy < cost.energyCost) {
    return {
      canTravel: false,
      reason: `Not enough energy. Need ${cost.energyCost}, have ${state.player.energy}`,
    };
  }

  return { canTravel: true };
}

/**
 * Check if the player can drive to a destination.
 * Requires a working car with enough fuel at current location.
 */
export function canDrive(
  state: GameState,
  to: GridPosition
): { canTravel: boolean; reason?: string; car?: OwnedCar } {
  const from = state.player.position;

  // Find a working car at player's location
  const carsHere = state.inventory.cars.filter(
    (car) =>
      car.position.x === from.x &&
      car.position.y === from.y &&
      car.engineCondition > 0
  );

  if (carsHere.length === 0) {
    return {
      canTravel: false,
      reason: 'No working car at your location',
    };
  }

  // Use the first available car (could add car selection later)
  const car = carsHere[0];
  const cost = getDrivingCost(from, to, 10); // Assuming 10L/100km for now

  if (car.fuel < cost.fuelCost) {
    return {
      canTravel: false,
      reason: `Not enough fuel. Need ${cost.fuelCost.toFixed(1)}L, have ${car.fuel.toFixed(1)}L`,
      car,
    };
  }

  return { canTravel: true, car };
}

// ============================================================================
// Travel Execution
// ============================================================================

/**
 * Execute walking travel.
 */
export function executeWalk(
  state: GameState,
  to: GridPosition
): TravelResult {
  const validation = canWalk(state, to);
  if (!validation.canTravel) {
    return { success: false, error: validation.reason };
  }

  const from = state.player.position;
  const cost = getWalkingCost(from, to, state.player.stats.fitness);
  const distanceMeters = calculateDistanceMeters(from, to);

  return {
    success: true,
    newPosition: to,
    delta: {
      player: {
        energy: -cost.energyCost,
      },
      time: {
        hours: cost.timeHours,
      },
    },
    narrative: `Walked ${Math.round(distanceMeters)}m in ${Math.round(cost.timeHours * 60)} minutes.`,
  };
}

/**
 * Execute driving travel.
 * Returns the car instance ID that was used so caller can update its fuel.
 */
export function executeDrive(
  state: GameState,
  to: GridPosition
): TravelResult & { carInstanceId?: string; fuelUsed?: number } {
  const validation = canDrive(state, to);
  if (!validation.canTravel || !validation.car) {
    return { success: false, error: validation.reason };
  }

  const from = state.player.position;
  const car = validation.car;
  const cost = getDrivingCost(from, to, 10); // Using default fuel efficiency
  const distanceMeters = calculateDistanceMeters(from, to);

  return {
    success: true,
    newPosition: to,
    carInstanceId: car.instanceId,
    fuelUsed: cost.fuelCost,
    delta: {
      time: {
        hours: cost.timeHours,
      },
    },
    narrative: `Drove ${Math.round(distanceMeters)}m in ${Math.round(cost.timeHours * 60)} minutes. Used ${cost.fuelCost.toFixed(1)}L of fuel.`,
  };
}

/**
 * Get tow truck cost.
 */
export function getTowCost(): number {
  const mapData = getMapData();
  return mapData.towCost;
}

/**
 * Get the parking lot location for tow destination.
 */
export function getParkingLotPosition(): GridPosition {
  const parkingLot = getLocation('parking_lot');
  if (!parkingLot) {
    throw new Error('Parking lot location not found in map data');
  }
  return parkingLot.entryPoint;
}
