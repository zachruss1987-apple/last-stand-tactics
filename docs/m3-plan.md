# M3 — "Pixel & Cinematics" — Execution Spec

> Stakeholder-approved graphics overhaul (2026-07-07). Authoritative work order for the
> autonomous run; survives context compaction. Program Manager sequences; commit
> incrementally, role-attributed; push to origin main.

## Approved direction
- **Art style:** pixel art (retro SRPG). [[decisions D9]]
- **Assets:** mix, first pass from **CC0 packs** downloaded now (Kenney / OpenGameArt /
  game-icons); AI/custom later per-asset. Track every asset's source + license in
  `CREDITS.md`. [[decisions D10]]
- **Battle scenes:** full **Fire-Emblem-style cutaway** on attacks (side view, lunge/hit/
  recoil, HP drain, damage numbers), with skip/toggle + auto-skip on repeats.
- **Rendering:** adopt **Phaser** (full framework), vendored locally as `phaser.min.js` —
  no build step, still runs by opening `src/index.html`. [[decisions D8]]

## Architecture (critical: keep the tested engine)
Our pure logic — `src/js/engine/{grid,units,combat,ai,turn}.js` + `src/js/data/*` — is the
authoritative **model** and stays untouched, so the 24 smoke tests remain valid. Phaser is
only the **view + battle scenes**. The DOM HUD/sidebar/log/buttons are retained and keep
being driven by the engine's `onChange`.

New code under `src/js/game/` (Phaser):
- `boot.js` — Phaser config + asset preload (BootScene).
- `map-scene.js` — renders the tilemap + unit sprites from game state; handles input
  (tile clicks → `game.handleCellClick`); plays move/attack tweens; triggers the battle
  scene; re-syncs on `onChange`.
- `battle-scene.js` — the FE-style cutaway (attacker vs defender, animations, damage).
- `bridge.js` — glue between the Phaser scenes and the `Game` controller + DOM HUD.

`render.js` is trimmed to the **HUD only** (selected-unit panel, roster, log, buttons,
overlay); the board moves to Phaser.

## Asset pipeline
- Downloaded sheets live in `assets/graphics/` with a small `manifest.json`.
- `CREDITS.md` (repo root) lists each asset: name, author, source URL, license (CC0/CC-BY).
- Prefer **CC0** (no attribution required); if CC-BY is used, attribution is mandatory.

## Work order (sequenced)
- [ ] **A. Vendor Phaser** (`src/vendor/phaser.min.js`), boot a Phaser canvas replacing
      `#board`, render the Level-01 tilemap from `grid` with pixel tiles.
- [ ] **B. Unit sprites** — CC0 survivor + 4 zombie-variant sprites; render from state;
      wire tile-click input to the engine; sync on `onChange`.
- [ ] **C. Board parity** — port move/attack/heal/open highlights, ammo/overwatch badges,
      item drops, doors/containers to Phaser; keep HUD in DOM.
- [ ] **D. Battle cutaway** — `battle-scene.js`: on any attack, cut to side view, animate,
      show damage/HP, return. Skip button + setting; auto-skip repeated matchups.
- [ ] **E. Background & polish** — apocalyptic level backdrop, camera, tweens, hit-flash,
      screen shake, damage popups on the map.
- [ ] **F. Wrap** — CREDITS.md, manifest, keep smoke tests green, update docs/changelog,
      commit/push, summarize for the stakeholder.

## Definition of Done
Pixel-art board + units via Phaser; FE-style battle cutaway on attacks; level background;
weapons/skills/doors/loot all still work; HUD intact; engine smoke tests green; every
asset credited/licensed; runs by opening `src/index.html`; committed and pushed.

## Guardrails
- Keep the engine and its tests untouched; if a rule must change, that's a separate,
  tested step. Commit in small role-attributed increments.
- Must still run by opening `src/index.html` (vendored Phaser, no build step).
- Only CC0/CC-BY assets, all credited. No hotlinking — download and vendor locally.
- Log genuine forks to `docs/decisions.md` Open Questions with a running default; don't
  stall. Reserve context for the user's other project; checkpoint if low.
