# Decision Log & Open Questions — Last Stand: Tactics

Two purposes:
1. **Decisions** we've made (with rationale) so we don't relitigate them.
2. **Open Questions for the Stakeholder (Zachary)** — forks that need a human call.
   Agents log them here with a recommended default and keep working on the default.

---

## 🔵 Open Questions for the Stakeholder

> Format: **Q#** — question · *why it matters* · **current default we're running with**.

- **Q1 — Tone target.** How grim? Grounded/bleak (The Road) vs pulpy B-movie
  (zombie comedy)? *Affects art, audio, writing.* **Default:** grounded and tense,
  desaturated palette. *(art/audio direction)*
- **Q2 — Infection mechanic for M2.** Should a bitten survivor risk *turning into a
  zombie* (harsh, signature) or just take a curable damage-over-time debuff (softer)?
  *This is the identity mechanic that separates us from generic FE.* **Default:** curable
  DoT in M2, with turning as an optional hard-mode rule later.
- **Q3 — Permadeath.** Full Fire-Emblem permadeath, or a "downed but recoverable"
  softer model for accessibility? **Default:** permadeath (classic mode) with a possible
  casual toggle later.
- **Q4 — Audio sourcing.** Procedural Web-Audio SFX only (zero-dependency, no licensing)
  vs bundling real music tracks (needs licensing/original composition + scope). **Default:**
  procedural for the demo; revisit for M2.
- **Q5 — Long-term engine.** Stay browser (HTML/canvas) or plan a port to Godot/Unity
  for the full campaign? *Big architectural fork.* **Default:** stay browser through M2,
  reassess at M3.
- **Q6 — Art production.** Placeholder CSS/emoji art for now — when do we invest in real
  pixel-art sprites/tilesets, and do we commission or generate them? **Default:**
  placeholders through M1, decide during M2.

*(Answer any of these whenever you like — reply here or just tell the team. Until then
the defaults are what's being built.)*

---

## ✅ Decisions Made

- **D1 — Demo is zero-dependency HTML/CSS/vanilla JS.** No build step, no npm. So every
  agent and the stakeholder can run it by opening one file via a static server. *(CLAUDE.md §2)*
- **D2 — Data/logic separation.** Unit and level definitions live in `src/js/data/` as
  plain objects so the Game Designer can tune balance without touching engine code.
- **D3 — Deterministic demo combat.** Fixed damage (no hit/crit RNG) for the demo; any
  future randomness routes through one seedable RNG helper for reproducible tests.
- **D4 — DOM/CSS-grid rendering for the demo,** with logic kept separate so a later
  canvas/WebGL swap is possible without rewriting game rules.
- **D5 — Team/agent workflow.** Six specialist roles + PM coordinator + human stakeholder,
  defined in `.claude/agents/`. PM decomposes and dispatches; specialists own their folders.
