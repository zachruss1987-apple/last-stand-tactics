// Unit factory + roster instantiation. Turns designer data (data/*.js) into live unit
// objects the engine mutates during play.

import { CLASSES } from '../data/units.js';

let nextId = 1;

export function makeUnit(clsKey, { x, y, name } = {}) {
  const def = CLASSES[clsKey];
  if (!def) throw new Error(`Unknown class: ${clsKey}`);
  return {
    id: nextId++,
    cls: clsKey,
    className: def.className,
    name: name || def.className,
    faction: def.faction,
    glyph: def.glyph,
    x, y,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    def: def.def,
    move: def.move,
    range: def.range,
    canHeal: !!def.canHeal,
    healAmount: def.healAmount || 0,
    hasActed: false,
    alive: true,
  };
}

// Build the full unit list for a level. Resets ids so restarts are stable.
export function buildRoster(level) {
  nextId = 1;
  const units = [];
  for (const s of level.survivors) {
    units.push(makeUnit(s.cls, { x: s.x, y: s.y, name: s.name }));
  }
  for (const z of level.zombies) {
    units.push(makeUnit(z.cls, { x: z.x, y: z.y }));
  }
  return units;
}
