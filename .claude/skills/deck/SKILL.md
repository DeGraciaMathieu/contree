---
name: deck
description: Use when working on tile drawing in Contrée — weighted terrain draws, rare tiles, commands on tiles, initial seeds — or on the seeded RNG. Also when adding a new terrain or rare tile.
auto_invoke: true
---

# Pioche et hasard

La pioche est **pure** dans `src/rules/deck.js` : le hasard arrive par un générateur `rng`
injecté, jamais par `Math.random`. Le générateur seedé est `createRng(seed)`
(`src/rules/rng.js`, LCG déterministe).

## Fonctions (`src/rules/deck.js`)

| Fonction | Rôle | Constantes (`config.js`) |
| --- | --- | --- |
| `drawTerrain(rng)` | tire un terrain selon des poids | `WEIGHTS` |
| `drawTile(rng)` | terrain + éventuelle tuile rare + éventuelle commande | `RARES`, `RARE_CHANCE`, `COMMANDS`, `CMD_CHANCE` |
| `drawHand(rng)` | trois tuiles | — |
| `seeds(rng, cells)` | amorces initiales dispersées | `SEED_COUNT`, `SEED_RING_MIN/MAX`, `SEED_SPACING`, `SEED_GUARD_MAX` |

`drawGoals(rng)` (tirage des objectifs) vit dans `src/rules/goals.js` mais suit le même
contrat d'injection.

## Contrat du hasard

- Une règle qui tire au sort **reçoit `rng` en argument**. Seul `src/main.js` décide de la
  graine (`G.rng = createRng(Date.now() >>> 0)`). Un test passe une graine fixe et obtient
  un résultat déterministe (voir `tests/deck.test.js`).
- Le hasard **cosmétique** (jitter des grains de `spawnDust`, `src/render/board.js`) reste
  dans `render/` et n'a pas besoin de graine.
- Ne jamais appeler `Math.random` dans `src/rules/`.

Une tuile est `{terrain, cmd, done, rare}`. `cmd`/`rare` valent `null` par défaut. Une tuile
rare n'a pas de commande (voir `drawTile`).

## Ajouter un terrain

1. `src/config.js` : entrée dans `TERRAINS` (`{name, fill, dark, light}`) **et** un poids
   dans `WEIGHTS`. `drawTerrain` le tire automatiquement.
2. `src/render/board.js` : un `case` dans `motif(t, x, y, s)` pour dessiner le terrain.
3. Vérifier les règles impactées : massifs (`MASSIF_T` dans `config.js` si le terrain doit
   compter comme massif), villages, commandes — voir skill `scoring`.
4. `tests/deck.test.js` : compléter la liste des terrains connus.

## Ajouter une tuile rare

1. `src/config.js` : entrée dans `RARES` (`{on:<terrain>, name, hint}`) + éventuel bonus
   nommé (comme `MOULIN_BONUS`). `drawTile` la tire automatiquement (probabilité `RARE_CHANCE`).
2. `src/render/board.js` : un `case` dans `rareMotif(rare, x, y, s)`.
3. Son effet de règle : `rules/groups.js` (comme le pont via `waterLinks`) ou `rules/score.js`
   (comme le moulin) → skill `scoring`. Un test dans le fichier de règle concerné.
4. Ligne au panneau `#sheet` d'`index.html` si visible au joueur.
