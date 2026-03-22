/**
 * Activity execution engine.
 * Core game logic for executing player activities.
 * All functions are pure with no side effects.
 */

import type { GameState, ActivityResult, StateDelta, GameEvent } from '../types';
import type { EconomyConfig } from '../data';
import { getActivityDefinition, getEconomyConfig } from '../data';
import { generateNewspaper } from '../systems/newspaper';
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

  // 2. Check newspaper re-purchase block
  if (
    activityId === 'buy_newspaper' &&
    state.newspaper.purchased &&
    state.newspaper.currentDay === state.time.currentDay
  ) {
    return {
      success: false,
      error: "You already have today's paper.",
    };
  }

  // 3. Get economy config
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
  let moneyCost = calculateMoneyCost(state, activity, params);
  const timeCost = calculateTimeCost(activity, params);

  // Override moneyCost for variable-mode activities whose real cost depends on runtime state.
  // Must happen before the affordability check so the check uses the actual amount.
  if (activity.outcomes.some((o) => o.type === 'refuelCar')) {
    const carForRefuel = state.inventory.cars.find(
      (c) =>
        c.position.x === state.player.position.x &&
        c.position.y === state.player.position.y
    );
    if (carForRefuel) {
      const fuelNeeded = carForRefuel.fuelCapacity - carForRefuel.fuel;
      moneyCost = Math.round(fuelNeeded * (activity.money.base ?? 2));
    }
  }

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
  let enginePartsChange = 0;
  let bodyPartsChange = 0;
  const carUpdates: Array<{ instanceId: string; fuel?: number }> = [];
  let generatedNewspaper: import('../types').NewspaperContent | null = null;

  for (const outcome of activity.outcomes) {
    switch (outcome.type) {
      case 'resetFoodCounter':
        foodCounterReset = true;
        events.push({
          type: 'food_eaten',
          message: 'You had a meal.',
        });
        break;

      case 'items': {
        const min = outcome.quantity?.min ?? 0;
        let max = outcome.quantity?.max ?? 1;
        // Apply stat modifier to max quantity
        if (outcome.statModifier && outcome.statModifier.effect === 'increaseMax') {
          const statValue = state.player.stats[outcome.statModifier.stat];
          max += Math.floor(statValue / 10);
        }
        const quantity = rng.randomInRange(min, max);
        if (quantity > 0) {
          if (outcome.itemType === 'engine_part') {
            enginePartsChange += quantity;
          } else if (outcome.itemType === 'body_part') {
            bodyPartsChange += quantity;
          } else {
            // random_part — split randomly between engine and body
            const engineCount = rng.randomInRange(0, quantity);
            enginePartsChange += engineCount;
            bodyPartsChange += quantity - engineCount;
          }
          events.push({
            type: 'items_found',
            message: `You found ${quantity} part${quantity > 1 ? 's' : ''}.`,
            data: { quantity, itemType: outcome.itemType },
          });
        } else {
          events.push({
            type: 'items_found',
            message: 'You searched but found nothing useful.',
            data: { quantity: 0 },
          });
        }
        break;
      }

      case 'refuelCar': {
        // Cost was pre-computed in step 4 and checked in step 5.
        // Here we just apply the car state change.
        const car = state.inventory.cars.find(
          (c) =>
            c.position.x === state.player.position.x &&
            c.position.y === state.player.position.y
        );
        if (car) {
          const fuelAdded = car.fuelCapacity - car.fuel;
          carUpdates.push({ instanceId: car.instanceId, fuel: car.fuelCapacity });
          events.push({
            type: 'car_refueled',
            message: `Filled up ${Math.round(fuelAdded)}L of fuel for $${Math.abs(moneyChange)}.`,
            data: { fuelAdded, cost: Math.abs(moneyChange) },
          });
        }
        break;
      }

      case 'showListings':
        events.push({
          type: 'listings_shown',
          message: 'You browse the available vehicles.',
          data: { listingType: outcome.listingType },
        });
        break;

      case 'acquireCar':
        events.push({
          type: 'car_acquired',
          message: 'Car acquisition requires the car listing system.',
          data: { source: outcome.source },
        });
        break;

      case 'removeCar':
        events.push({
          type: 'car_removed',
          message: 'Car removal requires the car listing system.',
          data: { source: outcome.source },
        });
        break;

      case 'conditionalCost':
        events.push({
          type: 'conditional_cost',
          message: outcome.description ?? 'Additional cost may apply.',
          data: { condition: outcome.condition, cost: outcome.cost },
        });
        break;

      case 'generateNewspaper':
        generatedNewspaper = generateNewspaper(state, rng);
        events.push({
          type: 'newspaper_purchased',
          message: "You pick up today's paper.",
          data: { day: state.time.currentDay },
        });
        break;
    }
  }

  // 8. Build state delta
  const hasInventoryChanges = enginePartsChange !== 0 || bodyPartsChange !== 0;
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
    inventory: hasInventoryChanges
      ? { engineParts: enginePartsChange, bodyParts: bodyPartsChange }
      : undefined,
    carUpdates: carUpdates.length > 0 ? carUpdates : undefined,
    newspaper: generatedNewspaper
      ? { content: generatedNewspaper, purchased: true, currentDay: state.time.currentDay }
      : undefined,
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
    case 'sleep':
      return `You slept for ${hourStr} and recovered ${energyChange} energy.`;

    case 'nap':
      return `You napped for ${hourStr} and recovered ${energyChange} energy.`;

    case 'refuel':
      return delta.carUpdates?.[0]
        ? `Filled up your car. (${hourStr})`
        : `No car to refuel. (${hourStr})`;

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

  // Block newspaper re-purchase for the same day
  if (
    activityId === 'buy_newspaper' &&
    state.newspaper.purchased &&
    state.newspaper.currentDay === state.time.currentDay
  ) {
    return { canPerform: false, reason: "You already have today's paper." };
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

  // Check money — mirror the variable-cost pre-computation from executeActivity
  let moneyCost = calculateMoneyCost(state, activity, params);
  if (activity.outcomes.some((o) => o.type === 'refuelCar')) {
    const carForRefuel = state.inventory.cars.find(
      (c) =>
        c.position.x === state.player.position.x &&
        c.position.y === state.player.position.y
    );
    if (carForRefuel) {
      const fuelNeeded = carForRefuel.fuelCapacity - carForRefuel.fuel;
      moneyCost = Math.round(fuelNeeded * (activity.money.base ?? 2));
    }
  }
  if (state.player.money < moneyCost) {
    return { canPerform: false, reason: `Need $${moneyCost}` };
  }

  return { canPerform: true };
}
