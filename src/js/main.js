// Bootstrap — wires data, controller, Phaser board view, DOM HUD, audio, and input.
// Run via a static server (see CLAUDE.md §7): http://localhost:8000/src/index.html

import { LEVEL_01 } from './data/level-01.js';
import { Game } from './engine/turn.js';
import { Renderer } from './engine/render.js';
import { AudioEngine } from './engine/audio.js';
import { attachInput } from './engine/input.js';
import { createBoardView } from './game/phaser-view.js';

function byId(id) { return document.getElementById(id); }

const els = {
  status: byId('status'),
  roster: byId('roster'),
  selinfo: byId('selinfo'),
  log: byId('log'),
  overlay: byId('overlay'),
  btnEndTurn: byId('btn-endturn'),
  btnGuard: byId('btn-guard'),
  btnWait: byId('btn-wait'),
  btnCancel: byId('btn-cancel'),
  btnRestart: byId('btn-restart'),
  btnMute: byId('btn-mute'),
};

const audio = new AudioEngine();
const renderer = new Renderer(els); // HUD only — the board is rendered by Phaser

let boardView; // set below; guard in onChange since the engine emits during construction

const game = new Game(LEVEL_01, {
  onChange: (g) => { renderer.render(g); if (boardView) boardView.sync(g); },
  onAudio: (event) => audio.play(event),
});

boardView = createBoardView(game, 'board', { onPointer: () => audio.ensure() });

attachInput(game, audio, els);
renderer.render(game);

// Expose for debugging / the Tester agent.
window.__game = game;
