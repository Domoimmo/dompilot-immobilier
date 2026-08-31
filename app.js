/* =========================================================================
   DOMPILOT — Pôle Immobilier
   Moteur commun : modèle de données, authentification, persistance,
   layout (sidebar / topbar) partagé par toutes les pages.

   Persistance : localStorage par défaut.
   Un point d'extension "GitHub Sync" est prévu (voir syncWithGitHub) pour
   reproduire le pattern utilisé par GESTOCK : commit d'un data.json dans le
   repo via l'API GitHub (Contents API) avec un Personal Access Token.
   ========================================================================= */

const DP_STORAGE_KEY = "dompilot_data_v1";
const DP_SESSION_KEY = "dompilot_session_v1";

/* ---------------------------------------------------------------------
   1) DONNÉES DE DÉMARRAGE (seed) — remplacées dès que l'utilisateur
   modifie quoi que ce soit, et persistées en localStorage.
   --------------------------------------------------------------------- */
const DP_SEED = {
  // passwordHash/salt = null tant que l'utilisateur n'a pas fait sa "première connexion"
  // (choix de son mot de passe personnel). Voir dpHashPassword / dpGenSalt plus bas.
  utilisateurs: [
    { id: "u1", nom: "Directeur du Développement", identifiant: "j.moreau", role: "Direction", passwordHash: null, salt: null },
    { id: "u2", nom: "Responsable de programmes", identifiant: "s.lefevre", role: "Chargé d'opérations", passwordHash: null, salt: null },
    { id: "u3", nom: "Chargée de développement foncier", identifiant: "c.dubois", role: "Développement", passwordHash: null, salt: null },
    { id: "u4", nom: "Marie Blain", identifiant: "mblain", role: "Chargé d'opérations",
      passwordHash: "4972461b078710060a97d6525d7bec4ea5afdefa4985dbc845531eb90bf28411",
      salt: "a495f1a9556f5a78637565824c3f8eb6" }
  ],

  territoires: ["Bordeaux Métropole", "Bassin d'Arcachon", "Libournais", "Sud Gironde", "Landes"],

  typesOperation: ["Construction neuve", "Acquisition-amélioration", "Réhabilitation", "Démolition"],
  naturesProduit: ["Logement social (PLUS/PLAI)", "Accession sociale", "Locatif intermédiaire (LLI)", "Tertiaire"],

  phases: ["Développement", "Montage", "Travaux", "Livraison", "Clôturé"],

  jalonsTypes: [
    "Signature foncière", "Dépôt PC", "Obtention PC purgé", "Consultation entreprises",
    "Ordre de service travaux", "Livraison"
  ],

  /* --- Pipeline développement (module "Développement") --- */
  opportunites: [
    {
      id: "op1", nom: "Îlot Belcier — friche SNCF", commune: "Bordeaux", territoire: "Bordeaux Métropole",
      statut: "En cours", potentielLogements: 84, contact: "SNCF Immobilier", dateProspection: "2026-03-12",
      note: "Foncier maîtrisé à confirmer, étude de sol en cours."
    },
    {
      id: "op2", nom: "Ancien site EDF", commune: "Cenon", territoire: "Bordeaux Métropole",
      statut: "À signer", potentielLogements: 46, contact: "Ville de Cenon", dateProspection: "2026-01-20",
      note: "Compromis en cours de rédaction avec le notaire."
    },
    {
      id: "op3", nom: "Cœur de bourg", commune: "Langon", territoire: "Sud Gironde",
      statut: "Signé", potentielLogements: 28, contact: "Mairie de Langon", dateProspection: "2025-11-05",
      note: "Acte signé, passage en montage prévu."
    },
    {
      id: "op4", nom: "Résidence Les Tilleuls — extension", commune: "Mérignac", territoire: "Bordeaux Métropole",
      statut: "Transmis MO", potentielLogements: 32, contact: "Interne", dateProspection: "2025-09-14",
      note: "Dossier transmis à la maîtrise d'ouvrage pour instruction."
    },
    {
      id: "op5", nom: "Terrain La Teste-de-Buch", commune: "La Teste-de-Buch", territoire: "Bassin d'Arcachon",
      statut: "Sans suite", potentielLogements: 18, contact: "Propriétaire privé", dateProspection: "2025-08-02",
      note: "Prix de sortie incompatible avec l'équilibre PLAI/PLUS."
    }
  ],

  /* --- Opérations en cours (module "Suivi projet") --- */
  operations: [
    {
      id: "pr1", nom: "Résidence Les Lauriers", commune: "Pessac", territoire: "Bordeaux Métropole",
      typeOperation: "Construction neuve", natureProduit: "Logement social (PLUS/PLAI)",
      phase: "Travaux", responsable: "s.lefevre", nbLogements: 58,
      budgetPrevisionnel: 8900000, budgetEngage: 6200000,
      dateSignatureFoncier: "2024-06-10", dateLivraisonPrevue: "2027-02-28",
      jalons: [
        { libelle: "Signature foncière", date: "2024-06-10", statut: "fait" },
        { libelle: "Dépôt PC", date: "2024-09-15", statut: "fait" },
        { libelle: "Obtention PC purgé", date: "2025-02-20", statut: "fait" },
        { libelle: "Consultation entreprises", date: "2025-05-10", statut: "fait" },
        { libelle: "Ordre de service travaux", date: "2025-09-01", statut: "fait" },
        { libelle: "Livraison", date: "2027-02-28", statut: "encours" }
      ],
      taches: [
        { titre: "Relance lot gros-œuvre — retard planning", echeance: "2026-09-05", fait: false },
        { titre: "Réunion de chantier mensuelle", echeance: "2026-09-10", fait: false }
      ],
      comptesRendus: [
        { date: "2026-08-20", auteur: "s.lefevre", texte: "Retard de 3 semaines sur le gros-œuvre, plan de rattrapage demandé à l'entreprise." }
      ]
    },
    {
      id: "pr2", nom: "Cœur de bourg Langon", commune: "Langon", territoire: "Sud Gironde",
      typeOperation: "Construction neuve", natureProduit: "Accession sociale",
      phase: "Montage", responsable: "c.dubois", nbLogements: 28,
      budgetPrevisionnel: 4100000, budgetEngage: 480000,
      dateSignatureFoncier: "2025-11-05", dateLivraisonPrevue: "2028-06-30",
      jalons: [
        { libelle: "Signature foncière", date: "2025-11-05", statut: "fait" },
        { libelle: "Dépôt PC", date: "2026-10-15", statut: "encours" },
        { libelle: "Obtention PC purgé", date: "2027-03-01", statut: "attente" },
        { libelle: "Consultation entreprises", date: "2027-06-01", statut: "attente" },
        { libelle: "Ordre de service travaux", date: "2027-09-01", statut: "attente" },
        { libelle: "Livraison", date: "2028-06-30", statut: "attente" }
      ],
      taches: [
        { titre: "Finaliser étude géotechnique G2", echeance: "2026-09-20", fait: false },
        { titre: "Passage en comité d'engagement", echeance: "2026-10-02", fait: false }
      ],
      comptesRendus: []
    },
    {
      id: "pr3", nom: "Résidence Bel Air — réhabilitation", commune: "Talence", territoire: "Bordeaux Métropole",
      typeOperation: "Réhabilitation", natureProduit: "Logement social (PLUS/PLAI)",
      phase: "Livraison", responsable: "s.lefevre", nbLogements: 40,
      budgetPrevisionnel: 3200000, budgetEngage: 3050000,
      dateSignatureFoncier: "2023-02-01", dateLivraisonPrevue: "2026-10-15",
      jalons: [
        { libelle: "Signature foncière", date: "2023-02-01", statut: "fait" },
        { libelle: "Dépôt PC", date: "2023-06-01", statut: "fait" },
        { libelle: "Obtention PC purgé", date: "2023-10-01", statut: "fait" },
        { libelle: "Consultation entreprises", date: "2024-01-15", statut: "fait" },
        { libelle: "Ordre de service travaux", date: "2024-05-01", statut: "fait" },
        { libelle: "Livraison", date: "2026-10-15", statut: "encours" }
      ],
      taches: [
        { titre: "Préparer dossier de fin de travaux (DOE)", echeance: "2026-09-30", fait: false }
      ],
      comptesRendus: [
        { date: "2026-08-15", auteur: "s.lefevre", texte: "Levée des dernières réserves en cours, livraison confirmée mi-octobre." }
      ]
    },
    {
      id: "pr4", nom: "Îlot Belcier", commune: "Bordeaux", territoire: "Bordeaux Métropole",
      typeOperation: "Construction neuve", natureProduit: "Locatif intermédiaire (LLI)",
      phase: "Développement", responsable: "c.dubois", nbLogements: 84,
      budgetPrevisionnel: 14500000, budgetEngage: 90000,
      dateSignatureFoncier: "", dateLivraisonPrevue: "2029-12-31",
      jalons: [
        { libelle: "Signature foncière", date: "", statut: "attente" },
        { libelle: "Dépôt PC", date: "", statut: "attente" }
      ],
      taches: [
        { titre: "Finaliser négociation foncière avec SNCF Immobilier", echeance: "2026-10-01", fait: false }
      ],
      comptesRendus: []
    }
  ],

  postesBudget: [
    "Charge foncière", "Frais notariés", "Études (géotech, sols, diag)", "Honoraires MOE",
    "Travaux VRD", "Travaux bâtiment", "Aléas / imprévus", "Frais de gestion / commercialisation"
  ]
};

