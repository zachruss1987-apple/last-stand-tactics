# Research — Zombie Variants & Scavenging/Loot/Doors

> Read-only research for *Last Stand: Tactics* M2 (topics 3 & 4 of `docs/m2-plan.md §A`).
> Baseline **Walker**: `hp14 / atk6 / def1 / move3 / range1`. All numbers below are relative
> to that. Engine facts this is written against:
> - Stats are pure data in `src/js/data/units.js` (`CLASSES`); the engine reads them.
> - **AI is fully stat-driven** (`ai.js` + `grid.js computeReachable/distanceField`): a variant
>   that only changes hp/atk/def/move/**range** needs **zero AI/engine code** — including a
>   ranged zombie, because `decideWalker` already reads `walker.range`.
> - Combat (`combat.js`) is fixed-damage; a melee defender counters only if `range >= dist`,
>   so a `range2` attacker hitting from 2 tiles takes **no counter** (mirrors our Ranger).
> - Terrain is a static char grid (`grid.js TERRAIN`); mutable tile state (open door, spawned
>   drop) needs a small side-`Set`/`Map` on the `Game` object, not a rewrite.
> - `makeRng(seed)` in `rng.js` is the single seedable RNG — all loot rolls route through it.

---

## Part 1 — Zombie Variant Archetypes

Design goal: map the four L4D/WWZ "special infected" axes — **speed, strength, toughness,
special** — onto our five stats plus at most one cheap deterministic hook, and make each one
readable by **silhouette + size + tint** so the SVG paper-doll art can mirror the stats
(`m2-plan §E`: size ∝ strength, lean/posture ∝ speed, tint ∝ variant).

Effort key: **S** = pure `CLASSES` data, no engine change. **M** = one small engine hook.
**L** = new subsystem (spawning, hazard tiles).

### 1. Runner — the sprinter (speed axis)
- **Stats:** `hp8 / atk5 / def0 / move5 / range1` (glyph tint pale/grey, **small lean-forward** silhouette).
- **Mapping:** pure data. `move5 > Walker3` closes gaps in one enemy phase; low hp/def means a Ranger one-shots it (8 atk ≥ 8 hp) — glass cannon.
- **Tactical decision:** punishes loose formation and over-extension; the player can no longer treat 3 tiles of empty street as safe. Forces tight formations and kill-order priority (drop Runners first or they reach the Medic).
- **Effort:** **S**. Art: smaller body, forward-pitched posture, washed-out tint.
- **Source:** L4D common "Runner" / WWZ swarm pace. https://left4dead.fandom.com/wiki/The_Infected

### 2. Brute — the tank (toughness + strength axis)
- **Stats:** `hp30 / atk10 / def3 / move2 / range1` (**oversized, hunched** silhouette, dark red-brown tint).
- **Mapping:** pure data. `def3` means our Ranger (atk8) does only `max(1, 8-3)=5`; it eats ~6 ranged hits. `atk10` two-shots a Ranger (18hp) and threatens a Fighter. `move2` is the counterweight — it is kiteable.
- **Tactical decision:** a damage sponge that inverts attrition math: you must commit focus fire or lose the Fighter's HP trading blows. Its slowness is the out — bait it, then gang it while it lumbers.
- **Effort:** **S** base. Optional **M** special *Sunder* (`ignoreDef: 2` field read in `combat.js strike`) if def-stacking terrain feels too safe.
- **Source:** L4D Charger/Tank; WWZ "Bull". https://left4dead.fandom.com/wiki/Charger

### 3. Lurker — the ranged spitter (range axis, no special code needed)
- **Stats:** `hp10 / atk5 / def1 / move2 / range2` (thin, elongated silhouette, sickly-green tint).
- **Mapping:** **pure data** — `range2` is already fully supported by AI and combat. It attacks from 2 tiles and, per `combat.js`, takes **no counter** from melee survivors. It is the enemy mirror of our Ranger and the single highest-value cheap variant because it flips our "kite the horde" pillar back on the player.
- **Tactical decision:** clumping is now punished; the front-line Fighter can no longer safely tank because damage arrives from behind the Walkers. Player must close distance or use a Ranger to out-range it (range2 vs range2 → whoever strikes first / positioning).
- **Effort:** **S**. Art: gaunt, distended jaw/neck, green tint. (Optional **L** upgrade → *Spitter* that leaves an acid hazard tile; deferred, needs a hazard-terrain subsystem.)
- **Source:** L4D Spitter/Smoker (ranged specials). https://left4dead.fandom.com/wiki/The_Infected

### 4. Bloater — the death bomb (special: on-down AoE)
- **Stats:** `hp16 / atk4 / def2 / move2 / range1` + **special hook**. Bloated, round silhouette, sickly-yellow/green tint.
- **Mapping:** **M**. Add `onDown: { type:'burst', dmg:4, radius:1 }` in data; in `turn.js applyCombatEvents`, when a `down` event fires for a Bloater, deal fixed `4` to all units (both factions) orthogonally adjacent to its tile. Fully deterministic (fixed damage, no roll).
- **Tactical decision:** "don't melee it, don't clump when it dies." Kill it at range, or accept splash on your Fighter. It can also chain into other zombies — friendly fire is a feature. Great counter-play to the player's focus-fire habit.
- **Effort:** **M** (one branch in the down handler; ~15 lines).
- **Source:** L4D Boomer (death splatter). https://left4dead.fandom.com/wiki/Boomer

### 5. Crawler — the rubble flanker (special: terrain ignore)
- **Stats:** `hp10 / atk5 / def1 / move3 / range1` + **special hook**. Low, prone silhouette (short), grey-green.
- **Mapping:** **M**. Add `ignoreRoughTerrain: true`; `computeReachable`/`distanceField` treat `rubble` as cost 1 for this unit. Everything else unchanged.
- **Tactical decision:** rubble the player used as a slow-lane / cover flank becomes an open highway for Crawlers. Makes the map's cover conditional on *who* is approaching.
- **Effort:** **M** (pass unit into cost lookup; small pathfinding tweak).
- **Source:** WWZ crawlers / L4D uncommon variants that ignore terrain. https://left4dead.fandom.com/wiki/The_Infected

### 6. Screamer — the horde-caller (special: buff/summon) — *exotic, defer*
- **Stats:** `hp12 / atk3 / def1 / move3 / range1` + active skill. Thin, wide-mouthed silhouette, purple tint.
- **Mapping:** **L**. On its enemy turn, instead of attacking it *howls*: either (a) grant `+1 move` to all zombies within radius 2 next enemy phase (status hook), or (b) spawn 1 Walker at a fixed adjacent open tile (needs a spawn path in `turn.js` + roster insert). Deterministic if the spawn tile/priority is rule-based (lowest y,x open neighbor).
- **Tactical decision:** priority target — leaving it alive escalates the attrition clock. Creates a "kill the caster" objective inside the horde.
- **Effort:** **L** (new status or spawn subsystem). **Flag:** spawning fights the finite-horde win condition (`§7 all zombies down`) — cap total spawns per level so the level still terminates. Recommend deferring past the M2 starter set.
- **Source:** L4D Witch/Screamer lineage; WWZ swarm-callers. https://left4dead.fandom.com/wiki/The_Infected

---

## Part 2 — Scavenging / Loot / Door Mechanics

All deterministic. Any drop randomness = one roll through the existing `makeRng(seed)` held on
the `Game` object (create `this.rng = makeRng(level.seed ?? 0xC0FFEE)` in `reset()`), so a given
seed replays identically for the Tester.

### Doors

Doors need **mutable per-tile state**, which the static char grid can't hold. Cheapest model:
add a door char `'D'` to `TERRAIN` (blocked, `blocksLoS` later) and keep `this.openDoors =
new Set()` of `"x,y"` keys on `Game`. `Grid.isBlocked` (or a wrapper) returns `false` for a `'D'`
tile whose key is in `openDoors`. Because `distanceField`/`computeReachable` both call `isBlocked`,
**closed doors automatically block zombies and reroute the AI with no AI code** — and since
zombies are too dumb to open doors, a closed door is a *player-controlled* wall.

**Model A — Free-on-enter (MVP).**
- **Rule:** a survivor moving onto (or the pathfinder passing through) a `'D'` tile adds it to
  `openDoors` for the rest of the level; no action cost. Closed = blocked for pathing until first entry.
- **Decision it creates:** thin — doors are just delayed chokepoints; whoever walks up opens it.
- **Effort:** **S**. Engine: door char + open-Set + `isBlocked` check + open-on-`moveTo`.
- **Source:** FE Engage "stand adjacent and open" simplified. https://game8.co/games/Fire-Emblem-Engage/archives/402727

**Model B — Open-as-Action (recommended).**
- **Rule:** a `'D'` tile blocks movement (and later LoS). A survivor **adjacent** to a closed door
  may spend its **Action** (a new `Open` verb alongside Attack/Wait/Heal in `turn.js`) to add it to
  `openDoors`. Zombies can never open doors → the player can *hold a door shut to funnel the horde*
  into a Fighter's chokepoint, or spend a turn opening a shortcut to extraction.
- **Decision it creates:** genuine cost — open the door (lose a turn's attack) vs. keep the horde
  funneled; controls the map's chokepoints turn-by-turn. This is the richest cheap option and best
  fits our positioning pillar.
- **Effort:** **M**. Engine: door state (as above) + one new Action verb + adjacency check +
  `computeReachable` treats closed doors as blocked (already true via `isBlocked`).
- **Source:** FE chest/door "spend the turn to Open"; XCOM 2 Interact-to-open-door.
  https://fireemblemwiki.org/wiki/Chest • https://www.feralinteractive.com/en/manuals/xcom2/latest/steam/

**Model C — Keyed / bashable door (later).**
- **Rule:** door opens only with a looted `crowbar`/`key` item (ties doors to loot), or a **Brute**
  can *Bash* it (`atk` vs a door "hp"). Gates exploration and links the two systems.
- **Effort:** **M–L** (needs inventory + door hp). Defer until loot inventory exists.
- **Source:** FE Door Key / Thief Locktouch. https://fireemblem.fandom.com/wiki/Door_Key

### Loot & Scavenging

Current units have **no inventory**. MVP dodges that with **instant-consume** pickups (apply the
effect the moment a survivor lands on the tile) — deterministic, no inventory subsystem.

**Model D — Drops from downed zombies (recommended core).**
- **Rule:** on a zombie `down` event, roll its drop table through `this.rng` and, if it yields an
  item, place a drop token on the zombie's tile (`this.drops = Map<"x,y", item>`). A survivor that
  **ends movement on** that tile auto-consumes it (Medkit → `+8 hp` capped; later Ammo → refill).
  Drop table example (weights): Walker `{nothing:6, medkit:1}`, Brute `{medkit:2, scrap:1}` — a
  single `randInt(rng, totalWeight)` selects the entry, fully replayable per seed.
- **Decision it creates:** push into the horde's kill-zone to grab the Medkit dropped mid-field, or
  play safe and let it rot. Turns kills into positional bait.
- **Effort:** **S–M**. Engine: `drops` map + roll in the down handler + pickup check in `moveTo`.
- **Source:** XCOM 2 enemy loot drops on the map. https://www.feralinteractive.com/en/manuals/xcom2/latest/steam/

**Model E — Searchable containers (recommended companion).**
- **Rule:** add a crate char `'C'` (passable or blocked, designer choice). A survivor adjacent/on it
  spends its **Action** to *Search* (reuse the `Open` verb): roll `this.rng` on the container's table,
  emit the item as a drop (or instant-consume), then mark the crate emptied (`this.searched` Set).
  Pairs naturally with door Model B (same "spend Action to interact" verb).
- **Decision it creates:** spend a scarce activation scavenging vs. fighting; rewards controlling
  map corners. Reinforces the scarcity pillar.
- **Effort:** **M**. Engine: crate char + Search action + emptied-Set + shared drop-table helper.
- **Source:** FE chests / XCOM crates & Interact action. https://fireemblemwiki.org/wiki/Chest

**Model F — Shared stash + inventory (later).**
- **Rule:** picked items enter a party stash; a unit spends an Action to *Use* one later (deferred
  Medkit, saved Ammo). Enables the future Infection-cure and Ammo scarcity mechanics (`§8`).
- **Effort:** **L** (real inventory + Use action + HUD). Defer past M2.
- **Source:** FE convoy / Project Zomboid loot loop.

---

## Recommended Starter Set (build first)

Chosen to satisfy M2 DoD ("≥3 variants whose art reflects stats; doors + one scavenge/drop loop")
with **near-zero engine risk** — the three zombies are pure data, the door and loot each need one
small, well-scoped hook.

**Zombies (3):**
| Variant | hp | atk | def | move | range | Effort | Art cue | Tactical axis |
|---------|----|-----|-----|------|-------|--------|---------|---------------|
| **Runner** | 8 | 5 | 0 | **5** | 1 | S | small, forward-lean, pale | speed — punishes loose formation |
| **Brute**  | **30** | **10** | **3** | 2 | 1 | S | oversized, hunched, dark-red | toughness — forces focus fire |
| **Lurker** | 10 | 5 | 1 | 2 | **2** | S | gaunt, green, distended | range — no-counter, punishes clumping |

All three are pure `CLASSES` entries — no AI/combat changes (the engine already handles `range2`).

**Door (1): Model B — Open-as-Action.** Door char `'D'` + `openDoors` Set + one `Open` action verb.
Closed doors block zombies automatically → player-controlled chokepoints. Effort **M**.

**Loot (1): Model D — Seeded drops from downed zombies**, instant-consume Medkit (`+8 hp`), rolled
through the existing `makeRng`. Effort **S–M**, no inventory needed. (Add Model E crates next; it
reuses the same drop-table helper and the door's `Open` verb.)

**Stretch after starter:** Bloater (M, on-down AoE) for the first "special" zombie, then crates
(Model E). Defer Screamer/spawning, hazard-tile Spitter, and inventory (Model F) to a later milestone.

### Sources
- Left 4 Dead special infected: https://left4dead.fandom.com/wiki/The_Infected • https://left4dead.fandom.com/wiki/Charger • https://left4dead.fandom.com/wiki/Boomer
- Fire Emblem doors/chests/keys: https://fireemblemwiki.org/wiki/Chest • https://fireemblem.fandom.com/wiki/Door_Key • https://game8.co/games/Fire-Emblem-Engage/archives/402727
- XCOM 2 interact/loot: https://www.feralinteractive.com/en/manuals/xcom2/latest/steam/
