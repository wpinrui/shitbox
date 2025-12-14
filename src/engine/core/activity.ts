/**
 * Activity execution engine.
 * Core game logic for executing player activities.
 * All functions are pure with no side effects.
 */

import type { GameState, ActivityResult, StateDelta, GameEvent } from '../types';
import type { EconomyConfig } from '../data';
import { getActivityDefinition, getEconomyConfig } from '../data';
import { RNG } from '../utils/rng';
import { checkPrerequisites, checkEnergyAvailable, checkMoneyAvailable } from '../utils/validators';
import {
  calculateEnergyCost,
  calculateEnergyRecovery,
  calculateMoneyCost,
  calculateMoneyEarned,
  calculateTimeCost,
  calculateStatGains,
  type ActivityParams,
} from '../utils/calculations';

/**
 * Input for executing an activity
 */
export interface ExecuteActivityInput {
  state: GameState;
  activityId: string;
  params: ActivityParams;
  rng: RNG;
}

/**
 * Execute an activity and return the result.
 * This is the main entry point for activity execution.
 */
export function executeActivity(input: ExecuteActivityInput): ActivityResult {
  const { state, activityId, params, rng } = input;

  // 1. Get activity definition
  const activity = getActivityDefinition(activityId);
  if (!activity) {
    return {
      success: false,
      error: `Unknown activity: ${activityId}`,
    };
  }

  // 2. Get economy config
  let economyConfig: EconomyConfig;
  try {
    economyConfig = getEconomyConfig();
  } catch {
    return {
      success: false,
      error: 'Economy data not loaded.',
    };
  }

  // 3. Validate prerequisites
  const prereqResult = checkPrerequisites(state, activity.prerequisites, params);
  if (!prereqResult.valid) {
    return {
      success: false,
      error: prereqResult.reason,
    };
  }

  // 4. Calculate costs
  const energyCost = calculateEnergyCost(state, activity, params);
  const moneyCost = calculateMoneyCost(state, activity, params);
  const timeCost = calculateTimeCost(activity, params);

  // 5. Check affordability
  const energyCheck = checkEnergyAvailable(state, energyCost);
  if (!energyCheck.valid) {
    return {
      success: false,
      error: energyCheck.reason,
    };
  }

  const moneyCheck = checkMoneyAvailable(state, moneyCost);
  if (!moneyCheck.valid) {
    return {
      success: false,
      error: moneyCheck.reason,
    };
  }

  // 6. Calculate outcomes
  const events: GameEvent[] = [];
  let energyChange = -energyCost;
  let moneyChange = -moneyCost;

  // Handle energy recovery activities
  if (activity.energy.type === 'recover') {
    const recovery = calculateEnergyRecovery(state, activity, params, economyConfig);
    energyChange = recovery; // Positive value
  }

  // Handle money earning activities
  if (activity.money.type === 'earn') {
    const earnings = calculateMoneyEarned(state, activity, params);
    // Apply variance using RNG
    const variance = activity.money.variance ?? 0;
    const actualVariance = variance > 0 ? rng.randomInRange(-variance, variance) : 0;
    moneyChange = Math.round(earnings + actualVariance);
  }

  // Calculate stat gains
  const statGains = calculateStatGains(activity, params, state.player.stats.knowledge);

  // 7. Process special outcomes
  let foodCounterReset = false;

  for (const outcome of activity.outcomes) {
    switch (outcome.type) {
      case 'resetFoodCounter':
        foodCounterReset = true;
        events.push({
          type: 'food_eaten',
          message: 'You had a meal.',
        });
        break;

      // Future: Handle other outcome types
      // case 'items':
      // case 'acquireCar':
      // etc.
    }
  }

  // 8. Build state delta
  const delta: StateDelta = {
    player: {
      energy: energyChange,
      money: moneyChange,
      stats: Object.keys(statGains).length > 0 ? statGains : undefined,
      daysWithoutFood: foodCounterReset ? -state.player.daysWithoutFood : undefined,
    },
    time: {
      hours: timeCost,
    },
    events,
  };

  // 9. Generate narrative
  const narrative = generateNarrative(activity.id, delta, timeCost);

  return {
    success: true,
    delta,
    narrative,
  };
}

/**
 * Pluralize "hour" based on count.
 */
function pluralizeHours(hours: number): string {
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

/**
 * Generate a narrative description of what happened.
 */
function generateNarrative(
  activityId: string,
  delta: StateDelta,
  hours: number
): string {
  const moneyChange = delta.player?.money ?? 0;
  const energyChange = delta.player?.energy ?? 0;
  const hourStr = pluralizeHours(hours);

  switch (activityId) {
    case 'eat':
      return `You spent $${Math.abs(moneyChange)} on food. (1 hour)`;

    case 'sleep':
      return `You slept for ${hourStr} and recovered ${energyChange} energy.`;

    case 'wait':
      return `You waited for ${hourStr} and recovered ${energyChange} energy.`;

    default:
      if (moneyChange > 0) {
        return `You earned $${moneyChange}. (${hourStr})`;
      } else if (moneyChange < 0) {
        return `You spent $${Math.abs(moneyChange)}. (${hourStr})`;
      }
      return `Activity completed. (${hourStr})`;
  }
}

/**
 * Check if an activity can be performed (for UI display).
 */
export function canPerformActivity(
  state: GameState,
  activityId: string,
  params: ActivityParams = {}
): { canPerform: boolean; reason?: string } {
  const activity = getActivityDefinition(activityId);
  if (!activity) {
    return { canPerform: false, reason: 'Unknown activity' };
  }

  // Check prerequisites
  const prereqResult = checkPrerequisites(state, activity.prerequisites, params);
  if (!prereqResult.valid) {
    return { canPerform: false, reason: prereqResult.reason };
  }

  // Check energy
  const energyCost = calculateEnergyCost(state, activity, params);
  if (state.player.energy < energyCost) {
    return { canPerform: false, reason: `Need ${energyCost} energy` };
  }

  // Check money
  const moneyCost = calculateMoneyCost(state, activity, params);
  if (state.player.money < moneyCost) {
    return { canPerform: false, reason: `Need $${moneyCost}` };
  }

  return { canPerform: true };
}
