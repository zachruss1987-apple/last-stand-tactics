// Unit class definitions — owned by the Game Designer.
// Pure data: the engine reads these to build units. Tune balance here, not in engine code.
// See docs/game-design.md §5 for the design rationale behind each stat.

export const CLASSES = {
  fighter: {
    className: 'Fighter',
    faction: 'player',
    glyph: '🪓',
    hp: 24, atk: 9, def: 4, move: 4, range: 1,
    canHeal: false,
    blurb: 'Frontline. Trades blows and holds the line.',
  },
  ranger: {
    className: 'Ranger',
    faction: 'player',
    glyph: '🏹',
    hp: 18, atk: 8, def: 2, move: 4, range: 2,
    canHeal: false,
    blurb: 'Ranged. Kills without counter, but fragile.',
  },
  medic: {
    className: 'Medic',
    faction: 'player',
    glyph: '⚕️',
    hp: 20, atk: 5, def: 3, move: 5, range: 1,
    canHeal: true,
    healAmount: 8,
    blurb: 'Mobile support. Heals an adjacent ally instead of attacking.',
  },
  walker: {
    className: 'Walker',
    faction: 'enemy',
    glyph: '🧟',
    hp: 14, atk: 6, def: 1, move: 3, range: 1,
    canHeal: false,
    blurb: 'Slow, melee. Shambles toward the nearest survivor.',
  },
};
