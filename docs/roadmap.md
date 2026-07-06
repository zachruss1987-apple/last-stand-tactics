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

## 🔭 M2 — "Depth & Identity"  *(active — stakeholder-requested)*
Full work order in **[docs/m2-plan.md](m2-plan.md)**. Scope (approved 2026-07-06):
- Human-looking survivors via a hand-coded **SVG paper-doll** system (replaces emoji).
- **Visible equipped weapons**; a **melee vs ranged** weapon + **skill/trait** system.
- **Zombie variants** (Runner/Brute/…) with stats, and **art that mirrors those stats**.
- **Doors, scavengeable containers, item drops.**
- Real **level + character art** pass.
- Research-driven design: designers spawn `researcher` subagents for weapons/mechanics.
- Deferred to later: infection mechanic, 2nd level/transition, audio sourcing, canvas port.

## 🌍 M3+ — Campaign  *(vision)*
Multiple maps, permadeath persistence, support/relationship system, meta-progression,
possible engine port (Godot/Unity) — pending stakeholder direction.
