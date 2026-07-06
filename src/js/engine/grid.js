// Grid, terrain, and pathfinding. Pure logic — takes the grid and unit list as inputs,
// holds no rendering concerns. See docs/game-design.md §2 for movement rules.

export const TERRAIN = {
  '.': { key: 'floor',      name: 'Street',     cost: 1,        def: 0, blocked: false },
  'r': { key: 'rubble',     name: 'Rubble',     cost: 2,        def: 1, blocked: false },
  '#': { key: 'wall',       name: 'Wall',       cost: Infinity, def: 0, blocked: true  },
  'E': { key: 'extraction', name: 'Extraction', cost: 1,        def: 0, blocked: false },
};

export class Grid {
  constructor(rows) {
    this.rows = rows.map((r) => r.split(''));
    this.height = this.rows.length;
    this.width = this.rows[0].length;
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  charAt(x, y) {
    return this.inBounds(x, y) ? this.rows[y][x] : '#';
  }

  terrainAt(x, y) {
    return TERRAIN[this.charAt(x, y)] || TERRAIN['#'];
  }

  key(x, y) {
    return this.terrainAt(x, y).key;
  }

  moveCost(x, y) {
    return this.terrainAt(x, y).cost;
  }

  defBonus(x, y) {
    return this.terrainAt(x, y).def;
  }

  isBlocked(x, y) {
    return !this.inBounds(x, y) || this.terrainAt(x, y).blocked;
  }

  isExtraction(x, y) {
    return this.key(x, y) === 'extraction';
  }
}

export const keyOf = (x, y) => `${x},${y}`;
export const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const NEIGHBORS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

function occupantAt(units, x, y, exclude) {
  return units.find((u) => u.alive && u !== exclude && u.x === x && u.y === y) || null;
}

// Tiles `unit` can legally STOP on this activation, keyed "x,y" -> movement cost.
// Rules (design canon §2): budget = unit.move; walls block; enemy-faction units block
// passage; friendly units can be passed through but not stopped on. Own tile is included.
export function computeReachable(grid, unit, units) {
  const startKey = keyOf(unit.x, unit.y);
  const dist = new Map([[startKey, 0]]);
  const reachable = new Map([[startKey, 0]]); // stoppable tiles
  // Dijkstra over small grid; frontier as array is fine at this scale.
  const frontier = [{ x: unit.x, y: unit.y, d: 0 }];
  while (frontier.length) {
    frontier.sort((a, b) => a.d - b.d);
    const cur = frontier.shift();
    if (cur.d > (dist.get(keyOf(cur.x, cur.y)) ?? Infinity)) continue;
    for (const n of NEIGHBORS) {
      const nx = cur.x + n.dx;
      const ny = cur.y + n.dy;
      if (grid.isBlocked(nx, ny)) continue;
      const occ = occupantAt(units, nx, ny, unit);
      if (occ && occ.faction !== unit.faction) continue; // enemy blocks passage
      const nd = cur.d + grid.moveCost(nx, ny);
      if (nd > unit.move) continue;
      const nk = keyOf(nx, ny);
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd);
        frontier.push({ x: nx, y: ny, d: nd });
        // Can only stop here if no unit occupies the tile.
        if (!occ) reachable.set(nk, nd);
        else reachable.delete(nk);
      }
    }
  }
  return reachable;
}

// Multi-source BFS distance field over passable (non-wall) tiles, ignoring unit
// occupancy. Used by the AI as a walls-aware heuristic toward the nearest survivor.
export function distanceField(grid, sources) {
  const dist = new Map();
  const queue = [];
  for (const s of sources) {
    const k = keyOf(s.x, s.y);
    if (!dist.has(k)) {
      dist.set(k, 0);
      queue.push({ x: s.x, y: s.y });
    }
  }
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const cd = dist.get(keyOf(cur.x, cur.y));
    for (const n of NEIGHBORS) {
      const nx = cur.x + n.dx;
      const ny = cur.y + n.dy;
      if (grid.isBlocked(nx, ny)) continue;
      const nk = keyOf(nx, ny);
      if (!dist.has(nk)) {
        dist.set(nk, cd + 1);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return dist;
}
