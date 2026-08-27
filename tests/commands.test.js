import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cmdOk } from '../src/rules/commands.js';
import { neighbors, key } from '../src/rules/geometry.js';

const village = (cmd) => new Map([['0,0', {terrain:'village', cmd, done:false}]]);
const withNeighbors = (b, terrains) => {
  const ns = neighbors(0, 0, 4);
  terrains.forEach((t, i) => b.set(key(...ns[i]), {terrain:t}));
  return b;
};

test('la commande « 3 forêts autour » exige exactement trois forêts voisines', () => {
  const trois = withNeighbors(village('village_forets3'), ['foret', 'foret', 'foret']);
  assert.equal(cmdOk(trois, '0,0', trois.get('0,0'), 4), true);

  const deux = withNeighbors(village('village_forets3'), ['foret', 'foret']);
  assert.equal(cmdOk(deux, '0,0', deux.get('0,0'), 4), false);
});

test('« massif de 5 forêts » compte le massif de forêts connecté à la tuile', () => {
  // une ligne de 5 forêts le long de l'axe q
  const b = new Map();
  for (let q = 0; q < 5; q++) b.set(key(q, 0), {terrain:'foret', cmd:q === 0 ? 'foret_massif5' : null, done:false});
  assert.equal(cmdOk(b, '0,0', b.get('0,0'), 4), true);

  b.delete(key(4, 0));                              // plus que 4 forêts connectées
  assert.equal(cmdOk(b, '0,0', b.get('0,0'), 4), false);
});

test('une commande déjà marquée done reste satisfaite', () => {
  const b = village('village_forets3');
  b.get('0,0').done = true;
  assert.equal(cmdOk(b, '0,0', b.get('0,0'), 4), true);
});
