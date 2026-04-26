// ===============================================
// Side Panel — Jean find my Job (v0.5.0)
// Logique : capture + création carte + analyse ATS
// ===============================================

const API_URL_FROM_EXTENSION = "https://jeanfindmyjob.fr/api/jobs/from-extension";
const API_URL_USER_DOCUMENTS = "https://jeanfindmyjob.fr/api/extension/user-documents";
const API_URL_ATS_FROM_EXTENSION = (jobId) =>
  `https://jeanfindmyjob.fr/api/jobs/${jobId}/ats-from-extension`;
const DASHBOARD_URL = "https://jeanfindmyjob.fr/dashboard";
const PROFILE_URL = "https://jeanfindmyjob.fr/dashboard/profile";

// État local du panel
let currentCapture = null; // données scrapées (modifiables)
let currentSkills = []; // tableau de skills (modifiables)
let createdJobId = null; // id de la carte créée/existante
let availableCvs = []; // CVs chargés depuis /api/extension/user-documents
let defaultCvRef = null; // ref du CV par défaut profil (peut être null)
let selectedCvRef = null; // CV choisi pour l'analyse
let analyzingInterval = null; // timer messages "analyse en cours"

// ---------- Helpers DOM ----------
const $ = (id) => document.getElementById(id);

function showView(viewId) {
  document
    .querySelectorAll(".jfmj-view")
    .forEach((v) => v.classList.add("jfmj-hidden"));
  $(viewId).classList.remove("jfmj-hidden");

  // Footer visible uniquement sur la vue récap
  if (viewId === "view-recap") {
    $("footer-recap").classList.remove("jfmj-hidden");
  } else {
    $("footer-recap").classList.add("jfmj-hidden");
  }

  // Si on quitte la vue analyzing, on stoppe le timer
  if (viewId !== "view-analyzing") {
    stopAnalyzingMessages();
  }

  // Scroll vers le haut sur changement de vue (utile pour la longue vue résultat)
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showError(message) {
  const errBox = $("error-box");
  if (errBox) {
    errBox.textContent = message;
    errBox.classList.remove("jfmj-hidden");
  } else {
    alert(message);
  }
}

function clearError() {
  const errBox = $("error-box");
  if (errBox) errBox.classList.add("jfmj-hidden");
}

// ---------- Auth (lecture du token Supabase) ----------
async function getAuthSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["jfmj_session"], (result) => {
      resolve(result.jfmj_session || null);
    });
  });
}

function isSessionValid(session) {
  if (!session || !session.access_token || !session.expires_at) return false;
  // expires_at est en secondes, on compare en secondes
  const nowSec = Math.floor(Date.now() / 1000);
  return session.expires_at > nowSec + 30; // marge de 30s
}

// ---------- Récup des données capturées ----------
async function getPendingCapture() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "JFMJ_GET_PENDING_CAPTURE" },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "[JFMJ Panel] Erreur sendMessage :",
            chrome.runtime.lastError
          );
          resolve(null);
          return;
        }
        resolve(response?.payload || null);
      }
    );
  });
}

// ---------- Affichage des champs détectés ----------
function renderDetectedFields(data) {
  const container = $("fields-detected");
  container.innerHTML = "";

  const fields = [
    { key: "Lieu", value: data.location },
    { key: "Type de contrat", value: data.contractType },
    { key: "Rythme", value: data.workSchedule },
    { key: "Durée hebdo", value: data.workingHours },
    { key: "Salaire", value: formatSalary(data) },
    { key: "Période salaire", value: formatPeriod(data.salaryPeriod) },
    { key: "Date de publication", value: formatDate(data.postedAt) },
    { key: "Expérience", value: data.experienceLabel },
    { key: "Niveau d'études", value: data.educationLevel },
    { key: "Qualification", value: data.qualification },
    { key: "Secteur", value: data.industry },
    { key: "Source", value: data.source },
  ];

  fields.forEach((f) => {
    if (!f.value) return; // on cache les champs vides
    const row = document.createElement("div");
    row.className = "jfmj-field-row";
    row.innerHTML = `
      <span class="jfmj-field-key">${escapeHtml(f.key)}</span>
      <span class="jfmj-field-value">${escapeHtml(String(f.value))}</span>
    `;
    container.appendChild(row);
  });
}

function formatSalary(data) {
  const min = data.salaryMin;
  const max = data.salaryMax;
  const currency = data.salaryCurrency === "EUR" ? "€" : data.salaryCurrency || "€";
  if (min && max && min !== max) return `${min} - ${max} ${currency}`;
  if (min) return `À partir de ${min} ${currency}`;
  if (max) return `Jusqu'à ${max} ${currency}`;
  return null;
}

