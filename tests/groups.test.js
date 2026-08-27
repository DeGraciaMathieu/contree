import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groups, waterGroups, isClosed } from '../src/rules/groups.js';
import { neighbors, key } from '../src/rules/geometry.js';

test('des cases de même terrain adjacentes forment un massif, un terrain différent reste à part', () => {
  const b = new Map([
    ['0,0', {terrain:'foret'}],
    ['1,0', {terrain:'foret'}],   // voisine de 0,0
    ['2,0', {terrain:'champ'}],
  ]);
  const g = groups(b, () => true, 4);
  const foret = g.find(x => x.terrain === 'foret');
  const champ = g.find(x => x.terrain === 'champ');
  assert.equal(foret.cells.length, 2);
  assert.equal(champ.cells.length, 1);
});

test('un massif est fermé quand toutes ses cases sont entourées de cases posées', () => {
  const b = new Map([['0,0', {terrain:'foret'}]]);
  for (const [q, r] of neighbors(0, 0, 4)) b.set(key(q, r), {terrain:'champ'});
  const g = {terrain:'foret', cells:['0,0']};
  assert.equal(isClosed(b, g, 4), true);
  b.delete(key(...neighbors(0, 0, 4)[0]));           // on retire une voisine
  assert.equal(isClosed(b, g, 4), false);
});

test('un pont raccorde deux tronçons d\'eau séparés par une case', () => {
  const avecPont = new Map([
    ['0,0', {terrain:'eau', rare:'pont'}],
    ['2,0', {terrain:'eau', rare:null}],             // séparée par la case vide 1,0
  ]);
  assert.equal(waterGroups(avecPont).length, 1);     // le pont les relie

  const sansPont = new Map([
    ['0,0', {terrain:'eau', rare:null}],
    ['2,0', {terrain:'eau', rare:null}],
  ]);
  assert.equal(waterGroups(sansPont).length, 2);     // sans pont, deux rivières
});
