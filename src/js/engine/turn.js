// Game controller: owns state, the player/enemy phase machine, selection/action flow,
// win/lose resolution, and the M2 systems (weapons/ammo, skills incl. Overwatch, doors,
// scavenging, item drops). Rendering and input live elsewhere and talk to this through
// the hooks passed in (onChange / onAudio / onLog). No DOM here.

import { Grid, computeReachable, keyOf, manhattan } from './grid.js';
import { buildRoster } from './units.js';
import { resolveAttack, resolveHeal, inAttackRange, canReach } from './combat.js';
import { decideWalker } from './ai.js';
import { makeRng } from './rng.js';
import { hasSkill } from '../data/skills.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const DROP_CHANCE = 0.4; // seeded chance a downed zombie drops an item

export class Game {
  constructor(level, hooks = {}) {
    this.level = level;
    this.hooks = hooks;
    this.reset();
  }

  reset() {
    this.grid = new Grid(this.level.map);
    this.units = buildRoster(this.level);
    this.rng = makeRng(0xC0FFEE); // single seeded source (design canon: deterministic)
    this.loot = new Map(Object.entries(this.level.containers || {})); // "x,y" -> item id
    this.drops = new Map(); // "x,y" -> item id (from downed zombies)
    this.phase = 'player';
    this.round = 1;
    this.status = 'playing';
    this.selected = null;
    this.step = 'idle'; // 'idle' | 'move' | 'action'
    this.reachable = new Map();
    this.attackable = new Set();
    this.healable = new Set();
    this.openable = new Set(); // adjacent closed doors the selected unit can open
    this.moveOrigin = null;
    this.busy = false;
    this.logLines = [];
    this.log(this.level.intro);
    this.log('— Player Phase (Round 1) —');
    this.changed();
  }

  // --- hook helpers ---
  log(msg) { this.logLines.push(msg); if (this.hooks.onLog) this.hooks.onLog(msg); }
  sfx(e) { if (this.hooks.onAudio) this.hooks.onAudio(e); }
  changed() { if (this.hooks.onChange) this.hooks.onChange(this); }

  // --- queries ---
  unitAt(x, y) { return this.units.find((u) => u.alive && u.x === x && u.y === y) || null; }
  players() { return this.units.filter((u) => u.alive && u.faction === 'player'); }
  enemies() { return this.units.filter((u) => u.alive && u.faction === 'enemy'); }

  // --- selection / player interaction ---
  selectUnit(u) {
    if (this.status !== 'playing' || this.phase !== 'player' || this.busy) return;
    if (!u || u.faction !== 'player' || u.hasActed) return;
    this.selected = u;
    this.step = 'move';
    this.moveOrigin = { x: u.x, y: u.y };
    u.movedThisTurn = false;
    this.reachable = computeReachable(this.grid, u, this.units);
    this.computeTargets(); // attack/heal/open options from the current tile (act without moving)
    this.sfx('select');
    this.changed();
  }

  deselect() {
    this.selected = null;
    this.step = 'idle';
    this.reachable = new Map();
    this.clearTargets();
    this.moveOrigin = null;
    this.changed();
  }

  clearTargets() {
    this.attackable = new Set();
    this.healable = new Set();
    this.openable = new Set();
  }