function formatPeriod(p) {
  const map = { YEAR: "annuel", MONTH: "mensuel", HOUR: "horaire" };
  return map[p] || p || null;
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Skills (chips) ----------
function renderSkills() {
  const card = $("card-skills");
  const container = $("skills-chips");
  container.innerHTML = "";

  if (!currentSkills || currentSkills.length === 0) {
    card.classList.add("jfmj-hidden");
    return;
  }
  card.classList.remove("jfmj-hidden");

  currentSkills.forEach((skill, idx) => {
    const chip = document.createElement("span");
    chip.className = "jfmj-chip";
    chip.innerHTML = `
      ${escapeHtml(skill)}
      <button class="jfmj-chip-remove" data-idx="${idx}" title="Retirer">×</button>
    `;
    container.appendChild(chip);
  });

  // Bind suppression
  container.querySelectorAll(".jfmj-chip-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx, 10);
      currentSkills.splice(idx, 1);
      renderSkills();
    });
  });
}

// ---------- Affichage de la vue récap ----------
function populateRecap(data) {
  currentCapture = data;
  currentSkills = Array.isArray(data.skills) ? [...data.skills] : [];

  $("input-title").value = data.title || "";
  $("input-company").value = data.company || "";
  $("input-description").value = data.description || "";

  renderDetectedFields(data);
  renderSkills();

  showView("view-recap");
}

// ---------- Soumission de la carte ----------
async function handleSave() {
  clearError();
  const btn = $("btn-save");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  try {
    const session = await getAuthSession();
    if (!isSessionValid(session)) {
      showError("Ta session a expiré. Reconnecte-toi via la popup.");
      btn.disabled = false;
      btn.textContent = "✓ Enregistrer dans Jean";
      return;
    }

    // Construction du body avec les valeurs (potentiellement éditées)
    const payload = {
      ...currentCapture,
      title: $("input-title").value.trim(),
      company: $("input-company").value.trim() || null,
      description: $("input-description").value.trim() || null,
      skills: currentSkills,
    };

    if (!payload.title) {
      showError("L'intitulé du poste est obligatoire.");
      btn.disabled = false;
      btn.textContent = "✓ Enregistrer dans Jean";
      return;
    }

    const response = await fetch(API_URL_FROM_EXTENSION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      showError(result.error || `Erreur ${response.status}`);
      btn.disabled = false;
      btn.textContent = "✓ Enregistrer dans Jean";
      return;
    }

    createdJobId = result.jobId;

    if (result.status === "already_exists") {
      $("already-job-title").textContent = payload.title;
      showView("view-already-exists");
    } else {
      $("success-job-title").textContent = payload.title;
      showView("view-success");
    }
  } catch (err) {
    console.error("[JFMJ Panel] Erreur fetch :", err);
    showError("Erreur réseau : " + (err?.message || "inconnue"));
    btn.disabled = false;
    btn.textContent = "✓ Enregistrer dans Jean";
  }
}

// =========================================
// SESSION 5 — Analyse ATS (CV vs Offre)
// =========================================

