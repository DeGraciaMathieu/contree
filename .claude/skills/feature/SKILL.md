---
name: feature
description: Use when implementing a new feature or gameplay change in Contrée end to end — from understanding the request to green macro tests and updated documentation.
user_invocable: true
---

# Implémenter une fonctionnalité

Fil conducteur : **comprendre → implémenter dans l'architecture → tester au niveau macro →
mettre à jour la doc → résumer.** Ne jamais sauter la phase de compréhension.

## 1. Comprendre la demande

- **Reformuler** la demande avec tes mots pour vérifier l'intention.
- Invoquer le skill `architecture` pour situer le changement (quelle couche, quels fichiers).
- Poser les questions que le code ne tranche pas, notamment :
  - **valeurs numériques** : points, seuils, probabilités, timings (elles iront dans
    `config.js`) ;
  - **interactions avec l'existant** : effet sur le score, les objectifs, les commandes, les
    formats de plateau, l'annulation ;
  - **cas limites** : plateau plein, format court vs long, tuile rare, commande ratée.

Ne rien inventer : si un point reste indécis, le poser plutôt que de deviner.

## 2. Implémenter dans l'architecture

- Respecter `CLAUDE.md` : **aucune valeur magique hors `config.js`**, **aucun DOM / hasard /
  horloge dans `src/rules/`**, la flèche de dépendance ne va que vers le bas.
- Suivre le skill de domaine adapté (`scoring`, `board-geometry`, `deck`) et sa procédure
  « Ajouter un X », qui pointe les fichiers réels à toucher dans l'ordre.
- La logique de règle est pure et reçoit son contexte en argument ; l'orchestration
  (`loop/`), l'affichage (`render/`) et les entrées (`input/`) l'appellent, sans la recoder.

## 3. Tester au niveau macro

- Ajouter un test dans le `tests/<module>.test.js` concerné (skill `testing`) : un énoncé de
  comportement de joueur, pas un détail d'implémentation. Graine fixe pour tout tirage.
- `npm test` jusqu'au vert. Si une approche échoue deux fois, revoir le plan avant d'insister.

## 4. Mettre à jour la documentation si le périmètre a bougé

- Panneau de règles `#sheet` d'`index.html` (documentation vivante) si une règle visible
  change — un hook vérifie cette cohérence.
- `README.md`, `CLAUDE.md`, et les skills concernés si un module ou une convention change.
- `docs/decisions.md` pour toute question restée ouverte.

## 5. Résumer

Lister : fichiers modifiés, tests ajoutés, résultat de la suite, et toute question ouverte.
