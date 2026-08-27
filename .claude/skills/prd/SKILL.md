---
name: prd
description: Use when writing a specification (PRD) for a Contrée feature before any implementation — explore the code for the technical baseline, ask only the product decisions, then write the document.
user_invocable: true
---

# Rédiger un PRD

Ce skill **n'implémente rien** : il produit un document de spécification. Explorer d'abord
le code pour établir la base technique, puis ne poser au demandeur que les décisions
**produit** (pas les détails techniques déductibles du code).

## Démarche

1. **Explorer** le code réel (invoquer `architecture`, `scoring`, `board-geometry`, `deck`
   selon le sujet) pour remplir la base technique : quels modules et fonctions sont
   concernés, quelles constantes de `config.js`, quelles règles pures existent déjà.
2. **Demander uniquement les décisions produit** : quel comportement de jeu, quelles valeurs
   (points, seuils, probabilités), quelles interactions voulues, quel périmètre exclu. Ne
   jamais deviner une valeur de règle — la demander ou la marquer en question ouverte.
3. **Écrire le PRD** dans le format fixe ci-dessous.

## Format du PRD

```
# PRD — <titre>

## Objectif
<le résultat de jeu visé, en une ou deux phrases>

## Base technique
<modules, fonctions et constantes existants concernés (fichiers réels) ; ce sur quoi on s'appuie>

## Comportement
<règles précises, valeurs chiffrées, cas nominal et cas limites (format court/long, plateau plein, tuile rare, commande ratée)>

## Hors périmètre
<ce que cette fonctionnalité ne fait pas>

## Impact par couche
| Couche | Changement attendu |
| --- | --- |
| config | <nouvelles constantes> |
| rules | <règles pures à ajouter/modifier> |
| state | <impact sur G / persistance> |
| render | <affichage / motif / panneau> |
| input | <interactions> |
| loop | <orchestration> |

## Critères d'acceptation
<liste vérifiable de ce qui doit être vrai une fois fait>

## Tests
<tests macro à écrire, par fichier tests/…>

## Risques et questions ouvertes
<ce que le code ne tranche pas et qui n'a pas été décidé>
```

Rester en français, cohérent avec le vocabulaire du jeu (skill `scoring` pour la
terminologie). Le PRD pointe des fichiers et fonctions réels, jamais des notions importées
d'un autre projet.
