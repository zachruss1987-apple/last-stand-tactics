# Changelog — Last Stand: Tactics

Newest first. Format: `date — [role] change`.

## 2026-07-08 (M3 — Pixel & Cinematics)
- **[programmer]** Adopted **Phaser** as the board renderer (vendored, no build step),
  keeping the pure engine as the model. New `src/js/game/{art,phaser-view,battle-scene}.js`.
- **[graphics-designer]** **Pixel-art** overhaul: code-authored tiles + unit sprites (visible
  weapons, stat-scaled zombies) baked into Phaser textures; apocalyptic **skyline backdrop**
  + horizon haze behind the level. Replaces the SVG board.
- **[programmer][graphics-designer]** **Fire-Emblem-style battle cutaway** on every attack:
  side-view lunge/hit/recoil, HP drain, floating damage, screen shake; click-to-skip +
  Battle Scenes on/off toggle. Engine awaits the cutaway; input frozen during it.
- **[tester]** Verified headless (puppeteer-core + system Chrome): board renders, input
  selects/moves, cutaway fires & completes, no console errors. Engine smoke tests still 24 green.
- **[program-manager]** `CREDITS.md` added (Phaser MIT; art/audio original). Q7 logs the
  code-authored-pixel-art-first choice for stakeholder review.

## 2026-07-06 (M2 build)
- **[graphics-designer][programmer]** **SVG paper-doll art**: human survivor sprites with
  a visible equipped weapon; zombie sprites whose silhouette encodes stats (size ∝
  strength, lean ∝ speed, tint per variant) with per-variant markers (Brute shoulders,
  Runner motion streaks, Spitter acid drip). Replaces emoji glyphs.
- **[programmer]** Render integration: on-board ammo & Overwatch badges, item-drop icons,
  door/container tiles, "open door" highlight, weapon + skill + ammo HUD, variant tally,
  Guard (Overwatch) button + hotkey, extraction pulse. Tile-art polish.
- **[game-designer][programmer]** Weapon/ammo + skill system, four zombie variants, doors,
  searchable containers, and seeded drops (see engine commit). Smoke test → 22 checks green;
  sprite validity check added.

## 2026-07-06 (M2 kickoff)
- **[program-manager]** Kicked off **M2 "Depth & Identity"** (stakeholder-requested):
  SVG paper-doll characters, visible weapons, melee/ranged weapon + skill system, zombie
  variants with stat-mirroring art, doors/scavenging/drops, and a real art pass. Work
  order in `docs/m2-plan.md`. Granted overnight autonomy (bypassPermissions + web +
  research subagents); added the `researcher` agent role. Execution scheduled to begin
  after context settles (~30 min).
- **[graphics-designer][programmer]** Mobile/touch pass for iPhone playtest: fluid board
  that fits any viewport width (no horizontal scroll), larger tap targets, touch-action
  tuning (no double-tap zoom / tap highlight), and iOS web-app meta tags. Demo can now be
  served on the LAN (`python -m http.server 8000 --bind 0.0.0.0`) for on-device testing.

## 2026-07-05
- **[program-manager]** Project bootstrapped: CLAUDE.md, team agent roles, docs
  (design canon, roadmap, decisions log), autonomous settings, repo structure.
- **[game-designer]** Authored design canon (rules, terrain, classes, AI, win/lose) and
  Level 01 data + survivor roster.
- **[programmer]** Implemented demo engine: grid, units, movement/pathfinding, combat,
  turn system, Walker AI, input/selection, DOM rendering, HUD, win/lose + restart.
- **[graphics-designer]** Apocalyptic desaturated palette, tile/unit iconography, and
  selection/move/attack highlight styling.
- **[music-designer]** Procedural Web-Audio SFX (select/move/attack/hit/down/victory/
  defeat/phase) + ambient drone with mute toggle.
- **[tester]** Test plan authored; M1 smoke test in progress.
