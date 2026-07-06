# CLAUDE.md — Project "Last Stand: Tactics"

> A turn-based tactical RPG in the spirit of *Fire Emblem*, set during a zombie
> apocalypse. Grid combat, permadeath survivors, resource scarcity, and hard
> tactical choices. This repo is **also** a testbed for an agent/team-based
> development workflow.

---

## 1. Project Vision

**Genre:** Grid-based tactical RPG (SRPG), Fire Emblem lineage.
**Setting:** Small band of survivors fighting through a zombie apocalypse.
**Pillars:**
1. **Tactical positioning** — terrain, facing, chokepoints, and the horde matter.
2. **Attrition & scarcity** — ammo, healing, and units are finite. Every loss hurts.
3. **Permadeath tension** — a downed survivor can be gone for good.
4. **Readable, deliberate turns** — player phase / enemy phase, no twitch reflexes.

**Current milestone:** `M1 — One-Level Playable Demo` (HTML/CSS/JS, no build step).
See [docs/roadmap.md](docs/roadmap.md).

---

## 2. Tech Stack (Demo Phase)

- **Pure browser stack:** HTML5, CSS3, vanilla ES modules (JavaScript). No framework, no build tooling, no npm dependency for the demo.
- **Rendering:** DOM/CSS grid for the tactical map (swappable for `<canvas>` later).
- **Audio:** Web Audio API / `<audio>` elements.
- **Run it:** open `src/index.html` via a local static server (see §7). No compile step.

Rationale: keep the demo zero-dependency and instantly runnable so every agent can
open it in a browser and verify behavior. A heavier engine (canvas/WebGL, or a port
to Godot/Unity) is an explicitly deferred decision — see [docs/decisions.md](docs/decisions.md).

---

## 3. The Team (Agent Roles)

Development is organized as a **team of specialized agents**, each defined in
[.claude/agents/](.claude/agents/). The **Program Manager** coordinates; the
**Stakeholder** (the human, Zachary) sets direction and answers open questions.

| Role | Agent file | Owns |
|------|-----------|------|
| 🧭 Program Manager | `program-manager.md` | Roadmap, task breakdown, coordination, unblocking, status |
| 💻 Programmer | `programmer.md` | Game engine, systems code, data structures, performance |
| 🎯 Game/Level Designer | `game-designer.md` | Rules, unit stats, level layout, balance, win/lose conditions |
| 🎨 Graphics Designer | `graphics-designer.md` | Sprites, tiles, UI look, color/readability, art direction |
| 🎵 Music Designer | `music-designer.md` | Music, SFX, audio implementation & mood |
| 🧪 Tester | `tester.md` | Test plans, bug reports, regression checks, playability |
| 👤 **Stakeholder (human)** | — | Vision, priorities, sign-off, answering escalated questions |

### How the team works
- The **Program Manager** decomposes a milestone into tasks and dispatches them to the
  right specialist agent (via the `Agent` tool / subagents).
- Specialists work in their domain, write to the relevant folders (§6), and hand back
  results. Cross-role dependencies are surfaced to the PM.
- Anything requiring a **human decision** (scope, art/tone direction, budget, "which of
  these two designs") is logged in [docs/decisions.md](docs/decisions.md) as an **open
  question for the Stakeholder** rather than silently guessed.
- **Definition of Done** for a task: implemented + self-tested + no console errors +
  documented in the relevant doc/changelog if it changes behavior.

---

## 4. Working Agreements & Conventions

- **Language:** Vanilla JS ES modules. No transpilation. Target evergreen browsers.
- **Style:** 2-space indent, semicolons, `camelCase` for vars/functions,
  `PascalCase` for classes/factories, `SCREAMING_SNAKE_CASE` for constants.
- **Files:** one system per module (e.g. `grid.js`, `combat.js`, `turn.js`). Keep
  modules focused. Data (unit/level definitions) lives in `src/js/data/` as plain JS
  objects, separate from logic so designers can tune without touching engine code.
- **No secrets, no network calls** in the demo. Everything runs offline.
- **Comments:** explain *why*, not *what*. Match surrounding density.
- **Determinism:** combat RNG goes through a single seedable helper so tests and the
  Tester agent can reproduce outcomes.

---

## 5. Design Canon (must stay consistent)

Authoritative rules live in [docs/game-design.md](docs/game-design.md). Summary:

- **Turn structure:** Player Phase → Enemy Phase, repeat.
- **A unit acts once per phase:** Move (up to `move` range) then one Action (Attack / Wait / Item).
- **Combat:** attacker deals `max(1, atk - def)` damage; melee lets the defender counter if it survives and is in range.
- **Zombies:** slow, numerous, no ranged, but attacking a survivor risks **Infection** (design hook, see canon doc). They advance toward the nearest survivor on Enemy Phase.
- **Survivors:** varied classes (e.g. Fighter, Ranger, Medic) with distinct move/range/stats.
- **Win/Lose (demo):** Win = reach the extraction tile with any survivor **or** clear all zombies; Lose = all survivors down.

Any change to these rules is a **Game Designer** decision and must update the canon doc.

---

## 6. Repository Layout

```
zombie-rpg/
├── CLAUDE.md                 # You are here — project constitution
├── .claude/
│   ├── agents/               # Team role definitions (subagents)
│   └── settings.local.json   # Local permissions for autonomous work
├── docs/
│   ├── game-design.md        # Design canon (rules, stats, systems)
│   ├── roadmap.md            # Milestones & task backlog
│   ├── decisions.md          # Decision log + OPEN QUESTIONS for stakeholder
│   └── changelog.md          # What changed, by whom (role)
├── src/
│   ├── index.html            # Demo entry point
│   ├── css/style.css         # Presentation
│   └── js/
│       ├── main.js           # Bootstrap / game loop wiring
│       ├── engine/           # grid, units, combat, turn, ai, input, render
│       └── data/             # units.js, level-01.js (designer-tunable data)
└── assets/
    ├── graphics/             # sprites, tiles, ui art (placeholders ok in demo)
    └── audio/                # music & sfx
```

---

## 7. Running & Testing the Demo

From the repo root, serve statically (ES modules require http://, not file://):

```powershell
# Python 3
python -m http.server 8000
# then open http://localhost:8000/src/index.html
```

or

```powershell
npx --yes serve -l 8000 .
```

**Manual smoke test (Tester baseline):** load the page → no console errors → a survivor
can be selected, moved, and attack a zombie → Enemy Phase advances zombies → win by
reaching extraction; lose by losing all survivors. Full plan in the Tester's docs.

---

## 8. Stakeholder Interface

Zachary is the **stakeholder**, not an implementer. Agents should:
- **Proceed autonomously** on anything with a reasonable default.
- **Escalate** genuine direction/taste/scope forks by appending to the
  **Open Questions** section of [docs/decisions.md](docs/decisions.md), and, when it
  blocks progress, surface it directly.
- Never block the whole demo waiting on an answer if a sensible placeholder lets work
  continue — implement the placeholder, log the question, move on.
