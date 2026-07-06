// Combat resolution. Deterministic (design canon §4): damage = max(1, effAtk - (def +
// terrainDefBonus - ignoreDef)). Range comes from the attacker's weapon (minRange..
// maxRange); ranged weapons with minRange > 1 cannot fire point-blank. Ammo is consumed
// per shot (melee/natural weapons are unlimited). Skills: steadyAim (+2 if not moved),
// smash (ignore 2 def), cleave (splash to the tile beyond the target).

import { manhattan } from './grid.js';
import { hasSkill } from '../data/skills.js';

const hasAmmo = (u) => !isFinite(u.ammo) || u.ammo > 0;

// Effective attack power for this strike, applying attack-side skills.
function effectiveAtk(attacker) {
  let atk = attacker.atk;
  if (hasSkill(attacker, 'steadyAim') && !attacker.movedThisTurn) atk += 2;
  return atk;
}

function spendAmmo(u) {
  if (isFinite(u.ammo)) u.ammo = Math.max(0, u.ammo - 1);
}

// Can `attacker` hit a target at `dist` tiles, given range + ammo? (no target object needed)
export function canReach(attacker, dist) {
  return hasAmmo(attacker) && dist >= attacker.minRange && dist <= attacker.maxRange;
}

// Whether `attacker` can currently attack `defender`.
export function inAttackRange(attacker, defender) {
  return canReach(attacker, manhattan(attacker, defender));
}

function strike(attacker, defender, grid) {
  const bonus = grid.defBonus(defender.x, defender.y);
  const ignoreDef = hasSkill(attacker, 'smash') ? 2 : 0;
  const effDef = Math.max(0, defender.def + bonus - ignoreDef);
  const dmg = Math.max(1, effectiveAtk(attacker) - effDef);
  defender.hp -= dmg;
  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.alive = false;
  }
  return dmg;
}

// The tile one step beyond `defender`, in the direction attacker->defender (orthogonal).
function tileBeyond(attacker, defender) {
  return { x: defender.x + (defender.x - attacker.x), y: defender.y + (defender.y - attacker.y) };
}

// Resolve `attacker` attacking `defender`. Returns an events list for UI/audio.
// `units` is the live unit list (needed for Cleave's splash target).
export function resolveAttack(attacker, defender, grid, units = []) {
  const events = [];
  const dist = manhattan(attacker, defender);
  const dmg = strike(attacker, defender, grid);
  spendAmmo(attacker);
  events.push({ type: 'hit', source: attacker, target: defender, dmg });

  // Cleave: melee attacker with the skill also strikes the enemy directly beyond.
  if (attacker.alive && attacker.weapon.kind === 'melee' && hasSkill(attacker, 'cleave')) {
    const b = tileBeyond(attacker, defender);
    const behind = units.find(
      (u) => u.alive && u !== defender && u.faction !== attacker.faction && u.x === b.x && u.y === b.y
    );
    if (behind) {
      const cd = strike(attacker, behind, grid);
      events.push({ type: 'cleave', source: attacker, target: behind, dmg: cd });
      if (!behind.alive) events.push({ type: 'down', target: behind });
    }
  }

  if (!defender.alive) {
    events.push({ type: 'down', target: defender });
    return events;
  }

  // Counterattack: defender must be able to reach the attacker with its own weapon (range
  // + ammo). Ranged defenders with a point-blank dead zone cannot counter an adjacent foe.
  if (canReach(defender, dist)) {
    const cdmg = strike(defender, attacker, grid);
    spendAmmo(defender);
    events.push({ type: 'counter', source: defender, target: attacker, dmg: cdmg });
    if (!attacker.alive) events.push({ type: 'down', target: attacker });
  }
  return events;
}

// Medic heal action (design canon §5). Returns events list.
export function resolveHeal(medic, ally) {
  const before = ally.hp;
  ally.hp = Math.min(ally.maxHp, ally.hp + medic.healAmount);
  return [{ type: 'heal', source: medic, target: ally, amount: ally.hp - before }];
}
