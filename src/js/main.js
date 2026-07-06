// Bootstrap — wires data, controller, renderer, audio, and input together.
// Run via a static server (see CLAUDE.md §7): http://localhost:8000/src/index.html

import { LEVEL_01 } from './data/level-01.js';
import { Game } from './engine/turn.js';
import { Renderer } from './engine/render.js';
import { AudioEngine } from './engine/audio.js';
import { attachInput } from './engine/input.js';

function byId(id) { return document.getElementById(id); }

const els = {
  board: byId('board'),
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
const renderer = new Renderer(els);

const game = new Game(LEVEL_01, {
  onChange: (g) => renderer.render(g),
  onAudio: (event) => audio.play(event),
});

attachInput(game, audio, els);
renderer.render(game);

// Expose for debugging / the Tester agent to poke state from the console.
window.__game = game;