/* ---------------------------------------------------------------------
   2) PERSISTANCE
   --------------------------------------------------------------------- */
function dpLoadData() {
  const raw = localStorage.getItem(DP_STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fallthrough to seed */ }
  }
  dpSaveData(DP_SEED);
  return JSON.parse(JSON.stringify(DP_SEED));
}

function dpSaveData(data) {
  localStorage.setItem(DP_STORAGE_KEY, JSON.stringify(data));
}

let DP = dpLoadData();

function dpPersist() {
  dpSaveData(DP);
  dpMarkDirtyForSync();
}

/* ---------------------------------------------------------------------
   3) SYNCHRONISATION GITHUB — ARCHITECTURE À DEUX DÉPÔTS
   - Dépôt PUBLIC : héberge ce code (index.html, *.html, style.css, app.js)
     via GitHub Pages. Aucune donnée sensible n'y transite.
   - Dépôt PRIVÉ : contient uniquement data.json (les données réelles :
     opérations, budgets, comptes rendus...). L'app y lit/écrit via
     l'API GitHub Contents, à l'aide d'un token dédié à CE dépôt privé.
   Configuration faite depuis la page Paramètres → stockée en localStorage
   (donc côté navigateur — voir avertissement de sécurité dans Paramètres).
   --------------------------------------------------------------------- */
