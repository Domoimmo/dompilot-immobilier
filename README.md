# DomPilot — Pôle Immobilier

Application de pilotage des opérations immobilières, construite sur le même socle technique que **GESTOCK** et **DomAlerte** (HTML/CSS/JS statique, hébergement GitHub Pages), et inspirée des modules de **WIP by Cellance** (pilotage d'opérations pour maîtres d'ouvrage : promoteurs, bailleurs sociaux).

## Modules

| Module | Page | Équivalent WIP |
|---|---|---|
| Connexion | `index.html` | — |
| Tableau de bord | `dashboard.html` | Analyse (reporting global) |
| Développement | `developpement.html` | Développement (pipeline d'opportunités, vue kanban) |
| Opérations (liste) | `operations.html` | Suivi projet (portefeuille) |
| Fiche opération | `operation.html?id=...` | Suivi projet (fiche détaillée : infos, planning/jalons, budget, tâches/CR) |
| Carte | `carte.html` | Cartographie patrimoniale (Camileia) — via Leaflet.js + OpenStreetMap, gratuit |
| Paramètres | `parametres.html` | Administration + connexion GitHub |

## Fonctionnement

- **Données** : la base démarre vide (aucune opération/opportunité fictive). Toute création (opportunité, opération, jalon, tâche, compte rendu, budget) est saisie par l'équipe et persistée automatiquement.
- **Authentification** : comptes réels avec mots de passe hashés (SHA-256 + sel, calculé côté navigateur) — voir « Sécurité » ci-dessous. Un compte administrateur (Marie Blain) peut ajouter/retirer des utilisateurs et gérer les droits admin depuis Paramètres.
- **Synchronisation GitHub** : la page *Paramètres* permet de renseigner un `owner`/`repo`/`token` pour committer les données (`data.json`) dans le dépôt privé via l'API Contents. Tant que ce n'est pas configuré sur un poste donné, cet utilisateur travaille en local uniquement sur ce poste.

## Sécurité — à relire avant un usage étendu

DomPilot est une application 100% statique (aucun serveur applicatif). Conséquences :
- Les mots de passe sont hashés (jamais stockés en clair), mais la vérification se fait côté
  navigateur : quelqu'un ayant un accès en lecture au dépôt privé pourrait tenter une attaque
  hors-ligne sur les hashes. Utilisez des mots de passe robustes.
- Le token GitHub de synchronisation est stocké dans le `localStorage` du navigateur de chaque
  utilisateur. Chaque personne doit avoir **son propre token fine-grained**, limité au seul dépôt
  privé, permission Contents: Read/write, avec une expiration courte à renouveler.
- Pour un usage à plus grande échelle ou des données très sensibles, prévoir à terme un vrai
  backend d'authentification (SSO / Azure AD Domofrance) plutôt que ce mécanisme client-only.

## Cartographie

La page *Carte* utilise **Leaflet.js + OpenStreetMap**, entièrement gratuit et sans clé API
(contrairement à Google Maps). Chaque opération peut être géolocalisée manuellement (latitude/
longitude) ou automatiquement via le bouton « Localiser automatiquement depuis la commune », qui
interroge l'API de géocodage gratuite **Nominatim** (OpenStreetMap). Nominatim impose une limite
d'usage raisonnable (~1 requête/seconde, pas d'automatisation massive) — largement suffisant pour
un usage manuel occasionnel comme ici. Voir sa politique d'usage :
https://operations.osmfoundation.org/policies/nominatim/

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
