// Phaser board view — owned by the Programmer. Renders the tactical board (tiles, units,
// highlights, drops, HP bars) from the engine's state and routes tile clicks back to the
// Game controller. The engine stays the authoritative model; this is pure view + input.
// Phaser is loaded as a global via <script> (see index.html).

import { bakeAll, unitTextureKey } from './art.js';
import { BattleScene } from './battle-scene.js';

const Phaser = window.Phaser;
const TILE = 48; // on-screen pixels per tile (16px art scaled 3x)

class BoardScene extends Phaser.Scene {
  constructor() { super('board'); }

  init(data) {
    this.engine = data.engine;
    this.view = data.view;
  }

  create() {
    bakeAll(this);
    const g = this.engine.grid;

    this.tileSprites = [];
    for (let y = 0; y < g.height; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < g.width; x++) {
        const s = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, `tile-${g.key(x, y)}`)
          .setDisplaySize(TILE, TILE).setDepth(0);
        this.tileSprites[y][x] = s;
      }
    }

    this.highlight = this.add.graphics().setDepth(5);
    this.selGfx = this.add.graphics().setDepth(40);
    this.unitSprites = new Map();
    this.hpBars = new Map();
    this.dropSprites = new Map();

    this.input.on('pointerdown', (p) => {
      if (this.view.onPointer) this.view.onPointer();
      const tx = Math.floor(p.worldX / TILE);
      const ty = Math.floor(p.worldY / TILE);
      this.engine.handleCellClick(tx, ty);
    });

    this.view.scene = this;
    this.syncState();
  }

  syncState() {
    const g = this.engine.grid;
    for (let y = 0; y < g.height; y++) {
      for (let x = 0; x < g.width; x++) {
        const key = `tile-${g.key(x, y)}`;
        const s = this.tileSprites[y][x];
        if (s.texture.key !== key) s.setTexture(key).setDisplaySize(TILE, TILE);
      }
    }
    this.drawHighlights();
    this.syncDrops();
    this.syncUnits();
  }

  drawHighlights() {
    const game = this.engine;
    const hl = this.highlight;
    hl.clear();
    const paint = (keys, color) => {
      for (const k of keys) {
        const [x, y] = k.split(',').map(Number);
        hl.fillStyle(color, 0.26); hl.fillRect(x * TILE, y * TILE, TILE, TILE);
        hl.lineStyle(2, color, 0.9); hl.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
      }
    };
    paint(game.reachable.keys(), 0x4d86c6);
    paint(game.attackable, 0xc65b4e);
    paint(game.healable, 0x6bbf72);
    paint(game.openable, 0xd8a63c);
  }

  syncDrops() {
    const drops = this.engine.drops;
    for (const [k, s] of this.dropSprites) if (!drops.has(k)) { s.destroy(); this.dropSprites.delete(k); }
    for (const [k, item] of drops) {
      if (!this.dropSprites.has(k)) {
        const [x, y] = k.split(',').map(Number);
        const s = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, `item-${item}`)
          .setDisplaySize(TILE * 0.5, TILE * 0.5).setDepth(8);
        this.dropSprites.set(k, s);
      }
    }
  }

  syncUnits() {
    const game = this.engine;
    const seen = new Set();
    for (const u of game.units) {
      if (!u.alive) continue;
      seen.add(u.id);
      let s = this.unitSprites.get(u.id);
      if (!s) { s = this.add.image(0, 0, unitTextureKey(this, u.cls)); this.unitSprites.set(u.id, s); }
      const scale = (u.faction === 'enemy' && u.size) ? u.size : 1;
      s.setDisplaySize(TILE * scale, TILE * scale);
      s.x = u.x * TILE + TILE / 2;
      s.y = u.y * TILE + TILE / 2 - (scale > 1 ? TILE * (scale - 1) / 2 : 0);
      s.setDepth(10 + u.y);
      if (u.hasActed && u.faction === 'player') s.setTint(0x808080); else s.clearTint();
      this.drawHpBar(u);
    }
    for (const [id, s] of this.unitSprites) {
      if (!seen.has(id)) {
        s.destroy(); this.unitSprites.delete(id);
        const b = this.hpBars.get(id); if (b) { b.destroy(); this.hpBars.delete(id); }
      }
    }
    this.drawSelection();
  }

  drawHpBar(u) {
    let b = this.hpBars.get(u.id);
    if (!b) { b = this.add.graphics().setDepth(50); this.hpBars.set(u.id, b); }
    b.clear();
    const w = TILE * 0.7, x = u.x * TILE + TILE / 2 - w / 2, y = u.y * TILE + TILE - 7;
    const r = u.hp / u.maxHp;
    b.fillStyle(0x000000, 0.65); b.fillRect(x - 1, y - 1, w + 2, 5);
    const col = r > 0.5 ? 0x6bbf72 : r > 0.25 ? 0xd8a63c : 0xc65b4e;
    b.fillStyle(col, 1); b.fillRect(x, y, w * r, 3);
  }

  drawSelection() {
    const u = this.engine.selected;
    this.selGfx.clear();
    if (!u || !u.alive) return;
    this.selGfx.lineStyle(2, 0xffffff, 0.95);
    this.selGfx.strokeRect(u.x * TILE + 2, u.y * TILE + 2, TILE - 4, TILE - 4);
  }
}

// Create the Phaser board mounted in the element with id `parentId`.
export function createBoardView(engine, parentId, hooks = {}) {
  if (!Phaser) { console.error('Phaser failed to load'); return { sync() {} }; }
  const g = engine.grid;
  const view = {
    scene: null,
    battleScene: null,
    battleEnabled: true,
    onPointer: hooks.onPointer || null,
    sync() { if (this.scene) this.scene.syncState(); },
    playBattle(report) {
      return (this.battleEnabled && this.battleScene) ? this.battleScene.play(report) : Promise.resolve();
    },
  };
  const phaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: parentId,
    width: g.width * TILE,
    height: g.height * TILE,
    pixelArt: true,
    backgroundColor: '#0a0c0d',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  });
  phaser.scene.add('board', BoardScene, true, { engine, view });
  phaser.scene.add('battle', BattleScene, true, { view });
  view.phaser = phaser;
  return view;
}
