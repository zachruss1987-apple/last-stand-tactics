// Game controller: owns state, the player/enemy phase machine, selection/action flow,
// and win/lose resolution (design canon §1, §7). Rendering and input live elsewhere and
// talk to this through the hooks passed in (onChange / onAudio / onLog). No DOM here.

import { Grid, computeReachable, keyOf, manhattan } from './grid.js';
import { buildRoster } from './units.js';
import { resolveAttack, resolveHeal, inAttackRange } from './combat.js';
import { decideWalker } from './ai.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export class Game {
  constructor(level, hooks = {}) {
    this.level = level;
    this.hooks = hooks;
    this.reset();
  }

  reset() {
    this.grid = new Grid(this.level.map);
    this.units = buildRoster(this.level);
    this.phase = 'player';
    this.round = 1;
    this.status = 'playing'; // 'playing' | 'won' | 'lost'
    this.selected = null;
    this.step = 'idle'; // 'idle' | 'move' | 'action'
    this.reachable = new Map();
    this.attackable = new Set();
    this.healable = new Set();
    this.moveOrigin = null;
    this.busy = false; // true while the enemy phase is animating
    this.logLines = [];
    this.log(this.level.intro);
    this.log(`— Player Phase (Round 1) —`);
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
    this.reachable = computeReachable(this.grid, u, this.units);
    this.attackable = new Set();
    this.healable = new Set();
    this.sfx('select');
    this.changed();
  }

  deselect() {
    this.selected = null;
    this.step = 'idle';
    this.reachable = new Map();
    this.attackable = new Set();
    this.healable = new Set();
    this.moveOrigin = null;
    this.changed();
  }

  computeTargets() {
    this.attackable = new Set();
    this.healable = new Set();
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
  }

  handleCellClick(x, y) {
    if (this.status !== 'playing' || this.phase !== 'player' || this.busy) return;
    const k = keyOf(x, y);
    const occ = this.unitAt(x, y);
    if (this.step === 'action' && this.selected) {
      if (this.attackable.has(k) && occ) return this.attack(occ);
      if (this.healable.has(k) && occ) return this.heal(occ);
      return; // must resolve the current action via Wait / Cancel
    }
    if (occ && occ.faction === 'player' && !occ.hasActed) return this.selectUnit(occ);
    if (this.selected && this.step === 'move' && this.reachable.has(k)) return this.moveTo(x, y);
    this.deselect();
  }

  moveTo(x, y) {
    const u = this.selected;
    if (!u) return;
    u.x = x;
    u.y = y;
    this.step = 'action';
    this.reachable = new Map();
    this.computeTargets();
    this.sfx('move');
    // Stepping onto extraction wins immediately (design canon §7).
    if (this.checkEnd()) { this.changed(); return; }
    this.changed();
  }

  cancelMove() {
    const u = this.selected;
    if (!u || this.step !== 'action' || !this.moveOrigin) return;
    u.x = this.moveOrigin.x;
    u.y = this.moveOrigin.y;
    this.step = 'move';
    this.reachable = computeReachable(this.grid, u, this.units);
    this.attackable = new Set();
    this.healable = new Set();
    this.changed();
  }

  attack(target) {
    const u = this.selected;
    if (!u) return;
    const events = resolveAttack(u, target, this.grid);
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

  wait() {
    if (!this.selected || this.step !== 'action') return;
    this.log(`${this.selected.name} holds position.`);
    this.finishAction();
  }

  applyCombatEvents(events) {
    for (const ev of events) {
      if (ev.type === 'hit') {
        this.sfx('hit');
        this.log(`${ev.source.name} hits ${ev.target.name} for ${ev.dmg}.`);
      } else if (ev.type === 'counter') {
        this.sfx('counter');
        this.log(`${ev.source.name} counters for ${ev.dmg}.`);
      } else if (ev.type === 'down') {
        this.sfx('down');
        this.log(`${ev.target.name} is down!`);
      }
    }
  }

  finishAction() {
    const u = this.selected;
    if (u) u.hasActed = true;
    this.selected = null;
    this.step = 'idle';
    this.reachable = new Map();
    this.attackable = new Set();
    this.healable = new Set();
    this.moveOrigin = null;
    if (!this.checkEnd()) this.maybeAutoEndTurn();
    this.changed();
  }

  // Convenience: if every survivor has acted, the player phase is effectively over.
  maybeAutoEndTurn() {
    if (this.players().every((u) => u.hasActed)) this.endTurn();
  }

  // Returns true if the game has ended (and sets status + plays the sting once).
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
    this.attackable = new Set();
    this.healable = new Set();
    this.moveOrigin = null;
    this.phase = 'enemy';
    this.busy = true;
    this.sfx('phase');
    this.log('— Enemy Phase —');
    this.changed();
    this.runEnemyPhase();
  }

  async runEnemyPhase() {
    const walkers = this.enemies().slice().sort((a, b) => a.id - b.id);
    for (const w of walkers) {
      if (this.status !== 'playing') break;
      if (!w.alive) continue;
      await delay(220);
      const decision = decideWalker(this.grid, w, this.units);
      if (decision) {
        if (w.x !== decision.moveTo.x || w.y !== decision.moveTo.y) {
          w.x = decision.moveTo.x;
          w.y = decision.moveTo.y;
          this.sfx('move');
          this.changed();
          await delay(160);
        }
        if (decision.target && decision.target.alive && inAttackRange(w, decision.target)) {
          const events = resolveAttack(w, decision.target, this.grid);
          this.applyCombatEvents(events);
          this.changed();
          if (this.checkEnd()) { this.busy = false; this.changed(); return; }
          await delay(200);
        }
      }
    }
    // Start next player phase.
    this.units.forEach((u) => { u.hasActed = false; });
    this.phase = 'player';
    this.round += 1;
    this.busy = false;
    this.sfx('phase');
    this.log(`— Player Phase (Round ${this.round}) —`);
    this.changed();
  }
}
