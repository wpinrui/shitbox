/**
 * Prerequisite validation for activities.
 * All validators are pure functions with no side effects.
 */

import type { GameState } from '../types';
import type { Prerequisite } from '../data';
import type { ActivityParams } from './calculations';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Result of a validation check
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Check all prerequisites for an activity.
 * Returns valid: true if all pass, or valid: false with reason if any fail.
 */
export function checkPrerequisites(
  state: GameState,
  prerequisites: Prerequisite[],
  params: ActivityParams
): ValidationResult {
  for (const prereq of prerequisites) {
    const result = checkSinglePrerequisite(state, prereq, params);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Check a single prerequisite.
 */
function checkSinglePrerequisite(
  state: GameState,
  prereq: Prerequisite,
  _params: ActivityParams
): ValidationResult {
  switch (prereq.type) {
    case 'money':
      return checkMoneyPrerequisite(state, prereq);

    case 'stat':
      return checkStatPrerequisite(state, prereq);

    case 'license':
      return checkLicensePrerequisite(state, prereq);

    case 'ownership':
      return checkOwnershipPrerequisite(state, prereq);

    case 'item':
      return checkItemPrerequisite(state, prereq);

    case 'hasCarHere':
      return checkHasCarHere(state);

    case 'hasCarElsewhere':
      return checkHasCarElsewhere(state);

    case 'context':
      return checkContextPrerequisite(prereq);

    default:
      return { valid: true };
  }
}

/**
 * Check if player has enough money.
 * Dynamic references (e.g. "carPrice") are deferred to execution time.
 */
function checkMoneyPrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  if (typeof prereq.minimum === 'string') {
    // Dynamic money prerequisites (e.g. "carPrice") can't be resolved at
    // card-display time — defer to execution.
    return { valid: true };
  }

  const minimum = prereq.minimum ?? 0;

  if (state.player.money < minimum) {
    return {
      valid: false,
      reason: `You need at least $${minimum}.`,
    };
  }

  return { valid: true };
}

/**
 * Check if player has minimum stat level.
 */
function checkStatPrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  if (!prereq.stat) {
    return { valid: true };
  }

  const minimum = typeof prereq.minimum === 'number' ? prereq.minimum : 0;
  const currentLevel = state.player.stats[prereq.stat];

  if (currentLevel < minimum) {
    return {
      valid: false,
      reason: `You need at least ${minimum} ${capitalize(prereq.stat)} skill.`,
    };
  }

  return { valid: true };
}

/**
 * Check if player has required license.
 */
function checkLicensePrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  if (!prereq.requirement) {
    return { valid: true };
  }

  if (!state.player.licenses.includes(prereq.requirement)) {
    return {
      valid: false,
      reason: `Requires a ${prereq.requirement} license.`,
    };
  }

  return { valid: true };
}

/**
 * Check if player owns required item type.
 */
function checkOwnershipPrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  if (!prereq.itemType) {
    return { valid: true };
  }

  switch (prereq.itemType) {
    case 'car':
      if (state.inventory.cars.length === 0) {
        return {
          valid: false,
          reason: 'You need to own a car.',
        };
      }
      break;

    case 'garage':
      if (!state.assets.garage) {
        return {
          valid: false,
          reason: 'You need to own a garage.',
        };
      }
      break;

    case 'workshop':
      if (!state.assets.workshop) {
        return {
          valid: false,
          reason: 'You need to own a workshop.',
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if player has required items.
 */
function checkItemPrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  if (!prereq.itemType) {
    return { valid: true };
  }

  const minimum = typeof prereq.minimum === 'number' ? prereq.minimum : 1;

  switch (prereq.itemType) {
    case 'engineParts':
      if (state.inventory.engineParts < minimum) {
        return {
          valid: false,
          reason: `Requires engine parts \u2014 you have ${state.inventory.engineParts}.`,
        };
      }
      break;

    case 'bodyParts':
      if (state.inventory.bodyParts < minimum) {
        return {
          valid: false,
          reason: `Requires body parts \u2014 you have ${state.inventory.bodyParts}.`,
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if the player has a car at their current position.
 */
function checkHasCarHere(state: GameState): ValidationResult {
  const hasCar = state.inventory.cars.some(
    (car) =>
      car.position.x === state.player.position.x &&
      car.position.y === state.player.position.y
  );

  if (!hasCar) {
    return {
      valid: false,
      reason: 'You need a car at this location.',
    };
  }

  return { valid: true };
}

/**
 * Check if the player has a car at a different position (for tow).
 */
function checkHasCarElsewhere(state: GameState): ValidationResult {
  const hasCarElsewhere = state.inventory.cars.some(
    (car) =>
      car.position.x !== state.player.position.x ||
      car.position.y !== state.player.position.y
  );

  if (!hasCarElsewhere) {
    return {
      valid: false,
      reason: 'All your cars are already here.',
    };
  }

  return { valid: true };
}

/**
 * Check context prerequisites — gate on runtime context that the UI
 * must supply (e.g. a selected car listing).
 */
function checkContextPrerequisite(prereq: Prerequisite): ValidationResult {
  if (prereq.requirement === 'selectedCar') {
    return {
      valid: false,
      reason: 'Browse junkers first to select a car.',
    };
  }

  return { valid: true };
}

/**
 * Check if player has enough energy for an activity.
 */
export function checkEnergyAvailable(
  state: GameState,
  requiredEnergy: number
): ValidationResult {
  if (state.player.energy < requiredEnergy) {
    return {
      valid: false,
      reason: `Requires ${requiredEnergy} energy.`,
    };
  }

  return { valid: true };
}

/**
 * Check if player can afford a money cost.
 */
export function checkMoneyAvailable(
  state: GameState,
  requiredMoney: number
): ValidationResult {
  if (state.player.money < requiredMoney) {
    return {
      valid: false,
      reason: `You need $${requiredMoney}.`,
    };
  }

  return { valid: true };
}
