---
description: Contrôle léger des conventions de Contrée + cohérence tests/doc + lancement des tests.
---

# /check-conventions

Vérification ciblée des conventions sur les changements en cours. Plus léger que `/review`.

## Déroulé

1. Lire `CLAUDE.md`.
2. Récupérer le périmètre : `git diff`, `git diff --cached`, `git status`, `git log --oneline -5`.
3. **S'il n'y a aucun changement, s'arrêter et le dire.**
4. Contrôler point par point (ci-dessous).
5. Lancer `npm test`.
6. Rapport structuré : chaque point **OK / VIOLATION / N/A** (fichier + ligne) + **verdict global**.

## Points de contrôle

- **Pureté des règles** : aucun `document`/`window`/`canvas`/`Math.random`/`Date.now`/
  `performance.now` dans `src/rules/` ; import limité à `config.js`.
- **Valeurs magiques** : toute constante (seuil, timing, bonus, probabilité, libellé lié aux
  règles) est un export nommé de `src/config.js` ; pas de littéral dupliqué.
- **Dépendances** : la flèche ne va que vers le bas (`config → rules → state → render → input/loop → main`) ; aucune logique de règle dans `render`/`input`/`loop`.
- **Hasard** : `rng` injecté, graine seulement dans `main.js` ; cosmétique laissé dans `render/`.
- **État** : passe par `G` ; règles recevant `R`/contexte en argument.
- **Cohérence tests/doc** :
  - une règle modifiée s'accompagne d'un test macro dans `tests/` ;
  - si une règle **visible** change, le panneau `#sheet` d'`index.html` (et `README.md` /
    `CLAUDE.md` si besoin) est mis à jour.
- **Langue** : commentaires et textes en français.

## Verdict

**APPROUVÉ** ou **À CORRIGER** avec la liste des points en violation.