function dpMarkDirtyForSync() {
  const cfg = dpGetGithubConfig();
  const el = document.getElementById("github-sync-status");
  if (el) el.textContent = cfg && cfg.token ? `Connecté au dépôt privé (${cfg.owner}/${cfg.repo})` : "Mode local (dépôt de données non connecté)";
}

function dpGetGithubConfig() {
  try { return JSON.parse(localStorage.getItem("dompilot_github_data_cfg") || "null"); }
  catch (e) { return null; }
}

function dpSaveGithubConfig(cfg) {
  localStorage.setItem("dompilot_github_data_cfg", JSON.stringify(cfg));
}

// Charge les données depuis le dépôt PRIVÉ (appelé au démarrage si configuré).
async function dpLoadFromGitHub() {
  const cfg = dpGetGithubConfig();
  if (!cfg || !cfg.token || !cfg.owner || !cfg.repo) return false;
  try {
    const path = cfg.path || "data.json";
    const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    const resp = await fetch(apiUrl, { headers: { Authorization: `token ${cfg.token}`, Accept: "application/vnd.github.v3+json" } });
    if (!resp.ok) return false;
    const j = await resp.json();
    const jsonText = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ""))));
    DP = JSON.parse(jsonText);
    dpSaveData(DP); // cache local pour un accès hors-ligne
    return true;
  } catch (err) {
    console.error("Échec du chargement depuis le dépôt privé", err);
    return false;
  }
}

