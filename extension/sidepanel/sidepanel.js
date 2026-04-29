// ============================================================
// Jean find my Job — Side panel logic
// Session 9bis v0.9.7 — Bloc 6b (complet) :
//   - Skip ATS direct après capture
//     → Au clic "Enregistrer pour analyse de ta candidature", on enchaîne
//       directement sur startAnalysisFlow() (sélection de CV ou analyse
//       direct si 1 seul CV). Plus d'étape intermédiaire view-success
//       ou view-already-exists.
//     → Ces vues restent comme filet de sécurité si l'utilisateur annule
//       depuis view-choose-cv (la bonne est affichée selon wasAlreadyExisting).
//   - Badge "Offre déjà capturée" sur view-choose-cv en cas de recapture
//     → Restaure l'info qui était portée par view-already-exists, sans
//       casser la fluidité du flow (zéro clic supplémentaire).
//   - Variable globale wasAlreadyExisting + helpers getCaptureSuccessView()
//     et updateAlreadyCapturedBadge().
//   - Fix mineur : le finally de btn-save remet désormais le bon wording.
// Session 9bis v0.9.5 — Bloc 2 (fix #4) :
//   - 🔧 #4 : récupération du prénom/nom utilisateur revue
//             → décodage du JWT directement (pas d'appel à /auth/v1/user)
//             → lecture de user_profiles via API REST Supabase, double
//               tentative user_id puis id
//             → fallback en cascade : metadata JWT → parsing email
// Session 9bis v0.9.4 — Bloc 2 :
//   - #3 : auto-reload du panel quand la session apparaît
//   - #4 : nom du CV téléchargé personnalisé
// Session 9bis v0.9.3 :
//   - #1 : plus de création auto de relance J+7 au "J'ai postulé"
//   - #2 : bouton "✓ J'ai postulé" masqué si la candidature est déjà appliquée
//   - #7 : "J'ai postulé" valide aussi l'étape du parcours côté API
// Session 9bis-bis v0.9.2 :
//   - Dropdown CV en 2 groupes : ⭐ Mes favoris + 📋 Tous mes CV
//   - Plus de pré-sélection auto + bouton désactivé tant que pas de choix
//   - Lecture data.all (nouveau format de la route extension/user-documents)
// Session 7 v0.7.0 :
//   - Bouton "✓ J'ai postulé" → marque la candidature comme postulée
// Session 6 v0.6.1 :
//   - Zone documents simplifiée : télécharger CV + bouton "Optimiser mon CV"
// ============================================================

const SUPABASE_URL = 'https://kjsqfgpewjzierlxzdyj.supabase.co';
const JEAN_API_BASE = 'https://jeanfindmyjob.fr';

// ============================================================
// État global
// ============================================================
let currentJobId = null;
let currentSessionToken = null;
let currentCapturedData = null;
let selectedCvRef = null;
let selectedCvDisplayName = null;
// Partie "InitialeNom" déduite du profil utilisateur (ex: "EGonidec")
let currentUserNamePart = '';
// 🆕 Bloc 6b — mémorise si la dernière capture a renvoyé "already_exists"
// pour router correctement en cas d'annulation depuis view-choose-cv.
let wasAlreadyExisting = false;

// ============================================================
// Helpers DOM
// ============================================================
function $(id) { return document.getElementById(id); }
function show(viewId) {
  document.querySelectorAll('.jfmj-view').forEach(v => v.classList.add('jfmj-hidden'));
  $(viewId)?.classList.remove('jfmj-hidden');
}
function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text || '—';
}

// 🆕 Bloc 6b — vue de succès appropriée selon le statut de la dernière capture.
// Utilisée si l'utilisateur annule l'analyse depuis view-choose-cv.
function getCaptureSuccessView() {
  return wasAlreadyExisting ? 'view-already-exists' : 'view-success';
}

