---
name: architecture
description: Use when adding or moving code in Contrée, deciding which module a change belongs to, or understanding how rules, state, rendering, input and the game loop fit together.
auto_invoke: true
---

# Architecture de Contrée

Jeu single-player en modules ES natifs, sans build. Le flux d'une action :
**`input/` (événement → intention) → `loop/turn.js` (applique une règle pure à l'état) →
`render/` (redessine)**. L'état mutable est centralisé dans l'objet `G`.

## Carte des modules

| Module | Rôle | Dépend de |
| --- | --- | --- |
| `src/config.js` | toutes les constantes nommées (règles, timings, libellés) | rien |
| `src/rules/rng.js` | générateur pseudo-aléatoire seedé (`createRng`) | rien |
| `src/rules/geometry.js` | plateau hexagonal : `onBoard`, `neighbors`, `sides`, `dist`, `buildCells`, `key` | `config` |
| `src/rules/groups.js` | massifs (`groups`, `isClosed`), eau + ponts (`waterGroups`, `waterLinks`) | `config`, `geometry` |
| `src/rules/commands.js` | satisfaction d'une commande (`cmdOk`) | `config`, `geometry` |
| `src/rules/goals.js` | objectifs (`GOAL_DEFS`, `goalOk`, `goalState`, `drawGoals`) | `config`, `groups`, `commands` |
| `src/rules/score.js` | score complet (`score`) | `config`, `geometry`, `groups`, `commands`, `goals` |
| `src/rules/targets.js` | cases posables (`validTargets`) | `geometry` |
| `src/rules/deck.js` | tirages + amorces (`drawTerrain`, `drawTile`, `drawHand`, `seeds`) | `config`, `geometry` |
| `src/state/game.js` | objet `G` (état mutable) + wrappers liant `G.R`/contexte aux règles + `snapshot`, `buildShape` | `config`, `rules` |
| `src/state/scores.js` | persistance du classement (localStorage) | `config`, `state/game` |
| `src/render/board.js` | canvas : géométrie écran (`px`, `hexAt`, `layout`), motifs, effets, boucle `render` | `config`, `geometry`, `state` |
| `src/render/ui.js` | widgets DOM : main, objectifs, inspection, delta, classement, `renderAll` | `config`, `rules`, `state`, `render/board` |
| `src/render/sound.js` | synthèse sonore + vibration (`snd`, `buzz`) | rien |
| `src/render/dom.js` | accès DOM partagés (`el`, `over`) | rien |
| `src/input/handlers.js` | écouteurs d'événements (`bindInputs`) | tout le reste |
| `src/loop/turn.js` | orchestration : `newGame`, `commit`, `discard`, `undo`, `cascade`, `finish`, `setFormat` | tout le reste |
| `src/main.js` | câblage, graine RNG, démarrage | tout |

La règle d'or de dépendance : **la flèche ne va que vers le bas** de ce tableau. Une règle
qui importe un renderer, ou une valeur magique hors `config.js`, est le défaut à traquer.

## L'objet d'état `G`

Tout l'état mutable de la partie (`board`, `hand`, `nextHand`, `history`, `sel`, `ghost`,
`effects`, `cachedScore`, `discards`, `closedAt`, `shownScore`, `finished`, `insp`, `dust`,
`deal`, `goals`, `lastEntry`, `rng`, `R`, `CROSS`, `cells`) vit dans `G`
(`src/state/game.js`). `render/`, `input/` et `loop/` lisent et écrivent `G.x`. Les règles
pures ne voient jamais `G` : les **wrappers** de `game.js` (`neighbors`, `sides`, `groups`,
`isClosed`, `cmdOk`, `goalOk`, `goalState`, `score`, `validTargets`) leur passent `G.R` et
le contexte courant.

## Où placer le nouveau code

| Type de changement | Fichier(s) à toucher |
| --- | --- |
| Nouvelle valeur (seuil, timing, bonus, libellé) | `src/config.js` (export nommé) — jamais en dur ailleurs |
| Nouvelle règle de score | `src/rules/score.js` (+ helpers dans `groups.js`) → skill `scoring` |
| Nouvelle commande | `config.js`, `rules/commands.js`, affichage `render/ui.js` → skill `scoring` |
| Nouvel objectif | `rules/goals.js`, seuils `config.js` → skill `scoring` |
| Nouveau terrain / tuile rare | `config.js`, tirage `rules/deck.js`, motif `render/board.js` → skill `deck` |
| Géométrie / format de plateau | `rules/geometry.js`, `config.js` → skill `board-geometry` |
| Nouvel effet visuel / animation | `src/render/board.js` (jamais une règle ici) |
| Nouveau widget / panneau DOM | `src/render/ui.js` (+ `index.html` pour le markup) |
| Nouvelle interaction / bouton | `src/input/handlers.js` (+ orchestration dans `loop/turn.js`) |
| Nouveau flux de jeu (pose, fin…) | `src/loop/turn.js` |

Toujours accompagner un changement de règle d'un test macro (skill `testing`) et, si le
périmètre bouge, mettre à jour le panneau `#sheet` d'`index.html`.
