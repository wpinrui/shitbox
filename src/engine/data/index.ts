/**
 * Data loading and caching for game configuration files.
 * All game data is loaded from JSON files and cached in memory.
 */

import type { PlayerStats } from '../types';

// ============================================================================
// Activity Definition Types
// ============================================================================

export interface ActivityDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  time: TimeDefinition;
  energy: EnergyDefinition;
  money: MoneyDefinition;
  prerequisites: Prerequisite[];
  outcomes: Outcome[];
  statGain: StatGain[];
  risks: Risk[];
  confirmationRequired?: boolean;
  confirmationMessage?: string;
}

export interface TimeDefinition {
  type: 'fixed' | 'variable';
  hours?: number;
  minHours?: number;
  maxHours?: number;
  unit?: 'hour';
}

export interface EnergyDefinition {
  type: 'fixed' | 'perHour' | 'recover' | 'none';
  base?: number;
  mode?: 'perHour';
  statModifier?: StatModifier;
  housingModifier?: boolean;
}

export interface MoneyDefinition {
  type: 'earn' | 'spend' | 'none';
  mode?: 'fixed' | 'perHour' | 'negotiated' | 'carScrapValue';
  base?: number;
  variance?: number;
  formula?: string;
  statModifier?: StatModifier;
}

export interface StatModifier {
  stat: keyof PlayerStats;
  effect: 'reduce' | 'increase' | 'increaseMax';
  formula: string;
}

export interface Prerequisite {
  type: 'money' | 'stat' | 'item' | 'license' | 'ownership' | 'context';
  minimum?: number | string;
  stat?: keyof PlayerStats;
  requirement?: string;
  itemType?: string;
}

export interface Outcome {
  type: 'items' | 'showListings' | 'acquireCar' | 'removeCar' | 'conditionalCost' | 'resetFoodCounter';
  itemType?: string;
  quantity?: { min: number; max: number };
  statModifier?: StatModifier;
  listingType?: string;
  priceRange?: { min: number; max: number };
  source?: string;
  condition?: string;
  cost?: { min: number; max: number };
  description?: string;
  value?: number;
}

export interface StatGain {
  stat: keyof PlayerStats;
  amount: number;
  per: 'hour' | 'activity';
}

export interface Risk {
  type: string;
  chance: number;
  consequence: string;
}

export interface ActivityFile {
  locationId: string;
  locationName: string;
  activities: ActivityDefinition[];
}

// ============================================================================
// Economy Config Types
// ============================================================================

export interface EconomyConfig {
  version: string;
  resources: {
    maxEnergy: number;
    startingMoney: number;
    startingStatPoints: number;
  };
  survival: {
    dailyFoodCost: number;
    daysWithoutFoodUntilDeath: number;
  };
  rest: {
    shitboxEnergyPerHour: number;
    basicApartmentEnergyPerHour: number;
    niceApartmentEnergyPerHour: number;
    ownedHomeEnergyPerHour: number;
    lightRestEnergyPerHour: number;
  };
  housing: {
    basicApartmentRent: number;
    niceApartmentRent: number;
    basicApartmentBuyPrice: { min: number; max: number };
    niceApartmentBuyPrice: { min: number; max: number };
    houseBuyPrice: { min: number; max: number };
  };
  parking: {
    seasonParkingMonthly: { min: number; max: number };
  };
  newspaper: {
    dailyCost: number;
  };
  ads: {
    freeAdResponseChancePerDay: number;
    paidAdCost: { min: number; max: number };
    paidAdResponseChancePerDay: { min: number; max: number };
  };
  bank: {
    savingsInterestMonthly: number;
    indexFund: {
      averageAnnualReturn: number;
      dailyVolatility: number;
      withdrawalDelayDays: number;
    };
    loans: {
      personal: { aprMin: number; aprMax: number };
      auto: { aprMin: number; aprMax: number };
      mortgage: { aprMin: number; aprMax: number };
      business: { aprMin: number; aprMax: number };
    };
    missedPaymentLateFeePercent: number;
    missedPaymentsUntilRateIncrease: number;
    missedPaymentsUntilRepo: number;
  };
  fines: {
    speedingTicket: { min: number; max: number };
  };
  commissions: {
    auctionHouseFee: number;
    consignmentCommission: number;
    realEstateAgentFee: { min: number; max: number };
    dealerTradeInPercent: number;
  };
  statEffects: {
    charisma: {
      traitVisibilityPerPoint: number;
      adResponseBonusPerPoint: number;
      earningsBonusPerPoint: number;
    };
    mechanical: {
      repairQualityBonusPerPoint: number;
      partFindBonusPerPoint: number;
      valueSpotAccuracyPerPoint: number;
      earningsBonusPerPoint: number;
    };
    fitness: {
      energyCostReductionPerPoint: number;
      restEfficiencyBonusPerPoint: number;
      laborOutputBonusPerPoint: number;
    };
    knowledge: {
      researchAccuracyPerPoint: number;
      hiddenListingChancePerPoint: number;
      statGainBonusPerPoint: number;
    };
    driving: {
      roadTripRiskReductionPerPoint: number;
      deliveryEfficiencyBonusPerPoint: number;
      ticketAvoidancePerPoint: number;
      fuelEfficiencyBonusPerPoint: number;
      carWearReductionPerPoint: number;
    };
  };
}

