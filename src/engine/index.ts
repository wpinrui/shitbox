/**
 * Engine public API
 * Re-exports all types and functions needed by the UI layer
 */

// Types
export * from './types';

// RNG
export { RNG, createRNG, deriveRNG } from './utils/rng';

// Constants
export const ENGINE_VERSION = '0.1.0';

export const STARTING_STAT_POINTS = 25;
export const MAX_ENERGY = 100;
export const HOURS_PER_DAY = 24;
export const MAX_PLAYER_NAME_LENGTH = 20;
