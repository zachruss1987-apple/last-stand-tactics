// Rendering — owned jointly by Programmer (structure) and Graphics Designer (look).
// Pure presentation: reads game state, writes DOM. Rebuilds the small board each change.
// M2: SVG unit sprites, weapon/skill/ammo HUD, doors/containers/drops, overwatch badges.

import { keyOf } from './grid.js';
import { unitSVG, weaponIconSVG, itemSVG } from './sprites.js';
import { SKILLS } from '../data/skills.js';

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
}

function hpClass(u) {
  const r = u.hp / u.maxHp;
  if (r > 0.5) return 'hp-ok';
  if (r > 0.25) return 'hp-warn';
  return 'hp-low';
}

function rangeLabel(u) {
  return u.minRange === u.maxRange ? `${u.maxRange}` : `${u.minRange}–${u.maxRange}`;
}

export class Renderer {
  constructor(els) {
    this.els = els;
  }

  render(game) {
    this.renderBoard(game);
    this.renderStatus(game);
    this.renderRoster(game);
    this.renderSelected(game);
    this.renderLog(game);
    this.renderButtons(game);
    this.renderOverlay(game);
  }

  renderBoard(game) {
    const { grid } = game;
    const board = this.els.board;
    board.style.setProperty('--cols', grid.width);
    board.style.setProperty('--rows', grid.height);
    board.innerHTML = '';
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const k = keyOf(x, y);
        const cell = el('div', `cell t-${grid.key(x, y)}`);
        cell.dataset.x = x;
        cell.dataset.y = y;
        if (game.reachable.has(k)) cell.classList.add('reach');
        if (game.attackable.has(k)) cell.classList.add('attack');
        if (game.healable.has(k)) cell.classList.add('heal');
        if (game.openable.has(k)) cell.classList.add('openable');

        // ground item (drop) sitting on this tile
        if (game.drops.has(k)) {
          const drop = el('div', 'drop');
          drop.innerHTML = itemSVG(game.drops.get(k));
          cell.appendChild(drop);
        }

        const occ = game.unitAt(x, y);
        if (occ) {
          const unit = el('div', `unit f-${occ.faction}`);
          if (occ === game.selected) unit.classList.add('selected');
          if (occ.hasActed && occ.faction === 'player') unit.classList.add('acted');
          unit.innerHTML = unitSVG(occ);

          const bar = el('div', 'hpbar');
          const fill = el('div', `hpfill ${hpClass(occ)}`);
          fill.style.width = `${(occ.hp / occ.maxHp) * 100}%`;
          bar.appendChild(fill);
          unit.appendChild(bar);

          if (occ.faction === 'player' && isFinite(occ.ammo)) {
            const ammo = el('div', `badge ammo ${occ.ammo === 0 ? 'empty' : ''}`, `${occ.ammo}`);
            unit.appendChild(ammo);
          }
          if (occ.overwatch) unit.appendChild(el('div', 'badge watch', '◎'));
          cell.appendChild(unit);
        }
        board.appendChild(cell);
      }
    }
  }

  renderStatus(game) {
    const phase = game.phase === 'player' ? 'Player Phase' : 'Enemy Phase';
    let tag = `Round ${game.round} · ${phase}`;
    if (game.status === 'won') tag = 'Victory';
    else if (game.status === 'lost') tag = 'Defeat';
    this.els.status.textContent = tag;
    this.els.status.className = `status phase-${game.phase} status-${game.status}`;
  }

  renderRoster(game) {
    const root = this.els.roster;
    root.innerHTML = '';
    root.appendChild(el('h3', null, `Survivors (${game.players().length})`));
    for (const u of game.units.filter((x) => x.faction === 'player')) {
      const row = el('div', `rosrow ${u.alive ? '' : 'dead'} ${u.hasActed ? 'acted' : ''}`);
      const ic = el('span', 'ros-wicon');
      ic.innerHTML = weaponIconSVG(u.weapon.icon);
      row.appendChild(ic);
      row.appendChild(el('span', 'ros-name', u.name));
      const hp = u.alive ? `${u.hp}/${u.maxHp}` : 'DOWN';
      const ammo = (u.alive && isFinite(u.ammo)) ? ` · ${u.ammo}⁙` : '';
      row.appendChild(el('span', 'ros-hp', hp + ammo));
      root.appendChild(row);
    }
    // enemy tally by variant
    root.appendChild(el('h3', null, `Horde (${game.enemies().length})`));
    const counts = {};
    for (const z of game.enemies()) counts[z.className] = (counts[z.className] || 0) + 1;
    const tally = el('div', 'tally');
    for (const [name, n] of Object.entries(counts)) tally.appendChild(el('span', 'tag', `${name} ×${n}`));
    if (!Object.keys(counts).length) tally.appendChild(el('span', 'muted', 'cleared'));
    root.appendChild(tally);
  }

  renderSelected(game) {
    const root = this.els.selinfo;
    root.innerHTML = '';
    const u = game.selected;
    if (!u) {
      root.appendChild(el('p', 'muted', game.phase === 'player' && !game.busy
        ? 'Click a survivor to select. Move, then attack, heal, guard, open a door, or wait.'
        : 'Enemy phase…'));
      return;
    }
    root.appendChild(el('h3', null, `${u.name} — ${u.className}`));
    const stats = el('div', 'stats');
    stats.appendChild(el('span', null, `HP ${u.hp}/${u.maxHp}`));
    stats.appendChild(el('span', null, `ATK ${u.atk}`));
    stats.appendChild(el('span', null, `DEF ${u.def}`));
    stats.appendChild(el('span', null, `MOV ${u.move}`));
    root.appendChild(stats);

    // weapon
    const wp = el('div', 'weapon');
    const wic = el('span', 'wp-ic');
    wic.innerHTML = weaponIconSVG(u.weapon.icon);
    wp.appendChild(wic);
    const wt = el('div', 'wp-txt');
    wt.appendChild(el('div', 'wp-name', u.weapon.name));
    const meta = `${u.weapon.kind} · range ${rangeLabel(u)}` + (isFinite(u.ammo) ? ` · ammo ${u.ammo}` : '');
    wt.appendChild(el('div', 'wp-meta', meta));
    wp.appendChild(wt);
    root.appendChild(wp);

    // skills
    if (u.skills.length) {
      const sk = el('div', 'skills');
      for (const id of u.skills) {
        const s = SKILLS[id];
        if (!s) continue;
        const chip = el('span', 'skill', s.name);
        chip.title = s.desc;
        sk.appendChild(chip);
      }
      root.appendChild(sk);
    }

    const bits = [];
    if (game.attackable.size) bits.push('red = attack');
    if (game.healable.size) bits.push('green = heal');
    if (game.openable.size) bits.push('amber = open door');
    const acts = bits.length ? `Act now (${bits.join(', ')})` : 'No targets in range';
    if (game.step === 'move') {
      root.appendChild(el('p', 'hint', `Move to a blue tile, or act without moving. ${acts}. Or Guard / Wait.`));
    } else {
      root.appendChild(el('p', 'hint', `${acts} — or Guard / Wait / Cancel.`));
    }
  }

  renderLog(game) {
    const root = this.els.log;
    root.innerHTML = '';
    for (const line of game.logLines.slice(-9)) root.appendChild(el('div', 'logline', line));
    root.scrollTop = root.scrollHeight;
  }

  renderButtons(game) {
    const playerActing = game.status === 'playing' && game.phase === 'player' && !game.busy;
    const u = game.selected;
    const hasSelected = playerActing && !!u;
    // Wait/Guard work whether or not the unit has moved; Cancel only reverts a move.
    this.els.btnWait.disabled = !hasSelected;
    this.els.btnCancel.disabled = !(playerActing && game.step === 'action');
    this.els.btnEndTurn.disabled = !playerActing;
    if (this.els.btnGuard) {
      const canGuard = hasSelected && u.skills.includes('overwatch') && u.weapon.kind === 'ranged' && u.ammo > 0;
      this.els.btnGuard.disabled = !canGuard;
    }
  }

  renderOverlay(game) {
    const root = this.els.overlay;
    if (game.status === 'playing') {
      root.classList.remove('show');
      root.innerHTML = '';
      return;
    }
    root.classList.add('show');
    root.innerHTML = '';
    const card = el('div', `overlay-card ${game.status}`);
    card.appendChild(el('h1', null, game.status === 'won' ? 'SURVIVED' : 'OVERRUN'));
    card.appendChild(el('p', null, game.status === 'won'
      ? 'The survivors break through the overpass.'
      : 'The horde takes the overpass. No one makes it out.'));
    const btn = el('button', 'btn primary', 'Play Again');
    btn.id = 'btn-restart-overlay';
    card.appendChild(btn);
    root.appendChild(card);
  }
}
