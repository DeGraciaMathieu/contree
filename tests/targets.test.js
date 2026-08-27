import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validTargets } from '../src/rules/targets.js';

test('on ne peut poser qu\'à côté du pays existant, jamais sur une case occupée ou isolée', () => {
  const cells = [[0, 0], [1, 0], [2, 0], [-1, 0]];
  const board = new Map([['0,0', {terrain:'foret'}]]);
  const t = validTargets(board, cells, 4);

  assert.ok(t.has('1,0'));    // voisine du pays
  assert.ok(t.has('-1,0'));   // voisine du pays
  assert.ok(!t.has('2,0'));   // pas adjacente à une case posée
  assert.ok(!t.has('0,0'));   // déjà occupée
});
