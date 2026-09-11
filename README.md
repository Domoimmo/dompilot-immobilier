# DomPatrimoine — Services Généraux

Application de gestion du patrimoine tertiaire pour le pôle Services Généraux, construite sur le
même modèle technique que **GESTOCK**, **DomAlerte** et l'ancien **DomPilot** (HTML/CSS/JS statique,
hébergement GitHub Pages, persistance via l'API GitHub Contents).

**Ce dépôt remplace l'ancien contenu de DomPilot** (pôle immobilier, non utilisé) : même dépôt public
`Domoimmo/dompilot-immobilier`, nouveau périmètre fonctionnel.

## Architecture à deux dépôts

- **Dépôt public** (`Domoimmo/dompilot-immobilier`) : héberge ce code via GitHub Pages.
- **Dépôt privé** (`Domoimmo/dompilot-immobilier-data`) : contient uniquement `data.json`
  (sites, contrats, annuaire, utilisateurs). Configuré depuis la page *Paramètres* avec un
  token dédié (fine-grained, droits Contents: Read/write sur ce seul dépôt).

## Origine des données

Les jeux de données affichés sont extraits des fichiers fournis :

| Module | Fichier source | Volume |
|---|---|---|
| Patrimoine | `surface_locaux_administratif.xlsx` | 19 sites (agences + logements de fonction) |
| Contrats | `CONTRATS.xlsx` | 189 contrats de fonctionnement |
| Annuaire prestataires | `ANNUAIRE_BORDEAUX_AGEN_PAU_2.xlsx` | 107 contacts, Bordeaux/Agen/Pau-Bayonne |

Deux fichiers n'ont pas été repris :
- **Template_Camileia_à_compléter.xlsx** — c'est un modèle d'import vide (2 lignes d'exemple), destiné
  à l'outil Camileia lui-même. Son référentiel patrimoine (sites/bâtiments/niveaux/espaces/équipements)
  est une piste d'évolution si vous voulez descendre au niveau du bâtiment/local plutôt que du site.
- **Liste_fournisseurs_actifs_au_02102023.xlsx** — export brut du grand livre comptable ERP
  (6216 lignes, format technique). À reprendre séparément si un besoin précis se dessine (ex. réconcilier
  fournisseurs comptables et fournisseurs de l'annuaire).

## Authentification

Connexion par identifiant + mot de passe (SHA-256 + sel, calculé côté navigateur — même schéma que
DomPilot/GESTOCK). Un utilisateur sans mot de passe défini passe automatiquement par un écran
"Première connexion" où il choisit son propre mot de passe. Les admins peuvent créer des comptes et
réinitialiser des mots de passe depuis Paramètres.

## Connexion à la base de données (GitHub)

Le dépôt privé (`Domoimmo/dompilot-immobilier-data`) est **fixé dans le code** — plus besoin de
ressaisir owner/repo/chemin. Il suffit de coller un **Personal Access Token** une fois par appareil
dans Paramètres ; l'app s'y connecte ensuite automatiquement à chaque visite (comme GESTOCK).

## Pages

- `index.html` — connexion (identifiant + mot de passe, écran de première connexion)
- `dashboard.html` — KPIs, alertes d'échéances de contrats, contrats par type, top fournisseurs
- `patrimoine.html` — sites : liste, filtres, **création/édition/suppression**
- `carte.html` — localisation des sites (Leaflet + OpenStreetMap/Nominatim)
- `amenagement.html` — chantiers/travaux d'aménagement : liste + fiche détail avec **planning Gantt** par étape et corps de métier (inspiré de WIP by Cellance)
- `contrats.html` — contrats : liste, filtres (dont échéance et site), **création/édition/suppression**, rattachement à un site
- `annuaire.html` — prestataires : liste, filtres, **création/édition/suppression**
- `parametres.html` — token GitHub, mon compte, gestion des utilisateurs (admin), réinitialisation des données

## Aménagement immobilier

Chaque chantier (`amenagements`) est rattaché à un site et regroupe une liste d'étapes, chacune avec
un corps de métier (gros œuvre, électricité, peinture...), des dates de début/fin, un statut (à venir /
en cours / terminé / retard) et un avancement en %. La fiche détail affiche un planning Gantt calculé
automatiquement à partir des dates des étapes (échelle mensuelle, barres colorées par statut, clic pour
éditer). L'avancement global du chantier est la moyenne de l'avancement de ses étapes.

## Échéances de contrats

Le fichier source (`CONTRATS.xlsx`) ne contenait pas de date de fin de contrat. Un champ
`dateEcheance` a été ajouté (vide par défaut) : à renseigner manuellement depuis la fiche contrat.
Une fois renseignée, elle alimente :
- le badge d'échéance dans la liste des contrats (vert = à jour, orange = &le; 60 jours, rouge = échu),
- le filtre "Échéance",
- la carte "Contrats à échéance proche ou dépassée" du tableau de bord.

## Édition des données

Chaque module (Patrimoine, Contrats, Annuaire) permet désormais de **créer, modifier et supprimer**
des enregistrements directement depuis l'app (bouton "+ Nouveau..." et clic sur une ligne). Les
modifications sont persistées dans le `localStorage` du navigateur, et **synchronisées automatiquement
sur GitHub** si un dépôt de données est configuré dans Paramètres (sinon elles restent locales).

## Comptes de démonstration

`s.moreau` (admin) ou `t.dupuis` — identifiant seul, sans mot de passe.

## Pour tester en local

Ouvrir `index.html` dans un navigateur (ou servir le dossier avec un petit serveur statique,
ex. `python3 -m http.server`, pour éviter les restrictions de certains navigateurs sur les fichiers
locaux).

## Quand vous voudrez déployer

Le même pattern que DomPilot s'applique directement : dépôt public (code) + dépôt privé (`data.json`)
sur GitHub Pages, synchronisation via un token à portée fine (Contents: Read/write) configuré depuis
Paramètres. Dites-le-moi quand vous voudrez passer à cette étape.
