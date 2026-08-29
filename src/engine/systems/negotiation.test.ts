/**
 * Negotiation engine — the claims made by PR #62.
 *
 * Everything here is seeded: `new RNG(n)` makes NPC generation, pricing and dialogue
 * fully reproducible. `createRNG()` seeds from Date.now() and must never appear in a test.
 */
import { describe, it, expect } from 'vitest';
import { RNG } from '@engine/utils/rng';
import type { TraitDefinition } from '@engine/data';
import { getAllTraits, getTraitDefinition } from '@engine/data';
import {
  acceptListPrice,
  calculateNpcPricing,
  generateNpc,
  startNegotiation,
  submitOffer,
} from './negotiation';
import { makeGameState, makeListing } from '../../test/fixtures';

const ANCHOR = 10_000;
const ASKING = 5_000;

/**
 * Every trait combination `generateNpc` could legally produce (2–4 compatible traits),
 * plus the smaller sets, so the pricing invariants are checked exhaustively rather than
 * on whichever handful of traits a few seeds happen to roll.
 */
function compatibleTraitSets(maxSize: number): string[][] {
  const traits = getAllTraits();
  const sets: string[][] = [];

  const build = (start: number, current: TraitDefinition[]): void => {
    sets.push(current.map((t) => t.id));
    if (current.length >= maxSize) return;
    for (let i = start; i < traits.length; i++) {
      const candidate = traits[i];
      const conflicts = current.some(
        (s) =>
          s.incompatibleWith.includes(candidate.id) ||
          candidate.incompatibleWith.includes(s.id)
      );
      if (!conflicts) build(i + 1, [...current, candidate]);
    }
  };

  build(0, []);
  return sets;
}

const TRAIT_SETS = compatibleTraitSets(4);
const label = (traits: string[]) => (traits.length ? traits.join('+') : 'no traits');

describe('NPC pricing is anchored to the asking price (fix #2)', () => {
  it('targets the asking price rather than a markup over it', () => {
    // On `main` the base target multiplier was 1.15 against market value. It is now 1.0
    // against the anchor, leaving only the ±5% random variance.
    for (let seed = 1; seed <= 100; seed++) {
      const { targetPrice } = calculateNpcPricing([], ANCHOR, new RNG(seed));
      expect(targetPrice).toBeGreaterThanOrEqual(Math.round(ANCHOR * 0.95));
      expect(targetPrice).toBeLessThanOrEqual(Math.round(ANCHOR * 1.05));
    }
  });

  it('prices the seller off the listing, not off market value', () => {
    // The fixture car is worth a few hundred dollars; the listing asks $5,000. On `main`
    // the seller's target was derived from market value (≈$920) while the browse card
    // showed $5,000 — two prices for one car.
    const listing = makeListing({ askingPrice: ASKING });
    const state = makeGameState({ listings: [listing] });

    for (let seed = 1; seed <= 50; seed++) {
      const negotiation = startNegotiation(state, listing.id, new RNG(seed));

      expect(negotiation.item.askingPrice).toBe(listing.askingPrice);
      // Guard against a vacuous pass: the fixture must genuinely separate the two numbers.
      expect(negotiation.item.marketValue).not.toBe(listing.askingPrice);
      expect(negotiation.npc.targetPrice).toBeGreaterThan(negotiation.item.marketValue * 2);
    }
  });
});