// 🆕 Bloc 6b — Badge "Offre déjà capturée" sur view-choose-cv en cas de recapture.
// Restaure l'information perdue avec le skip ATS direct, sans casser la
// fluidité du flow (l'utilisateur n'a pas de clic supplémentaire à faire).
// Le badge est créé une seule fois puis montré/caché selon wasAlreadyExisting.
function updateAlreadyCapturedBadge() {
  const chooseCvView = $('view-choose-cv');
  if (!chooseCvView) return;

  let badge = $('already-captured-badge');

  if (wasAlreadyExisting) {
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'already-captured-badge';
      badge.style.cssText =
        'padding:10px 14px;background:#FFFBE6;border:1.5px solid #F5C400;' +
        'border-radius:8px;color:#7A5A00;font-weight:600;text-align:center;' +
        'font-size:13px;margin:0 0 14px 0;line-height:1.4;' +
        "font-family:'Montserrat',sans-serif;";
      badge.textContent = 'ℹ️ Offre déjà capturée dans tes candidatures';
      // Insère après le titre (1er enfant) si présent, sinon en tête de vue
      const firstEl = chooseCvView.firstElementChild;
      if (firstEl) {
        firstEl.after(badge);
      } else {
        chooseCvView.appendChild(badge);
      }
    } else {
      badge.style.display = '';
    }
  } else if (badge) {
    badge.style.display = 'none';
  }
}

// ============================================================
// Auth
// ============================================================
async function getSessionToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jfmj_session'], (result) => {
      const session = result.jfmj_session;
      if (!session || !session.access_token) {
        resolve(null);
        return;
      }
      const nowSec = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at <= nowSec + 30) {
        resolve(null);
        return;
      }
      resolve(session.access_token);
    });
  });
}

// ============================================================
// SESSION 9bis #4 (v0.9.5) — Décodage du JWT Supabase
// ============================================================
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.warn('[decodeJwtPayload] erreur:', e);
    return null;
  }
}

