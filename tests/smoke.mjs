// Headless engine smoke test — owned by the Tester. No DOM; drives the pure engine
// (turn machine, pathfinding, weapons/ammo/skills, doors, loot, AI, win/lose).
// Run from the repo root:  node tests/smoke.mjs
import { LEVEL_01 } from '../src/js/data/level-01.js';
import { Game } from '../src/js/engine/turn.js';
import { Grid } from '../src/js/engine/grid.js';
import { canReach } from '../src/js/engine/combat.js';

let fails = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); fails++; } else console.log('ok  :', m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- map integrity ---
const g = new Grid(LEVEL_01.map);
ok(g.width === 10 && g.height === 8, `grid is ${g.width}x${g.height} (expect 10x8)`);
ok(LEVEL_01.map.every((r) => r.length === g.width), 'all map rows equal width');
const placed = [...LEVEL_01.survivors, ...LEVEL_01.zombies];
ok(placed.every((u) => !g.isBlocked(u.x, u.y)), 'no unit starts on a wall/door');

// --- roster / variants ---
const game = new Game(LEVEL_01, {});
ok(game.players().length === 3, 'starts with 3 survivors');
ok(game.enemies().length === 6, 'starts with 6 zombies');
const variants = new Set(game.enemies().map((z) => z.variant));
ok(['walker', 'runner', 'brute', 'spitter'].every((v) => variants.has(v)), 'all 4 zombie variants present');
const brute = game.enemies().find((z) => z.variant === 'brute');
ok(brute.hp > 24 && brute.atk >= 12, `Brute is a damage-sponge/hitter (hp ${brute.hp}, atk ${brute.atk})`);
const spitter = game.enemies().find((z) => z.variant === 'spitter');
ok(spitter.maxRange === 2, 'Spitter attacks at range 2');

// --- weapons: derived atk, range, ammo ---
const dana = game.players().find((u) => u.name === 'Dana');
ok(dana.atk === dana.str + dana.weapon.power, `Ranger atk = str+weapon.power (${dana.atk})`);
ok(dana.minRange === 2 && dana.maxRange === 5, 'Rifle has a point-blank dead zone (range 2..5)');
ok(!canReach(dana, 1) && canReach(dana, 2), 'Ranger cannot fire at range 1 but can at range 2');
ok(dana.ammo === 6, `Ranger starts with 6 ammo`);

// reachability respects walls
game.selectUnit(dana);
ok(game.reachable.size > 1, `Dana can reach ${game.reachable.size} tiles`);
ok(!game.reachable.has('0,4'), 'Dana cannot stop on the wall at 0,4');
game.deselect();

// --- combat: fixed damage, ranged-no-counter, ammo spend ---
const walker = game.enemies().find((z) => z.variant === 'walker');
dana.x = walker.x; dana.y = walker.y - 2; // 2 tiles away
dana.movedThisTurn = true;                // neutralize Steady Aim for a clean number
const expected = Math.max(1, dana.atk - (walker.def + game.grid.defBonus(walker.x, walker.y)));
const wHp0 = walker.hp, ammo0 = dana.ammo, danaHp0 = dana.hp;
game.selected = dana; game.step = 'action'; game.computeTargets();
game.attack(walker);
ok(walker.hp === wHp0 - expected, `ranger deals ${expected} (atk-def) damage`);
ok(dana.hp === danaHp0, 'ranged attacker takes no counter from a melee walker');
ok(dana.ammo === ammo0 - 1, 'ranged attack spends 1 ammo');

// --- Steady Aim bonus ---
const g2 = new Game(LEVEL_01, {});
const dana2 = g2.players().find((u) => u.name === 'Dana');
const w2 = g2.enemies().find((z) => z.variant === 'walker');
dana2.x = w2.x; dana2.y = w2.y - 3; dana2.movedThisTurn = false; // did not move
const exp2 = Math.max(1, (dana2.atk + 2) - (w2.def + g2.grid.defBonus(w2.x, w2.y)));
const w2hp0 = w2.hp;
g2.selected = dana2; g2.step = 'action'; g2.computeTargets(); g2.attack(w2);
ok(w2.hp === w2hp0 - exp2, 'Steady Aim adds +2 when the ranger did not move');

// --- doors & containers ---
ok(g.isDoor(7, 1), 'door present at 7,1 (shed entrance)');
ok(g.openDoor(7, 1) && !g.isDoor(7, 1), 'door opens to floor');
ok(game.loot.has('6,2') && game.loot.has('4,6'), 'two searchable containers seeded');

// --- full auto playthrough terminates cleanly ---
const fresh = new Game(LEVEL_01, {});
let guard = 0;
while (fresh.status === 'playing' && guard < 80) {
  guard++;
  for (const u of fresh.players()) {
    if (fresh.status !== 'playing') break;
    if (u.hasActed) continue;
    fresh.selectUnit(u);
    let best = { x: u.x, y: u.y }, score = Infinity;
    for (const k of fresh.reachable.keys()) {
      const [x, y] = k.split(',').map(Number);
      const s = Math.abs(8 - x) + Math.abs(1 - y); // head toward the shed
      if (s < score) { score = s; best = { x, y }; }
    }
    fresh.moveTo(best.x, best.y);
    if (fresh.status !== 'playing') break;
    if (fresh.step === 'action') {
      if (fresh.attackable.size) {
        const [tx, ty] = [...fresh.attackable][0].split(',').map(Number);
        fresh.attack(fresh.unitAt(tx, ty));
      } else if (fresh.openable.size) {
        const [dx, dy] = [...fresh.openable][0].split(',').map(Number);
        fresh.openDoor(dx, dy);
      } else if (fresh.healable.size) {
        const [hx, hy] = [...fresh.healable][0].split(',').map(Number);
        fresh.heal(fresh.unitAt(hx, hy));
      } else {
        fresh.wait();
      }
    }
  }
  if (fresh.status !== 'playing') break;
  if (fresh.phase === 'player' && !fresh.busy) fresh.endTurn();
  let spins = 0;
  while (fresh.busy && spins < 600) { await sleep(4); spins++; }
}
ok(fresh.status !== 'playing', `game reached terminal state: ${fresh.status} (in ${guard} rounds)`);
ok(guard < 80, 'game terminated without runaway loop');

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
