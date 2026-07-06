// Headless engine smoke test — owned by the Tester. No DOM; drives the pure engine
// (turn machine, pathfinding, combat, AI, win/lose) through a full playthrough.
// Run from the repo root:  node tests/smoke.mjs
import { LEVEL_01 } from '../src/js/data/level-01.js';
import { Game } from '../src/js/engine/turn.js';
import { Grid } from '../src/js/engine/grid.js';

let fails = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL:', m); fails++; } else console.log('ok  :', m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const g = new Grid(LEVEL_01.map);
ok(g.width === 10 && g.height === 8, `grid is ${g.width}x${g.height} (expect 10x8)`);
ok(LEVEL_01.map.every((r) => r.length === g.width), 'all map rows equal width');

const placed = [...LEVEL_01.survivors, ...LEVEL_01.zombies];
ok(placed.every((u) => !g.isBlocked(u.x, u.y)), 'no unit starts on a wall');

const game = new Game(LEVEL_01, {});
ok(game.players().length === 3, 'starts with 3 survivors');
ok(game.enemies().length === 6, 'starts with 6 walkers');

const dana = game.players().find((u) => u.name === 'Dana');
game.selectUnit(dana);
ok(game.reachable.size > 1, `Dana can reach ${game.reachable.size} tiles`);
ok(!game.reachable.has('0,4'), 'Dana cannot stop on the wall at 0,4');
game.deselect();

const ranger = game.players().find((u) => u.name === 'Dana'); // atk 8, range 2
const walker = game.enemies()[0];
const rangerHp0 = ranger.hp;
ranger.x = walker.x; ranger.y = walker.y - 2;
game.selected = ranger; game.step = 'action'; game.computeTargets();
const wHp0 = walker.hp;
game.attack(walker);
ok(walker.hp === wHp0 - Math.max(1, ranger.atk - walker.def), 'ranger deals atk-def damage');
ok(ranger.hp === rangerHp0, 'ranged attacker takes no counter from melee walker');

const fresh = new Game(LEVEL_01, {});
let guard = 0;
while (fresh.status === 'playing' && guard < 60) {
  guard++;
  for (const u of fresh.players()) {
    if (fresh.status !== 'playing') break;
    if (u.hasActed) continue;
    fresh.selectUnit(u);
    let best = { x: u.x, y: u.y }, score = Infinity;
    for (const k of fresh.reachable.keys()) {
      const [x, y] = k.split(',').map(Number);
      const s = Math.abs(9 - x) + Math.abs(0 - y);
      if (s < score) { score = s; best = { x, y }; }
    }
    fresh.moveTo(best.x, best.y);
    if (fresh.status !== 'playing') break;
    if (fresh.step === 'action') {
      if (fresh.attackable.size) {
        const [tx, ty] = [...fresh.attackable][0].split(',').map(Number);
        fresh.attack(fresh.unitAt(tx, ty));
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
  while (fresh.busy && spins < 400) { await sleep(5); spins++; }
}
ok(fresh.status !== 'playing', `game reached terminal state: ${fresh.status} (in ${guard} rounds)`);
ok(guard < 60, 'game terminated without runaway loop');

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
