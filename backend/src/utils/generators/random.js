// Simple Mulberry32 PRNG
export function createPRNG(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function randomFloat(min, max, prng) {
  return prng() * (max - min) + min;
}

export function randomInt(min, max, prng) {
  return Math.floor(randomFloat(min, max + 1, prng));
}

export function pickRandom(arr, prng) {
  return arr[randomInt(0, arr.length - 1, prng)];
}
