# Test Plan — Last Stand: Tactics (M1 Demo)

Owned by the Tester. Combat is deterministic (fixed damage), so results are
reproducible. Run against `src/index.html` served over http:// (see CLAUDE.md §7).

## Smoke Suite (must all pass for M1 sign-off)

| ID | Step | Expected |
|----|------|----------|
| S1 | Load the page | No console errors; board, units, and HUD render |
| S2 | Click a survivor | Unit selected; reachable tiles highlight (respect `move`, terrain cost, blockers) |
| S3 | Click a highlighted tile | Unit moves there along a legal path; can't pass walls/enemies |
| S4 | Move next to a Walker, attack | `max(1, atk-def-terrain)` damage dealt; Walker HP drops; melee counter if it survives |
| S5 | Ranger attacks from range 2 | Damage dealt; **no** counter taken |
| S6 | Medic acts on adjacent ally | Ally healed +8 (capped at max); Medic spent |
| S7 | Acted unit | Greyed out; cannot act again this phase |
| S8 | End Turn | Enemy Phase runs; Walkers advance toward nearest survivor and attack when adjacent |
| S9 | New round | All surviving units refreshed and actable |
| S10 | Stand a survivor on extraction OR clear all zombies | Victory screen shows |
| S11 | Let all survivors reach 0 HP | Defeat screen shows |
| S12 | Restart | Level resets to initial state |
| S13 | Mute toggle | Audio stops/starts; no errors |

## Bug reporting
File in `docs/bugs.md`: **id, steps, expected, actual, severity (blocker/major/minor),
seed if relevant.** Re-test after fix before closing.

## Current status
⏳ In progress — see `docs/bugs.md` for open items and the go/no-go call.
