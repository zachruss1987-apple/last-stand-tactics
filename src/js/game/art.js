// Pixel-art texture baking — owned by the Graphics Designer. Authors cohesive pixel
// sprites/tiles in code and registers them as Phaser textures (no external assets, no
// licensing). 16x16 native, scaled up with nearest-neighbor for a crisp retro look.
// Purpose-built to match our roster (weapon-carrying survivors + 4 zombie variants) and
// terrain. CC0/AI art can replace these later (see docs/decisions Q7).

import { CLASSES } from '../data/units.js';
import { WEAPONS } from '../data/weapons.js';

export const NATIVE = 16; // native pixels per sprite/tile

function darken(hex, f = 0.55) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}
function lighten(hex, f = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * f);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
// tiny deterministic hash → 0..1 for texture speckle
function rnd(x, y, seed) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 3.1) * 43758.5453;
  return s - Math.floor(s);
}

function bake(scene, key, drawFn) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, NATIVE, NATIVE);
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, NATIVE, NATIVE);
  drawFn(ctx);
  tex.refresh();
  return key;
}
const P = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

// ---- terrain tiles ----
const TILE_DRAW = {
  floor: (ctx) => {
    P(ctx, 0, 0, 16, 16, '#23292a');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const r = rnd(x, y, 1);
      if (r > 0.86) P(ctx, x, y, 1, 1, '#1c2223');
      else if (r < 0.06) P(ctx, x, y, 1, 1, '#2b3234');
    }
    P(ctx, 0, 0, 16, 1, '#1a1f20'); P(ctx, 0, 15, 16, 1, '#1a1f20');
  },
  rubble: (ctx) => {
    P(ctx, 0, 0, 16, 16, '#33301f');
    const chunks = [[2, 3, 3, 2], [8, 5, 4, 3], [4, 9, 3, 3], [10, 10, 3, 2], [6, 12, 3, 2]];
    for (const [x, y, w, h] of chunks) { P(ctx, x, y, w, h, '#4a4336'); P(ctx, x, y, w, 1, '#5a5142'); }
    for (let i = 0; i < 10; i++) { const x = (i * 7) % 16, y = (i * 5) % 16; P(ctx, x, y, 1, 1, '#241f13'); }
  },
  wall: (ctx) => {
    P(ctx, 0, 0, 16, 16, '#191e20');
    for (let y = 0; y < 16; y += 4) {
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = -4; x < 16; x += 8) { P(ctx, x + off, y, 7, 3, '#14181a'); }
    }
    P(ctx, 0, 0, 16, 1, '#0a0c0d'); P(ctx, 0, 0, 1, 16, '#0a0c0d');
  },
  door: (ctx) => {
    P(ctx, 0, 0, 16, 16, '#3a2c1a');
    P(ctx, 2, 1, 12, 14, '#5a4632'); P(ctx, 2, 1, 12, 1, '#6a563f');
    for (let x = 4; x < 14; x += 4) P(ctx, x, 2, 1, 12, '#48381f');
    P(ctx, 11, 7, 2, 2, '#d8b64a'); // handle
  },
  container: (ctx) => {
    TILE_DRAW.floor(ctx);
    P(ctx, 3, 4, 10, 9, '#443a24'); P(ctx, 3, 4, 10, 1, '#6a5a3a');
    P(ctx, 3, 4, 1, 9, '#5a4a2e'); P(ctx, 12, 4, 1, 9, '#2a2416');
    P(ctx, 3, 8, 10, 1, '#2a2416'); P(ctx, 7, 4, 2, 9, '#2a2416');
  },
  extraction: (ctx) => {
    P(ctx, 0, 0, 16, 16, '#14251c');
    P(ctx, 0, 0, 16, 1, '#6bbf72'); P(ctx, 0, 15, 16, 1, '#6bbf72');
    P(ctx, 0, 0, 1, 16, '#6bbf72'); P(ctx, 15, 0, 1, 16, '#6bbf72');
    // chevrons pointing up/out
    P(ctx, 7, 4, 2, 2, '#8fe0a0'); P(ctx, 5, 6, 2, 2, '#8fe0a0'); P(ctx, 9, 6, 2, 2, '#8fe0a0');
    P(ctx, 7, 9, 2, 2, '#4f9a63'); P(ctx, 5, 11, 2, 2, '#4f9a63'); P(ctx, 9, 11, 2, 2, '#4f9a63');
  },
};

