# Changelog — Last Stand: Tactics

Newest first. Format: `date — [role] change`.

## 2026-07-06
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
