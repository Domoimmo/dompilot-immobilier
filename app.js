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
  // Vide en version production : les opportunités réelles sont saisies depuis l'app.
  opportunites: [],

  /* --- Opérations en cours (module "Suivi projet") --- */
  // Vide en version production : les opérations réelles sont saisies depuis l'app.
  operations: [],

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
