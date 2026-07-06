// Skill / trait definitions — owned by the Game Designer. Skills are cheap, deterministic
// hooks the engine checks by id (no RNG). A unit's `skills` array lists the ids it has.
// Descriptions are shown in the HUD for the selected unit.

export const SKILLS = {
  cleave:    { name: 'Cleave',     desc: 'Melee hits also strike the enemy directly beyond the target.' },
  steadyAim: { name: 'Steady Aim', desc: '+2 attack when you attack without moving this turn.' },
  overwatch: { name: 'Overwatch',  desc: 'Take Guard instead of attacking to fire on the first walker that enters your range during the enemy phase.' },
  scavenger: { name: 'Scavenger',  desc: 'Recovers extra supplies when searching containers.' },
  sprint:    { name: 'Sprint',     desc: 'Unnaturally fast — covers a lot of ground each turn.' },
  smash:     { name: 'Smash',      desc: 'Heavy blows punch through 2 points of defense.' },
  spit:      { name: 'Acid Spit',  desc: 'Attacks from range with no fear of melee reprisal.' },
};

export const hasSkill = (unit, id) => Array.isArray(unit.skills) && unit.skills.includes(id);