// ---------- Étape 1 : récupérer les CV de la bibliothèque ----------
async function loadCvs() {
  const session = await getAuthSession();
  if (!isSessionValid(session)) {
    showView("view-not-logged-in");
    return null;
  }

  try {
    const response = await fetch(API_URL_USER_DOCUMENTS + "?type=cv", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    availableCvs = Array.isArray(data.cvs) ? data.cvs : [];
    defaultCvRef = data.default_cv_ref || null;
    return data;
  } catch (err) {
    console.error("[JFMJ Panel] Erreur chargement CVs :", err);
    return null;
  }
}

// ---------- Étape 2 : déclenchement du flow analyse ----------
async function handleAnalyzeClick() {
  if (!createdJobId) {
    alert("Aucune carte n'a été créée pour cette offre. Réessaye.");
    return;
  }

  // Indicateur de chargement immédiat (spinner sur la vue analyzing avec message neutre)
  $("analyzing-text").textContent = "Chargement de tes CV…";
  showView("view-analyzing");

  const data = await loadCvs();
  if (!data) {
    showError(
      "Impossible de charger tes CV. Vérifie ta connexion et réessaye."
    );
    showView("view-success"); // retour à l'écran de succès
    return;
  }

  const analysableCvs = availableCvs.filter((cv) => cv.is_analyzable);

  if (analysableCvs.length === 0) {
    showView("view-no-cv");
    return;
  }

  if (analysableCvs.length === 1) {
    // Un seul CV PDF : analyse directe, pas de dropdown
    selectedCvRef = analysableCvs[0].ref;
    launchAnalysis(selectedCvRef);
    return;
  }

  // Plusieurs CV : afficher la dropdown
  populateCvChooser();
  showView("view-choose-cv");
}

// ---------- Étape 3 : peuple la dropdown CV ----------
function populateCvChooser() {
  const select = $("select-cv");
  select.innerHTML = "";

  // Pré-sélection : CV par défaut s'il existe et est analysable, sinon premier analysable
  let preselectRef = null;
  if (
    defaultCvRef &&
    availableCvs.some((c) => c.ref === defaultCvRef && c.is_analyzable)
  ) {
    preselectRef = defaultCvRef;
  } else {
    const firstAnalysable = availableCvs.find((c) => c.is_analyzable);
    preselectRef = firstAnalysable ? firstAnalysable.ref : null;
  }

  // Options analysables d'abord, puis non-analysables (grisées)
  const analysable = availableCvs.filter((c) => c.is_analyzable);
  const nonAnalysable = availableCvs.filter((c) => !c.is_analyzable);

  if (analysable.length > 0) {
    const og = document.createElement("optgroup");
    og.label = "📄 CV analysables (PDF)";
    analysable.forEach((cv) => {
      const opt = document.createElement("option");
      opt.value = cv.ref;
      opt.textContent = cv.is_default
        ? `${cv.display_name}  ⭐ par défaut`
        : cv.display_name;
      if (cv.ref === preselectRef) opt.selected = true;
      og.appendChild(opt);
    });
    select.appendChild(og);
  }

  if (nonAnalysable.length > 0) {
    const og = document.createElement("optgroup");
    og.label = "🚫 CV Creator (non analysables ici)";
    nonAnalysable.forEach((cv) => {
      const opt = document.createElement("option");
      opt.value = cv.ref;
      opt.textContent = cv.display_name;
      opt.disabled = true;
      og.appendChild(opt);
    });
    select.appendChild(og);
  }

  selectedCvRef = preselectRef;
  select.addEventListener("change", (e) => {
    selectedCvRef = e.target.value;
  });
}

// ---------- Étape 4 : lancer l'analyse ATS ----------
async function launchAnalysis(cvRef) {
  if (!cvRef || !createdJobId) {
    alert("CV ou offre manquant. Réessaye.");
    return;
  }

  startAnalyzingMessages();
  showView("view-analyzing");

  try {
    const session = await getAuthSession();
    if (!isSessionValid(session)) {
      stopAnalyzingMessages();
      showView("view-not-logged-in");
      return;
    }

    const response = await fetch(API_URL_ATS_FROM_EXTENSION(createdJobId), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ cvRef }),
    });

    const result = await response.json();
    stopAnalyzingMessages();

    if (!response.ok || !result.success) {
      // Cas spécial : limite atteinte
      if (response.status === 429 || result.code === "LIMIT_REACHED") {
        alert(
          "Tu as atteint la limite de 3 analyses pour cette offre. Tu peux consulter les résultats précédents directement dans Jean."
        );
        showView("view-success");
        return;
      }
      // Cas spécial : Creator non supporté (sécurité, ne devrait pas arriver côté UI)
      if (result.code === "CREATOR_NOT_SUPPORTED") {
        alert(
          "Les CV Creator ne sont pas analysables depuis l'extension. Sélectionne un CV PDF."
        );
        showView("view-choose-cv");
        return;
      }
      alert(result.error || `Erreur ${response.status}`);
      showView("view-success");
      return;
    }

    renderAtsResult(result.result, result.analyses_restantes);
  } catch (err) {
    console.error("[JFMJ Panel] Erreur analyse :", err);
    stopAnalyzingMessages();
    alert("Erreur réseau pendant l'analyse : " + (err?.message || "inconnue"));
    showView("view-success");
  }
}

// ---------- Messages animés pendant l'analyse ----------
const ANALYZING_MESSAGES = [
  "Lecture de ton CV…",
  "Extraction des mots-clés de l'offre…",
  "Calcul du matching CV ↔ offre…",
  "Évaluation du score ATS sur 100…",
  "Identification des points forts et faibles…",
  "Génération des recommandations prioritaires…",
];

