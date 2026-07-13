/**
 * Store-level negotiation behaviour — the money path and the "one shot per car" rule.
 *
 * The store is exercised directly; no React, no DOM. The fixture pins meta.rngSeed, and
 * `startNegotiation` seeds from rngSeed + hash(listingId), so the seller and their prices
 * are identical on every run.
 */
import { describe, it, expect } from 'vitest';
import type { NegotiationState } from '@engine/types';
import { useGameStore } from './index';
import { makeGameState, makeListing } from '../test/fixtures';

const ASKING = 5_000;

const store = () => useGameStore.getState();
const game = () => useGameStore.getState().gameState!;

/** Fresh game with one listing on the market and a given wallet. */
function setup(money: number) {
  const listing = makeListing({ askingPrice: ASKING });
  useGameStore.setState({
    gameState: makeGameState({ money, listings: [listing] }),
    activeNegotiation: null,
    toasts: [],
  });
  return listing;
}

const toastMessages = () => store().toasts.map((t) => t.message);

describe('the wallet guard (fix #1)', () => {
  it('refuses the purchase when the player is one dollar short', () => {
    const listing = setup(ASKING - 1);

    store().startNegotiation(listing.id);
    store().acceptAtListPrice();

    expect(game().player.money).toBe(ASKING - 1);
    expect(game().inventory.cars).toHaveLength(0);
    expect(toastMessages()).toContain("You can't afford this.");
    // A refused purchase must not consume the listing.
    expect(game().market.currentListings).toHaveLength(1);
  });

  it('never lets money go negative, whatever the player is holding', () => {
    // On `main` closeNegotiation deducted the price with no affordability check at all.
    for (let money = 0; money < ASKING; money += 250) {
      const listing = setup(money);

      store().startNegotiation(listing.id);
      store().acceptAtListPrice();

      expect(game().player.money, `starting from $${money}`).toBe(money);
      expect(game().player.money).toBeGreaterThanOrEqual(0);
      expect(game().inventory.cars).toHaveLength(0);
    }
  });

  it('refuses an offer the seller accepts but the player cannot cover', () => {
    const listing = setup(ASKING);
    store().startNegotiation(listing.id);

    // Any offer at or above target is accepted outright, whatever the seller's traits.
    const offer = store().activeNegotiation!.npc.targetPrice * 2;
    useGameStore.setState({
      gameState: { ...game(), player: { ...game().player, money: offer - 1 } },
    });

    store().submitOffer(offer);

    expect(game().player.money).toBe(offer - 1);
    expect(game().player.money).toBeGreaterThanOrEqual(0);
    expect(game().inventory.cars).toHaveLength(0);
    expect(toastMessages()).toContain("You can't afford this.");
    // The deal is not allowed to stand: the negotiation stays open rather than settling.
    expect(store().activeNegotiation!.status).toBe('active');
  });

  it('lets the player buy with exactly the asking price, landing them on zero', () => {
    const listing = setup(ASKING);

    store().startNegotiation(listing.id);
    store().acceptAtListPrice();

    expect(game().player.money).toBe(0);
    expect(game().inventory.cars).toHaveLength(1);
    expect(game().inventory.cars[0].carId).toBe(listing.carId);
  });
});

describe('the price on the button is the price you pay (fixes #2 and #3)', () => {
  it('quotes the browse-card asking price inside the negotiation', () => {
    const listing = setup(10_000);

    store().startNegotiation(listing.id);

    // The browse card renders listing.askingPrice; the modal renders item.askingPrice.
    expect(store().activeNegotiation!.item.askingPrice).toBe(listing.askingPrice);
  });

  it('deducts exactly the number printed on the Accept button', () => {
    const listing = setup(ASKING + 500);
    store().startNegotiation(listing.id);

    const negotiation = store().activeNegotiation!;
    const printedOnButton = negotiation.item.askingPrice; // what NegotiationModal renders
    // Guard against a vacuous pass: on `main` the charge came from targetPrice, so the
    // two numbers must differ for this test to prove anything.
    expect(negotiation.npc.targetPrice).not.toBe(printedOnButton);

    store().acceptAtListPrice();

    expect(game().player.money).toBe(ASKING + 500 - printedOnButton);
    expect(game().inventory.cars[0].acquiredPrice).toBe(printedOnButton);
  });
});

describe('the seller is stable for a given car (fix #5)', () => {
  it('returns the same seller even after the player has acted and days have passed', () => {
    // On `main` the seed was rngSeed + day*1000 + actionCount, so any action between two
    // openings produced a different seller with different traits and different prices.
    // The seed is now hashed from the listing id, which no clock or action count touches —
    // so the time-travel below must not change the seller at all.
    const listing = setup(10_000);

    store().startNegotiation(listing.id);
    const first = store().activeNegotiation!;

    useGameStore.setState({
      activeNegotiation: null,
      gameState: {
        ...game(),
        time: { ...game().time, currentDay: 9, currentHour: 15 },
        history: {
          actions: [
            { timestamp: 0, day: 1, action: 'chill', params: {}, result: 'success' },
            { timestamp: 0, day: 2, action: 'sleep', params: {}, result: 'success' },
          ],
        },
      },
    });

    store().startNegotiation(listing.id);
    const second = store().activeNegotiation!;

    expect(second.npc).toEqual(first.npc);
  });
});

describe('one shot per car (new gameplay rule)', () => {
  it('destroys the listing when the player walks away', () => {
    const listing = setup(10_000);

    store().startNegotiation(listing.id);
    store().closeNegotiation();

    expect(game().market.currentListings).toHaveLength(0);
    expect(store().activeNegotiation).toBeNull();
  });

  it('destroys the listing when the seller walks away', () => {
    const listing = setup(10_000);
    store().startNegotiation(listing.id);

    const walkedAway: NegotiationState = {
      ...store().activeNegotiation!,
      status: 'walked_away',
    };
    useGameStore.setState({ activeNegotiation: walkedAway });

    store().closeNegotiation();

    expect(game().market.currentListings).toHaveLength(0);
  });

  it('cannot be reopened once it is gone: a walked-away car is off the market for good', () => {
    const listing = setup(10_000);

    store().startNegotiation(listing.id);
    store().closeNegotiation();

    expect(game().market.currentListings.find((l) => l.id === listing.id)).toBeUndefined();
    expect(() => store().startNegotiation(listing.id)).toThrow(/not found/i);
  });

  it('takes the car off the market and puts it in the garage on a completed sale', () => {
    const listing = setup(10_000);

    store().startNegotiation(listing.id);
    store().acceptAtListPrice();

    expect(game().market.currentListings).toHaveLength(0);
    expect(game().inventory.cars).toHaveLength(1);
  });

  it('costs an hour whether the deal closes or not', () => {
    const walkedAwayListing = setup(10_000);
    store().startNegotiation(walkedAwayListing.id);
    store().closeNegotiation();
    expect(game().time.currentHour).toBe(7); // fixture starts at 06:00

    const boughtListing = setup(10_000);
    store().startNegotiation(boughtListing.id);
    store().acceptAtListPrice();
    expect(game().time.currentHour).toBe(7);
  });
});
