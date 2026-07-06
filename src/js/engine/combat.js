// Combat resolution. Deterministic per design canon §4: damage = max(1, atk - (def +
// terrainDefBonus)). Melee defenders counter if they survive and their range reaches the
// attacker. Ranged attackers (range >= distance the defender can't match) take no counter.

import { manhattan } from './grid.js';

function strike(attacker, defender, grid) {
  const bonus = grid.defBonus(defender.x, defender.y);
  const dmg = Math.max(1, attacker.atk - (defender.def + bonus));
  defender.hp -= dmg;
  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.alive = false;
  }
  return dmg;
}

// Resolve `attacker` attacking `defender`. Returns an events list for UI/audio.
export function resolveAttack(attacker, defender, grid) {
  const events = [];
  const dist = manhattan(attacker, defender);
  const dmg = strike(attacker, defender, grid);
  events.push({ type: 'hit', source: attacker, target: defender, dmg });
  if (!defender.alive) {
    events.push({ type: 'down', target: defender });
    return events;
  }
  // Counterattack: defender must be able to reach the attacker with its own range.
  if (defender.range >= dist) {
    const cdmg = strike(defender, attacker, grid);
    events.push({ type: 'counter', source: defender, target: attacker, dmg: cdmg });
    if (!attacker.alive) events.push({ type: 'down', target: attacker });
  }
  return events;
}

// Whether `attacker` (at optional overridden position) can hit `defender`.
export function inAttackRange(attacker, defender) {
  const d = manhattan(attacker, defender);
  return d >= 1 && d <= attacker.range;
}

// Medic heal action (design canon §5). Returns events list.
export function resolveHeal(medic, ally) {
  const before = ally.hp;
  ally.hp = Math.min(ally.maxHp, ally.hp + medic.healAmount);
  return [{ type: 'heal', source: medic, target: ally, amount: ally.hp - before }];
}