  computeTargets() {
    this.clearTargets();
    const u = this.selected;
    if (!u) return;
    for (const e of this.enemies()) {
      if (inAttackRange(u, e)) this.attackable.add(keyOf(e.x, e.y));
    }
    if (u.canHeal) {
      for (const a of this.players()) {
        if (a !== u && manhattan(u, a) === 1 && a.hp < a.maxHp) this.healable.add(keyOf(a.x, a.y));
      }
    }
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const dx = u.x + d[0], dy = u.y + d[1];
      if (this.grid.isDoor(dx, dy)) this.openable.add(keyOf(dx, dy));
    }
  }

  handleCellClick(x, y) {
    if (this.status !== 'playing' || this.phase !== 'player' || this.busy) return;
    const k = keyOf(x, y);
    const occ = this.unitAt(x, y);
    if (this.selected) {
      // Act-in-place options work in both the move and action steps (attack without moving).
      if (this.attackable.has(k) && occ) return this.attack(occ);
      if (this.healable.has(k) && occ) return this.heal(occ);
      if (this.openable.has(k)) return this.openDoor(x, y);
      // Switch to another ready survivor.
      if (occ && occ.faction === 'player' && !occ.hasActed && occ !== this.selected) return this.selectUnit(occ);
      // Move (only before acting).
      if (this.step === 'move' && this.reachable.has(k)) return this.moveTo(x, y);
      // Clicking empty ground before moving deselects; after moving it does nothing.
      if (this.step === 'move') return this.deselect();
      return;
    }
    if (occ && occ.faction === 'player' && !occ.hasActed) return this.selectUnit(occ);
  }

  moveTo(x, y) {
    const u = this.selected;
    if (!u) return;
    u.x = x;
    u.y = y;
    u.movedThisTurn = (x !== this.moveOrigin.x || y !== this.moveOrigin.y);
    this.step = 'action';
    this.reachable = new Map();
    this.sfx('move');
    this.pickUpHere(u);   // scavenge container / grab a drop on arrival
    this.computeTargets();
    if (this.checkEnd()) { this.changed(); return; } // stepping onto extraction wins
    this.changed();
  }

  cancelMove() {
    const u = this.selected;
    if (!u || this.step !== 'action' || !this.moveOrigin) return;
    u.x = this.moveOrigin.x;
    u.y = this.moveOrigin.y;
    u.movedThisTurn = false;
    this.step = 'move';
    this.reachable = computeReachable(this.grid, u, this.units);
    this.clearTargets();
    this.changed();
  }

  // --- items: containers & drops ---
  pickUpHere(unit) {
    const k = keyOf(unit.x, unit.y);
    if (this.loot.has(k)) {
      const item = this.loot.get(k);
      this.loot.delete(k);
      this.grid.rows[unit.y][unit.x] = '.'; // searched container becomes floor
      this.applyItem(unit, item, 'searches a container');
    }
    if (this.drops.has(k)) {
      const item = this.drops.get(k);
      this.drops.delete(k);
      this.applyItem(unit, item, 'grabs a drop');
    }
  }

  applyItem(unit, item, verb) {
    const bonus = hasSkill(unit, 'scavenger'); // Scavenger recovers more
    this.sfx('heal');
    if (item === 'ammo') {
      if (isFinite(unit.ammo)) {
        const add = bonus ? 6 : 4;
        unit.ammo += add;
        this.log(`${unit.name} ${verb}: +${add} ammo (now ${unit.ammo}).`);
      } else {
        this.log(`${unit.name} ${verb}: ammo stashed for later.`);
      }
    } else if (item === 'medkit') {
      const amt = (bonus ? 14 : 10);
      const before = unit.hp;
      unit.hp = Math.min(unit.maxHp, unit.hp + amt);
      this.log(`${unit.name} ${verb}: +${unit.hp - before} HP.`);
    }
  }

  maybeDrop(zombie) {
    if (this.rng() >= DROP_CHANCE) return;
    const k = keyOf(zombie.x, zombie.y);
    if (this.drops.has(k) || this.grid.isBlocked(zombie.x, zombie.y)) return;
    const item = this.rng() < 0.5 ? 'ammo' : 'medkit';
    this.drops.set(k, item);
    this.log(`The ${zombie.className} drops something.`);
  }

  // --- actions ---
  attack(target) {
    const u = this.selected;
    if (!u) return;
    const events = resolveAttack(u, target, this.grid, this.units);
    this.applyCombatEvents(events);
    this.finishAction();
  }

  heal(ally) {
    const u = this.selected;
    if (!u) return;
    const events = resolveHeal(u, ally);
    this.sfx('heal');
    for (const ev of events) this.log(`${u.name} patches up ${ally.name} (+${ev.amount} HP).`);
    this.finishAction();
  }

  openDoor(x, y) {
    const u = this.selected;
    if (!u) return;
    this.grid.openDoor(x, y);
    this.sfx('move');
    this.log(`${u.name} forces the door open.`);
    this.finishAction();
  }

  guard() {
    const u = this.selected;
    if (!u) return;
    if (!hasSkill(u, 'overwatch') || u.weapon.kind !== 'ranged' || !(u.ammo > 0)) return;
    u.overwatch = true;
    this.log(`${u.name} takes Overwatch, covering the approach.`);
    this.finishAction();
  }

  wait() {
    if (!this.selected) return;
    this.log(`${this.selected.name} holds position.`);
    this.finishAction();
  }

  applyCombatEvents(events) {
    for (const ev of events) {
      if (ev.type === 'hit') {
        this.sfx('hit');
        this.log(`${ev.source.name} hits ${ev.target.name} for ${ev.dmg}.`);
      } else if (ev.type === 'cleave') {
        this.sfx('hit');
        this.log(`${ev.source.name} cleaves ${ev.target.name} for ${ev.dmg}.`);
      } else if (ev.type === 'counter') {
        this.sfx('counter');
        this.log(`${ev.source.name} counters for ${ev.dmg}.`);
      } else if (ev.type === 'down') {
        this.sfx('down');
        this.log(`${ev.target.name} is down!`);
        if (ev.target.faction === 'enemy') this.maybeDrop(ev.target);
      }
    }
  }

  finishAction() {
    const u = this.selected;
    if (u) u.hasActed = true;
    this.selected = null;
    this.step = 'idle';
    this.reachable = new Map();
    this.clearTargets();
    this.moveOrigin = null;
    if (!this.checkEnd()) this.maybeAutoEndTurn();
    this.changed();
  }

  maybeAutoEndTurn() {
    if (this.players().every((u) => u.hasActed)) this.endTurn();
  }

  checkEnd() {
    if (this.status !== 'playing') return true;
    const players = this.players();
    const enemies = this.enemies();
    if (players.length === 0) {
      this.status = 'lost';
      this.sfx('defeat');
      this.log('All survivors are down. The overpass is lost.');
      return true;
    }
    if (enemies.length === 0) {
      this.status = 'won';
      this.sfx('victory');
      this.log('The horde is cleared. Survivors hold the overpass!');
      return true;
    }
    if (players.some((u) => this.grid.isExtraction(u.x, u.y))) {
      this.status = 'won';
      this.sfx('victory');
      this.log('A survivor reaches extraction. Everyone falls back — victory!');
      return true;
    }
    return false;
  }

  // --- phase control ---
  endTurn() {
    if (this.status !== 'playing' || this.phase !== 'player' || this.busy) return;
    this.selected = null;
    this.step = 'idle';
    this.reachable = new Map();
    this.clearTargets();
    this.moveOrigin = null;
    this.phase = 'enemy';
    this.busy = true;
    this.sfx('phase');
    this.log('— Enemy Phase —');
    this.changed();
    this.runEnemyPhase();
  }

  // A player Overwatch shot fires at a walker that has entered range. Returns true if the
  // walker was put down. Ranged dead zone applies (won't fire at point-blank).
  triggerOverwatch(walker) {
    const watchers = this.players()
      .filter((p) => p.overwatch && canReach(p, manhattan(p, walker)))
      .sort((a, b) => a.id - b.id);
    for (const w of watchers) {
      if (!walker.alive) break;
      this.log(`${w.name} fires on Overwatch!`);
      const events = resolveAttack(w, walker, this.grid, this.units);
      this.applyCombatEvents(events);
      w.overwatch = false; // one reaction shot per phase
      this.changed();
    }
    return !walker.alive;
  }

  async runEnemyPhase() {
    const walkers = this.enemies().slice().sort((a, b) => a.id - b.id);
    for (const w of walkers) {
      if (this.status !== 'playing') break;
      if (!w.alive) continue;
      await delay(200);
      const decision = decideWalker(this.grid, w, this.units);
      if (decision) {
        if (w.x !== decision.moveTo.x || w.y !== decision.moveTo.y) {
          w.x = decision.moveTo.x;
          w.y = decision.moveTo.y;
          w.movedThisTurn = true;
          this.sfx('move');
          this.changed();
          await delay(150);
        }
        // Overwatch reaction as the walker completes its approach.
        if (this.triggerOverwatch(w)) {
          if (this.checkEnd()) { this.busy = false; this.changed(); return; }
          await delay(150);
          continue;
        }
        if (decision.target && decision.target.alive && inAttackRange(w, decision.target)) {
          const events = resolveAttack(w, decision.target, this.grid, this.units);
          this.applyCombatEvents(events);
          this.changed();
          if (this.checkEnd()) { this.busy = false; this.changed(); return; }
          await delay(180);
        }
      }
    }
    // Start next player phase — refresh all units.
    this.units.forEach((u) => { u.hasActed = false; u.movedThisTurn = false; u.overwatch = false; });
    this.phase = 'player';
    this.round += 1;
    this.busy = false;
    this.sfx('phase');
    this.log(`— Player Phase (Round ${this.round}) —`);
    this.changed();
  }
}
