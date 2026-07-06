# Research — Weapons & Skills for *Last Stand: Tactics*

> Read-only research shortlist. Maps prior-art mechanics to our deterministic grid engine
> (fixed damage `max(1, atk - def - terrainDef)`, move-then-act, permadeath, no hit/crit RNG).
> Weapon target shape: `{ id, name, kind:'melee'|'ranged', atk, minRange, maxRange, ammo?, special? }`.
> Skill target shape: `{ id, name, type:'passive'|'active', hook, ...params }`.

---

## TOPIC 1 — Melee vs Ranged Weapon Systems

### W1. Ranged, no-counter (the kite) — **already canon, formalize it**
- **Fields:** `{ kind:'ranged', atk, minRange:2, maxRange:2 }` (e.g. Ranger bow).
- **Rule:** attack allowed only if `minRange <= dist <= maxRange`. Defender counters only if
  its own weapon range covers `dist`. Melee (`maxRange:1`) can never counter a range-2 shot.
  This is exactly the "ranged advantage" already in §4 — moving it onto the weapon just makes
  it data-driven.
- **Decision:** kite the horde; ranged units must hold spacing every turn or lose the free hit.
- **Effort:** **S.** Combat already reads `range`; swap to `weapon.minRange/maxRange`.
- **Source:** [FE Range](https://fireemblemwiki.org/wiki/Range).

### W2. Min-range dead zone (can't fire point-blank)
- **Fields:** `{ kind:'ranged', atk, minRange:2, maxRange:3 }` — a "longbow/rifle" that
  **cannot** hit adjacent (dist 1) at all.
- **Rule:** the `minRange` check already forbids it. A zombie that closes to adjacent shuts
  the weapon off entirely — the ranged unit must reposition (move away, then shoot) or swap to
  a sidearm/melee.
- **Decision:** ranged isn't free safety; getting swarmed to adjacency is a real punish, which
  rewards Fighter body-blocking. Creates the classic longbow vulnerability.
- **Effort:** **S** (pure data once W1 lands). **M** if you add a per-unit backup melee weapon.
- **Source:** [FE Ballista 3–10 / Longbow 2–3](https://fireemblem.fandom.com/wiki/Ballista),
  [Three Houses ranges](https://www.supercheats.com/fire-emblem-three-houses/walkthrough/weapon-attack-range).

### W3. Ammo scarcity + reload
- **Fields:** `{ kind:'ranged', atk, minRange:2, maxRange:2, ammo:{ mag:4, reserve:8 } }`.
- **Rule:** each ranged attack spends 1 `mag`. At `mag:0` the unit's Action can be **Reload**
  (mag = min(clip, reserve); costs the whole Action, no attack that turn). Reserve refilled
  only by scavenge/drops (ties into the loot loop in m2-plan §D). Melee weapons ignore ammo.
- **Decision:** ranged becomes a spend-down resource — every shot is "is this kill worth a
  bullet?", and low reserves force melee bailouts. Pure attrition pressure, on-theme.
- **Effort:** **M.** New `ammo` field, Reload action, HUD ammo readout, drop table. Deterministic
  (no rolls) so it stays predictable.
- **Source:** Wasteland/Jagged Alliance ammo economy; [FE uses (durability)](https://fireemblemwiki.org/wiki/Durability).

### W4. Cleave (melee hits a small arc)
- **Fields:** `{ kind:'melee', atk, minRange:1, maxRange:1, special:'cleave' }`.
- **Rule:** on attack, apply the normal damage to the primary target **and** to enemies on the
  two tiles orthogonally flanking the attack axis (or all adjacent enemies — designer pick).
  No counter change; each defender counters independently if able.
- **Decision:** melee answer to being swarmed — the Fighter *wants* 2–3 walkers adjacent. Turns
  a weakness (getting surrounded) into an engine, rewarding tight chokepoints.
- **Effort:** **M.** Needs multi-target resolution + AoE tile highlight in the UI.
- **Source:** [Into the Breach Prime Spear / Titanite Blade](https://gamefaqs.gamespot.com/pc/205477-into-the-breach/faqs/76363/weapons).

### W5. Knockback (push on hit)
- **Fields:** `{ kind:'melee', atk, minRange:1, maxRange:1, special:'knockback:1' }`.
- **Rule:** after damage, if defender survives, shove it 1 tile directly away from attacker.
  Blocked by wall/unit/edge → **no move + 1 extra bonk damage** (Into-the-Breach collision).
  Deterministic; reuses movement/collision code.
- **Decision:** spacing as a weapon — knock a walker off the extraction tile, break its adjacency
  so it can't attack next enemy phase, or slam it into a wall for chip. High readability.
- **Effort:** **M.** Push resolution + collision damage + shove animation/telegraph.
- **Source:** [Into the Breach push/collision](https://intothebreach.fandom.com/wiki/Attacks).

### W6. Braced / Overwatch shot (reaction fire) — *weapon-flagged, skill-driven*
- **Fields:** `{ kind:'ranged', special:'overwatch' }` enables the **Overwatch** active (see S1).
- **Rule:** see S1 — this just marks which weapons can hold a shot. Covered under skills.
- **Effort:** **M** (shared with S1).
- **Source:** [XCOM Overwatch](https://xcom.fandom.com/wiki/Overwatch_(XCOM_2)).

**Weapon recommendation:** ship **W1 (no-counter) + W2 (min-range dead zone)** as the data-driven
core immediately (both ~S, no new systems), then **W3 (ammo)** as the first depth add since it
feeds the m2 scavenge loop. W4/W5 are the best "flavor per class" follow-ups.

---

## TOPIC 2 — Unit Skills / Traits (deterministic, 1–2 per class)

> Hooks the engine already exposes or cheaply can: `onEnemyEnterRange` (needs a reaction step in
> enemy phase), `onAttack`, `onKill`, `onActionInstead` (active abilities), `onMoveEnd`.

### S1. **Overwatch** (active) — *Ranger*
- **Map:** Action = enter Overwatch (spend activation, don't attack). During enemy phase, the
  first enemy that moves into `[minRange,maxRange]` triggers one immediate ranged attack at full
  fixed damage, then Overwatch ends. One shot, deterministic (no aim roll — we have none).
- **Decision:** trade a guaranteed attack now for zone control later; punishes the AI's shortest-path
  shamble. Pairs with W2 (hold the lane the longbow can't defend point-blank).
- **Effort:** **M.** New enemy-phase reaction check; needs weapon `special:'overwatch'` flag (W6).
- **Source:** [XCOM Overwatch](https://xcom.fandom.com/wiki/Overwatch_(XCOM_2)),
  [Reaction Shot](https://xcom.fandom.com/wiki/Reaction_Shot).

### S2. **Cleave** (passive) — *Fighter*
- **Map:** passive form of W4 — melee attacks also hit enemies adjacent to the primary target.
  Attach to the unit instead of the weapon if you want it class-defining.
- **Decision:** rewards holding a chokepoint against 2+ walkers; makes the Fighter the anti-swarm anchor.
- **Effort:** **M** (same multi-target work as W4). If W4 ships, this is **S**.
- **Source:** [Into the Breach AoE melee](https://gamefaqs.gamespot.com/pc/205477-into-the-breach/faqs/76363/weapons).

### S3. **Steady Aim / Braced** (passive) — *Ranger*
- **Map:** `+2 atk` on the attack **if the unit did not Move this activation** (check `movedThisTurn`).
- **Decision:** the core ranged tension — root to hit hard, or reposition and hit soft. Makes
  standing still meaningful without any RNG.
- **Effort:** **S.** One conditional in the damage calc; `movedThisTurn` already tracked by move-then-act.
- **Source:** [XCOM Deadeye/held-position bonuses](https://xcom.fandom.com/wiki/Overwatch_(XCOM_2)); FE "Bowbreaker"-style conditionals.

### S4. **First Aid** (active) — *Medic*
- **Map:** the existing Heal, generalized: Action heals `+8 hp` to an adjacent ally **and** clears
  the future *Infected* status (design-canon §8 hook). Optionally `uses:2` per level (scarcity).
- **Decision:** the medic's turn is a fork — attack a walker, top off a wounded Fighter, or save a
  charge for an infection. Directly serves attrition.
- **Effort:** **S** (Heal exists). **+S** for the limited-uses counter; Infected cure waits on §8.
- **Source:** [XCOM Medikit / Field Medic](https://xcom.fandom.com/wiki/Medikit).

### S5. **Suppressing Fire** (active) — *Ranger* (alt to Overwatch)
- **Map:** Action targets one enemy in range, deals **0 dmg** but applies `Suppressed` until end of
  next enemy phase: that enemy's `move` is halved (round down) on its turn. Deterministic debuff.
- **Decision:** no-kill zone control — slow the fast variant (Runner) so the line can re-form; a
  soft counter to the m2 zombie roster.
- **Effort:** **M.** New status field the AI reads when computing move budget.
- **Source:** [XCOM Suppression](https://xcom.fandom.com/wiki/Suppression).

### S6. **Scavenger** (passive) — *any / Medic*
- **Map:** when this unit ends its move on a downed-zombie or container tile, auto-collect the drop
  (or `+1` to the loot yield). Ties into m2 §D drops/containers.
- **Decision:** routes the looter through danger — greed vs. safety detours. Light but supports the economy loop.
- **Effort:** **M**, but **gated on the loot system existing** — defer until §D lands.
- **Source:** Wasteland/XCOM loot-perk lineage.

### S7. **Bracing Body-Block** (passive) — *Fighter* (alt)
- **Map:** adjacent friendly ranged units gain `+1 def` (the Fighter "screens" them). Static aura,
  recomputed each combat.
- **Decision:** formalizes the tank-in-front / shooter-behind formation that W2's dead zone demands.
- **Effort:** **S.** Aura check in the defense calc.
- **Source:** [XCOM Covering Fire / FE support bonuses](https://xcom.fandom.com/wiki/Covering_Fire).

**Starter kit (1–2 per class):**
| Class | Skill 1 | Skill 2 |
|-------|---------|---------|
| Fighter | **Cleave** (S2) | Bracing Body-Block (S7) |
| Ranger | **Steady Aim** (S3) | Overwatch (S1) |
| Medic | **First Aid** (S4) | Scavenger (S6, deferred) |

---

## TOP-2 TO BUILD FIRST

1. **W1+W2 — data-driven weapon range (no-counter + min-range dead zone).** Effort **S**, no new
   systems (combat already reads range). Instantly makes melee vs ranged a real spacing puzzle and
   unlocks every later weapon/skill by moving range onto weapon data.
2. **S3 — Steady Aim (move-or-hit-hard).** Effort **S**, one conditional on the already-tracked
   `movedThisTurn`. Gives the Ranger a deterministic identity and a per-turn decision with zero new
   engine surface — the cheapest "depth" win in the list.

*Next after those:* **W3 (ammo)** to seed the scavenge economy, then **S1/W6 (Overwatch)** as the
first reaction-fire system.

### Sources
- Fire Emblem — [Range](https://fireemblemwiki.org/wiki/Range), [Ballista](https://fireemblem.fandom.com/wiki/Ballista), [Three Houses weapon ranges](https://www.supercheats.com/fire-emblem-three-houses/walkthrough/weapon-attack-range)
- XCOM — [Overwatch](https://xcom.fandom.com/wiki/Overwatch_(XCOM_2)), [Suppression](https://xcom.fandom.com/wiki/Suppression), [Reaction Shot](https://xcom.fandom.com/wiki/Reaction_Shot), [Covering Fire](https://xcom.fandom.com/wiki/Covering_Fire)
- Into the Breach — [Attacks / push & collision](https://intothebreach.fandom.com/wiki/Attacks), [Weapons list](https://gamefaqs.gamespot.com/pc/205477-into-the-breach/faqs/76363/weapons)
- Wasteland / Jagged Alliance — ammo economy & loot-perk lineage (genre prior art)