// ============================================================================
// Data Cache
// ============================================================================

const dataCache = {
  economy: null as EconomyConfig | null,
  activities: new Map<string, ActivityDefinition[]>(),
  activityById: new Map<string, ActivityDefinition>(),
};

// ============================================================================
// Loading Functions
// ============================================================================

/**
 * Load economy configuration from JSON.
 * Uses Electron IPC to read from data/ folder.
 */
export async function loadEconomyData(): Promise<EconomyConfig> {
  if (dataCache.economy) {
    return dataCache.economy;
  }

  const data = await window.electronAPI.loadData('economy.json');
  dataCache.economy = data as EconomyConfig;
  return dataCache.economy;
}

/**
 * Load activity definitions for a specific location.
 * Caches results and indexes activities by ID.
 */
export async function loadActivityDefinitions(locationId: string): Promise<ActivityDefinition[]> {
  if (dataCache.activities.has(locationId)) {
    return dataCache.activities.get(locationId)!;
  }

  const data = await window.electronAPI.loadData(`activities/${locationId}.json`);
  const activityFile = data as ActivityFile;

  // Cache the activities
  dataCache.activities.set(locationId, activityFile.activities);

  // Index by ID for quick lookup
  for (const activity of activityFile.activities) {
    dataCache.activityById.set(activity.id, activity);
  }

  return activityFile.activities;
}

/**
 * Load all core activity files needed for Phase 1.
 */
export async function loadCoreActivities(): Promise<void> {
  await loadActivityDefinitions('misc');
}

// ============================================================================
// Accessor Functions
// ============================================================================

/**
 * Get a specific activity by ID.
 * Returns undefined if not loaded or not found.
 */
export function getActivityDefinition(activityId: string): ActivityDefinition | undefined {
  return dataCache.activityById.get(activityId);
}

/**
 * Get all activities for a location.
 * Returns empty array if not loaded.
 */
export function getLocationActivities(locationId: string): ActivityDefinition[] {
  return dataCache.activities.get(locationId) || [];
}

/**
 * Get all loaded activities.
 */
export function getAllActivities(): ActivityDefinition[] {
  return Array.from(dataCache.activityById.values());
}

/**
 * Get economy config.
 * Throws if not loaded.
 */
export function getEconomyConfig(): EconomyConfig {
  if (!dataCache.economy) {
    throw new Error('Economy data not loaded. Call loadEconomyData() first.');
  }
  return dataCache.economy;
}

/**
 * Check if economy data is loaded.
 */
export function isEconomyLoaded(): boolean {
  return dataCache.economy !== null;
}

/**
 * Clear all cached data.
 * Useful for testing or reloading.
 */
export function clearDataCache(): void {
  dataCache.economy = null;
  dataCache.activities.clear();
  dataCache.activityById.clear();
}

// ============================================================================
// Map Data Re-exports
// ============================================================================

export {
  loadMapData,
  getMapData,
  getTileGrid,
  getTileAt,
  getLocation,
  getAllLocations,
  getLocationAtPosition,
  isRoadTile,
  isWalkable,
  calculateDistance,
  calculateDistanceMeters,
  calculateTravelTime,
  formatDistance,
  formatTravelTime,
  isMapLoaded,
  clearMapCache,
  type MapData,
  type LocationDefinition,
  type TileInfo,
} from './map';
