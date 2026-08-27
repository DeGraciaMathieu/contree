# Contrée

Jeu de pose de tuiles hexagonales en solitaire : composer un pays en fermant des massifs,
traçant des rivières, entourant des villages et satisfaisant commandes et objectifs.
Formats **court** (rayon 3, 37 cases) et **long** (rayon 4, 61 cases).

## Stack

- **JavaScript vanilla + modules ES natifs**, aucun build (ni bundler ni transpileur).
- **Node 22** (exécute l'ESM et le runner de test nativement).
- Rendu **Canvas 2D**, son **Web Audio**, persistance **localStorage**.
- Aucun lint ni formateur configuré (ne pas en imposer un).

Commandes :

```bash
npm run dev          # sert le dossier (npx serve .), puis ouvrir l'URL affichée
npm test             # node --test  → lance tests/*.test.js
npm run test:watch   # relance à chaque modification
```

> ⚠️ Le double-clic sur `index.html` ne fonctionne pas : l'ESM natif ne se charge pas via
> `file://`. Toujours passer par `npm run dev`.

## Architecture (la flèche ne va que vers le bas)

| Couche | Contient | Peut importer |
| --- | --- | --- |
| `src/config.js` | toutes les constantes nommées | rien |
| `src/rules/` | décisions et transitions **pures** | `config` uniquement |
| `src/state/` | l'état mutable `G` + accès aux règles lié à l'état ; persistance | `config`, `rules` |
| `src/render/` | tout ce qui écrit à l'écran (canvas, DOM, son) | `config`, `state` (lecture) |
| `src/input/` | écouteurs d'événements → intentions | tout le reste |
| `src/loop/` | orchestration : intention → règle → état → rendu | tout le reste |
| `src/main.js` | câblage, graine RNG, point d'entrée | tout |

L'état mutable de la partie vit dans l'objet unique **`G`** (`src/state/game.js`). Le
prototype partageait cet état par variables libres ; en ESM il est centralisé dans `G`,
muté par `state`/`render`/`input`/`loop`. Les fonctions de `src/rules/` restent pures : les
**wrappers** de `state/game.js` (`neighbors`, `score`, `cmdOk`, `goalOk`, `validTargets`…)
leur injectent le rayon `G.R` et le contexte courant.

## Conventions de code — à ne jamais enfreindre

- **Aucun DOM, aucune horloge, aucun hasard dans `src/rules/`.** Pas de `document`,
  `window`, `canvas` ; pas de `Math.random`, `Date.now`, `performance.now`. Une règle prend
  son état en argument et retourne une décision ou le nouvel état, sans muter ses arguments.
  Elle n'importe que `config.js`. Si une fonction ne peut pas respecter ça, ce n'est pas une
  règle : elle va dans `loop/` ou `input/`.
- **Aucune valeur magique hors `config.js`.** Vitesses, dimensions, seuils, timings, bonus,
  probabilités, libellés liés aux règles : tout est un export nommé de `src/config.js`. Une
  valeur dupliquée (ex. un seuil affiché) doit référencer la même constante, pas la recopier.
- **Le hasard est injecté.** Les tirages (`rules/deck.js`, `drawGoals`) reçoivent un `rng`
  seedé en argument ; seul `main.js` décide de la graine. Le hasard **cosmétique**
  (jitter de `spawnDust`) et les `performance.now()` d'animation restent dans `render/`.
- **Les règles pures ne connaissent pas l'état global.** Elles reçoivent `R` / un contexte
  en paramètre. Seuls les wrappers de `state/game.js` lisent `G`.
- **Ne jamais réintroduire de logique de règle dans `render/`, `input/` ou `loop/` :** ces
  couches appellent les règles, elles ne les recodent pas.

## Conventions de domaine

- Vocabulaire du jeu (à réutiliser tel quel) : `plateau`, `tuile`, `massif`, `rivière`,
  `village`, `commande`, `objectif`, `défausse`, `amorce`, `traversée`, `fermeture`,
  `isolé`, `pont`, `moulin`, terrains `foret`/`champ`/`eau`/`pierre`/`village`.
- Coordonnées hexagonales axiales `q,r` ; clé de case = `"q,r"` (`rules/geometry.js` `key`).
- Le plateau (`G.board`) est une `Map<"q,r", {terrain, cmd, done, rare}>`.

## Comportement (règles de process)

- **Ne jamais déclarer une tâche terminée sans avoir lancé `npm test` et vu la suite
  passer.** Un hook Stop le vérifie.
- **Si une approche échoue deux fois, revoir le plan** avant de tenter une troisième variante.
- Après une modification, nettoyer le superflu : imports inutilisés, constantes mortes,
  classes CSS orphelines.
- Si le périmètre d'une règle bouge, mettre à jour le panneau de règles `#sheet`
  d'`index.html` (documentation vivante) et les skills concernés.
- Langue du dépôt : **français** (commentaires, docs, texte in-game). S'y tenir.

## Skills disponibles

- `architecture` — carte des modules et où placer chaque type de nouveau code.
- `scoring` — moteur de score : massifs, rivières, villages, commandes, objectifs.
- `board-geometry` — plateau hexagonal : coordonnées, voisinage, bords/traversée, formats.
- `deck` — pioche : tirages pondérés, tuiles rares/commandes, amorces, RNG seedé.
- `testing` — commande, philosophie des tests macro, où placer un nouveau test.
- `feature` — implémenter une fonctionnalité de bout en bout dans l'architecture.
- `prd` — rédiger une spécification (sans implémenter).
