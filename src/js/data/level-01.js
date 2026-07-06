// Level 01 — "The Overpass" — owned by the Game Designer.
// Map legend: '.' street(floor)  'r' rubble  '#' wall  'E' extraction
// Coordinates are (x = column, y = row), origin top-left. Grid is 10 wide x 8 tall.
// Placements reference class keys from data/units.js. All must sit on non-wall tiles.

export const LEVEL_01 = {
  id: 'level-01',
  name: 'The Overpass',
  intro:
    'Survivors must break across the overpass to the extraction point (green) before ' +
    'the horde overwhelms them. Clear the walkers — or just get one survivor to the exit.',
  map: [
    '....##...E', // y0
    '...r.....E', // y1
    '....#.#..r', // y2
    '#....#.#..', // y3
    '#........r', // y4
    '..r.....r.', // y5
    '..r..##...', // y6
    '..........', // y7
  ],
  survivors: [
    { cls: 'ranger',  name: 'Dana',   x: 1, y: 3 },
    { cls: 'medic',   name: 'Ellis',  x: 1, y: 4 },
    { cls: 'fighter', name: 'Marcus', x: 1, y: 5 },
  ],
  zombies: [
    { cls: 'walker', x: 3, y: 2 },
    { cls: 'walker', x: 6, y: 1 },
    { cls: 'walker', x: 8, y: 3 },
    { cls: 'walker', x: 5, y: 4 },
    { cls: 'walker', x: 8, y: 5 },
    { cls: 'walker', x: 7, y: 6 },
  ],
};
