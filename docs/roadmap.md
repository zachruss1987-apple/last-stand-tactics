# Roadmap — Last Stand: Tactics

Owned by the Program Manager. Milestones are shipped increments; tasks route to the
specialist agents listed.

---

## ✅ M0 — Project Setup  *(done)*
Team roles, docs, design canon, repo structure, autonomous settings.

## 🎯 M1 — One-Level Playable Demo  *(current)*
**Goal:** a single, winnable, tense tactical level playable in the browser with zero
dependencies. Proves the core loop end-to-end.

Task backlog:

| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Design canon: rules, stats, terrain, win/lose | game-designer | ✅ done |
| 2 | Level 01 data + survivor roster + zombie placement | game-designer | ✅ done |
| 3 | Engine: grid, units, movement/pathfinding | programmer | ✅ done |
| 4 | Engine: combat + turn system | programmer | ✅ done |
| 5 | Enemy AI (Walker) | programmer | ✅ done |
| 6 | Input, selection, rendering, HUD | programmer | ✅ done |
| 7 | Visual layer: palette, tiles, unit icons, highlights | graphics-designer | ✅ done |
| 8 | Audio: procedural SFX + ambient, mute | music-designer | ✅ done |
| 9 | Win/lose screens + restart | programmer | ✅ done |
| 10 | Test plan + smoke test sign-off | tester | ⏳ ongoing |

**Definition of Done for M1:** all smoke tests pass, no console errors, a first-time
player can win in a few turns with real tactical decisions.

## 🔭 M2 — Depth Pass  *(next, not started)*
- Infection mechanic (see design canon §8 + Open Questions).
- Second level + simple level transition.
- Ammo/scarcity for ranged units.
- Real art pass (sprites/tiles) and licensed-or-original audio decision.
- Canvas rendering evaluation.

## 🌍 M3+ — Campaign  *(vision)*
Multiple maps, permadeath persistence, support/relationship system, meta-progression,
possible engine port (Godot/Unity) — pending stakeholder direction.
