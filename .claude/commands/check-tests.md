---
description: Analyse la couverture de tests de Contrée, propose les tests macro manquants, attend l'accord avant de les écrire, puis relance la suite.
---

# /check-tests

Vérifie que les règles touchées sont couvertes par des tests macro, propose ce qui manque,
puis (après accord) l'écrit et relance la suite.

## Déroulé

1. Lire `CLAUDE.md` et le skill `testing`.
2. Récupérer le périmètre : `git diff`, `git diff --cached`, `git status`, `git log --oneline -5`.
3. **S'il n'y a aucun changement, s'arrêter et le dire.**
4. Analyser la couverture point par point (ci-dessous).
5. Lancer `npm test` pour connaître l'état actuel.
6. Rapport : chaque règle touchée notée **COUVERTE / À COUVRIR / N/A**.
7. **Proposer** la liste des tests macro manquants (intitulé + comportement visé + fichier
   `tests/…` cible), puis **s'arrêter et attendre l'accord de l'utilisateur avant d'écrire
   quoi que ce soit.**
8. Après accord : écrire les tests, puis relancer `npm test` jusqu'au vert.

## Analyse de couverture

- Chaque règle ajoutée/modifiée dans `src/rules/` a-t-elle un test dans le
  `tests/<module>.test.js` correspondant ?
- Les cas limites qui justifient la règle sont-ils testés (format court/long, plateau plein,
  tuile rare, commande ratée, pont, traversée) ?
- Les tirages sont-ils testés avec une graine fixe (déterminisme) ?
- Les tests énoncent-ils un comportement de joueur plutôt qu'un détail d'implémentation ?

## Rappels

- Ne tester que la couche pure `src/rules/` ; `render`/`input`/`loop` ne sont pas couverts.
- Construire l'état avec un petit littéral explicite, sans helper masquant la mise en place.
- Ne rien écrire avant l'accord ; terminer sur une suite verte.