// Écrit les données courantes vers le dépôt PRIVÉ.
async function dpSyncWithGitHub() {
  const cfg = dpGetGithubConfig();
  const statusEl = document.getElementById("github-sync-status");
  if (!cfg || !cfg.token || !cfg.owner || !cfg.repo) {
    if (statusEl) statusEl.textContent = "Configurez le dépôt de données dans Paramètres";
    return;
  }
  if (statusEl) statusEl.textContent = "Synchronisation…";
  try {
    const path = cfg.path || "data.json";
    const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    let sha = null;
    const getResp = await fetch(apiUrl, { headers: { Authorization: `token ${cfg.token}` } });
    if (getResp.ok) { const j = await getResp.json(); sha = j.sha; }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(DP, null, 2))));
    const putResp = await fetch(apiUrl, {
      method: "PUT",
      headers: { Authorization: `token ${cfg.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `DomPilot: mise à jour des données — ${new Date().toISOString()}`,
        content, sha: sha || undefined
      })
    });
    if (!putResp.ok) throw new Error("Échec de l'écriture GitHub");
    if (statusEl) statusEl.textContent = `Synchronisé avec ${cfg.owner}/${cfg.repo} ✓`;
  } catch (err) {
    if (statusEl) statusEl.textContent = "Erreur de synchronisation";
    console.error(err);
  }
}

/* ---------------------------------------------------------------------
   4) AUTHENTIFICATION — mots de passe hashés (même esprit que GESTOCK :
   "première connexion" pour choisir son mot de passe personnel).

   IMPORTANT — nature de la sécurité obtenue : l'app étant 100% statique
   (pas de serveur), le hash est calculé et vérifié CÔTÉ NAVIGATEUR. Cela
   évite de stocker les mots de passe en clair dans le dépôt privé, mais
   ne protège pas contre quelqu'un qui aurait un accès en lecture au
   dépôt privé ET les ressources pour attaquer les hashes hors-ligne.
   Pour une sécurité de niveau production, prévoir à terme un vrai
   backend d'authentification.
   --------------------------------------------------------------------- */
function dpGenSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function dpHashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(salt + ":" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function dpGetSession() {
  try { return JSON.parse(sessionStorage.getItem(DP_SESSION_KEY) || "null"); }
  catch (e) { return null; }
}
function dpSetSession(user) {
  sessionStorage.setItem(DP_SESSION_KEY, JSON.stringify(user));
}
function dpLogout() {
  sessionStorage.removeItem(DP_SESSION_KEY);
  window.location.href = "index.html";
}
function dpRequireAuth() {
  const session = dpGetSession();
  if (!session) { window.location.href = "index.html"; return null; }
  return session;
}

/* ---------------------------------------------------------------------
   5) UTILITAIRES
   --------------------------------------------------------------------- */
function dpUid(prefix) { return prefix + "_" + Math.random().toString(36).slice(2, 9); }

function dpFormatEUR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function dpFormatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function dpUserName(identifiant) {
  const u = DP.utilisateurs.find(u => u.identifiant === identifiant);
  return u ? u.nom : identifiant;
}
function dpPhaseBadgeClass(phase) {
  return {
    "Développement": "badge-gris",
    "Montage": "badge-bleu",
    "Travaux": "badge-orange",
    "Livraison": "badge-vert",
    "Clôturé": "badge-vert"
  }[phase] || "badge-gris";
}
function dpStatutOppBadgeClass(statut) {
  return {
    "En cours": "badge-bleu",
    "À signer": "badge-orange",
    "Signé": "badge-vert",
    "Transmis MO": "badge-vert",
    "Sans suite": "badge-rouge"
  }[statut] || "badge-gris";
}

/* ---------------------------------------------------------------------
   6) LAYOUT PARTAGÉ (sidebar + topbar)
   --------------------------------------------------------------------- */
const DP_NAV = [
  { href: "dashboard.html", icon: "📊", label: "Tableau de bord", key: "dashboard" },
  { href: "developpement.html", icon: "🧭", label: "Développement", key: "developpement" },
  { href: "operations.html", icon: "🏗", label: "Opérations", key: "operations" },
  { href: "parametres.html", icon: "⚙", label: "Paramètres", key: "parametres" }
];

function dpRenderShell(activeKey, pageTitle, pageSubtitle) {
  const session = dpRequireAuth();
  if (!session) return null;

  // Si un dépôt privé est configuré, on tente un rafraîchissement des
  // données en arrière-plan avant d'afficher (le rendu initial utilise
  // d'abord le cache local pour un affichage instantané).
  if (dpGetGithubConfig()) {
    dpLoadFromGitHub().then(ok => { if (ok && typeof render === "function") render(); });
  }

  document.body.classList.add("has-shell");
  const shell = document.createElement("div");
  shell.className = "app-shell";

  const navHtml = DP_NAV.map(item => `
    <a class="nav-link ${item.key === activeKey ? "active" : ""}" href="${item.href}">
      <span class="ico">${item.icon}</span><span>${item.label}</span>
    </a>`).join("");

  shell.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="logo-mark">DP</div>
        <div class="brand-text"><strong>DomPilot</strong><span>Pôle Immobilier</span></div>
      </div>
      <div class="nav-group">
        <div class="nav-label">Navigation</div>
        ${navHtml}
      </div>
      <div class="sidebar-footer">
        <div id="github-sync-status">Mode local (non connecté à GitHub)</div>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div>
          <h1>${pageTitle}</h1>
          ${pageSubtitle ? `<div class="topbar-sub">${pageSubtitle}</div>` : ""}
        </div>
        <div class="topbar-right">
          <button class="btn btn-outline btn-sm" onclick="dpSyncWithGitHub()">⇅ Synchroniser</button>
          <div class="user-chip">
            <div class="avatar">${session.nom.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}</div>
            <span>${session.nom}</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="dpLogout()">Déconnexion</button>
        </div>
      </div>
      <div class="content" id="dp-content"></div>
    </div>
  `;
  document.body.innerHTML = "";
  document.body.appendChild(shell);
  dpMarkDirtyForSync();
  return document.getElementById("dp-content");
}
