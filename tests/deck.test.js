import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawTerrain, drawTile, drawHand, seeds } from '../src/rules/deck.js';
import { createRng } from '../src/rules/rng.js';
import { buildCells } from '../src/rules/geometry.js';

const TERRAINS = ['foret', 'champ', 'eau', 'pierre', 'village'];

test('une même graine produit exactement le même tirage (reproductible)', () => {
  const a = drawHand(createRng(7));
  const b = drawHand(createRng(7));
  assert.deepEqual(a, b);
});

test('drawTerrain ne rend qu\'un terrain connu', () => {
  const rng = createRng(123);
  for (let i = 0; i < 50; i++) assert.ok(TERRAINS.includes(drawTerrain(rng)));
});

test('drawTile produit une tuile bien formée (terrain, cmd, done, rare)', () => {
  const t = drawTile(createRng(1));
  assert.ok(TERRAINS.includes(t.terrain));
  assert.equal(t.done, false);
  assert.ok(t.cmd === null || typeof t.cmd === 'string');
  assert.ok(t.rare === null || typeof t.rare === 'string');
});

test('seeds place le centre puis des amorces dispersées et distinctes', () => {
  const cells = buildCells(4);
  const s = seeds(createRng(99), cells);
  assert.deepEqual(s[0], [0, 0]);                          // le centre en premier
  assert.ok(s.length >= 1 && s.length <= 4);
  const clefs = new Set(s.map(c => c.join(',')));
  assert.equal(clefs.size, s.length);                      // toutes distinctes
});
