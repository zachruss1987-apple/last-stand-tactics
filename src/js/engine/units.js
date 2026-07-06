// Unit factory + roster instantiation. Turns designer data (data/*.js) into live unit
// objects the engine mutates during play. M2: resolves the equipped weapon and derives
// effective attack (str + weapon.power), attack range, and ammo.

import { CLASSES } from '../data/units.js';
import { WEAPONS } from '../data/weapons.js';

let nextId = 1;

export function makeUnit(clsKey, { x, y, name } = {}) {
  const def = CLASSES[clsKey];
  if (!def) throw new Error(`Unknown class: ${clsKey}`);
  const w = WEAPONS[def.weapon];
  if (!w) throw new Error(`Unknown weapon: ${def.weapon} on ${clsKey}`);
  return {
    id: nextId++,
    cls: clsKey,
    className: def.className,
    name: name || def.className,
    faction: def.faction,
    kind: def.kind, // 'survivor' | 'zombie'
    variant: def.variant || null,
    x, y,
    hp: def.hp,
    maxHp: def.hp,
    str: def.str,
    def: def.def,
    move: def.move,
    // weapon-derived combat profile
    weapon: { ...w },
    atk: def.str + w.power,
    minRange: w.minRange,
    maxRange: w.maxRange,
    ammo: w.ammo,
    skills: [...(def.skills || [])],
    canHeal: !!def.canHeal,
    healAmount: def.healAmount || 0,
    // art hints
    color: def.color || null,
    skin: def.skin || '#c48e63',
    tint: def.tint || null,
    size: def.size || 1,
    lean: def.lean || 0,
    // per-activation state
    hasActed: false,
    movedThisTurn: false,
    overwatch: false,
    alive: true,
  };
}

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
