import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score } from '../src/rules/score.js';
import { neighbors, key } from '../src/rules/geometry.js';

const ctx = { R:4, CROSS:40, cells:[], goals:[], discards:3 };   // pas d'objectif : objectifs = 0

test('un massif ouvert vaut sa taille, un massif fermé vaut sa taille au carré', () => {
  const ouvert = new Map([['0,0', {terrain:'foret'}], ['1,0', {terrain:'foret'}]]);
  assert.equal(score(ouvert, ctx).massifs, 2);            // massif ouvert de 2 → 2

  const ferme = new Map([['0,0', {terrain:'foret'}]]);
  for (const [q, r] of neighbors(0, 0, 4)) ferme.set(key(q, r), {terrain:'eau'});
  assert.equal(score(ferme, ctx).massifs, 1);             // forêt fermée de 1 → 1²
});

test('une rivière rapporte 3 points par tuile', () => {
  const riviere = new Map([['0,0', {terrain:'eau'}], ['1,0', {terrain:'eau'}]]);
  assert.equal(score(riviere, ctx).rivieres, 6);          // 3 × 2, sans traversée
});

test('une rivière de bord à bord touche la prime de traversée', () => {
  const cross = new Map();
  for (let q = -4; q <= 4; q++) cross.set(key(q, 0), {terrain:'eau'});   // ligne complète, bords opposés
  assert.equal(score(cross, ctx).rivieres, 3 * 9 + 40);   // 27 + CROSS
});

test('un village vaut 2 points par terrain différent autour, doublé si une eau le touche', () => {
  const ns = neighbors(0, 0, 4);
  const vil = new Map([['0,0', {terrain:'village'}]]);
  vil.set(key(...ns[0]), {terrain:'foret'});
  vil.set(key(...ns[1]), {terrain:'champ'});
  assert.equal(score(vil, ctx).villages, 4);              // 2 terrains → 2 × 2

  vil.set(key(...ns[2]), {terrain:'eau'});
  assert.equal(score(vil, ctx).villages, 12);             // 3 terrains → 2 × 3, doublé par l'eau
});

test('une commande satisfaite rapporte 15 points', () => {
  const ns = neighbors(0, 0, 4);
  const b = new Map([['0,0', {terrain:'village', cmd:'village_forets3', done:false}]]);
  [0, 1, 2].forEach(i => b.set(key(...ns[i]), {terrain:'foret'}));
  assert.equal(score(b, ctx).commandes, 15);
});
