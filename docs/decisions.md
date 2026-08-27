# Décisions de restructuration — Contrée

> Journal de suivi tenu pendant `/refactor-game`. Sera réconcilié avec le gabarit
> officiel à l'étape 6.

## Toolchain

**Branche zéro-build** (défaut). Aucun signal Vite : pas d'import npm (seules deux
polices Google Fonts en CSS), JavaScript vanilla, aucun asset à bundler, ~1 030 lignes
de JS (< 2 000). → `node --test`, `npx serve .`, aucune dépendance dev.

⚠️ Le double-clic sur `index.html` ne fonctionne plus : l'ESM natif n'est pas chargé en
`file://`. Servir via `npm run dev`.

## Archétype

**#2 Plateau au tour par tour.** Grille hexagonale discrète, une action à la fois,
pilotage événementiel.

Écarts assumés :
- La boucle `requestAnimationFrame` existe mais est **purement cosmétique** (animations,
  interpolation du score, poussière, fumée, nuage). `loop/` garde donc deux rôles :
  contrôleur de tour *et* boucle d'animation.
- Jeu solitaire : pas de tour adverse, pas d'enum de phase.
- Le cœur des règles est un **moteur de score** (massifs/rivières/villages/commandes/
  objectifs), plus proche d'un euro-game que du plateau tactique de l'archétype.

## Questions ouvertes (validées au GATE 1)

1. `score()` lit de l'état hors `board` (`goals`, `discards`, `R`/`CROSS`/`cells`) →
   deviendront des paramètres explicites lors de l'extraction.
2. `R`/`CROSS`/`cells` mutables (format 3↔4) → `config.js` porte les presets ; un objet
   `shape` sera passé aux règles.
3. Graine RNG dérivée dans `main.js` uniquement (câblage, pas une règle).
4. Aléa/temps **cosmétiques** (jitter de `spawnDust`, tous les `performance.now()` des
   motifs/animations) restent dans `render/`, sans graine ni injection.
5. Timing d'orchestration (`syncClosed`, `cascade`, `finish`) reste dans `loop/`.

## Aléa et temps — classification (étape 4)

**Dé-randomisés (RNG seedé injecté)** — code de règles/tirage :
`drawTerrain`, `drawTile`, `drawHand`, `drawGoals`, `seeds`. Reçoivent `rng` en
argument ; la graine est décidée au câblage (`rng = createRng(Date.now()>>>0)`).

**Laissés cosmétiques (pas de graine)** — ne nourrissent que le rendu :
- `spawnDust` : position/vitesse/taille/durée des grains (`Math.random()`).
- Tous les `performance.now()` : motifs (cimes, vagues, moulin), lueur, fumée, nuage,
  poussière, `render`, effets `pop`/`float`/`jolt`, `syncClosed`, `cascade`, `finish`.

**Laissé persistance** — `Date.now()` dans `saveScore` : horodatage de l'entrée de
classement. Ce n'est pas une règle (I/O localStorage).

## Deliberately left alone

_(comportements « à corriger » repérés mais laissés identiques — à remplir si rencontré)_

## Journal des étapes

- **Étape 3 — Extraction config** : toutes les valeurs magiques de l'inventaire déplacées
  dans `src/config.js` en exports nommés. `<script>` inline converti en
  `<script type="module">`. Aucun changement de comportement.
