---
name: scoring
description: Use when changing how points are computed in Contrée — massifs, rivières, villages, commandes or objectifs — or when adding a new command, objective or scoring rule.
auto_invoke: true
---

# Moteur de score

Le score est calculé par une seule fonction pure `score(b, ctx)` dans `src/rules/score.js`,
`ctx = {R, CROSS, cells, goals, discards}`. Elle retourne
`{massifs, rivieres, villages, commandes, objectifs, closed, glow, total}`. Depuis le reste
du code on l'appelle via le wrapper `score(b)` de `src/state/game.js` (il injecte le
contexte courant depuis `G`).

## Les cinq sources de points

| Concept | Implémentation | Constantes (`config.js`) |
| --- | --- | --- |
| **Massif** (forêt/champ/pierre) | `rules/groups.js` `groups` + `isClosed` ; boucle dans `score.js` : `taille²` si fermé, `taille` sinon | `MASSIF_T`, `MASSIF_MIN` |
| **Rivière** (eau) | `rules/groups.js` `waterGroups`/`waterLinks` ; `score.js` : `RIVER_PT`/tuile, prime `CROSS` si `sides` opposés (i et i+3) | `RIVER_PT`, `CROSS_FACTOR` (→ `CROSS = 10·R`) |
| **Village** | `score.js` : `VILLAGE_PT`·(terrains distincts voisins), ×`VILLAGE_WATER_MULT` si eau, +`MOULIN_BONUS`/moulin voisin | `VILLAGE_PT`, `VILLAGE_WATER_MULT`, `MOULIN_BONUS` |
| **Commande** | `rules/commands.js` `cmdOk` ; `score.js` : +`CMD_BONUS` par commande satisfaite | `CMD_BONUS`, `CMD_FORETS3`, `CMD_EAU2`, `CMD_VILLAGES2`, `CMD_MASSIF5`, `COMMANDS` |
| **Objectif** | `rules/goals.js` `GOAL_DEFS`/`goalOk` ; `score.js` : +`GOAL_BONUS` par objectif atteint | `GOAL_BONUS`, `GOALS_PER_GAME`, `GOAL_FERMER/GROS/COMMANDES/TOT_LIMIT/ISOLES` |

`closed` = cases des massifs fermés (pour l'animation) ; `glow` = rivières traversantes.

## Fermeture, traversée, ponts

- Un massif est **fermé** quand toutes ses cases sont entourées de cases posées :
  `isClosed(b, g, R)` (`groups.js`).
- Une rivière **traverse** si l'ensemble des bords touchés (`sides`, `geometry.js`) contient
  un bord `i` et son opposé `(i+3)%6` (`score.js`).
- Un **pont** (`rare:'pont'`) raccorde deux tronçons d'eau séparés par une case :
  `waterLinks(b, k)` ajoute l'enjambée sur les 3 axes.

## Ajouter une commande

1. `src/config.js` : entrée dans `COMMANDS` (`{on:<terrain>, text:<libellé>}`) + éventuel
   seuil nommé (`CMD_…`). Le tirage la prend automatiquement (`deck.js` lit `COMMANDS`).
2. `src/rules/commands.js` : un `case` dans `cmdOk` renvoyant le booléen de satisfaction.
3. `src/render/ui.js` : un `case` dans `cmdRow` pour l'avancement affiché en inspection.
4. `tests/commands.test.js` : un test macro (nominal + cas limite).
5. Si la règle est visible au joueur, ajouter une ligne au panneau `#sheet` d'`index.html`.

## Ajouter un objectif

1. `src/rules/goals.js` : une entrée dans `GOAL_DEFS` avec `chip`, `atEnd`, `need(ctx)`,
   `text(ctx)`, `val(b, ctx)` et éventuellement `state(b, ctx)`. Rester fidèle à la règle de
   conception (commentaire en tête du fichier) : **un objectif ne mesure que le placement,
   jamais ce que la pioche a donné.** `drawGoals` le tire automatiquement.
2. `src/config.js` : les seuils format-dépendants sous forme `{long, short}`.
3. `tests/goals.test.js` : un test macro construisant un petit plateau.

## Ajouter une règle de score

Éditer `src/rules/score.js` (et un helper dans `groups.js` si besoin d'un regroupement),
ajouter la constante dans `config.js`, puis un test dans `tests/score.test.js`. Ne jamais
lire le DOM, l'horloge ou le hasard ici : `score` doit rester pure et déterministe.
