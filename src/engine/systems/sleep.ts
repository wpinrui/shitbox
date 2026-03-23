/**
 * Sleep & energy recovery system.
 * Determines sleep options and rates based on player location and housing.
 */

import type { GameState, GameEvent, GameTime, CarListing } from '../types';
import type { EconomyConfig } from '../data';
import { getEconomyConfig, getLocation } from '../data';
import { advanceTime, processNewDay, checkDeathConditions } from '../core/time';
import { MAX_ENERGY, HOURS_PER_DAY } from '../index';

// ============================================================================
// Types
// ============================================================================

export interface SleepOption {
  id: 'home' | 'car' | 'crash';
  label: string;
  rate: number;
  hours: number;
}

export interface SleepContext {
  /** Best available rate at the current location */
  bestRate: number;
  /** Best option label */
  bestLabel: string;
  /** Projected sleep hours at the best rate */
  bestHours: number;
  /** All available options (for crash prompt) */
  options: SleepOption[];
}

export interface TimeAdvanceOutcome {
  newState: GameState;
  events: GameEvent[];
  isDead: boolean;
  deathReason?: string;
}

// ============================================================================
// Sleep Rate Calculation
// ============================================================================

/**
 * Determine all sleep options available at the player's current location.
 * Options are ordered best-to-worst. "Sleep in car" is hidden when
 * "Sleep at home" is available.
 */
export function getSleepOptions(state: GameState): SleepOption[] {
  const config = getEconomyConfig();
  const energy = state.player.energy;
  const toRecover = MAX_ENERGY - energy; // Can be > 100 if energy is negative
  const options: SleepOption[] = [];

  const isAtHome = getIsAtHome(state);
  const hasCarHere = state.inventory.cars.some(
    (c) =>
      c.position.x === state.player.position.x &&
      c.position.y === state.player.position.y
  );

  // Home option
  if (isAtHome) {
    const rate = getHomeRate(state.player.housing.type, config);
    options.push({
      id: 'home',
      label: 'Sleep at home',
      rate,
      hours: Math.ceil(toRecover / rate),
    });
  }

  // Car option — hidden when at home
  if (hasCarHere && !isAtHome) {
    const rate = config.rest.shitboxEnergyPerHour;
    options.push({
      id: 'car',
      label: 'Sleep in your car',
      rate,
      hours: Math.ceil(toRecover / rate),
    });
  }

  // Crash out — always available
  const crashRate = config.rest.crashOutEnergyPerHour;
  options.push({
    id: 'crash',
    label: 'Crash out',
    rate: crashRate,
    hours: Math.ceil(toRecover / crashRate),
  });

  return options;
}

/**
 * Get the full sleep context for the player's current location.
 * Used for both voluntary sleep confirmation and crash prompt.
 */
export function getSleepContext(state: GameState): SleepContext {
  const options = getSleepOptions(state);
  const best = options[0]; // First option is always the best rate

  return {
    bestRate: best.rate,
    bestLabel: best.label,
    bestHours: best.hours,
    options,
  };
}

/**
 * Check if the player is at their home location (renting or owning tier).
 */
function getIsAtHome(state: GameState): boolean {
  const { housing } = state.player;
  if (housing.type === 'shitbox' || !housing.propertyId) return false;

  // propertyId maps to a location ID — check if player is at that location
  const homeLoc = getLocation(housing.propertyId);
  if (!homeLoc) return false;

  return (
    state.player.position.x === homeLoc.position.x &&
    state.player.position.y === homeLoc.position.y
  );
}

/**
 * Get the home sleep rate based on housing tier.
 */
function getHomeRate(
  housingType: 'shitbox' | 'renting' | 'owning',
  config: EconomyConfig
): number {
  switch (housingType) {
    case 'renting':
      return config.rest.basicApartmentEnergyPerHour;
    case 'owning':
      return config.rest.ownedHomeEnergyPerHour;
    default:
      return config.rest.shitboxEnergyPerHour;
  }
}

// ============================================================================
// Time Advance with Day Boundary Processing
// ============================================================================

/**
 * Advance time by the given hours, processing day boundary effects
 * (food deduction, starvation, newspaper reset) for each midnight crossed.
 *
 * Used by both sleep and chill.
 */
export function advanceTimeWithDayProcessing(
  state: GameState,
  totalHours: number
): TimeAdvanceOutcome {
  const economyConfig = getEconomyConfig();
  let currentState = { ...state };
  let remainingHours = totalHours;
  const allEvents: GameEvent[] = [];

  while (remainingHours > 0) {
    const hoursUntilMidnight = HOURS_PER_DAY - currentState.time.currentHour;

    if (remainingHours >= hoursUntilMidnight && hoursUntilMidnight > 0) {
      // This chunk crosses midnight
      const timeResult = advanceTime(currentState.time, hoursUntilMidnight);
      currentState = { ...currentState, time: timeResult.newTime };
      remainingHours -= hoursUntilMidnight;

      // Process new day
      const dayResult = processNewDay(currentState, economyConfig);
      currentState = {
        ...currentState,
        player: {
          ...currentState.player,
          money: currentState.player.money + dayResult.moneyChange,
          daysWithoutFood: dayResult.daysWithoutFood,
        },
        newspaper: {
          currentDay: currentState.time.currentDay,
          content: null,
          purchased: false,
        },
        market: dayResult.expiredListingsRemoved
          ? { ...currentState.market, currentListings: dayResult.currentListings }
          : currentState.market,
      };
      allEvents.push(...dayResult.events);

      // Check death conditions
      const deathCheck = checkDeathConditions(currentState, economyConfig);
      if (deathCheck.isDead) {
        return {
          newState: currentState,
          events: allEvents,
          isDead: true,
          deathReason: deathCheck.deathReason,
        };
      }
    } else {
      // Remaining hours don't cross midnight
      const timeResult = advanceTime(currentState.time, remainingHours);
      currentState = { ...currentState, time: timeResult.newTime };
      remainingHours = 0;
    }
  }

  return { newState: currentState, events: allEvents, isDead: false };
}

// ============================================================================
// Chill Hour Presets
// ============================================================================

export interface ChillPreset {
  label: string;
  hours: number;
}

/**
 * Get available chill presets based on the current time.
 * Filters out presets that would be 0 hours.
 */
export function getChillPresets(currentTime: GameTime): ChillPreset[] {
  const { currentHour } = currentTime;
  const presets: ChillPreset[] = [];

  presets.push({ label: '1 hour', hours: 1 });
  presets.push({ label: '2 hours', hours: 2 });
  presets.push({ label: '4 hours', hours: 4 });

  // Until morning (6 AM)
  const hoursUntilMorning = hoursUntil(currentHour, 6);
  if (hoursUntilMorning > 0) {
    presets.push({ label: 'Until morning', hours: hoursUntilMorning });
  }

  // Until evening (18:00)
  const hoursUntilEvening = hoursUntil(currentHour, 18);
  if (hoursUntilEvening > 0) {
    presets.push({ label: 'Until evening', hours: hoursUntilEvening });
  }

  return presets;
}

/**
 * Hours from currentHour until targetHour (wrapping around midnight).
 * Returns 0 only if we're exactly at the target.
 */
function hoursUntil(currentHour: number, targetHour: number): number {
  let h = targetHour - currentHour;
  if (h <= 0) h += HOURS_PER_DAY;
  return h;
}