export function bakeTiles(scene) {
  for (const key of Object.keys(TILE_DRAW)) bake(scene, `tile-${key}`, TILE_DRAW[key]);
}

// ---- weapon overlay drawn into a unit sprite (right hand) ----
function drawWeapon(ctx, icon) {
  switch (icon) {
    case 'rifle':  P(ctx, 10, 8, 6, 1, '#3b4043'); P(ctx, 10, 9, 3, 1, '#5a4632'); break;
    case 'pistol': P(ctx, 11, 8, 4, 1, '#3b4043'); P(ctx, 11, 9, 1, 2, '#2b3032'); break;
    case 'blade':  P(ctx, 12, 3, 1, 6, '#cdd0d2'); P(ctx, 11, 9, 3, 1, '#5a4632'); break;
    case 'bat':    P(ctx, 12, 3, 2, 5, '#9a7a4a'); P(ctx, 12, 8, 1, 3, '#6a4f2f'); break;
    default: break;
  }
}

function drawSurvivor(ctx, def, weapon) {
  const cloth = def.color, skin = def.skin, dark = darken(def.color, 0.5), pants = darken(def.color, 0.4);
  P(ctx, 4, 15, 8, 1, 'rgba(0,0,0,0.35)');            // shadow
  P(ctx, 6, 12, 2, 3, pants); P(ctx, 8, 12, 2, 3, pants); // legs
  P(ctx, 5, 7, 6, 5, cloth);                          // torso
  P(ctx, 4, 7, 1, 4, dark); P(ctx, 11, 7, 1, 4, dark); // arms
  P(ctx, 5, 2, 6, 5, skin);                           // head
  P(ctx, 5, 1, 6, 2, dark);                           // cap (role color)
  P(ctx, 6, 4, 1, 1, '#241c17'); P(ctx, 9, 4, 1, 1, '#241c17'); // eyes
  drawWeapon(ctx, weapon.icon);
}

function drawZombie(ctx, def, weapon) {
  const body = def.tint, skin = lighten(def.tint, 0.25), dark = darken(def.tint, 0.5);
  const big = def.variant === 'brute';
  P(ctx, 4, 15, 8, 1, 'rgba(0,0,0,0.35)');
  P(ctx, 6, 12, 2, 3, dark); P(ctx, 9, 12, 2, 3, dark);        // staggered legs
  P(ctx, 5, 7, 7, 5, body);                                   // hunched torso
  if (big) { P(ctx, 4, 7, 8, 5, body); P(ctx, 4, 7, 8, 1, dark); } // broad shoulders
  P(ctx, 10, 7, 4, 1, body); P(ctx, 10, 8, 4, 1, dark);       // arms reaching forward
  P(ctx, 8, 2, 5, 5, skin);                                   // head forward
  P(ctx, 10, 4, 1, 1, '#160d0a'); P(ctx, 8, 4, 1, 1, '#160d0a'); // dead eyes
  if (def.variant === 'runner') { P(ctx, 1, 8, 3, 1, lighten(def.tint, 0.4)); P(ctx, 0, 11, 3, 1, lighten(def.tint, 0.4)); }
  if (def.variant === 'spitter') { P(ctx, 8, 1, 5, 2, lighten(def.tint, 0.4)); P(ctx, 9, 7, 1, 2, '#b6d84a'); }
  drawWeapon(ctx, weapon.icon);
}

// Bake (once) and return the texture key for a unit class.
export function unitTextureKey(scene, clsKey) {
  const key = `unit-${clsKey}`;
  return bake(scene, key, (ctx) => {
    const def = CLASSES[clsKey];
    const weapon = WEAPONS[def.weapon];
    if (def.kind === 'zombie') drawZombie(ctx, def, weapon);
    else drawSurvivor(ctx, def, weapon);
  });
}

// Small item-drop textures.
export function bakeItems(scene) {
  bake(scene, 'item-ammo', (ctx) => { P(ctx, 4, 6, 8, 6, '#b9962f'); P(ctx, 4, 6, 8, 2, '#d8b64a'); P(ctx, 7, 3, 2, 3, '#8a6a20'); });
  bake(scene, 'item-medkit', (ctx) => { P(ctx, 4, 5, 8, 7, '#e7ebe9'); P(ctx, 7, 6, 2, 5, '#c65b4e'); P(ctx, 5, 7, 6, 1, '#c65b4e'); });
}

export function bakeAll(scene) {
  bakeTiles(scene);
  bakeItems(scene);
  for (const cls of Object.keys(CLASSES)) unitTextureKey(scene, cls);
}
