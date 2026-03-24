/**
 * Negotiation system — pure functions, no store or UI imports.
 * Handles NPC generation, pricing, offer processing, and negotiation resolution.
 */

import type { GameState, NegotiationState, NegotiationOffer, NpcResponse } from '../types';
import type { TraitDefinition } from '../data';
import { getEconomyConfig, getTraitDefinition, getAllTraits } from '../data';
import { getCarDefinition, getConditionRating } from '../data';
import type { RNG } from '../utils/rng';

// ============================================================================
// Constants
// ============================================================================

const BASE_ACCEPTANCE_THRESHOLD = 0.65; // Offer must be ≥65% of the way from walkaway to target
const BASE_INSULT_THRESHOLD = 0.30;     // Offer >30% below walkaway = insult
const BASE_WALKAWAY_ON_INSULT = 0.40;   // 40% chance to walk on insult (no prideful trait)

const NPC_NAMES = [
  'Ray', 'Dale', 'Vic', 'Earl', 'Mitch', 'Gary', 'Hank', 'Lou', 'Terry', 'Norm',
  'Bud', 'Roy', 'Frank', 'Eddie', 'Walt', 'Glen', 'Floyd', 'Clint', 'Merv', 'Sal',
  'Pat', 'Sandy', 'Donna', 'Carol', 'Shirley', 'Barb', 'Wanda', 'Rhonda', 'Sue', 'Jo',
];

// Dialogue pools keyed by response type
const DIALOGUE: Record<string, string[]> = {
  accept: [
    "Alright, you've got yourself a deal.",
    "Fair enough. We've got a deal.",
    "I can work with that. Deal.",
    "You drive a hard bargain. Done.",
    "Okay, okay. You got me. Deal.",
  ],
  counter: [
    "I appreciate the offer, but I need more than that.",
    "Not quite there yet. How about we meet somewhere in the middle?",
    "That's a bit low for me. Can you do better?",
    "I've had higher offers. What else can you do?",
    "We're close. Let me throw out a number.",
  ],
  insulted_reject: [
    "You're joking, right? Come back when you're serious.",
    "That's insulting. I'm not interested.",
    "I don't think you understand what you're looking at.",
    "You've wasted my time with that offer.",
  ],
  insulted_walkaway: [
    "Get out of here with that nonsense.",
    "I don't need to deal with this. We're done.",
    "That offer is an insult. I'm out.",
    "Don't bother coming back.",
  ],
  impatient_walkaway: [
    "Look, I don't have all day. We're done here.",
    "You're taking too long. I've got other buyers.",
    "I'm not waiting around forever. Deal's off.",
  ],
};

// ============================================================================
// NPC Generation
// ============================================================================

interface GeneratedNpc {
  id: string;
  name: string;
  traits: string[];
}

/**
 * Generate an NPC with 2–4 compatible traits and a random name.
 */
export function generateNpc(rng: RNG): GeneratedNpc {
  const allTraits = getAllTraits();
  const traitCount = 2 + Math.floor(rng.random() * 3); // 2–4
  const selected: TraitDefinition[] = [];

  // Shuffle and pick compatible traits
  const shuffled = rng.shuffle([...allTraits]);
  for (const trait of shuffled) {
    if (selected.length >= traitCount) break;
    const conflicts = selected.some(
      (s) => s.incompatibleWith.includes(trait.id) || trait.incompatibleWith.includes(s.id)
    );
    if (!conflicts) {
      selected.push(trait);
    }
  }

  return {
    id: rng.uuid(),
    name: NPC_NAMES[Math.floor(rng.random() * NPC_NAMES.length)],
    traits: selected.map((t) => t.id),
  };
}

// ============================================================================
// Pricing
// ============================================================================

/**
 * Derive the NPC's targetPrice and walkAwayPrice from traits + market value + RNG variance.
 *
 * For a buy negotiation (NPC is seller):
 *   - targetPrice ≥ marketValue (NPC wants at least market)
 *   - walkAwayPrice < marketValue (NPC's floor is below market)
 */