// ============================================================
// SESSION 9bis #4 (v0.9.5) — Lecture de la table user_profiles
// ============================================================
async function tryFetchUserProfile(filter) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?${filter}&select=first_name,last_name`,
      {
        headers: {
          'Authorization': `Bearer ${currentSessionToken}`,
          'apikey': currentSessionToken,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.warn('[tryFetchUserProfile] erreur:', e);
    return null;
  }
}

async function fetchUserProfileFromDb(userId) {
  if (!userId || !currentSessionToken) return null;
  let profile = await tryFetchUserProfile(`user_id=eq.${encodeURIComponent(userId)}`);
  if (profile) return profile;
  profile = await tryFetchUserProfile(`id=eq.${encodeURIComponent(userId)}`);
  return profile;
}

// ============================================================
// SESSION 9bis #4 (v0.9.5) — Construction "InitialeNom"
// Stratégie en cascade : user_profiles → JWT user_metadata → email
// ============================================================
async function buildUserNamePart() {
  const tokenPayload = decodeJwtPayload(currentSessionToken);
  if (!tokenPayload) return '';

  let firstName = '';
  let lastName = '';

  if (tokenPayload.sub) {
    const profile = await fetchUserProfileFromDb(tokenPayload.sub);
    if (profile) {
      firstName = (profile.first_name || '').trim();
      lastName = (profile.last_name || '').trim();
    }
  }

  if (!firstName && !lastName) {
    const meta = tokenPayload.user_metadata || {};
    firstName = (meta.first_name || meta.firstName || '').trim();
    lastName = (meta.last_name || meta.lastName || '').trim();

    if (!firstName && !lastName) {
      const fullName = (meta.full_name || meta.fullName || meta.name || '').trim();
      if (fullName) {
        const parts = fullName.split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }
    }
  }

  if (!firstName && !lastName && tokenPayload.email) {
    const localPart = tokenPayload.email.split('@')[0];
    const parts = localPart.split(/[._-]/);
    if (parts.length >= 2) {
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      lastName = localPart;
    }
  }

  return formatNamePart(firstName, lastName);
}

function formatNamePart(firstName, lastName) {
  const cleanFirst = sanitizeFilenamePart(firstName);
  const cleanLast = sanitizeFilenamePart(lastName);

  const initial = cleanFirst ? cleanFirst.charAt(0).toUpperCase() : '';

  const lastFormatted = cleanLast
    .split('_')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join('');

  return initial + lastFormatted;
}

function sanitizeFilenamePart(s) {
  if (!s) return '';
  return s
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildCvFilename(originalFileName) {
  const dotIdx = originalFileName.lastIndexOf('.');
  const ext = dotIdx > 0 ? originalFileName.slice(dotIdx) : '.pdf';

  const posteRaw = $('field-title')?.value || currentCapturedData?.title || 'Poste';
  const entrepriseRaw = $('field-company')?.value || currentCapturedData?.company || 'Entreprise';

  const poste = sanitizeFilenamePart(posteRaw) || 'Poste';
  const entreprise = sanitizeFilenamePart(entrepriseRaw) || 'Entreprise';

  let name = `${poste}_${entreprise}_CV`;
  if (currentUserNamePart) {
    name += `_${currentUserNamePart}`;
  }
  return name + ext;
}

// ============================================================
// Init
// ============================================================
async function init() {
  show('view-loading');

  const token = await getSessionToken();
  if (!token) {
    show('view-not-logged-in');
    return;
  }
  currentSessionToken = token;

  try {
    currentUserNamePart = await buildUserNamePart();
    console.log('[init] currentUserNamePart =', currentUserNamePart || '(vide)');
  } catch (e) {
    console.warn('[init - buildUserNamePart] erreur:', e);
    currentUserNamePart = '';
  }

  chrome.runtime.sendMessage({ type: 'JFMJ_GET_PENDING_CAPTURE' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[sidepanel] erreur sendMessage:', chrome.runtime.lastError);
      show('view-empty');
      return;
    }
    if (!response || !response.ok || !response.payload || !response.payload.data) {
      show('view-empty');
      return;
    }
    currentCapturedData = response.payload.data;
    populateRecap(currentCapturedData);
    show('view-recap');
  });
}

$('btn-refresh-auth')?.addEventListener('click', init);

// ============================================================
// SESSION 9bis #3 — Auto-reload du panel quand la session change
// ============================================================
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!changes.jfmj_session) return;

  const newSession = changes.jfmj_session.newValue;
  const oldSession = changes.jfmj_session.oldValue;

  const oldToken = oldSession?.access_token;
  const newToken = newSession?.access_token;

  if (newToken && (!oldToken || newToken !== oldToken)) {
    const notLoggedView = $('view-not-logged-in');
    const isShowingNotLoggedIn =
      notLoggedView && !notLoggedView.classList.contains('jfmj-hidden');
    if (isShowingNotLoggedIn) {
      console.log('[storage.onChanged] Login détecté → re-init du panel');
      init();
    }
  }

  if (!newToken && oldToken) {
    console.log('[storage.onChanged] Logout détecté → retour à view-not-logged-in');
    currentSessionToken = null;
    currentUserNamePart = '';
    show('view-not-logged-in');
  }
});

// ============================================================
// Populate recap
// ============================================================
function populateRecap(d) {
  $('field-title').value = d.title || '';
  $('field-company').value = d.company || '';
  setText('field-location', d.location);

  const contractParts = [d.contractType, d.workSchedule].filter(Boolean);
  setText('field-contract', contractParts.join(' · '));

  let salary = '—';
  if (d.salaryMin || d.salaryMax) {
    const period = d.salaryPeriod === 'YEAR' ? '/an' : d.salaryPeriod === 'MONTH' ? '/mois' : d.salaryPeriod === 'HOUR' ? '/h' : '';
    if (d.salaryMin && d.salaryMax && d.salaryMin !== d.salaryMax) {
      salary = `${d.salaryMin} – ${d.salaryMax} ${d.salaryCurrency || '€'}${period}`;
    } else {
      salary = `${d.salaryMin || d.salaryMax} ${d.salaryCurrency || '€'}${period}`;
    }
  }
  setText('field-salary', salary);

  setText('field-working-hours', d.workingHours);
  setText('field-posted-at', d.postedAt ? new Date(d.postedAt).toLocaleDateString('fr-FR') : null);
  setText('field-experience', d.experienceLabel);
  setText('field-qualification', d.qualification);
  setText('field-education', d.educationLevel);
  setText('field-industry', d.industry);

  $('field-description').value = d.description || '';

  const chipsContainer = $('field-skills-chips');
  chipsContainer.innerHTML = '';
  const skills = Array.isArray(d.skills) ? d.skills : [];
  skills.forEach((skill, idx) => {
    const chip = document.createElement('span');
    chip.className = 'jfmj-chip';
    chip.innerHTML = `<span>${skill}</span><button class="jfmj-chip-remove" data-idx="${idx}">×</button>`;
    chipsContainer.appendChild(chip);
  });
  chipsContainer.querySelectorAll('.jfmj-chip-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      if (Array.isArray(currentCapturedData.skills)) {
        currentCapturedData.skills.splice(idx, 1);
        populateRecap(currentCapturedData);
      }
    });
  });
}

// ============================================================
// Boutons fermeture
// ============================================================
$('btn-cancel')?.addEventListener('click', () => show('view-empty'));
$('btn-close-success')?.addEventListener('click', () => window.close());
$('btn-close-exists')?.addEventListener('click', () => window.close());
$('btn-close-ats')?.addEventListener('click', () => window.close());
$('btn-close-applied')?.addEventListener('click', () => window.close());

// ============================================================
// Save
// 🆕 Bloc 6b — Skip ATS direct après capture :
//   après le POST réussi, on enchaîne directement sur startAnalysisFlow()
//   au lieu d'afficher view-success / view-already-exists. Les vues fallback
//   restent prêtes (liens "Voir dans Jean" pré-remplis) si l'utilisateur
//   annule depuis view-choose-cv.
// ============================================================
$('btn-save')?.addEventListener('click', async () => {
  if (!currentSessionToken) {
    show('view-not-logged-in');
    return;
  }

  const payload = {
    ...currentCapturedData,
    title: $('field-title').value,
    company: $('field-company').value,
    description: $('field-description').value,
  };

  $('btn-save').disabled = true;
  $('btn-save').textContent = '⏳ Enregistrement…';

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/jobs/from-extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSessionToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const result = await res.json();
    currentJobId = result.jobId;
    wasAlreadyExisting = (result.status === 'already_exists');

    // Pré-remplit les liens "Voir dans Jean" des vues fallback
    $('link-view-success').href = `${JEAN_API_BASE}/dashboard`;
    $('link-view-exists').href = `${JEAN_API_BASE}/dashboard`;

    // 🆕 Bloc 6b — Skip direct vers l'analyse ATS, plus d'étape intermédiaire.
    startAnalysisFlow();
  } catch (e) {
    console.error('[save] erreur:', e);
    showError(e.message || 'Erreur lors de la sauvegarde', 'view-recap');
  } finally {
    $('btn-save').disabled = false;
    // Wording aligné sur le HTML (s9 — tutoiement)
    $('btn-save').textContent = 'Enregistrer pour analyse de ta candidature';
  }
});

// ============================================================
// Analyse CV vs offre
// 🆕 Bloc 6b — boutons "Annuler analyse" / "Retour" routent vers la bonne
// vue de succès selon le statut de la capture (créée vs déjà existante).
// ============================================================
$('btn-analyze-from-success')?.addEventListener('click', () => startAnalysisFlow());
$('btn-analyze-from-exists')?.addEventListener('click', () => startAnalysisFlow());
$('btn-cancel-analysis')?.addEventListener('click', () => show(getCaptureSuccessView()));
$('btn-back-to-success')?.addEventListener('click', () => show(getCaptureSuccessView()));

async function startAnalysisFlow() {
  show('view-loading');

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/extension/user-documents`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const allCvs = Array.isArray(data.all) ? data.all : (data.cvs || []);
    const favoriteCvs = Array.isArray(data.favorites) ? data.favorites : allCvs.filter(c => c.is_favorite);

    const analyzableCvs = allCvs.filter(c => c.is_analyzable);

    if (analyzableCvs.length === 0) {
      show('view-no-cv');
      return;
    }

    if (analyzableCvs.length === 1) {
      selectedCvRef = analyzableCvs[0].ref;
      selectedCvDisplayName = analyzableCvs[0].display_name;
      launchAnalysis();
      return;
    }

    populateCvChooser(allCvs, favoriteCvs);
    show('view-choose-cv');
  } catch (e) {
    console.error('[analyse - load CVs] erreur:', e);
    showError(e.message || 'Erreur de chargement des CV', getCaptureSuccessView());
  }
}

