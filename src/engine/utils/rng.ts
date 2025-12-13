/**
 * Seeded random number generator using Mulberry32 algorithm
 * Deterministic: same seed always produces same sequence
 */
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Get current seed state (for saving)
   */
  getSeed(): number {
    return this.state;
  }

  /**
   * Set seed state (for loading)
   */
  setSeed(seed: number): void {
    this.state = seed;
  }

  /**
   * Generate a random number between 0 (inclusive) and 1 (exclusive)
   */
  random(): number {
    // Mulberry32 algorithm
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate a random integer between min (inclusive) and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random number between min and max (both inclusive, float)
   */
  randomInRange(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[Math.floor(this.random() * array.length)];
  }

  /**
   * Shuffle an array (returns new array, doesn't mutate)
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Return true with given probability (0-1)
   */
  chance(probability: number): boolean {
    return this.random() < probability;
  }

  /**
   * Pick from weighted options
   * @param options Array of [item, weight] tuples
   */
  weightedPick<T>(options: [T, number][]): T {
    const totalWeight = options.reduce((sum, [, weight]) => sum + weight, 0);
    let random = this.random() * totalWeight;

    for (const [item, weight] of options) {
      random -= weight;
      if (random <= 0) {
        return item;
      }
    }

    // Fallback (shouldn't happen with valid weights)
    return options[options.length - 1][0];
  }

  /**
   * Generate a normally distributed random number (Box-Muller transform)
   * @param mean Center of distribution
   * @param stdDev Standard deviation
   */
  gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.random();
    const u2 = this.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * stdDev + mean;
  }

  /**
   * Generate a UUID-like string (not cryptographically secure)
   */
  uuid(): string {
    const hex = () =>
      Math.floor(this.random() * 16)
        .toString(16)
        .toLowerCase();
    return (
      hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() +
      '-' + hex() + hex() + hex() + hex() +
      '-4' + hex() + hex() + hex() +
      '-' + ['8', '9', 'a', 'b'][this.randomInt(0, 3)] + hex() + hex() + hex() +
      '-' + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex()
    );
  }
}

/**
 * Create a new RNG with a random seed (for new games)
 */
export function createRNG(): RNG {
  return new RNG(Date.now());
}

/**
 * Create a child RNG from a parent (for isolated random sequences)
 */
export function deriveRNG(parent: RNG): RNG {
  return new RNG(Math.floor(parent.random() * 0xffffffff));
}
