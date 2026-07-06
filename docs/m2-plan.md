# M2 — "Depth & Identity" — Execution Spec

> Stakeholder-requested improvements (2026-07-06). This file is the authoritative
> work order for the overnight autonomous run so it survives context compaction.
> Program Manager sequences; specialists own their sections. Keep the demo
> zero-dependency and always runnable. Commit incrementally, role-attributed.

## Stakeholder requests (verbatim intent)
1. Player icons should **resemble a human person** (not emoji).
2. **Show the weapon** each player carries.
3. Embrace **melee vs long-range** weapons as a **stat/skill system** per player.
4. Look into **item drops, doors, scavengeable items**.
5. Game designers may **spawn research agents** for interesting weapons/mechanics/skills.
6. **Zombies get skills too** — speed, strength, etc. — and their **art mirrors their stats**.
7. Spend real time on **level and player art**.

## Approved direction (2026-07-06)
- **Art:** hand-coded **SVG paper-doll** system (zero-dependency). Layered SVG humans;
  swappable weapon overlay; zombie size/posture/tint encode stats. [[decisions.md D7]]
- **Autonomy:** overnight full autonomy (bypassPermissions) with deny guardrails.
- **Web:** WebSearch + WebFetch enabled. **Research subagents:** enabled (spawn `researcher`).

---

## Work order (sequenced by dependency)

### A. Design & research first (game-designer + researcher)
- [ ] Spawn `researcher` agents (parallel) for: (1) melee-vs-ranged weapon systems in grid
      tactics, (2) unit skill/trait systems, (3) zombie-variant archetypes with distinct
      stats, (4) scavenging/loot/door mechanics. Collect shortlists into
      `docs/research/` (one file per topic).
- [ ] Fold the picks into the **design canon** (`docs/game-design.md`): weapon model,
      skill model, zombie variants, items/doors rules. Update numbers in `src/js/data/`.

### B. Weapons & skills (game-designer + programmer)
- [ ] **Weapon data model** in `src/js/data/weapons.js`: `{ id, name, kind: 'melee'|'ranged',
      atk, minRange, maxRange, ammo?, special? }`. Survivors reference an equipped weapon;
      combat reads range from the weapon, not just the unit.
- [ ] **Skill/trait model**: passive + active skills per unit (e.g. Overwatch, First Aid,
      Cleave, Steady Aim). Start with 1–2 per class; keep deterministic.
- [ ] HUD shows equipped weapon + skills for the selected unit.

### C. Zombie variants (game-designer + programmer + graphics)
- [ ] Add variants to `data/units.js`: e.g. **Walker** (baseline), **Runner** (high move,
      low hp), **Brute** (high atk/hp, low move), plus 1 researched exotic (e.g. Spitter/
      Screamer) if it fits deterministic rules.
- [ ] AI reads per-variant stats/skills (already stat-driven; extend for any active skill).

### D. Items, doors, scavenging (programmer + game-designer)
- [ ] **Doors**: a tile state that blocks movement/LoS until opened; opening costs an
      action or is free-on-enter (designer decides). Add to grid + render.
- [ ] **Containers/scavenge**: map tiles a survivor can search for a dropped item.
- [ ] **Drops**: downed zombies / containers yield ammo / medkit / weapon; picked up by
      moving onto the tile. Simple inventory on units or a shared stash (designer decides).

### E. Art pass (graphics-designer + programmer)
- [ ] **SVG paper-doll**: `src/js/engine/sprites.js` builds inline SVG for a unit from
      parts (head/torso/limbs) + role color + **weapon overlay**. Replace emoji glyphs.
- [ ] **Zombie art mirrors stats**: size ∝ strength, lean/posture ∝ speed, tint ∝ variant.
- [ ] **Level/tile art**: richer SVG/CSS tiles (asphalt, rubble, walls, doors, extraction),
      consistent worn palette. Keep readability overlays (move/attack/heal) dominant.

### F. Test & document (tester + PM)
- [ ] Extend `tests/smoke.mjs`: weapon range in combat, ranged ammo (if added), door
      block/open, item pickup, each zombie variant reaches a terminal state. All green.
- [ ] Update `docs/changelog.md`, `docs/roadmap.md`, and `docs/decisions.md` (log any new
      stakeholder forks under Open Questions with a running default — do NOT block).

## Definition of Done for M2
Human-looking survivors with visible weapons; melee/ranged weapon+skill system live;
≥3 zombie variants whose art reflects their stats; doors + at least one scavenge/drop
loop working; level art noticeably improved; smoke tests green; no console errors;
everything committed and pushed. Then summarize for the stakeholder and pause for feedback.

## Guardrails for the overnight run
- Stay zero-dependency and runnable at `src/index.html` via static server.
- Deterministic combat; randomness (loot rolls) through the seedable RNG only.
- Commit in small, role-attributed steps; push to `origin main`.
- Log genuine taste/scope forks to `docs/decisions.md` Open Questions and keep going on a
  sensible default — never stall waiting for the sleeping stakeholder.
- Respect the context budget: reserve headroom for the stakeholder's other project; if
  context runs low, checkpoint progress to docs + commits and wind down cleanly.
