# DomPilot — Pôle Immobilier

Application de pilotage des opérations immobilières, construite sur le même modèle technique que **GESTOCK** et **DomAlerte** (HTML/CSS/JS statique, hébergement GitHub Pages), et inspirée des modules de **WIP by Cellance** (pilotage d'opérations pour maîtres d'ouvrage : promoteurs, bailleurs sociaux).

## Modules

| Module | Page | Équivalent WIP |
|---|---|---|
| Connexion | `index.html` | — |
| Tableau de bord | `dashboard.html` | Analyse (reporting global) |
| Développement | `developpement.html` | Développement (pipeline d'opportunités, vue kanban) |
| Opérations (liste) | `operations.html` | Suivi projet (portefeuille) |
| Fiche opération | `operation.html?id=...` | Suivi projet (fiche détaillée : infos, planning/jalons, budget, tâches/CR) |
| Paramètres | `parametres.html` | Administration + connexion GitHub |

## Fonctionnement actuel (V1 — prototype fonctionnel)

- **Données** : un jeu de démonstration est chargé au premier lancement et stocké dans le `localStorage` du navigateur. Toute modification (création/édition d'opportunité, d'opération, de jalon, de tâche, de compte rendu, de budget) est persistée automatiquement.
- **Authentification** : simplifiée (démo), à connecter à un vrai système (SSO / Azure AD Domofrance) lors du passage en production.
- **Synchronisation GitHub** : la page *Paramètres* permet de renseigner un `owner`/`repo`/`token` pour committer les données (`data.json`) dans un repo GitHub via l'API Contents, exactement comme le fait GESTOCK. Tant que ce n'est pas configuré, l'app fonctionne en local uniquement.

## Déploiement (identique à GESTOCK / DomAlerte)

1. Créer un repo GitHub (ex. `dompilot-immobilier`).
2. Y déposer tous les fichiers de ce dossier (`index.html`, `dashboard.html`, `developpement.html`, `operations.html`, `operation.html`, `parametres.html`, `style.css`, `app.js`).
3. Activer **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / racine).
4. L'app est accessible à `https://<org>.github.io/<repo>/index.html`.

## Pistes d'évolution

- **Suivi financier détaillé par poste** (charge foncière, honoraires MOE, travaux…) avec comparatif prévisionnel/réalisé — actuellement affiché à titre indicatif, à raccorder à une saisie ligne à ligne comme le module *Suivi financier* de WIP.
- **Export Excel / reporting personnalisé** (comme GESTOCK).
- **Vue Gantt** pour le planning d'opération (actuellement une timeline verticale des jalons).
- **Gestion documentaire** (pièces jointes par opération).
- **Droits d'accès par territoire / rôle**.
- **Vraie synchronisation GitHub multi-utilisateurs** : actuellement en dernier-écrit-gagne (comme un simple commit) — à surveiller si plusieurs personnes éditent en même temps.

## Modèle de données (résumé)

Voir `app.js` → `DP_SEED` pour le détail complet : `utilisateurs`, `territoires`, `typesOperation`, `naturesProduit`, `phases`, `opportunites` (pipeline développement), `operations` (portefeuille, avec `jalons`, `taches`, `comptesRendus`), `postesBudget`.