function startAnalyzingMessages() {
  let idx = 0;
  $("analyzing-text").textContent = ANALYZING_MESSAGES[0];
  stopAnalyzingMessages();
  analyzingInterval = setInterval(() => {
    idx = (idx + 1) % ANALYZING_MESSAGES.length;
    $("analyzing-text").textContent = ANALYZING_MESSAGES[idx];
  }, 4000);
}

function stopAnalyzingMessages() {
  if (analyzingInterval) {
    clearInterval(analyzingInterval);
    analyzingInterval = null;
  }
}

// ---------- Rendu de la vue résultat ATS ----------
function renderAtsResult(result, analysesRestantes) {
  if (!result) {
    showView("view-success");
    return;
  }

  // 1. Cercle de score global
  const scoreGlobal = Math.max(0, Math.min(100, result.score_global || 0));
  $("score-number").textContent = scoreGlobal;

  const circumference = 326.7; // 2 * π * 52
  const offset = circumference - (scoreGlobal / 100) * circumference;
  const circle = $("score-progress");
  circle.classList.remove(
    "jfmj-score-good",
    "jfmj-score-medium",
    "jfmj-score-low"
  );
  if (scoreGlobal >= 75) circle.classList.add("jfmj-score-good");
  else if (scoreGlobal >= 50) circle.classList.add("jfmj-score-medium");
  else circle.classList.add("jfmj-score-low");

  // Animation : on attend le prochain frame puis on applique l'offset
  circle.setAttribute("stroke-dashoffset", circumference);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      circle.setAttribute("stroke-dashoffset", offset);
    });
  });

  $("score-label").textContent = scoreLabel(scoreGlobal);

  // Compteur d'analyses restantes
  if (typeof analysesRestantes === "number") {
    $("analyses-restantes").textContent =
      analysesRestantes > 0
        ? `${analysesRestantes} analyse${
            analysesRestantes > 1 ? "s" : ""
          } restante${analysesRestantes > 1 ? "s" : ""} sur cette offre`
        : "Limite atteinte (3/3)";
  } else {
    $("analyses-restantes").textContent = "";
  }

  // 2. Sous-scores (jauges)
  renderSubscores(result.scores || {});

  // 3. Mots-clés
  renderKeywords(result.keywords || {});

  // 4. Points forts / faibles
  renderBullets("points-forts", result.analyse_contenu?.points_forts || []);
  renderBullets("points-faibles", result.analyse_contenu?.points_faibles || []);

  // 5. Recommandations
  renderRecommandations(result.recommandations || []);

  showView("view-ats-result");
}

function scoreLabel(score) {
  if (score >= 80) return "Excellent match 🎯";
  if (score >= 60) return "Bon match";
  if (score >= 40) return "Match moyen";
  if (score >= 20) return "Match faible";
  return "Match très faible";
}

// ---------- Sous-scores ----------
const SUBSCORE_DEFS = [
  { key: "format", label: "Format ATS", max: 15 },
  { key: "lisibilite_ats", label: "Lisibilité ATS", max: 15 },
  { key: "infos_obligatoires", label: "Infos obligatoires", max: 10 },
  { key: "structure", label: "Structure du CV", max: 10 },
  { key: "experiences", label: "Expériences", max: 25 },
  { key: "competences", label: "Compétences", max: 15 },
  { key: "matching", label: "Matching CV ↔ Offre", max: 10 },
];

function renderSubscores(scores) {
  const container = $("subscores-list");
  container.innerHTML = "";

  SUBSCORE_DEFS.forEach((def) => {
    const value = Math.max(0, Math.min(def.max, scores[def.key] || 0));
    const ratio = (value / def.max) * 100;

    let fillClass = "jfmj-fill-good";
    if (ratio < 50) fillClass = "jfmj-fill-low";
    else if (ratio < 80) fillClass = "jfmj-fill-medium";

    const row = document.createElement("div");
    row.className = "jfmj-subscore-row";
    row.innerHTML = `
      <div class="jfmj-subscore-header">
        <span class="jfmj-subscore-name">${escapeHtml(def.label)}</span>
        <span class="jfmj-subscore-value">${value}/${def.max}</span>
      </div>
      <div class="jfmj-subscore-bar">
        <div class="jfmj-subscore-fill ${fillClass}" style="width: 0%"></div>
      </div>
    `;
    container.appendChild(row);

    // Animation : on attend le prochain frame
    const fillEl = row.querySelector(".jfmj-subscore-fill");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fillEl.style.width = ratio + "%";
      });
    });
  });
}

