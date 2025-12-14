/**
 * Prerequisite validation for activities.
 * All validators are pure functions with no side effects.
 */

import type { GameState } from '../types';
import type { Prerequisite } from '../data';
import type { ActivityParams } from './calculations';

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

    case 'context':
      // Context prerequisites are handled at the UI level
      // For now, always pass
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Check if player has enough money.
 */
function checkMoneyPrerequisite(
  state: GameState,
  prereq: Prerequisite
): ValidationResult {
  const minimum = typeof prereq.minimum === 'number' ? prereq.minimum : 0;

  if (state.player.money < minimum) {
    return {
      valid: false,
      reason: `Not enough money. Need $${minimum}, have $${state.player.money}.`,
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
      reason: `${prereq.stat} too low. Need ${minimum}, have ${currentLevel}.`,
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
      reason: `Missing license: ${prereq.requirement}`,
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
          reason: `Not enough engine parts. Need ${minimum}, have ${state.inventory.engineParts}.`,
        };
      }
      break;

    case 'bodyParts':
      if (state.inventory.bodyParts < minimum) {
        return {
          valid: false,
          reason: `Not enough body parts. Need ${minimum}, have ${state.inventory.bodyParts}.`,
        };
      }
      break;
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
      reason: `Not enough energy. Need ${requiredEnergy}, have ${state.player.energy}.`,
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
      reason: `Not enough money. Need $${requiredMoney}, have $${state.player.money}.`,
    };
  }

  return { valid: true };
}
