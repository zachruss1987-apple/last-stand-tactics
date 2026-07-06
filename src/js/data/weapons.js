// Weapon definitions — owned by the Game Designer. Weapons drive attack power and range,
// so melee vs ranged is a real tactical stat system (design canon §4a). Effective attack
// damage = unit.str + weapon.power. Guns consume `ammo`; natural/melee weapons are
// unlimited (ammo: Infinity). Ranged weapons with minRange > 1 have a point-blank dead
// zone — they cannot fire at an adjacent enemy, which is a positioning risk.

export const WEAPONS = {
  // --- survivor weapons ---
  machete: { id: 'machete', name: 'Machete',       kind: 'melee',  power: 7, minRange: 1, maxRange: 1, ammo: Infinity, icon: 'blade' },
  bat:     { id: 'bat',     name: 'Baseball Bat',  kind: 'melee',  power: 6, minRange: 1, maxRange: 1, ammo: Infinity, icon: 'bat' },
  pistol:  { id: 'pistol',  name: 'Pistol',        kind: 'ranged', power: 6, minRange: 1, maxRange: 3, ammo: 8,        icon: 'pistol' },
  rifle:   { id: 'rifle',   name: 'Hunting Rifle', kind: 'ranged', power: 7, minRange: 2, maxRange: 5, ammo: 6,        icon: 'rifle' },

  // --- natural (zombie) weapons — unlimited ---
  claws:   { id: 'claws',   name: 'Claws',         kind: 'melee',  power: 1, minRange: 1, maxRange: 1, ammo: Infinity, icon: 'claws' },
  fists:   { id: 'fists',   name: 'Heavy Fists',   kind: 'melee',  power: 2, minRange: 1, maxRange: 1, ammo: Infinity, icon: 'fists' },
  acid:    { id: 'acid',    name: 'Acid Spit',     kind: 'ranged', power: 3, minRange: 1, maxRange: 2, ammo: Infinity, icon: 'acid' },
};

// Item types that can be scavenged / dropped, and how they resolve on pickup.
export const ITEMS = {
  ammo:   { id: 'ammo',   name: 'Ammo Box',  icon: 'ammo' },   // refills a ranged unit's magazine
  medkit: { id: 'medkit', name: 'Medkit',    icon: 'medkit' }, // heals the picker
};
