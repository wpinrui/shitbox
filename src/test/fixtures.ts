/**
 * Deterministic test fixtures.
 *
 * Nothing here reads the wall clock or an unseeded RNG: `rngSeed` is fixed, so every
 * NPC, price and trait roll derived from a fixture is reproducible across runs.
 */
import type { CarListing, GameState } from '@engine/types';
import { MAX_ENERGY } from '@engine/index';

/** Fixed seed — see `store.startNegotiation`, which seeds from rngSeed + hash(listingId). */
export const TEST_SEED = 12345;

/** A cheap car: market value tops out at $2,500 excellent, $800 fair, $300 poor. */
export const TEST_CAR_ID = 'shitbox_starter';

interface ListingOverrides {
  id?: string;
  carId?: string;
  askingPrice?: number;
  engine?: number;
  body?: number;
}

export function makeListing(overrides: ListingOverrides = {}): CarListing {
  return {
    id: overrides.id ?? 'listing-alpha',
    carId: overrides.carId ?? TEST_CAR_ID,
    condition: {
      engine: overrides.engine ?? 50,
      body: overrides.body ?? 50,
    },
    askingPrice: overrides.askingPrice ?? 5000,
    sellerId: 'seller-1',
    expiresDay: 30,
    source: 'scrapyard',
  };
}

interface StateOverrides {
  money?: number;
  charisma?: number;
  listings?: CarListing[];
}

/**
 * A minimal but complete GameState: day 1, 06:00, no cars owned, no listings unless given.
 * Money and charisma are the two levers the negotiation path actually reads.
 */
export function makeGameState(overrides: StateOverrides = {}): GameState {
  return {
    meta: {
      saveId: 'test-save',
      version: '0.1.0',
      createdAt: 0,
      lastSavedAt: 0,
      rngSeed: TEST_SEED,
    },
    time: { currentDay: 1, currentHour: 6, currentMinute: 0 },
    player: {
      name: 'Tester',
      money: overrides.money ?? 10_000,
      energy: MAX_ENERGY,
      position: { x: 0, y: 0 },
      stats: {
        charisma: overrides.charisma ?? 5,
        mechanical: 5,
        fitness: 5,
        knowledge: 5,
        driving: 5,
      },
      licenses: [],
      completedCourses: [],
      housing: { type: 'shitbox', propertyId: null },
      daysWithoutFood: 0,
    },
    inventory: { cars: [], engineParts: 0, bodyParts: 0 },
    assets: { garage: null, workshop: null, properties: [], dealership: null },
    finance: {
      savings: 0,
      indexFund: { invested: 0, pendingWithdrawal: 0, withdrawalAvailableDay: 0 },
      loans: [],
    },
    market: {
      currentListings: overrides.listings ?? [],
      playerListings: [],
      auctionSchedule: [],
      marketTrends: [],
    },
    npcs: { renters: [], employees: [] },
    newspaper: { currentDay: 0, content: null, purchased: false },
    progression: {
      totalEarnings: 0,
      carsFlipped: 0,
      roadTripsCompleted: 0,
      totalEngagement: 0,
      subscribers: 0,
      highestCarValue: 0,
      gtoAcquired: false,
      gtoAcquiredDay: null,
    },
    history: { actions: [] },
  };
}
