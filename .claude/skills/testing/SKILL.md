---
name: testing
description: Use when writing, running or extending tests for Contrée — the node:test suite over the pure rules layer — or when deciding what deserves a test and where it goes.
auto_invoke: true
---

# Tests

```bash
npm test             # node --test  → exécute tests/*.test.js
npm run test:watch   # relance à chaque modification
```

Runner natif **`node:test`** + `node:assert/strict`, aucune dépendance. Un hook Stop lance
la suite : ne jamais terminer une tâche sur une suite rouge.

## Philosophie : des tests macro, pas unitaires

On teste **ce qu'un joueur remarquerait**, dans le vocabulaire du domaine, pas des détails
d'implémentation. On construit l'état avec un petit littéral explicite et on affirme un
comportement de règle.

- Bon : « une rivière de bord à bord touche la prime de traversée », « une commande
  satisfaite rapporte 15 points ».
- Mauvais : « `groups` retourne un tableau de longueur 2 », « le champ interne vaut X ».

Un ou deux tests par règle : le cas nominal et le cas limite qui justifie la règle. La
couverture en pourcentage n'est pas un objectif.

Seule la couche **`src/rules/`** (pure) est testée. `render/`, `input/`, `loop/` dépendent
du DOM et ne sont pas couverts par la suite — d'où l'importance de garder la logique dans
`rules/`.

## Fichier de test → périmètre

| Fichier | Couvre |
| --- | --- |
| `tests/geometry.test.js` | plateau, voisinage, bords/traversée, distance (`rules/geometry.js`) |
| `tests/groups.test.js` | massifs, tronçons d'eau + ponts, fermeture (`rules/groups.js`) |
| `tests/commands.test.js` | satisfaction des commandes (`rules/commands.js`) |
| `tests/goals.test.js` | objectifs + contexte `{R, cells, discards}` (`rules/goals.js`) |
| `tests/score.test.js` | score complet : massifs, rivières, villages, commandes (`rules/score.js`) |
| `tests/targets.test.js` | légalité de pose (`rules/targets.js`) |
| `tests/deck.test.js` | tirages, déterminisme du RNG, amorces (`rules/deck.js`) |

## Où placer un nouveau test

Dans le fichier `tests/<module>.test.js` correspondant à la règle modifiée ; en créer un
nouveau seulement pour un nouveau module de `rules/`. Forme :

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score } from '../src/rules/score.js';
import { neighbors, key } from '../src/rules/geometry.js';

test('une commande satisfaite rapporte 15 points', () => {
  const ns = neighbors(0, 0, 4);
  const b = new Map([['0,0', {terrain:'village', cmd:'village_forets3', done:false}]]);
  [0, 1, 2].forEach(i => b.set(key(...ns[i]), {terrain:'foret'}));
  assert.equal(score(b, {R:4, CROSS:40, cells:[], goals:[], discards:3}).commandes, 15);
});
```

Pour un tirage, passer une graine fixe : `createRng(42)` (`rules/rng.js`) rend le test
déterministe. Construire l'état à la main, sans helper qui masque la mise en place.
