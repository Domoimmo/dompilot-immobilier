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

## Pages

- `index.html` — connexion (identifiant seul, pas de mot de passe : c'est un prototype)
- `dashboard.html` — KPIs : surfaces, effectifs, contrats par type, top fournisseurs
- `patrimoine.html` — liste des sites, filtrable par catégorie/département, fiche détail
- `contrats.html` — liste des contrats, filtrable par type/fournisseur, fiche détail
- `annuaire.html` — annuaire des prestataires, filtrable par secteur/catégorie de prestation
- `parametres.html` — utilisateurs démo, réinitialisation des données, évolutions prévues

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
