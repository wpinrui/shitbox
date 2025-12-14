/**
 * Engine public API
 * Re-exports all types and functions needed by the UI layer
 */

// Types
export * from './types';

// Constants
export const ENGINE_VERSION = '0.1.0';
export const STARTING_STAT_POINTS = 10;
export const MAX_ENERGY = 100;
export const HOURS_PER_DAY = 24;
export const MAX_PLAYER_NAME_LENGTH = 20;

// RNG
export { RNG, createRNG, deriveRNG } from './utils/rng';

// Data layer
export {
  loadEconomyData,
  loadActivityDefinitions,
  loadCoreActivities,
  getActivityDefinition,
  getLocationActivities,
  getAllActivities,
  getEconomyConfig,
  isEconomyLoaded,
  clearDataCache,
  type ActivityDefinition,
  type EconomyConfig,
  type Prerequisite,
  type Outcome,
  type StatGain,
} from './data';

// Validators
export {
  checkPrerequisites,
  checkEnergyAvailable,
  checkMoneyAvailable,
  type ValidationResult,
} from './utils/validators';

// Calculations
export {
  calculateEnergyCost,
  calculateEnergyRecovery,
  calculateMoneyCost,
  calculateMoneyEarned,
  calculateTimeCost,
  calculateStatGains,
  applyStatGains,
  getRestEnergyPerHour,
  getActivityHours,
  type ActivityParams,
} from './utils/calculations';

// Time system
export {
  advanceTime,
  processNewDay,
  checkDeathConditions,
  getTimeOfDay,
  formatTime,
  getTimeDescription,
  type TimeAdvanceResult,
  type NewDayResult,
  type DeathCheckResult,
} from './core/time';

// Activity execution
export {
  executeActivity,
  canPerformActivity,
  type ExecuteActivityInput,
} from './core/activity';