// ---------- Mots-clés ----------
function renderKeywords(kw) {
  const pct = Math.max(0, Math.min(100, kw.couverture_pct || 0));
  const fill = $("kw-bar-fill");
  $("kw-coverage-pct").textContent = pct + "%";

  fill.classList.remove("jfmj-fill-good", "jfmj-fill-low");
  if (pct >= 70) fill.classList.add("jfmj-fill-good");
  else if (pct < 50) fill.classList.add("jfmj-fill-low");

  fill.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fill.style.width = pct + "%";
    });
  });

  // Mots-clés manquants critiques
  const missing = Array.isArray(kw.manquants_critiques)
    ? kw.manquants_critiques
    : [];
  const section = $("kw-missing-section");
  const chips = $("kw-missing-chips");
  chips.innerHTML = "";

  if (missing.length === 0) {
    section.classList.add("jfmj-hidden");
  } else {
    section.classList.remove("jfmj-hidden");
    missing.forEach((kw) => {
      const chip = document.createElement("span");
      chip.className = "jfmj-chip jfmj-chip-missing";
      chip.textContent = kw;
      chips.appendChild(chip);
    });
  }
}

// ---------- Bullets points forts / faibles ----------
function renderBullets(containerId, items) {
  const ul = $(containerId);
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.style.color = "#888";
    li.style.fontStyle = "italic";
    li.textContent = "Aucun élément remonté par l'analyse";
    ul.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

// ---------- Recommandations ----------
function renderRecommandations(recos) {
  const container = $("recommandations");
  container.innerHTML = "";

  if (!recos || recos.length === 0) {
    container.innerHTML =
      '<p class="jfmj-hint" style="font-style: normal">Aucune recommandation prioritaire.</p>';
    return;
  }

  // Tri par priorité croissante (1 = plus urgent)
  const sorted = [...recos].sort(
    (a, b) => (a.priorite || 99) - (b.priorite || 99)
  );

  sorted.forEach((reco) => {
    const impact = (reco.impact || "mineur").toLowerCase();
    const pillClass = `jfmj-reco-pill-${impact}`;

    const div = document.createElement("div");
    div.className = "jfmj-reco";
    div.innerHTML = `
      <div class="jfmj-reco-header">
        <span class="jfmj-reco-priority">#${reco.priorite || "?"}</span>
        <span class="jfmj-reco-pill ${pillClass}">${escapeHtml(impact)}</span>
      </div>
      <p class="jfmj-reco-action">${escapeHtml(reco.action || "")}</p>
    `;
    container.appendChild(div);
  });
}

// ---------- Init ----------
async function init() {
  // 1. Vérifier l'authentification
  const session = await getAuthSession();
  if (!isSessionValid(session)) {
    showView("view-not-logged-in");
    return;
  }

  // 2. Récupérer les données en attente
  const capture = await getPendingCapture();
  if (!capture || !capture.data) {
    showView("view-empty");
    return;
  }

  // 3. Peupler la vue récap
  populateRecap(capture.data);
}

// ---------- Bind boutons ----------
document.addEventListener("DOMContentLoaded", () => {
  // Vue récap
  $("btn-save").addEventListener("click", handleSave);
  $("btn-cancel").addEventListener("click", () => window.close());

  // Vue success
  $("btn-close-success").addEventListener("click", () => window.close());
  $("btn-view-in-jean").addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
  $("btn-analyze-from-success").addEventListener("click", handleAnalyzeClick);

  // Vue already-exists
  $("btn-close-existing").addEventListener("click", () => window.close());
  $("btn-view-existing").addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
  $("btn-analyze-from-existing").addEventListener("click", handleAnalyzeClick);

  // Vue not-logged-in
  $("btn-close-not-logged").addEventListener("click", () => window.close());

  // Vue choose-cv
  $("btn-launch-analysis").addEventListener("click", () => {
    if (!selectedCvRef) {
      alert("Sélectionne un CV avant de lancer l'analyse.");
      return;
    }
    launchAnalysis(selectedCvRef);
  });
  $("btn-cancel-analysis").addEventListener("click", () => {
    showView("view-success");
  });

  // Vue no-cv
  $("btn-go-to-profile").addEventListener("click", () => {
    chrome.tabs.create({ url: PROFILE_URL });
  });
  $("btn-close-no-cv").addEventListener("click", () => window.close());

  // Vue ats-result
  $("btn-view-in-jean-result").addEventListener("click", () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
  $("btn-close-result").addEventListener("click", () => window.close());

  // Lancement
  init();
});
