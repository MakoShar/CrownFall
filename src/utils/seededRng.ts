// Deterministic pseudo-random number generator (Mulberry32) for reproducible BASH outcomes, AI simulations, and replays

export class SeededRNG {
  private state: number;

  constructor(seed: number = 1337) {
    this.state = seed >>> 0;
  }

  // Returns a pseudo-random float in [0, 1)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns a pseudo-random integer in [min, max] inclusive
  nextInt(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element from array
  pick<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    const index = this.nextInt(0, array.length - 1);
    return array[index];
  }

  // Get current state
  getState(): number {
    return this.state;
  }

  // Set current state
  setState(state: number): void {
    this.state = state >>> 0;
  }

  // Clone generator with exact current state
  clone(): SeededRNG {
    const rng = new SeededRNG(0);
    rng.setState(this.state);
    return rng;
  }
}
