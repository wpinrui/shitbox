/**
 * Time advancement and day processing system.
 * Handles time progression, day transitions, and death conditions.
 */

import type { GameState, GameTime, GameEvent } from '../types';
import type { EconomyConfig } from '../data';
import { HOURS_PER_DAY } from '../index';

/**
 * Result of advancing time
 */
export interface TimeAdvanceResult {
  newTime: GameTime;
  newDayStarted: boolean;
  daysAdvanced: number;
}

/**
 * Advance game time by a given number of hours.
 * Handles day overflow automatically.
 */
export function advanceTime(
  currentTime: GameTime,
  hours: number
): TimeAdvanceResult {
  let { currentDay, currentHour } = currentTime;
  const { currentMinute } = currentTime;

  // Add hours
  currentHour += hours;

  // Handle day overflow
  let daysAdvanced = 0;
  while (currentHour >= HOURS_PER_DAY) {
    currentHour -= HOURS_PER_DAY;
    currentDay += 1;
    daysAdvanced += 1;
  }

  return {
    newTime: {
      currentDay,
      currentHour: Math.floor(currentHour),
      currentMinute,
    },
    newDayStarted: daysAdvanced > 0,
    daysAdvanced,
  };
}

/**
 * Result of processing a new day
 */
export interface NewDayResult {
  daysWithoutFood: number;
  moneyChange: number;
  events: GameEvent[];
}

/**
 * Process new day events.
 * Auto-deducts food cost if affordable, otherwise increments hunger counter.
 */
export function processNewDay(
  state: GameState,
  economyConfig: EconomyConfig
): NewDayResult {
  const events: GameEvent[] = [];
  const foodCost = economyConfig.survival.dailyFoodCost;
  let daysWithoutFood: number;
  let moneyChange: number;

  // Generate day start event
  events.push({
    type: 'new_day',
    message: `Day ${state.time.currentDay + 1} begins.`,
  });

  // Auto-deduct food cost if player can afford it
  if (state.player.money >= foodCost) {
    // Can afford food - auto-deduct and reset hunger
    moneyChange = -foodCost;
    daysWithoutFood = 0;
    events.push({
      type: 'food_purchased',
      message: `Food purchased for $${foodCost}.`,
      data: { cost: foodCost },
    });
  } else {
    // Can't afford food - increment hunger counter
    moneyChange = 0;
    daysWithoutFood = state.player.daysWithoutFood + 1;

    const daysUntilDeath = economyConfig.survival.daysWithoutFoodUntilDeath - daysWithoutFood;

    if (daysUntilDeath <= 0) {
      events.push({
        type: 'death_imminent',
        message: 'You are starving! You will die if you do not eat.',
        data: { daysWithoutFood },
      });
    } else if (daysUntilDeath === 1) {
      events.push({
        type: 'hunger_critical',
        message: `You haven't eaten in ${daysWithoutFood} day(s). You need $${foodCost} for food or you will die!`,
        data: { daysWithoutFood },
      });
    } else {
      events.push({
        type: 'hunger_warning',
        message: `You can't afford food ($${foodCost}). ${daysUntilDeath} days until starvation.`,
        data: { daysWithoutFood },
      });
    }
  }

  return {
    daysWithoutFood,
    moneyChange,
    events,
  };
}

/**
 * Result of checking death conditions
 */
export interface DeathCheckResult {
  isDead: boolean;
  deathReason?: string;
}

/**
 * Check for death conditions.
 * Currently only checks starvation.
 */
export function checkDeathConditions(
  state: GameState,
  economyConfig: EconomyConfig
): DeathCheckResult {
  // Starvation check
  if (state.player.daysWithoutFood >= economyConfig.survival.daysWithoutFoodUntilDeath) {
    return {
      isDead: true,
      deathReason: `You starved to death after ${state.player.daysWithoutFood} days without food.`,
    };
  }

  // Future: Add bankruptcy check, etc.

  return { isDead: false };
}

/**
 * Get time of day category for UI/narrative purposes.
 */
export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Format time as a string (HH:MM).
 */
export function formatTime(time: GameTime): string {
  const hourStr = String(time.currentHour).padStart(2, '0');
  const minStr = String(time.currentMinute).padStart(2, '0');
  return `${hourStr}:${minStr}`;
}

/**
 * Get a human-readable time description.
 */
export function getTimeDescription(time: GameTime): string {
  const period = getTimeOfDay(time.currentHour);
  return `Day ${time.currentDay}, ${formatTime(time)} (${period})`;
}
