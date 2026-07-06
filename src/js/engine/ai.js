// Enemy (Walker) AI — design canon §6. Dumb on purpose: shamble toward the nearest
// survivor and attack when in range. Fully deterministic for reproducible tests.

import { computeReachable, distanceField, keyOf, manhattan } from './grid.js';
import { inAttackRange } from './combat.js';

// Decide one Walker's action. Returns { moveTo:{x,y}, target: unit|null }.
export function decideWalker(grid, walker, units) {
  const survivors = units.filter((u) => u.alive && u.faction === 'player');
  if (survivors.length === 0) return null;

  const field = distanceField(grid, survivors); // walls-aware distance to nearest survivor
  const reachable = computeReachable(grid, walker, units); // stoppable tiles incl. current

  const candidates = [...reachable.keys()].map((k) => {
    const [x, y] = k.split(',').map(Number);
    return { x, y };
  });

  // Prefer a tile from which we can attack a survivor this turn.
  const attackTiles = candidates.filter((c) =>
    survivors.some((s) => inAttackRange({ x: c.x, y: c.y, range: walker.range }, s))
  );

  const pickTile = (list) => {
    // Lowest field value (closest to survivors); deterministic tie-break by y then x.
    return list.slice().sort((a, b) => {
      const fa = field.get(keyOf(a.x, a.y)) ?? Infinity;
      const fb = field.get(keyOf(b.x, b.y)) ?? Infinity;
      if (fa !== fb) return fa - fb;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    })[0];
  };

  const moveTo = pickTile(attackTiles.length ? attackTiles : candidates) || { x: walker.x, y: walker.y };

  // From the chosen tile, target the reachable survivor with lowest hp, then lowest id.
  const probe = { x: moveTo.x, y: moveTo.y, range: walker.range };
  const targets = survivors
    .filter((s) => inAttackRange(probe, s))
    .sort((a, b) => (a.hp !== b.hp ? a.hp - b.hp : a.id - b.id));

  return { moveTo, target: targets[0] || null };
}
