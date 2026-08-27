import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalOk, drawGoals, GOAL_DEFS } from '../src/rules/goals.js';
import { neighbors, key } from '../src/rules/geometry.js';
import { createRng } from '../src/rules/rng.js';

test('« Sans défausse » est acquis quand le pays est complet et aucune défausse utilisée', () => {
  const cells = [[0, 0]];
  const b = new Map([['0,0', {terrain:'foret'}]]);           // pays complet : b.size === cells.length
  assert.equal(goalOk(b, {id:'defausse', done:false}, {R:4, cells, discards:3}), true);   // DISCARDS_MAX = 3
  assert.equal(goalOk(b, {id:'defausse', done:false}, {R:4, cells, discards:2}), false);  // une défausse utilisée
});

test('un massif réduit à une seule case entourée compte comme un isolé', () => {
  const b = new Map([['0,0', {terrain:'foret'}]]);
  for (const [q, r] of neighbors(0, 0, 4)) b.set(key(q, r), {terrain:'eau'});   // forêt isolée et fermée
  const cells = [...b.keys()].map(k => k.split(',').map(Number));
  // GOAL_ISOLES.long = 7 : un seul isolé reste sous le seuil, objectif acquis en fin de partie
  assert.equal(goalOk(b, {id:'isoles', done:false}, {R:4, cells, discards:3}), true);
});

test('un objectif déjà marqué done reste acquis sans recalcul', () => {
  assert.equal(goalOk(new Map(), {id:'fermer', done:true}, {R:4, cells:[], discards:3}), true);
});

test('drawGoals tire trois objectifs distincts parmi les définitions connues', () => {
  const g = drawGoals(createRng(42));
  const ids = Object.keys(GOAL_DEFS);
  assert.equal(g.length, 3);
  assert.equal(new Set(g.map(x => x.id)).size, 3);           // distincts
  assert.ok(g.every(x => ids.includes(x.id) && x.done === false));
});
