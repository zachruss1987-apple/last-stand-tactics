// Unit class definitions — owned by the Game Designer. Pure data; the engine builds live
// units from these. See docs/game-design.md §5 and docs/research/ for rationale.
//
// New in M2: units have `str` (strength) and an equipped `weapon` (see data/weapons.js).
// Effective attack = str + weapon.power. `skills` lists skill ids (see data/skills.js).
// Zombie art is stat-driven: `size` (∝ strength/toughness), `lean` (∝ speed), `tint`.

export const CLASSES = {
  // --- survivors ---
  fighter: {
    className: 'Fighter', faction: 'player', kind: 'survivor',
    hp: 24, str: 3, def: 4, move: 4,
    weapon: 'machete', skills: ['cleave'],
    color: '#c9a24b', skin: '#c48e63',
    blurb: 'Frontline. Holds the line and cleaves through crowds.',
  },
  ranger: {
    className: 'Ranger', faction: 'player', kind: 'survivor',
    hp: 18, str: 1, def: 2, move: 4,
    weapon: 'rifle', skills: ['steadyAim', 'overwatch'],
    color: '#5aa9e6', skin: '#d8a97e',
    blurb: 'Ranged. Reaches far; deadlier standing still, and can Guard the approach.',
  },
  medic: {
    className: 'Medic', faction: 'player', kind: 'survivor',
    hp: 20, str: 1, def: 3, move: 5,
    weapon: 'pistol', skills: ['scavenger'], canHeal: true, healAmount: 8,
    color: '#6bbf72', skin: '#b98a5e',
    blurb: 'Support. Heals allies, scavenges supplies, and can defend with a sidearm.',
  },

  // --- zombies (variants) ---
  walker: {
    className: 'Walker', faction: 'enemy', kind: 'zombie', variant: 'walker',
    hp: 14, str: 5, def: 1, move: 3,
    weapon: 'claws', skills: [],
    tint: '#6f8a4a', size: 1.0, lean: 0.18,
    blurb: 'Baseline shambler. Slow, but never stops coming.',
  },
  runner: {
    className: 'Runner', faction: 'enemy', kind: 'zombie', variant: 'runner',
    hp: 10, str: 4, def: 0, move: 5,
    weapon: 'claws', skills: ['sprint'],
    tint: '#95a23a', size: 0.82, lean: 0.55,
    blurb: 'Fast and fragile. Closes the gap alarmingly quick — punishes loose formation.',
  },
  brute: {
    className: 'Brute', faction: 'enemy', kind: 'zombie', variant: 'brute',
    hp: 30, str: 10, def: 3, move: 2,
    weapon: 'fists', skills: ['smash'],
    tint: '#4a6a3a', size: 1.4, lean: 0.05,
    blurb: 'Slow damage-sponge. Hits like a truck and shrugs off blows — force focus fire.',
  },
  spitter: {
    className: 'Spitter', faction: 'enemy', kind: 'zombie', variant: 'spitter',
    hp: 12, str: 3, def: 1, move: 3,
    weapon: 'acid', skills: ['spit'],
    tint: '#9a7a2a', size: 0.95, lean: 0.28,
    blurb: 'Ranged. Spits acid from 2 tiles away and takes no melee reprisal — punishes clumping.',
  },
};
