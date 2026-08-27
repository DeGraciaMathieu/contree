---
description: Revue complète des changements en cours de Contrée — conventions, tests, maintenabilité, cohérence système.
---

# /review

Revue approfondie des modifications non validées. Ne rien réécrire : produire un diagnostic.

## Déroulé

1. Lire `CLAUDE.md` (conventions et architecture de référence).
2. Récupérer le périmètre :
   - `git diff` (non indexé), `git diff --cached` (indexé), `git status`, `git log --oneline -5`.
   - Charger les skills utiles selon les fichiers touchés (`architecture`, `scoring`,
     `board-geometry`, `deck`, `testing`).
3. **S'il n'y a aucun changement, s'arrêter et le dire.**
4. Contrôler point par point (ci-dessous).
5. Lancer `npm test`.
6. Rendre un rapport structuré : chaque point noté **OK / VIOLATION / N/A** avec fichier et
   ligne, puis un **verdict global**.

## Points de contrôle

### Conventions (`CLAUDE.md`)
- Aucun `document`/`window`/`canvas`/`Math.random`/`Date.now`/`performance.now` dans `src/rules/`.
- Aucune valeur magique hors `config.js` (y compris un seuil affiché qui devrait référencer
  une constante existante).
- Flèche de dépendance respectée (`rules` n'importe que `config` ; pas de règle dans
  `render`/`input`/`loop`).
- Hasard injecté (`rng` en argument), graine décidée seulement dans `main.js` ; hasard
  cosmétique laissé dans `render/`.
- État mutable passant par `G` ; règles pures recevant `R`/contexte en argument.

### Couverture de tests
- Toute règle ajoutée ou modifiée dans `src/rules/` a un test macro dans `tests/`.
- Les tests énoncent un comportement de jeu, pas un détail d'implémentation.
- `npm test` est vert.

### Maintenabilité
- Couplage et responsabilité unique par module/fonction.
- Duplication (logique recopiée au lieu d'être réutilisée).
- Longueur/complexité des fonctions, nommage clair, absence de valeurs magiques.

### Cohérence système
- Intégration correcte avec l'existant (score, objectifs, commandes, formats, annulation).
- Forme de l'état/données conforme (`{terrain, cmd, done, rare}`, clé `"q,r"`, structure de
  `score`).
- Respect des patterns établis (wrappers de `state/game.js`, procédures « Ajouter un X »).
- Documentation vivante à jour si une règle visible a changé (panneau `#sheet`).

## Verdict

Conclure par **APPROUVÉ** (aucune violation) ou **À CORRIGER** (liste des violations
priorisées).
