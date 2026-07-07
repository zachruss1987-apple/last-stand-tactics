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
- **Q6 — Art production.** ✅ *Resolved (2026-07-06):* build a hand-coded **SVG paper-doll**
  system in M2 (zero-dependency, human-looking, weapon overlays, stat-driven zombie art).
  Downloaded/AI art revisited in a later milestone. See D7.

- **Q7 — M3 sprite source.** You chose "download CC0 packs," but CC0 packs rarely match
  our exact roster (weapon-carrying survivors + Walker/Runner/Brute/Spitter) and mixing
  mismatched art reads worse than purpose-built. *For the first M3 pass the team is
  authoring **cohesive pixel-art textures in code** (real pixel grids → Phaser textures,
  zero licensing risk).* **Default:** code-authored pixel art now; swap in curated CC0 or
  AI-generated sprites in a follow-up once you've seen the look and framing. Tell me if
  you'd rather I stop and source CC0 character packs first.

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
- **D6 — Overnight autonomy (2026-07-06).** For the M2 overnight run the stakeholder
  approved `bypassPermissions` (no prompts) with deny guardrails (no force-push, no
  `rm -rf /`), WebSearch + WebFetch, and spawning `researcher` subagents. Revisit/revert
  after the run. Local override lives in the git-ignored `.claude/settings.local.json`.
- **D7 — Art direction (2026-07-06).** Hand-coded **SVG paper-doll** character system:
  layered SVG humans, swappable weapon overlays, zombie size/posture/tint encoding stats.
  Chosen for zero-dependency, readability, and stat-driven variety. Resolves Q6.
- **D8 — Adopt Phaser (2026-07-07).** M3 uses the **Phaser** framework for rendering the
  board + battle scenes, vendored locally as `src/vendor/phaser.min.js` (no build step;
  still runs by opening `src/index.html`). This **supersedes the zero-dependency rule (D1)**
  for the view layer. The pure engine (grid/turn/combat/ai) stays framework-free so its
  tests remain valid. Superseded stance from Q5 (stay browser) — still browser, now Phaser.
- **D9 — Pixel-art style (2026-07-07).** The game moves from vector SVG to **pixel art**
  (retro SRPG look) with full Fire-Emblem-style **battle cutaways** on attacks.
- **D10 — CC0 asset pipeline + network egress (2026-07-07).** First-pass art from **CC0**
  packs (Kenney/OpenGameArt/game-icons), downloaded and vendored locally under
  `assets/graphics/`, every asset credited in `CREDITS.md`. The overnight run is granted
  network egress (curl/wget/unzip) + bypassPermissions; reverted after. AI/custom art is a
  later per-asset option.