function populateCvChooser(allCvs, favoriteCvs) {
  // 🆕 Bloc 6b — affiche/cache le badge "Offre déjà capturée" selon le statut
  updateAlreadyCapturedBadge();

  const select = $('select-cv');
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— Choisis un CV —';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  if (favoriteCvs.length > 0) {
    const grpFav = document.createElement('optgroup');
    grpFav.label = '⭐ Mes favoris';
    favoriteCvs.forEach(cv => {
      const opt = document.createElement('option');
      opt.value = cv.ref;
      opt.textContent = cv.display_name;
      if (!cv.is_analyzable) {
        opt.disabled = true;
        opt.textContent += ' (non analysable)';
      }
      grpFav.appendChild(opt);
    });
    select.appendChild(grpFav);
  }

  const favRefs = new Set(favoriteCvs.map(c => c.ref));
  const otherCvs = allCvs.filter(c => !favRefs.has(c.ref));

  if (otherCvs.length > 0) {
    const grpAll = document.createElement('optgroup');
    grpAll.label = favoriteCvs.length > 0 ? '📋 Tous mes CV' : '📋 Mes CV';
    otherCvs.forEach(cv => {
      const opt = document.createElement('option');
      opt.value = cv.ref;
      opt.textContent = cv.display_name;
      if (!cv.is_analyzable) {
        opt.disabled = true;
        opt.textContent += ' (non analysable)';
      }
      grpAll.appendChild(opt);
    });
    select.appendChild(grpAll);
  }

  const launchBtn = $('btn-launch-analysis');
  if (launchBtn) {
    launchBtn.disabled = true;
    launchBtn.dataset.originalText = launchBtn.dataset.originalText || launchBtn.textContent;
  }

  select.addEventListener('change', () => {
    if (launchBtn) {
      launchBtn.disabled = !select.value;
    }
  });
}

