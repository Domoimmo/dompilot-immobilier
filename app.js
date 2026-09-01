/* =========================================================================
   DOMPILOT — Pôle Immobilier
   Moteur commun : modèle de données, authentification, persistance,
   layout (sidebar / topbar) partagé par toutes les pages.

   Persistance : localStorage par défaut.
   Un point d'extension "GitHub Sync" est prévu (voir syncWithGitHub) pour
   reproduire le pattern utilisé par GESTOCK : commit d'un data.json dans le
   repo via l'API GitHub (Contents API) avec un Personal Access Token.
   ========================================================================= */

const DP_STORAGE_KEY = "dompilot_data_v3";
const DP_SESSION_KEY = "dompilot_session_v1";

/* ---------------------------------------------------------------------
   1) DONNÉES DE DÉMARRAGE (seed) — remplacées dès que l'utilisateur
   modifie quoi que ce soit, et persistées en localStorage.
   --------------------------------------------------------------------- */
const DP_SEED = {
  // Compte réel initial. Les autres membres de l'équipe sont à ajouter depuis
  // Paramètres (réservé aux administrateurs) : ils feront leur "première
  // connexion" pour choisir eux-mêmes leur mot de passe.
  utilisateurs: [
    { id: "u1", nom: "Marie Blain", identifiant: "mblain", role: "Chargé d'opérations", isAdmin: true,
      passwordHash: "4972461b078710060a97d6525d7bec4ea5afdefa4985dbc845531eb90bf28411",
      salt: "a495f1a9556f5a78637565824c3f8eb6" },
    { id: "u2", nom: "Léandre Brunel", identifiant: "lbrunel", role: "Chargé d'opérations", isAdmin: true,
      passwordHash: "4112b143cf286e3a8c2d104601ac0f344b31741463fa7e6405b88efd849acad9",
      salt: "3bb0ed4e72b0ed90c4fb5ac155a587e6" }
  ],

  territoires: ["Bordeaux Métropole", "Bassin d'Arcachon", "Libournais", "Sud Gironde", "Landes"],

  typesOperation: ["Construction neuve", "Acquisition-amélioration", "Restructuration / Repositionnement", "Réhabilitation", "Démolition"],
  naturesProduit: ["Bureaux", "Commerces", "Locaux d'activité / Logistique", "Mixte tertiaire"],

  // "Exploitation" = actif livré et passé en gestion locative (baux actifs, suivi de la vacance).
  // "Clôturé" = actif cédé / sorti du patrimoine suivi.
  phases: ["Développement", "Montage", "Travaux", "Livraison", "Exploitation", "Clôturé"],

  jalonsTypes: [
    "Signature foncière", "Dépôt PC", "Obtention PC purgé", "Consultation entreprises",
    "Ordre de service travaux", "Lancement commercialisation locative", "Livraison"
  ],

  typesBail: ["Bail commercial 3/6/9", "Bail professionnel", "Bail dérogatoire (< 3 ans)", "Convention d'occupation précaire"],
  indexations: ["ILAT", "ICC", "ILC"],
  statutsBail: ["Actif", "Préavis donné", "En négociation renouvellement", "Vacant"],

  /* --- Conformité réglementaire (inspiré du module Real Estate Camileia) --- */
  typesConformite: [
    "Diagnostic amiante", "Diagnostic plomb", "DPE", "Décret tertiaire (BACS)",
    "Contrôle accessibilité ERP", "Contrôle ascenseur", "Désenfumage",
    "Vérification électrique", "Registre de sécurité incendie", "Autre"
  ],
  statutsConformite: ["À jour", "À renouveler", "Non conforme"],

  /* --- Registre de risques --- */
  niveauxRisque: ["Faible", "Moyen", "Élevé"],
  statutsRisque: ["Identifié", "En traitement", "Maîtrisé"],

  /* --- Contrats de service (inspiré du module GMAO Camileia) --- */
  typesContrat: [
    "Maintenance ascenseur", "Nettoyage", "Espaces verts", "Sécurité incendie",
    "Gardiennage / Sécurité", "Assurance multirisque", "Contrôle technique / réglementaire",
    "Maintenance CVC (chauffage / climatisation)", "Autre"
  ],
  periodicitesContrat: ["Mensuel", "Trimestriel", "Annuel"],
  statutsContrat: ["Actif", "À renouveler", "Résilié"],

  /* --- Pipeline développement (module "Développement") --- */
  // Vide en version production : les opportunités réelles sont saisies depuis l'app.
  opportunites: [],

  /* --- Opérations en cours (module "Suivi projet") --- */
  // Vide en version production : les opérations réelles sont saisies depuis l'app.
  // Chaque opération peut porter un tableau `baux` une fois en phase "Exploitation"
  // (voir module "Gestion locative").
  operations: [],

  postesBudget: [
    "Charge foncière", "Frais notariés", "Études (géotech, sols, diag)", "Honoraires MOE",
    "Travaux VRD", "Travaux bâtiment", "Aléas / imprévus", "Frais de gestion / commercialisation locative"
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
    "Exploitation": "badge-vert",
    "Clôturé": "badge-gris"
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
function dpFormatSurface(m2) {
  if (m2 === null || m2 === undefined || isNaN(m2)) return "—";
  return new Intl.NumberFormat("fr-FR").format(m2) + " m²";
}
function dpStatutBailBadgeClass(statut) {
  return {
    "Actif": "badge-vert",
    "Préavis donné": "badge-rouge",
    "En négociation renouvellement": "badge-orange",
    "Vacant": "badge-gris"
  }[statut] || "badge-gris";
}
// Nombre de jours avant une échéance de bail (négatif = déjà dépassée).
function dpJoursAvantEcheance(dateEcheance) {
  if (!dateEcheance) return null;
  const diffMs = new Date(dateEcheance) - new Date();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
// Surface totale louée (baux actifs) d'une opération.
function dpSurfaceLouee(op) {
  return (op.baux || []).filter(b => b.statut !== "Vacant").reduce((s, b) => s + (b.surfaceM2 || 0), 0);
}
// Taux d'occupation (%) d'une opération en exploitation.
function dpTauxOccupation(op) {
  if (!op.surfaceLocative) return null;
  return Math.round((dpSurfaceLouee(op) / op.surfaceLocative) * 100);
}
// Loyer annuel total (baux actifs) d'une opération.
function dpLoyerAnnuelTotal(op) {
  return (op.baux || []).filter(b => b.statut !== "Vacant").reduce((s, b) => s + (b.loyerAnnuelHT || 0), 0);
}
// Taux de rendement locatif brut (%) = loyers annuels / valeur vénale.
function dpTRLB(op) {
  if (!op.valeurVenale) return null;
  return Math.round((dpLoyerAnnuelTotal(op) / op.valeurVenale) * 1000) / 10;
}
// Taux de rendement locatif net (%) = (loyers - charges non récupérables) / valeur vénale.
function dpTRLN(op) {
  if (!op.valeurVenale) return null;
  const net = dpLoyerAnnuelTotal(op) - (op.chargesNonRecuperablesAnnuelles || 0);
  return Math.round((net / op.valeurVenale) * 1000) / 10;
}
function dpStatutConformiteBadgeClass(statut) {
  return { "À jour": "badge-vert", "À renouveler": "badge-orange", "Non conforme": "badge-rouge" }[statut] || "badge-gris";
}
function dpNiveauRisqueBadgeClass(niveau) {
  return { "Faible": "badge-vert", "Moyen": "badge-orange", "Élevé": "badge-rouge" }[niveau] || "badge-gris";
}
function dpPhaseColor(phase) {
  return {
    "Développement": "#8393a3",
    "Montage": "#0f4c81",
    "Travaux": "#e08a2c",
    "Livraison": "#1f8a70",
    "Exploitation": "#1f8a70",
    "Clôturé": "#8393a3"
  }[phase] || "#8393a3";
}
function dpStatutRisqueBadgeClass(statut) {
  return { "Identifié": "badge-rouge", "En traitement": "badge-orange", "Maîtrisé": "badge-vert" }[statut] || "badge-gris";
}
function dpStatutContratBadgeClass(statut) {
  return { "Actif": "badge-vert", "À renouveler": "badge-orange", "Résilié": "badge-gris" }[statut] || "badge-gris";
}
// Budget annuel total des contrats de service (statut Actif ou À renouveler) d'une opération.
function dpBudgetContratsTotal(op) {
  return (op.contrats || []).filter(c => c.statut !== "Résilié").reduce((s, c) => s + (c.montantAnnuel || 0), 0);
}
// Répartition du budget de contrats par type, pour une opération donnée.
function dpBudgetContratsParType(op) {
  const parType = {};
  (op.contrats || []).filter(c => c.statut !== "Résilié").forEach(c => {
    parType[c.type] = (parType[c.type] || 0) + (c.montantAnnuel || 0);
  });
  return parType;
}

/* ---------------------------------------------------------------------
   6) LAYOUT PARTAGÉ (sidebar + topbar)
   --------------------------------------------------------------------- */
const DP_NAV = [
  { href: "dashboard.html", icon: "📊", label: "Tableau de bord", key: "dashboard" },
  { href: "developpement.html", icon: "🧭", label: "Développement", key: "developpement" },
  { href: "operations.html", icon: "🏗", label: "Opérations", key: "operations" },
  { href: "carte.html", icon: "🗺", label: "Carte", key: "carte" },
  { href: "locatif.html", icon: "🔑", label: "Gestion locative", key: "locatif" },
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
