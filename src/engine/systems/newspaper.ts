/**
 * Newspaper generation system.
 * Produces a NewspaperContent from template pools using seeded RNG.
 */

import type { GameState, NewspaperContent, GigListing } from '../types';
import { getNewspaperTemplates } from '../data';
import { RNG } from '../utils/rng';

/**
 * Generate a newspaper for the current game day.
 * Picks 2–3 random headlines and 1–2 gigs from the template pools.
 * All other content sections (classifieds, auctionPreviews, etc.) are empty — Phase 3+.
 */
export function generateNewspaper(state: GameState, rng: RNG): NewspaperContent {
  const templates = getNewspaperTemplates();

  // Pick 2–3 headlines without repeating
  const headlineCount = rng.randomInt(2, 3);
  const shuffledHeadlines = rng.shuffle(templates.headlines);
  const headlines = shuffledHeadlines.slice(0, headlineCount);

  // Pick 1–2 gigs without repeating
  const gigCount = rng.randomInt(1, 2);
  const shuffledGigs = rng.shuffle(templates.gigTemplates);
  const selectedGigTemplates = shuffledGigs.slice(0, gigCount);

  const gigs: GigListing[] = selectedGigTemplates.map((template) => ({
    id: `gig_${state.time.currentDay}_${template.id}`,
    title: template.title,
    description: template.description,
    pay: template.pay,
    timeCost: template.timeCost,
    energyPerHour: template.energyPerHour,
    day: state.time.currentDay,
    requirements: template.requirements,
    taken: false,
  }));

  return {
    headlines,
    classifieds: [],
    auctionPreviews: [],
    marketNews: [],
    gigs,
    roadTripNews: [],
    indexFundNews: '',
  };
}
