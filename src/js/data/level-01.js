// Level 01 — "The Overpass" — owned by the Game Designer.
// Map legend: '.' street  'r' rubble  '#' wall  'E' extraction  'D' door(closed)  'C' container
// Coordinates are (x = column, y = row), origin top-left. Grid is 10 wide x 8 tall.
// Units must start on non-wall, non-door tiles. See docs/game-design.md.

export const LEVEL_01 = {
  id: 'level-01',
  name: 'The Overpass',
  intro:
    'Extraction is sealed inside a maintenance shed (top-right) — reach it through the ' +
    'door, or clear every walker. Search containers for ammo & medkits; the horde now ' +
    'includes Runners, a Spitter, and a Brute, so mind your formation.',
  map: [
    '....#..#E#', // y0  — shed: extraction inside, walls around
    '...r...DE#', // y1  — door 'D' at (7,1) is the shed entrance
    '....#.C###', // y2  — container (6,2) near the shed
    '#....#....', // y3
    '#........r', // y4
    '..r.....r.', // y5
    '..r.C##...', // y6  — container (4,6)
    '..........', // y7
  ],
  survivors: [
    { cls: 'ranger',  name: 'Dana',   x: 1, y: 3 },
    { cls: 'medic',   name: 'Ellis',  x: 1, y: 4 },
    { cls: 'fighter', name: 'Marcus', x: 1, y: 5 },
  ],
  zombies: [
    { cls: 'walker',  x: 3, y: 2 },
    { cls: 'walker',  x: 6, y: 3 },
    { cls: 'runner',  x: 6, y: 4 },
    { cls: 'spitter', x: 7, y: 5 },
    { cls: 'brute',   x: 8, y: 4 },
    { cls: 'runner',  x: 4, y: 7 },
  ],
  // Loot in each container tile (searched by moving a survivor onto it).
  containers: {
    '6,2': 'ammo',
    '4,6': 'medkit',
  },
};
