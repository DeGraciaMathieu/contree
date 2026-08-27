# Refactor decisions

Écrit par `/refactor-game`. Consigne ce que le code ne peut pas exprimer : pourquoi ce
découpage, pourquoi cette toolchain, ce qui n'a délibérément pas été touché, ce qui reste
indécis. Lu par `/scaffold-claude`.

## Archetype

Selected: **Plateau au tour par tour** (turn-based board)
Why: grille hexagonale discrète (`board` = `Map<"q,r", tile>`), une action à la fois
(poser/défausser une tuile), pilotage événementiel, le rendu réagit aux changements d'état.
Le plateau est déjà une structure propre (pas le DOM).
Does not fit:
- Une boucle `requestAnimationFrame` existe mais est **purement cosmétique** (animations,
  interpolation du score, poussière, fumée, nuage). `loop/` garde donc deux rôles :
  contrôleur de tour *et* boucle d'animation (dans `render/board.js`).
- Jeu **solitaire** : pas de tour adverse, pas d'enum de phase.
- Le cœur des règles est un **moteur de score** (massifs/rivières/villages/commandes/
  objectifs), plus proche d'un euro-game que du plateau tactique de l'archétype.

## Toolchain

Branch: **zero-build**
Triggering signal: aucun signal Vite présent (pas d'import npm — seules deux polices
Google Fonts en CSS ; JavaScript vanilla, pas de TypeScript ; aucun asset à bundler ;
~1 030 lignes de JS < 2 000). Branche par défaut.
Node: 22
Test runner: **node:test** (aucune dépendance dev)

⚠️ Le double-clic sur `index.html` ne fonctionne plus : l'ESM natif n'est pas chargé en
`file://`. Servir via `npm run dev`.

## Layout

| Module | Responsibility | Came from (index.html d'origine) |
| --- | --- | --- |
| `src/config.js` | toutes les constantes nommées | valeurs magiques éparses |
| `src/rules/rng.js` | générateur pseudo-aléatoire seedé | — (nouveau) |
| `src/rules/geometry.js` | plateau hexagonal : `onBoard`, `neighbors`, `sides`, `dist`, `buildCells`, `key` | `géométrie` |
| `src/rules/groups.js` | massifs, tronçons d'eau + ponts, fermeture | `score` |
| `src/rules/commands.js` | satisfaction des commandes | `cmdOk` |
| `src/rules/goals.js` | objectifs de partie + `drawGoals` | `objectifs de partie` |
| `src/rules/score.js` | score complet | `score` |
| `src/rules/targets.js` | légalité de pose | `validTargets` |
| `src/rules/deck.js` | tirages + amorces | `drawTerrain/drawTile/drawHand/seeds` |
| `src/state/game.js` | état mutable `G` + wrappers liant l'état aux règles + `snapshot` | déclarations d'état + wrappers |
| `src/state/scores.js` | persistance du classement (localStorage) | `meilleurs scores` |
| `src/render/board.js` | canvas : dessin + boucle d'animation | `rendu plateau` |
| `src/render/ui.js` | widgets DOM (main, objectifs, inspection, delta, classement) | `inspection` + `rendu UI` |
| `src/render/sound.js` | synthèse sonore + vibration | `son` |
| `src/render/dom.js` | accès DOM partagés (`el`, `over`) | `el`, `over` |
| `src/input/handlers.js` | écouteurs d'événements → intentions | `interaction` (listeners) |
| `src/loop/turn.js` | orchestration : newGame, commit, discard, undo, cascade, finish, setFormat | `interaction` (flux) |
| `src/main.js` | câblage, graine RNG, point d'entrée | bas du script |

Le prototype partageait un état mutable via des variables libres. En ESM, cet état vit
dans l'objet unique `G` (`src/state/game.js`), muté par `render/`, `input/` et `loop/`.
Les fonctions de `src/rules/` restent pures : les wrappers de `game.js` leur injectent le
rayon/contexte courant.

## Rules extracted

| Rule | Module | Test | Notes |
| --- | --- | --- | --- |
| Géométrie hexagonale | `rules/geometry.js` | `tests/geometry.test.js` | `R` passé en argument |
| Massifs / eau / fermeture | `rules/groups.js` | `tests/groups.test.js` | pont via `waterLinks` |
| Commandes | `rules/commands.js` | `tests/commands.test.js` | |
| Objectifs | `rules/goals.js` | `tests/goals.test.js` | contexte `{R, cells, discards}` |
| Score | `rules/score.js` | `tests/score.test.js` | contexte `{R, CROSS, cells, goals, discards}` |
| Légalité de pose | `rules/targets.js` | `tests/targets.test.js` | |
| Pioche / amorces | `rules/deck.js` | `tests/deck.test.js` | `rng` injecté |

25 tests, tous verts (`npm test`).

## Randomness and time

| Call site | Classification | Handling |
| --- | --- | --- |
| `drawTerrain`, `drawTile`, `drawHand`, `drawGoals`, `seeds` | rule-bearing | RNG seedé injecté (`rng` en argument) |
| `spawnDust` (jitter des grains) | cosmetic | laissé dans `render/board.js`, `Math.random` |
| Tous les `performance.now()` (motifs, lueur, fumée, nuage, poussière, `render`, effets `pop`/`float`/`jolt`, `syncClosed`, `cascade`, `finish`) | cosmetic / orchestration | laissés dans `render/` et `loop/` |
| `Date.now()` dans `saveScore` | persistance | laissé dans `state/scores.js` (horodatage de l'entrée) |

Seed: **dérivée au câblage** dans `main.js` (`createRng(Date.now()>>>0)`). Les tests
passent une graine fixe pour un résultat déterministe.

## Deliberately left alone

Comportement qui pourrait sembler perfectible mais préservé tel quel (le refactor ne doit
pas changer le jeu).

- Rien à signaler : aucune anomalie de comportement rencontrée pendant la restructuration.

## Open questions

Décisions que le code ne tranche pas et qui n'ont pas été prises (jamais résolues par
supposition).

- `Math.min(5, kinds.size + libres)` dans le calcul du potentiel de village
  (`render/ui.js`) : le `5` correspond au nombre de terrains distincts (= `TERRAINS`).
  Laissé en littéral, non centralisé dans `config.js`, car il n'apparaît qu'à cet endroit
  d'affichage et n'a pas été identifié comme valeur magique dans l'inventaire.
- La largeur maximale `440px` de l'interface vit dans le CSS (`<style>`), pas dans
  `config.js` (config est du JS ; valeur de mise en page, pas de règle).
