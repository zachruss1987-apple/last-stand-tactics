// Seedable RNG (mulberry32). Single source of randomness so combat/AI outcomes are
// reproducible for the Tester. The demo combat is deterministic (fixed damage), but any
// future randomness must route through here. See docs/decisions.md D3.

export function makeRng(seed = 0xC0FFEE) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Integer in [0, n)
export function randInt(rng, n) {
  return Math.floor(rng() * n);
}
