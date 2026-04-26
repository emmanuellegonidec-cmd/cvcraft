// ===============================================
// Side Panel — Jean find my Job
// Logique : récup données capturées + appel API
// ===============================================

const API_URL = "https://jeanfindmyjob.fr/api/jobs/from-extension";
const DASHBOARD_BASE = "https://jeanfindmyjob.fr/dashboard/jobs/";

// État local du panel
let currentCapture = null; // données scrapées (modifiables)
let currentSkills = []; // tableau de skills (modifiables)
let createdJobId = null; // id de la carte créée/existante

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
}

function showError(message) {
  const errBox = $("error-box");
  errBox.textContent = message;
  errBox.classList.remove("jfmj-hidden");
}

function clearError() {
  $("error-box").classList.add("jfmj-hidden");
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

// ---------- Soumission ----------
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

    const response = await fetch(API_URL, {
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
  $("btn-save").addEventListener("click", handleSave);

  $("btn-cancel").addEventListener("click", () => {
    window.close();
  });

  $("btn-close-success").addEventListener("click", () => {
    window.close();
  });

  $("btn-close-existing").addEventListener("click", () => {
    window.close();
  });

  $("btn-close-not-logged").addEventListener("click", () => {
    window.close();
  });

  $("btn-view-in-jean").addEventListener("click", () => {
    if (createdJobId) {
      chrome.tabs.create({ url: DASHBOARD_BASE + createdJobId });
    }
  });

  $("btn-view-existing").addEventListener("click", () => {
    if (createdJobId) {
      chrome.tabs.create({ url: DASHBOARD_BASE + createdJobId });
    }
  });

  // Lancement
  init();
});