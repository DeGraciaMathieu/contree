# Contrée

Jeu de pose de tuiles hexagonales en solitaire : on compose un pays en fermant des
massifs, en traçant des rivières, en entourant des villages, en satisfaisant des commandes
et des objectifs de partie. Formats **court** (rayon 3) et **long** (rayon 4).

## Lancer le jeu

> ⚠️ Le double-clic sur `index.html` ne fonctionne **plus**. Le jeu est découpé en modules
> ES ; or les modules natifs ne se chargent pas via `file://`. Il faut un serveur HTTP.

```bash
npm run dev        # sert le dossier (npx serve .) puis ouvrir l'URL affichée
```

## Tester

La couche de règles (`src/rules/`) est pure et couverte par des tests macro.

```bash
npm test           # node --test
npm run test:watch # relance à chaque modification
```

Aucune dépendance : Node 22 exécute l'ESM et le runner de test nativement.

## Structure

```
index.html            page + styles ; charge src/main.js
src/
  config.js           toutes les constantes nommées
  rules/              règles pures et testées (aucun DOM, aucun hasard, aucun temps)
    rng.js  geometry.js  groups.js  commands.js  goals.js  score.js  targets.js  deck.js
  state/
    game.js           état mutable partagé (G) + accès aux règles lié à l'état courant
    scores.js         persistance du classement (localStorage)
  render/
    board.js          canvas : dessin + boucle d'animation
    ui.js             widgets DOM (main, objectifs, inspection, delta, classement)
    sound.js          synthèse sonore + vibration
    dom.js            accès DOM partagés
  input/
    handlers.js       écouteurs d'événements → intentions
  loop/
    turn.js           orchestration : pose, défausse, annulation, cascade, fin, format
  main.js             câblage, graine RNG, point d'entrée
tests/                un test macro par règle
docs/decisions.md     décisions du refactor (archétype, toolchain, découpage)
```

Le flux d'une action : `input/` traduit un événement en intention → `loop/turn.js`
applique la règle pure (`rules/`) à l'état (`state/game.js`) → `render/` redessine.
