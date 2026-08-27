---
name: board-geometry
description: Use when working on the hexagonal board of Contrée — coordinates, adjacency, board edges/crossing, board size or the court/long formats.
auto_invoke: true
---

# Géométrie du plateau

Plateau hexagonal en coordonnées axiales `q,r`. Toute la géométrie est **pure** dans
`src/rules/geometry.js` : le rayon `R` est passé en argument, jamais lu depuis un état
global.

## Fonctions

| Fonction | Rôle |
| --- | --- |
| `key(q,r)` | clé de case `"q,r"` (identifiant dans `G.board`) |
| `buildCells(R)` | liste des cases `[q,r]` du plateau de rayon `R` (37 pour R=3, 61 pour R=4) |
| `onBoard(q,r,R)` | la case est-elle sur le plateau |
| `neighbors(q,r,R)` | les 6 voisines valides (les hors-plateau sont écartées) via `DIRS` |
| `sides(q,r,R)` | bords du plateau touchés (0..5) ; opposés = `i` et `(i+3)%6` — sert à la traversée des rivières |
| `dist(a,b)` | distance hexagonale (utilisée par le placement des amorces) |

`DIRS` (les 6 directions axiales) est dans `src/config.js`.

## Lien avec l'état courant

`src/state/game.js` expose des **wrappers** qui figent `G.R` :
`neighbors(q,r)`, `sides(q,r)`, `onBoard(q,r)` y appellent les versions pures avec `G.R`.
`buildShape()` régénère `G.cells = buildCells(G.R)`. Le reste du code utilise ces wrappers ;
seules les règles reçoivent `R` explicitement.

## Formats de plateau

Deux formats, pilotés par le rayon `R` :

- `R_SHORT = 3` (« Court · 37 cases »), `R_LONG = 4` (« Long · 61 cases ») dans `config.js`.
- `setFormat(r, restart)` (`src/loop/turn.js`) fixe `G.R`, `G.CROSS = CROSS_FACTOR·r`,
  reconstruit les cases et persiste le choix (`LS_FMT`). Un classement séparé par format
  (`state/scores.js`).
- Les seuils d'objectifs et la prime de traversée dépendent du format (voir skill `scoring`).

## Modifier la géométrie

- **Changer une taille de format** : ajuster `R_SHORT`/`R_LONG` dans `config.js`. Les
  libellés « 37 cases » / « 61 cases » du panneau `#sheet` (`index.html`) sont écrits à la
  main → les mettre à jour.
- **Changer l'adjacence** : `DIRS` dans `config.js` (impacte `neighbors` et `waterLinks`).
- Toute nouvelle mesure géométrique va dans `geometry.js`, pure, avec `R` en argument, et un
  test dans `tests/geometry.test.js`.