export function calculateNpcPricing(
  traitIds: string[],
  anchorPrice: number,
  rng: RNG
): { targetPrice: number; walkAwayPrice: number } {
  const traits = traitIds.map((id) => getTraitDefinition(id));

  // Base: target = asking price (1.0), walkaway = 80% of asking
  let targetMultiplier = 1.0;
  let walkAwayMultiplier = 0.80;

  // Apply trait modifiers
  for (const trait of traits) {
    if (trait.effects.targetPriceMultiplier !== undefined) {
      targetMultiplier += trait.effects.targetPriceMultiplier;
    }
    if (trait.effects.walkAwayPriceMultiplier !== undefined) {
      walkAwayMultiplier += trait.effects.walkAwayPriceMultiplier;
    }
    // Impulsive adds extra variance to target
    if (trait.effects.targetPriceVariance !== undefined) {
      const variance = (rng.random() * 2 - 1) * trait.effects.targetPriceVariance;
      targetMultiplier += variance;
    }
  }

  // Small RNG variance (±5%) on top of traits
  const variance = (rng.random() * 0.10) - 0.05;
  targetMultiplier += variance;

  const targetPrice = Math.round(anchorPrice * targetMultiplier);
  // Clamp walkaway to max 90% of anchor — guarantees at least a 10% negotiation band
  const walkAwayPrice = Math.min(
    Math.round(anchorPrice * walkAwayMultiplier),
    Math.round(anchorPrice * 0.90)
  );

  // Sanity: walkaway must be less than target
  return {
    targetPrice: Math.max(targetPrice, walkAwayPrice + 1),
    walkAwayPrice,
  };
}

// ============================================================================
// Negotiation Lifecycle
// ============================================================================

/**
 * Initialise a new negotiation for a car listing.
 * Reveals traits based on player charisma × traitVisibilityPerPoint.
 */
export function startNegotiation(
  state: GameState,
  listingId: string,
  rng: RNG
): NegotiationState {
  const listing = state.market.currentListings.find((l) => l.id === listingId);
  if (!listing) {
    throw new Error(`Listing "${listingId}" not found in market.`);
  }

  const carDef = getCarDefinition(listing.carId);
  if (!carDef) {
    throw new Error(`Car definition "${listing.carId}" not found.`);
  }

  // Use condition-based market value (average of engine and body condition)
  const avgCondition = (listing.condition.engine + listing.condition.body) / 2;
  const conditionRating = getConditionRating(avgCondition);
  const marketValue = carDef.marketValue[conditionRating];

  const npc = generateNpc(rng);
  const { targetPrice, walkAwayPrice } = calculateNpcPricing(npc.traits, listing.askingPrice, rng);

  // Reveal traits based on charisma
  const config = getEconomyConfig();
  const visibilityPerPoint = config.statEffects.charisma.traitVisibilityPerPoint;
  const revealedTraits = npc.traits.filter(() => {
    const chance = state.player.stats.charisma * visibilityPerPoint;
    return rng.random() < chance;
  });

  return {
    id: rng.uuid(),
    type: 'buy',
    npc: {
      id: npc.id,
      name: npc.name,
      traits: npc.traits,
      revealedTraits,
      targetPrice,
      walkAwayPrice,
      currentMood: 0,
    },
    item: {
      type: 'car',
      id: listingId,
      carId: listing.carId,
      marketValue,
      askingPrice: listing.askingPrice,
    },
    history: [],
    status: 'active',
  };
}

/**
 * Process a player offer and return the updated negotiation state plus the NPC response.
 */
