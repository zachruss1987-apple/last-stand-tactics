# Design Canon — Last Stand: Tactics

> **Single source of truth for game rules.** Owned by the Game Designer. The Programmer
> implements to this; the Tester verifies against it. Changing a rule means changing
> this doc (and `docs/changelog.md`).

---

## 1. Core Loop

Turn-based, grid tactics. Each **round** = one **Player Phase** then one **Enemy Phase**.

- **Player Phase:** the player activates each survivor at most once. A unit's activation:
  optionally **Move** (0..`move` tiles), then one **Action** (Attack / Wait / Item).
  After acting, the unit is spent for the phase.
- **Enemy Phase:** each zombie takes an automated turn (see §6 AI).
- Repeat until a win/lose condition triggers (§7).

A unit that has acted is visibly greyed out until the next phase refreshes all units.

---

## 2. The Grid & Movement

- Rectangular tile grid. One unit per tile.
- **Movement** uses 4-directional (orthogonal) pathfinding, cost per tile by terrain.
  A unit may move through **friendly** units but **not** end on an occupied tile, and
  **not** move through **enemy** units or **walls**.
- **Move range** is a movement-cost budget (`move`), not raw tile count.

### Terrain (demo set)
| Tile | Move cost | Def bonus | Notes |
|------|-----------|-----------|-------|
| `floor` (street) | 1 | 0 | default |
| `rubble` | 2 | +1 | slows, light cover |
| `wall` | — (blocked) | — | impassable, blocks LoS later |
| `extraction` | 1 | 0 | survivor win tile |

---

## 3. Stats

| Stat | Meaning |
|------|---------|
| `hp` | health; at 0 the unit is **down** (removed; permadeath) |
| `atk` | attack power |
| `def` | defense (reduced by terrain-aware combat) |
| `move` | movement budget per activation |
| `range` | attack range (1 = melee; 2+ = ranged) |

---

## 4. Combat

When attacker A hits defender D:

```
damage = max(1, A.atk - (D.def + terrainDefBonus(D.tile)))
D.hp  -= damage
```

- **Counterattack:** if D survives, D is a melee unit at the right range (`range` covers
  the distance to A), and D can reach A, D counters with the same formula (A defends).
- **Ranged advantage:** a ranged unit (`range` ≥ 2) attacking from beyond the defender's
  range takes **no counter**. This is the core "kite the horde" tactic.
- **Determinism:** the demo uses **fixed damage** (no hit/crit RNG) so outcomes are fully
  predictable. All future randomness must route through the single seedable RNG helper.

---

## 5. Classes (demo roster)

Survivors (player). Numbers are the designer's starting balance — tune in `units.js`.

| Class | hp | atk | def | move | range | Role |
|-------|----|----|----|------|-------|------|
| **Fighter** | 24 | 9 | 4 | 4 | 1 | Frontline; trades blows, holds the line |
| **Ranger** | 18 | 8 | 2 | 4 | 2 | Ranged; kills zombies without counter, fragile |
| **Medic** | 20 | 5 | 3 | 5 | 1 | Mobile support; `Heal` action restores HP to an adjacent ally |

Enemy:

| Class | hp | atk | def | move | range | Behavior |
|-------|----|----|----|------|-------|----------|
| **Walker** (zombie) | 14 | 6 | 1 | 3 | 1 | Slow, melee, shambles toward nearest survivor |

> **Medic Heal (demo):** as its Action, a Medic restores `+8 hp` (capped at max) to an
> adjacent friendly unit instead of attacking.

---

## 6. Enemy AI (Walker)

On its turn each Walker:
1. Finds the **nearest survivor** (by movement distance).
2. If a survivor is already **in attack range**, attack it.
3. Else **move** along the shortest legal path toward that survivor, as far as `move`
   allows, then attack if now in range.
4. Ties broken deterministically (lowest survivor id / then lowest hp) so behavior is
   reproducible.

Walkers are dumb on purpose: the threat is numbers and positioning, not cleverness.

---

## 7. Win / Lose (Demo Level 01)

- **Win** when *either*: any survivor stands on the **extraction** tile, **or** all
  zombies are down.
- **Lose** when all survivors are down.
- On resolution, show a clear Victory / Defeat screen with a Restart option.

---

## 8. Deferred / Future Mechanics (NOT in demo unless noted)

Design hooks recorded so they stay consistent when added:

- **Infection:** a survivor reduced below a threshold by a Walker gains an *Infected*
  status that ticks damage each round unless cured; untreated, it can turn them. (Signature
  scarcity/tension mechanic — see Open Questions in `docs/decisions.md`.)
- **Ammo / scarcity:** ranged attacks consume limited ammo.
- **Facing / flanking, line-of-sight, fog of war.**
- **Support/relationship bonuses** between survivors (Fire Emblem flavor).
- **Campaign & permadeath persistence** across levels.

Add these only when scheduled on the roadmap; keep this section the agreed spec.
