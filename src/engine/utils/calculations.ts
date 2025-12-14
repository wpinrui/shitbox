/**
 * Calculation utilities for activity costs, rewards, and stat modifiers.
 * All calculations are pure functions with no side effects.
 */

import type { GameState, PlayerStats } from '../types';
import type { ActivityDefinition, EconomyConfig } from '../data';
import { MAX_ENERGY } from '../index';

/**
 * Parameters passed when executing an activity
 */
export interface ActivityParams {
  hours?: number;
  targetCarId?: string;
  amount?: number;
}

/**
 * Calculate the energy cost of an activity, applying stat modifiers.
 */
export function calculateEnergyCost(
  state: GameState,
  activity: ActivityDefinition,
  params: ActivityParams
): number {
  if (activity.energy.type === 'none' || activity.energy.type === 'recover') {
    return 0;
  }

  const hours = getActivityHours(activity, params);
  let baseCost = activity.energy.base ?? 0;

  // Scale by hours if perHour type
  if (activity.energy.type === 'perHour') {
    baseCost *= hours;
  }

  // Apply fitness modifier: -2% energy cost per point
  const fitnessReduction = state.player.stats.fitness * 0.02;
  const finalCost = baseCost * (1 - fitnessReduction);

  return Math.max(0, Math.round(finalCost));
}

/**
 * Calculate energy recovery for rest activities.
 */
export function calculateEnergyRecovery(
  state: GameState,
  activity: ActivityDefinition,
  params: ActivityParams,
  economyConfig: EconomyConfig
): number {
  if (activity.energy.type !== 'recover') {
    return 0;
  }

  const hours = getActivityHours(activity, params);
  let ratePerHour = activity.energy.base ?? 0;

  // Apply housing modifier if applicable
  if (activity.energy.housingModifier) {
    ratePerHour = getRestEnergyPerHour(state.player.housing.type, economyConfig);
  }

  // Apply fitness rest efficiency bonus: +2% per point
  const fitnessBonus = state.player.stats.fitness * 0.02;
  const effectiveRate = ratePerHour * (1 + fitnessBonus);

  const recovery = effectiveRate * hours;

  // Cap at max energy
  const currentEnergy = state.player.energy;
  const maxRecovery = MAX_ENERGY - currentEnergy;

  return Math.min(Math.round(recovery), maxRecovery);
}

/**
 * Get rest energy recovery rate based on housing type.
 */
export function getRestEnergyPerHour(
  housingType: 'shitbox' | 'renting' | 'owning',
  economyConfig: EconomyConfig
): number {
  switch (housingType) {
    case 'shitbox':
      return economyConfig.rest.shitboxEnergyPerHour;
    case 'renting':
      // Default to basic apartment for renting
      return economyConfig.rest.basicApartmentEnergyPerHour;
    case 'owning':
      return economyConfig.rest.ownedHomeEnergyPerHour;
    default:
      return economyConfig.rest.shitboxEnergyPerHour;
  }
}

/**
 * Calculate the money cost of an activity.
 */
export function calculateMoneyCost(
  _state: GameState,
  activity: ActivityDefinition,
  params: ActivityParams
): number {
  if (activity.money.type !== 'spend') {
    return 0;
  }

  if (activity.money.mode === 'fixed') {
    return activity.money.base ?? 0;
  }

  if (activity.money.mode === 'perHour') {
    const hours = getActivityHours(activity, params);
    return (activity.money.base ?? 0) * hours;
  }

  // For negotiated or other modes, return 0 (handled elsewhere)
  return 0;
}

/**
 * Calculate money earned from an activity.
 */
export function calculateMoneyEarned(
  state: GameState,
  activity: ActivityDefinition,
  params: ActivityParams
): number {
  if (activity.money.type !== 'earn') {
    return 0;
  }

  const hours = getActivityHours(activity, params);
  let baseEarnings = activity.money.base ?? 0;

  if (activity.money.mode === 'perHour') {
    baseEarnings *= hours;
  }

  // Apply variance if specified
  // Note: This should use RNG for randomness, but for now we use base value
  // The actual variance will be applied in the activity execution with RNG

  // Apply stat modifier if specified
  if (activity.money.statModifier) {
    const statValue = state.player.stats[activity.money.statModifier.stat];
    if (activity.money.statModifier.effect === 'increase') {
      // Typical formula: base * (1 + stat * modifier)
      // We'll use a default 0.05 bonus per point (5%)
      baseEarnings *= 1 + statValue * 0.05;
    }
  }

  return Math.round(baseEarnings);
}

/**
 * Calculate the time cost of an activity in hours.
 */
export function calculateTimeCost(
  activity: ActivityDefinition,
  params: ActivityParams
): number {
  return getActivityHours(activity, params);
}

/**
 * Get the number of hours for an activity based on its definition and params.
 */
export function getActivityHours(
  activity: ActivityDefinition,
  params: ActivityParams
): number {
  if (activity.time.type === 'fixed') {
    return activity.time.hours ?? 1;
  }

  // Variable time - use params.hours if provided, otherwise default to minimum
  if (params.hours !== undefined) {
    const minHours = activity.time.minHours ?? 1;
    const maxHours = activity.time.maxHours ?? 12;
    return Math.max(minHours, Math.min(maxHours, params.hours));
  }

  return activity.time.minHours ?? 1;
}

/**
 * Calculate stat gains from an activity.
 */
export function calculateStatGains(
  activity: ActivityDefinition,
  params: ActivityParams,
  knowledgeLevel: number
): Partial<PlayerStats> {
  const gains: Partial<PlayerStats> = {};

  if (!activity.statGain || activity.statGain.length === 0) {
    return gains;
  }

  const hours = getActivityHours(activity, params);

  // Knowledge bonus: +3% per point
  const knowledgeMultiplier = 1 + knowledgeLevel * 0.03;

  for (const statGain of activity.statGain) {
    let amount = statGain.amount;

    // Scale by hours if per-hour gain
    if (statGain.per === 'hour') {
      amount *= hours;
    }

    // Apply knowledge multiplier
    amount *= knowledgeMultiplier;

    gains[statGain.stat] = amount;
  }

  return gains;
}

/**
 * Apply stat gains to player stats, respecting max level.
 */
export function applyStatGains(
  currentStats: PlayerStats,
  gains: Partial<PlayerStats>,
  maxStatLevel: number = 20
): PlayerStats {
  const newStats = { ...currentStats };

  for (const [stat, gain] of Object.entries(gains)) {
    if (gain !== undefined) {
      const key = stat as keyof PlayerStats;
      newStats[key] = Math.min(maxStatLevel, currentStats[key] + gain);
    }
  }

  return newStats;
}