describe('the negotiation band (fix #2 walkaway clamp)', () => {
  it('never lets the walkaway floor exceed 90% of the asking price, for any trait set', () => {
    const cap = Math.round(ANCHOR * 0.9);
    const failures: string[] = [];

    for (const traits of TRAIT_SETS) {
      for (let seed = 1; seed <= 25; seed++) {
        const { walkAwayPrice } = calculateNpcPricing(traits, ANCHOR, new RNG(seed));
        if (walkAwayPrice > cap) {
          failures.push(`${label(traits)} @seed ${seed}: floor ${walkAwayPrice} > cap ${cap}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('never produces a degenerate band: the target always sits above the walkaway', () => {
    const failures: string[] = [];

    for (const traits of TRAIT_SETS) {
      for (let seed = 1; seed <= 25; seed++) {
        const { targetPrice, walkAwayPrice } = calculateNpcPricing(traits, ANCHOR, new RNG(seed));
        if (targetPrice <= walkAwayPrice) {
          failures.push(`${label(traits)} @seed ${seed}: target ${targetPrice} <= floor ${walkAwayPrice}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

describe('counter-offers', () => {
  it('always land inside the seller\'s own band, between walkaway and target', () => {
    const listing = makeListing({ askingPrice: ASKING });
    const state = makeGameState({ listings: [listing] });
    const failures: string[] = [];
    let countersSeen = 0;

    for (let seed = 1; seed <= 60; seed++) {
      let negotiation = startNegotiation(state, listing.id, new RNG(seed));
      const floor = negotiation.npc.walkAwayPrice;
      const target = negotiation.npc.targetPrice;
      const rng = new RNG(seed + 1_000);

      // Walk a rising sequence of offers up from below the floor.
      for (let round = 0; round < 8 && negotiation.status === 'active'; round++) {
        const offer = Math.round(floor * (0.85 + round * 0.03));
        const result = submitOffer(negotiation, { price: offer }, 5, rng);
        negotiation = result.negotiation;

        const counter = result.response.counterOffer?.price;
        if (counter === undefined) continue;
        countersSeen++;
        if (counter < floor) {
          failures.push(`seed ${seed} round ${round}: counter ${counter} below floor ${floor}`);
        }
        if (counter > target) {
          failures.push(`seed ${seed} round ${round}: counter ${counter} above target ${target}`);
        }
      }
    }

    expect(failures).toEqual([]);
    expect(countersSeen).toBeGreaterThan(0); // the loop must actually exercise counters
  });
});

describe('accepting at the list price (fixes #1 and #3)', () => {
  it('settles at the asking price, not at the seller\'s target price', () => {
    // On `main` the button read the last counter but `acceptListPrice()` charged
    // npc.targetPrice — always higher. A silent overcharge.
    const listing = makeListing({ askingPrice: ASKING });
    const state = makeGameState({ listings: [listing] });
    const negotiation = startNegotiation(state, listing.id, new RNG(7));

    // Guard against a vacuous pass: the two numbers must differ for this to prove anything.
    expect(negotiation.npc.targetPrice).not.toBe(negotiation.item.askingPrice);

    const accepted = acceptListPrice(negotiation);

    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptedPrice).toBe(listing.askingPrice);
  });
});

describe('seller generation (fixes #4 and #5)', () => {
  it('returns an identical seller for an identical seed', () => {
    const listing = makeListing();
    const state = makeGameState({ listings: [listing] });

    const first = startNegotiation(state, listing.id, new RNG(99));
    const second = startNegotiation(state, listing.id, new RNG(99));

    expect(second).toEqual(first);
  });

  it('gives every generated trait a display name distinct from its raw id', () => {
    // The badge renders getTraitDefinition(id).name — this is what stops it printing
    // "impatient" instead of "Impatient".
    for (let seed = 1; seed <= 200; seed++) {
      for (const traitId of generateNpc(new RNG(seed)).traits) {
        const name = getTraitDefinition(traitId).name;
        expect(name).toBeTruthy();
        expect(name).not.toBe(traitId);
      }
    }
  });

  it('never pairs two incompatible traits on one seller', () => {
    const failures: string[] = [];

    for (let seed = 1; seed <= 200; seed++) {
      const traits = generateNpc(new RNG(seed)).traits.map((id) => getTraitDefinition(id));
      for (const trait of traits) {
        for (const other of traits) {
          if (trait.id !== other.id && trait.incompatibleWith.includes(other.id)) {
            failures.push(`seed ${seed}: ${trait.id} + ${other.id}`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('gives every seller between 2 and 4 traits', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { traits } = generateNpc(new RNG(seed));
      expect(traits.length).toBeGreaterThanOrEqual(2);
      expect(traits.length).toBeLessThanOrEqual(4);
    }
  });
});

describe('trait data integrity', () => {
  it('gives every trait the fields the negotiation code reads off it', () => {
    const traits = getAllTraits();
    expect(traits.length).toBeGreaterThan(0);

    for (const trait of traits) {
      expect(trait.id, 'trait id').toBeTruthy();
      expect(trait.name, `name for "${trait.id}"`).toBeTruthy();
      expect(Array.isArray(trait.incompatibleWith), `incompatibleWith for "${trait.id}"`).toBe(true);
      expect(trait.effects, `effects for "${trait.id}"`).toBeTypeOf('object');
    }
  });

  it('only names traits that exist in incompatibleWith', () => {
    // A typo here would silently stop conflicting, letting the generator pair traits
    // that are meant to be mutually exclusive.
    const ids = new Set(getAllTraits().map((t) => t.id));
    const dangling: string[] = [];

    for (const trait of getAllTraits()) {
      for (const other of trait.incompatibleWith) {
        if (!ids.has(other)) dangling.push(`${trait.id} -> "${other}"`);
      }
    }

    expect(dangling).toEqual([]);
  });
});