$('btn-launch-analysis')?.addEventListener('click', () => {
  const select = $('select-cv');
  if (!select.value) return;
  selectedCvRef = select.value;
  selectedCvDisplayName = select.options[select.selectedIndex]?.text || 'CV';
  launchAnalysis();
});

async function launchAnalysis() {
  if (!currentJobId || !selectedCvRef) {
    showError('Données manquantes (jobId ou CV)', getCaptureSuccessView());
    return;
  }

  show('view-analyzing');
  cycleAnalyzingMessages();

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/jobs/${currentJobId}/ats-from-extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSessionToken}`,
      },
      body: JSON.stringify({ cvRef: selectedCvRef }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const atsPayload = data.result || data;
    renderAtsResult(atsPayload);

    show('view-ats-result');
  } catch (e) {
    console.error('[analyse - launch] erreur:', e);
    showError(e.message || "Erreur pendant l'analyse", getCaptureSuccessView());
  }
}

const ANALYZING_MESSAGES = [
  'Lecture de ton CV…',
  "Extraction des mots-clés de l'offre…",
  'Comparaison CV ↔ offre…',
  'Calcul du score de compatibilité…',
  'Identification des points forts…',
  'Génération des recommandations…',
];

let analyzingInterval = null;
function cycleAnalyzingMessages() {
  if (analyzingInterval) clearInterval(analyzingInterval);
  let idx = 0;
  setText('analyzing-message', ANALYZING_MESSAGES[idx]);
  analyzingInterval = setInterval(() => {
    idx = (idx + 1) % ANALYZING_MESSAGES.length;
    setText('analyzing-message', ANALYZING_MESSAGES[idx]);
  }, 4000);
}

// ============================================================
// Rendu résultat ATS
// ============================================================
function renderAtsResult(r) {
  if (analyzingInterval) {
    clearInterval(analyzingInterval);
    analyzingInterval = null;
  }

  const score = r.score_global || 0;
  const circumference = 2 * Math.PI * 52;

  const fill = $('score-circle-fill');
  fill.classList.remove('score-orange', 'score-red');
  if (score < 50) fill.classList.add('score-red');
  else if (score < 75) fill.classList.add('score-orange');

  fill.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const offset = circumference - (score / 100) * circumference;
      fill.style.strokeDashoffset = offset;
    });
  });

  animateNumber('score-value', 0, score, 1200);

  let label;
  if (score >= 85) label = 'Excellent match';
  else if (score >= 75) label = 'Bon match';
  else if (score >= 50) label = 'Match moyen';
  else if (score >= 30) label = 'Match faible';
  else label = 'Match très faible';
  setText('score-label', label);

  renderSubscores(r.scores || {});
  renderKeywords(r.keywords || {});
  renderBullets('strengths-list', r.analyse_contenu?.points_forts || []);
  renderBullets('weaknesses-list', r.analyse_contenu?.points_faibles || []);
  renderRecommendations(r.recommandations || []);

  setText('doc-cv-name', selectedCvDisplayName);

  // Session 9bis #2 — masquer le bouton "J'ai postulé" si déjà appliqué
  adjustMarkAppliedButton();
}

function animateNumber(id, from, to, duration) {
  const el = $(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const SUBSCORE_LABELS = {
  format: { label: 'Format PDF', max: 15 },
  lisibilite_ats: { label: 'Lisibilité ATS', max: 15 },
  infos_obligatoires: { label: 'Infos obligatoires', max: 10 },
  structure: { label: 'Structure', max: 10 },
  experiences: { label: 'Expériences', max: 25 },
  competences: { label: 'Compétences', max: 15 },
  matching: { label: 'Matching offre', max: 10 },
};

function renderSubscores(scores) {
  const container = $('subscores-list');
  container.innerHTML = '';
  Object.entries(SUBSCORE_LABELS).forEach(([key, meta]) => {
    const value = scores[key] || 0;
    const ratio = value / meta.max;
    let barClass = '';
    if (ratio < 0.5) barClass = 'bar-red';
    else if (ratio < 0.75) barClass = 'bar-orange';

    const row = document.createElement('div');
    row.className = 'jfmj-subscore-row';
    row.innerHTML = `
      <span class="jfmj-subscore-label">${meta.label}</span>
      <div class="jfmj-subscore-bar-bg">
        <div class="jfmj-subscore-bar-fill ${barClass}" style="width: 0%;"></div>
      </div>
      <span class="jfmj-subscore-value">${value}/${meta.max}</span>
    `;
    container.appendChild(row);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        row.querySelector('.jfmj-subscore-bar-fill').style.width = `${ratio * 100}%`;
      });
    });
  });
}

function renderKeywords(kw) {
  const pct = kw.couverture_pct || 0;
  $('keyword-coverage-fill').style.width = '0%';
  setText('keyword-coverage-pct', `${pct}%`);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      $('keyword-coverage-fill').style.width = `${pct}%`;
    });
  });

  const missing = kw.manquants_critiques || [];
  const chipsContainer = $('keywords-missing-chips');
  chipsContainer.innerHTML = '';
  if (missing.length === 0) {
    chipsContainer.innerHTML = '<p class="jfmj-help-text" style="color:#2E7D32;font-weight:700;">✓ Aucun mot-clé critique manquant</p>';
    return;
  }
  missing.forEach(k => {
    const chip = document.createElement('span');
    chip.className = 'jfmj-chip jfmj-chip-keyword-missing';
    chip.innerHTML = `<span>${k}</span>`;
    chipsContainer.appendChild(chip);
  });
}

function renderBullets(listId, items) {
  const ul = $(listId);
  ul.innerHTML = '';
  if (!items.length) {
    ul.innerHTML = '<li style="font-style:italic;color:#888;">—</li>';
    return;
  }
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
  });
}

function renderRecommendations(recs) {
  const container = $('recommendations-list');
  container.innerHTML = '';
  if (!recs.length) {
    container.innerHTML = '<p class="jfmj-help-text" style="color:#2E7D32;font-weight:700;">✓ Aucune recommandation prioritaire</p>';
    return;
  }
  const sorted = [...recs].sort((a, b) => (a.priorite || 99) - (b.priorite || 99));
  sorted.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'jfmj-recommendation-card';
    const impact = (rec.impact || 'mineur').toLowerCase();
    card.innerHTML = `
      <span class="jfmj-recommendation-priority jfmj-priority-${impact}">${impact}</span>
      <p class="jfmj-recommendation-action">${rec.action || ''}</p>
    `;
    container.appendChild(card);
  });
}

// ============================================================
// SESSION 6 v0.6.1 — Téléchargement CV via Supabase Storage signed URL
// SESSION 9bis #4 — Nom du fichier personnalisé
// ============================================================
$('btn-download-cv')?.addEventListener('click', async () => {
  if (!selectedCvRef) {
    alert("Aucun CV sélectionné");
    return;
  }
  if (!selectedCvRef.startsWith('upload:')) {
    alert("Ce CV n'est pas téléchargeable (CV Creator non supporté pour le moment)");
    return;
  }

  const btn = $('btn-download-cv');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Téléchargement…';

  try {
    const filePath = selectedCvRef.slice('upload:'.length);

    const signedRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/job-documents/${filePath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSessionToken}`,
          'apikey': currentSessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 300 }),
      }
    );

    if (!signedRes.ok) {
      const errTxt = await signedRes.text().catch(() => '');
      throw new Error(`Signed URL refusée (${signedRes.status}): ${errTxt}`);
    }

    const { signedURL } = await signedRes.json();
    if (!signedURL) {
      throw new Error('Pas de signedURL retournée par Supabase');
    }

    const fullUrl = `${SUPABASE_URL}/storage/v1${signedURL}`;
    const fileRes = await fetch(fullUrl);
    if (!fileRes.ok) {
      throw new Error(`Téléchargement échoué (${fileRes.status})`);
    }

    const blob = await fileRes.blob();

    const originalFileName = filePath.split('/').pop() || 'cv.pdf';
    const fileName = buildCvFilename(originalFileName);

    triggerDownload(blob, fileName);
  } catch (e) {
    console.error('[download CV] erreur:', e);
    alert("Erreur lors du téléchargement du CV : " + (e.message || 'inconnue'));
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ============================================================
// SESSION 6 v0.6.1 — Bouton "Optimiser mon CV"
// ============================================================
$('btn-optimize-cv')?.addEventListener('click', () => {
  if (!currentJobId) {
    alert("Pas de jobId courant");
    return;
  }
  const url = `${JEAN_API_BASE}/dashboard?ats=open&jobId=${encodeURIComponent(currentJobId)}`;
  window.open(url, '_blank');
});

// ============================================================
// SESSION 9bis #2 — Lecture du statut courant via Supabase REST
// ============================================================
async function fetchJobAppliedStatus(jobId) {
  if (!jobId || !currentSessionToken) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/jobs?id=eq.${encodeURIComponent(jobId)}&select=status,sub_status,applied_at`,
      {
        headers: {
          'Authorization': `Bearer ${currentSessionToken}`,
          'apikey': currentSessionToken,
        },
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch (e) {
    console.warn('[fetchJobAppliedStatus] erreur:', e);
    return null;
  }
}

async function adjustMarkAppliedButton() {
  const btn = $('btn-mark-applied');
  if (!btn || !currentJobId) return;

  const jobInfo = await fetchJobAppliedStatus(currentJobId);
  if (!jobInfo) return;

  const isAlreadyApplied =
    jobInfo.sub_status === 'applied' || jobInfo.status === 'applied';

  if (isAlreadyApplied) {
    btn.style.display = 'none';
    let info = $('mark-applied-info');
    if (!info) {
      info = document.createElement('div');
      info.id = 'mark-applied-info';
      info.style.cssText =
        'padding:10px 12px;background:#F1F8E9;border:1.5px solid #C8E6C9;' +
        'border-radius:8px;color:#2E7D32;font-weight:700;text-align:center;' +
        'font-size:13px;';
      info.textContent = '✓ Déjà postulé';
      btn.parentNode?.insertBefore(info, btn);
    } else {
      info.style.display = 'block';
    }
  } else {
    btn.style.display = '';
    const info = $('mark-applied-info');
    if (info) info.style.display = 'none';
  }
}

// ============================================================
// SESSION 7 + 9bis — Bouton "✓ J'ai postulé"
// ============================================================
$('btn-mark-applied')?.addEventListener('click', async () => {
  if (!currentJobId) {
    alert("Pas de candidature courante");
    return;
  }
  if (!currentSessionToken) {
    show('view-not-logged-in');
    return;
  }

  const btn = $('btn-mark-applied');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Enregistrement…';

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/jobs/${currentJobId}/mark-applied`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSessionToken}`,
      },
      body: JSON.stringify({
        cvRef: selectedCvRef || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    await res.json().catch(() => ({}));

    $('link-view-applied').href = `${JEAN_API_BASE}/dashboard`;
    show('view-applied-success');
  } catch (e) {
    console.error('[mark-applied] erreur:', e);
    alert("Erreur lors de l'enregistrement : " + (e.message || 'inconnue'));
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ============================================================
// Helper download
// ============================================================
function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

// ============================================================
// Vue erreur générique
// ============================================================
function showError(message, returnView) {
  setText('error-message', message || 'Erreur inconnue');
  $('btn-error-retry').onclick = () => show(returnView);
  show('view-error');
}

// ============================================================
// Démarrage
// ============================================================
init();