export function submitOffer(
  negotiation: NegotiationState,
  offer: NegotiationOffer,
  playerCharisma: number,
  rng: RNG
): { negotiation: NegotiationState; response: NpcResponse } {
  const traits = negotiation.npc.traits.map((id) => getTraitDefinition(id));
  const config = getEconomyConfig();

  // How good is this offer from the NPC's perspective?
  // 0 = offer exactly at walkaway, 1 = offer at target, >1 = above target
  const spread = negotiation.npc.targetPrice - negotiation.npc.walkAwayPrice;
  const offerQuality = spread > 0
    ? (offer.price - negotiation.npc.walkAwayPrice) / spread
    : 1;

  // Insult threshold — base + trait adjustments
  const insultThreshold = traits.reduce(
    (acc, t) => acc + (t.effects.lowballInsultThreshold ?? 0),
    BASE_INSULT_THRESHOLD
  );
  const isInsulting = offerQuality < -insultThreshold;

  let response: NpcResponse;

  if (isInsulting) {
    const walkOnInsultChance = traits.reduce(
      (acc, t) => acc + (t.effects.walkAwayOnInsult ?? 0),
      BASE_WALKAWAY_ON_INSULT
    );
    if (rng.random() < walkOnInsultChance) {
      response = {
        type: 'walk_away',
        moodChange: -0.5,
        dialogue: pickDialogue('insulted_walkaway', rng),
      };
    } else {
      response = {
        type: 'counter',
        counterOffer: { price: negotiation.npc.targetPrice },
        moodChange: -0.3,
        dialogue: pickDialogue('insulted_reject', rng),
      };
    }
  } else {
    // Acceptance threshold: charisma shifts it down (easier to close)
    const charismaShift = playerCharisma * config.statEffects.charisma.counterOfferShiftPerPoint;
    const acceptanceThreshold = traits.reduce(
      (acc, t) => acc + (t.effects.acceptanceThresholdBonus ?? 0),
      BASE_ACCEPTANCE_THRESHOLD - charismaShift
    );

    if (offerQuality >= acceptanceThreshold) {
      response = {
        type: 'accept',
        moodChange: 0.2,
        dialogue: pickDialogue('accept', rng),
      };
    } else {
      // Generate counter-offer: move toward target based on offer quality
      const counterPrice = generateCounterOffer(negotiation, offer, rng);
      response = {
        type: 'counter',
        counterOffer: { price: counterPrice },
        moodChange: offerQuality > 0 ? 0.1 : -0.1,
        dialogue: pickDialogue('counter', rng),
      };
    }
  }

  // Impatient walk-away chance (only on counter responses — not on accept)
  if (response.type === 'counter') {
    const walkAwayChance = traits.reduce(
      (acc, t) => acc + (t.effects.walkAwayChancePerRound ?? 0),
      0
    );
    if (walkAwayChance > 0 && rng.random() < walkAwayChance) {
      response = {
        type: 'walk_away',
        moodChange: -0.2,
        dialogue: pickDialogue('impatient_walkaway', rng),
      };
    }
  }

  const updatedNegotiation: NegotiationState = {
    ...negotiation,
    npc: {
      ...negotiation.npc,
      currentMood: Math.max(-1, Math.min(1, negotiation.npc.currentMood + response.moodChange)),
    },
    history: [
      ...negotiation.history,
      {
        roundNumber: negotiation.history.length + 1,
        playerOffer: offer,
        npcResponse: response,
      },
    ],
    status: response.type === 'accept' ? 'accepted'
          : response.type === 'walk_away' ? 'walked_away'
          : 'active',
    acceptedPrice: response.type === 'accept' ? offer.price : undefined,
  };

  return { negotiation: updatedNegotiation, response };
}

/**
 * Accept the listing at its asking price (no negotiation).
 * Returns an accepted NegotiationState directly.
 */
export function acceptListPrice(
  negotiation: NegotiationState
): NegotiationState {
  return {
    ...negotiation,
    status: 'accepted',
    acceptedPrice: negotiation.item.askingPrice,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a counter-offer price that moves partway toward target.
 * NPC concedes a bit each round but never goes below walkaway price.
 */
function generateCounterOffer(
  negotiation: NegotiationState,
  playerOffer: NegotiationOffer,
  rng: RNG
): number {
  const { targetPrice } = negotiation.npc;

  // Start from last counter or target
  const lastCounter = negotiation.history.length > 0
    ? (negotiation.history[negotiation.history.length - 1].npcResponse.counterOffer?.price ?? targetPrice)
    : targetPrice;

  // Concede 10–25% of the gap between last counter and player offer
  const gap = lastCounter - playerOffer.price;
  if (gap <= 0) return targetPrice; // Shouldn't happen, but safety net

  const concessionPct = 0.10 + rng.random() * 0.15;
  const newCounter = Math.round(lastCounter - gap * concessionPct);

  // Never go below walkaway price
  return Math.max(newCounter, negotiation.npc.walkAwayPrice);
}

function pickDialogue(type: string, rng: RNG): string {
  const pool = DIALOGUE[type] ?? DIALOGUE['counter'];
  return pool[Math.floor(rng.random() * pool.length)];
}
