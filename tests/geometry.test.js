import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onBoard, neighbors, sides, dist, buildCells } from '../src/rules/geometry.js';

test('le plateau long (R=4) compte 61 cases, le court (R=3) en compte 37', () => {
  assert.equal(buildCells(4).length, 61);
  assert.equal(buildCells(3).length, 37);
});

test('une case au-delà du rayon n\'est pas sur le plateau', () => {
  assert.equal(onBoard(0, 0, 4), true);
  assert.equal(onBoard(4, 0, 4), true);
  assert.equal(onBoard(5, 0, 4), false);   // au-delà du rayon
  assert.equal(onBoard(3, 3, 4), false);   // |q+r| = 6 > 4
});

test('le centre a six voisins, un coin du plateau en a moins', () => {
  assert.equal(neighbors(0, 0, 4).length, 6);
  assert.ok(neighbors(4, 0, 4).length < 6);         // les voisins hors plateau sont écartés
  assert.ok(neighbors(4, 0, 4).every(([q, r]) => onBoard(q, r, 4)));
});

test('une case au milieu d\'un bord ne touche que ce bord ; les bords opposés sont i et i+3', () => {
  assert.deepEqual(sides(4, -2, 4), [0]);
  assert.deepEqual(sides(-4, 2, 4), [3]);           // 3 est l'opposé de 0
});

test('la distance hexagonale entre deux cases', () => {
  assert.equal(dist([0, 0], [0, 0]), 0);
  assert.equal(dist([0, 0], [2, 0]), 2);
  assert.equal(dist([0, 0], [0, 3]), 3);
});
