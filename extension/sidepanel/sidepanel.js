// ============================================================
// Jean find my Job — Side panel logic
// Session 6 : ajout zone documents (CV/LM download + LM generation)
// ============================================================

const SUPABASE_URL = 'https://kjsqfgpewjzierlxzdyj.supabase.co';
const JEAN_API_BASE = 'https://jeanfindmyjob.fr';

// ============================================================
// État global
// ============================================================
let currentJobId = null;          // jobId Supabase après save
let currentSessionToken = null;   // access_token Supabase
let currentCapturedData = null;   // données scrapées
let selectedCvRef = null;         // ref du CV sélectionné pour l'analyse
let selectedCvDisplayName = null; // nom du CV sélectionné (pour bouton télécharger)
let availableLms = [];            // liste des LM chargées (cache local)

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

// ============================================================
// Auth — récupérer le token depuis chrome.storage
// ============================================================
async function getSessionToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jfmj_session'], (result) => {
      const session = result.jfmj_session;
      if (!session || !session.access_token) {
        resolve(null);
        return;
      }
      // Vérifier expiration (en secondes)
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
// Init — flow d'ouverture du side panel
// ============================================================
async function init() {
  show('view-loading');

  const token = await getSessionToken();
  if (!token) {
    show('view-not-logged-in');
    return;
  }
  currentSessionToken = token;

  // Demander au service worker les dernières données capturées
  chrome.runtime.sendMessage({ type: 'JFMJ_REQUEST_DATA' }, (response) => {
    if (chrome.runtime.lastError) {
      show('view-empty');
      return;
    }
    if (!response || !response.data) {
      show('view-empty');
      return;
    }
    currentCapturedData = response.data;
    populateRecap(response.data);
    show('view-recap');
  });
}

// Re-init quand l'utilisateur clique "J'ai connecté, recharger"
$('btn-refresh-auth')?.addEventListener('click', init);

// Écoute les nouvelles captures pendant que le panel est ouvert
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'JFMJ_NEW_DATA' && msg.data) {
    currentCapturedData = msg.data;
    populateRecap(msg.data);
    show('view-recap');
  }
});

// ============================================================
// Populate recap (vue 1 — édition de l'offre capturée)
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

  // Compétences en chips
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
// Bouton Annuler / Fermer
// ============================================================
$('btn-cancel')?.addEventListener('click', () => {
  show('view-empty');
});

$('btn-close-success')?.addEventListener('click', () => window.close());
$('btn-close-exists')?.addEventListener('click', () => window.close());
$('btn-close-ats')?.addEventListener('click', () => window.close());

// ============================================================
// Save → POST /api/jobs/from-extension
// ============================================================
$('btn-save')?.addEventListener('click', async () => {
  if (!currentSessionToken) {
    show('view-not-logged-in');
    return;
  }

  // Récupérer les valeurs éditées
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

    if (result.status === 'already_exists') {
      $('link-view-exists').href = `${JEAN_API_BASE}/dashboard`;
      show('view-already-exists');
    } else {
      $('link-view-success').href = `${JEAN_API_BASE}/dashboard`;
      show('view-success');
    }
  } catch (e) {
    console.error('[save] erreur:', e);
    showError(e.message || 'Erreur lors de la sauvegarde', 'view-recap');
  } finally {
    $('btn-save').disabled = false;
    $('btn-save').textContent = '✓ Enregistrer dans Jean';
  }
});

// ============================================================
// Analyse CV vs offre — déclenchement
// ============================================================
$('btn-analyze-from-success')?.addEventListener('click', () => startAnalysisFlow());
$('btn-analyze-from-exists')?.addEventListener('click', () => startAnalysisFlow());
$('btn-cancel-analysis')?.addEventListener('click', () => show('view-success'));
$('btn-back-to-success')?.addEventListener('click', () => show('view-success'));

async function startAnalysisFlow() {
  show('view-loading');

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/extension/user-documents?type=cv`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const cvs = data.cvs || [];
    const analyzableCvs = cvs.filter(c => c.is_analyzable);

    if (analyzableCvs.length === 0) {
      show('view-no-cv');
      return;
    }

    if (analyzableCvs.length === 1) {
      // 1 seul CV analysable → analyse directe
      selectedCvRef = analyzableCvs[0].ref;
      selectedCvDisplayName = analyzableCvs[0].display_name;
      launchAnalysis();
      return;
    }

    // Plusieurs CV → afficher dropdown
    populateCvChooser(cvs, data.default_cv_ref);
    show('view-choose-cv');
  } catch (e) {
    console.error('[analyse - load CVs] erreur:', e);
    showError(e.message || 'Erreur de chargement des CV', 'view-success');
  }
}

function populateCvChooser(cvs, defaultRef) {
  const select = $('select-cv');
  select.innerHTML = '';

  const analyzable = cvs.filter(c => c.is_analyzable);
  const nonAnalyzable = cvs.filter(c => !c.is_analyzable);

  // Pré-sélectionner le default analysable, sinon le premier analysable
  let preSelectedRef = null;
  if (defaultRef && analyzable.find(c => c.ref === defaultRef)) {
    preSelectedRef = defaultRef;
  } else if (analyzable.length > 0) {
    preSelectedRef = analyzable[0].ref;
  }

  // Group analysables
  if (analyzable.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '📄 CV analysables (PDF)';
    analyzable.forEach(cv => {
      const opt = document.createElement('option');
      opt.value = cv.ref;
      opt.textContent = cv.display_name + (cv.is_default ? ' ⭐' : '');
      if (cv.ref === preSelectedRef) opt.selected = true;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }

  // Group non-analysables
  if (nonAnalyzable.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = '🚫 CV Creator (non analysables ici)';
    nonAnalyzable.forEach(cv => {
      const opt = document.createElement('option');
      opt.value = cv.ref;
      opt.textContent = cv.display_name;
      opt.disabled = true;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }
}

$('btn-launch-analysis')?.addEventListener('click', () => {
  const select = $('select-cv');
  selectedCvRef = select.value;
  selectedCvDisplayName = select.options[select.selectedIndex]?.text || 'CV';
  launchAnalysis();
});

async function launchAnalysis() {
  if (!currentJobId || !selectedCvRef) {
    showError('Données manquantes (jobId ou CV)', 'view-success');
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

    const result = await res.json();
    renderAtsResult(result);
    // Charger les LM disponibles en arrière-plan (silencieux si erreur)
    loadAvailableLms();
    show('view-ats-result');
  } catch (e) {
    console.error('[analyse - launch] erreur:', e);
    showError(e.message || "Erreur pendant l'analyse", 'view-success');
  }
}

// Messages qui défilent pendant l'analyse
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
  const circumference = 2 * Math.PI * 52; // 326.7

  // Cercle de score
  const fill = $('score-circle-fill');
  fill.classList.remove('score-orange', 'score-red');
  if (score < 50) fill.classList.add('score-red');
  else if (score < 75) fill.classList.add('score-orange');

  // Reset puis animation
  fill.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const offset = circumference - (score / 100) * circumference;
      fill.style.strokeDashoffset = offset;
    });
  });

  // Score animé (count up)
  animateNumber('score-value', 0, score, 1200);

  // Label
  let label;
  if (score >= 85) label = 'Excellent match';
  else if (score >= 75) label = 'Bon match';
  else if (score >= 50) label = 'Match moyen';
  else if (score >= 30) label = 'Match faible';
  else label = 'Match très faible';
  setText('score-label', label);

  // Sous-scores
  renderSubscores(r.scores || {});

  // Mots-clés
  renderKeywords(r.keywords || {});

  // Points forts/faibles
  renderBullets('strengths-list', r.analyse_contenu?.points_forts || []);
  renderBullets('weaknesses-list', r.analyse_contenu?.points_faibles || []);

  // Recommandations
  renderRecommendations(r.recommandations || []);

  // Documents zone — afficher le nom du CV utilisé
  setText('doc-cv-name', selectedCvDisplayName);

  // Lien Voir dans Jean
  $('link-view-after-ats').href = `${JEAN_API_BASE}/dashboard`;
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
  // Tri par priorité
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
// ✨ SESSION 6 — Zone documents
// ============================================================

// --- Téléchargement CV (depuis bucket Storage via signed URL) ---
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
    // Encoder le filePath en base64url pour le passer dans l'URL
    const encoded = btoa(filePath).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // On passe par notre route extension (qui gère l'auth + sécurité user_id)
    const res = await fetch(`${JEAN_API_BASE}/api/extension/lm-pdf/upload__${encoded}`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });

    if (!res.ok) {
      // Fallback : on essaye via Supabase directement
      throw new Error(`HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const fileName = filePath.split('/').pop() || 'cv.pdf';
    triggerDownload(blob, fileName);
  } catch (e) {
    // Plan B : passer par signed URL Supabase directement
    try {
      const filePath = selectedCvRef.slice('upload:'.length);
      const signedRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/sign/job-documents/${filePath}?expiresIn=300`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSessionToken}`,
            'apikey': await getSupabaseAnonKey(),
          },
        }
      );
      if (!signedRes.ok) throw new Error('signed URL failed');
      const { signedURL } = await signedRes.json();
      const fullUrl = `${SUPABASE_URL}/storage/v1${signedURL}`;
      const fileBlob = await (await fetch(fullUrl)).blob();
      const fileName = filePath.split('/').pop() || 'cv.pdf';
      triggerDownload(fileBlob, fileName);
    } catch (e2) {
      console.error('[download CV] erreur:', e, e2);
      alert("Erreur lors du téléchargement du CV. Réessaye.");
    }
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// La clé anon Supabase est publique, on la lit depuis le manifest stocké
// (alternative : la mettre en dur ici, mais on évite la duplication)
async function getSupabaseAnonKey() {
  // On la lit depuis chrome.storage si jamais elle a été stockée par popup.js
  // sinon fallback en dur (clé publique anon, sans risque)
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc3FmZ3Bld2p6aWVybHh6ZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTgyNDUsImV4cCI6MjA4OTA3NDI0NX0.UlR7xF9grcPIPQ30WjLYojD76bPvnwFGBQgIizf1wu4.placeholder';
  // ⚠️ Cette clé sera lue depuis popup.js via chrome.storage en pratique
}

// --- Chargement liste LM disponibles ---
async function loadAvailableLms() {
  try {
    const res = await fetch(`${JEAN_API_BASE}/api/extension/user-documents?type=lm`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    availableLms = data.lms || [];
    populateLmSelect(availableLms, data.default_lm_ref);
  } catch (e) {
    console.error('[load LMs] erreur:', e);
    // Silencieux : on laisse la dropdown vide, l'utilisateur peut quand même générer
  }
}

function populateLmSelect(lms, defaultRef) {
  const select = $('select-lm');
  select.innerHTML = '<option value="">— Choisis une LM existante…</option>';

  const generated = lms.filter(l => l.source === 'generated');
  const uploaded = lms.filter(l => l.source === 'upload');

  if (generated.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = `✨ LM générées (${generated.length})`;
    generated.forEach(lm => {
      const opt = document.createElement('option');
      opt.value = lm.ref;
      opt.textContent = lm.display_name + (lm.is_default ? ' ⭐' : '');
      if (defaultRef && lm.ref === defaultRef) opt.selected = true;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }

  if (uploaded.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = `📎 LM uploadées (${uploaded.length})`;
    uploaded.forEach(lm => {
      const opt = document.createElement('option');
      opt.value = lm.ref;
      opt.textContent = lm.display_name + (lm.is_default ? ' ⭐' : '');
      if (defaultRef && lm.ref === defaultRef) opt.selected = true;
      grp.appendChild(opt);
    });
    select.appendChild(grp);
  }

  // Si une LM est pré-sélectionnée, afficher le bouton télécharger
  if (select.value) {
    $('btn-download-lm').classList.remove('jfmj-hidden');
  }
}

// Toggle bouton télécharger LM selon sélection
$('select-lm')?.addEventListener('change', (e) => {
  const ref = e.target.value;
  if (ref) {
    $('btn-download-lm').classList.remove('jfmj-hidden');
  } else {
    $('btn-download-lm').classList.add('jfmj-hidden');
  }
});

// --- Téléchargement LM ---
$('btn-download-lm')?.addEventListener('click', async () => {
  const ref = $('select-lm').value;
  if (!ref) return;

  const btn = $('btn-download-lm');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Téléchargement…';

  try {
    let urlPath;
    if (ref.startsWith('generated:')) {
      const lmId = ref.slice('generated:'.length);
      urlPath = `/api/extension/lm-pdf/${lmId}`;
    } else if (ref.startsWith('upload:')) {
      const filePath = ref.slice('upload:'.length);
      const encoded = btoa(filePath).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      urlPath = `/api/extension/lm-pdf/upload__${encoded}`;
    } else {
      throw new Error('Référence LM invalide');
    }

    const res = await fetch(`${JEAN_API_BASE}${urlPath}`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    // Récupérer le nom de fichier depuis Content-Disposition
    let fileName = 'lettre-de-motivation.pdf';
    const cd = res.headers.get('content-disposition');
    if (cd) {
      const match = cd.match(/filename="([^"]+)"/);
      if (match) fileName = match[1];
    }
    triggerDownload(blob, fileName);
  } catch (e) {
    console.error('[download LM] erreur:', e);
    alert("Erreur lors du téléchargement de la LM. Réessaye.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// --- Toggle options génération LM ---
$('btn-generate-lm-toggle')?.addEventListener('click', () => {
  $('lm-generate-options').classList.remove('jfmj-hidden');
  $('btn-generate-lm-toggle').classList.add('jfmj-hidden');
});

$('btn-cancel-generate-lm')?.addEventListener('click', () => {
  $('lm-generate-options').classList.add('jfmj-hidden');
  $('btn-generate-lm-toggle').classList.remove('jfmj-hidden');
});

// --- Lancer génération LM ---
$('btn-launch-generate-lm')?.addEventListener('click', async () => {
  if (!currentJobId) {
    alert("Pas de jobId courant — réenregistre l'offre d'abord");
    return;
  }

  const tone = $('select-lm-tone').value;
  const length = parseInt($('select-lm-length').value);
  const lang = $('select-lm-lang').value;

  show('view-generating-lm');
  cycleGeneratingLmMessages();

  try {
    const body = {
      jobId: currentJobId,
      tone,
      length,
      lang,
    };
    // Inclure le CV sélectionné pour l'analyse, si dispo
    if (selectedCvRef) {
      body.cvRef = selectedCvRef;
    }

    const res = await fetch(`${JEAN_API_BASE}/api/extension/generate-lm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSessionToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const result = await res.json();

    // Recharger la liste des LM pour inclure la nouvelle
    await loadAvailableLms();

    // Pré-sélectionner la nouvelle LM
    const newRef = `generated:${result.lm_id}`;
    $('select-lm').value = newRef;
    $('btn-download-lm').classList.remove('jfmj-hidden');

    // Reset toggle
    $('lm-generate-options').classList.add('jfmj-hidden');
    $('btn-generate-lm-toggle').classList.remove('jfmj-hidden');

    show('view-ats-result');

    // Petit feedback visuel : faire scroll vers la zone LM + flash
    setTimeout(() => {
      $('select-lm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  } catch (e) {
    console.error('[generate LM] erreur:', e);
    showError(e.message || "Erreur pendant la génération", 'view-ats-result');
  }
});

const GENERATING_LM_MESSAGES = [
  "Lecture de l'offre…",
  'Analyse de ton profil…',
  'Sélection des arguments les plus pertinents…',
  'Rédaction du paragraphe d\'accroche…',
  'Rédaction des arguments métier…',
  'Rédaction de la conclusion…',
  'Mise en forme finale…',
];

let generatingLmInterval = null;
function cycleGeneratingLmMessages() {
  if (generatingLmInterval) clearInterval(generatingLmInterval);
  let idx = 0;
  setText('generating-lm-message', GENERATING_LM_MESSAGES[idx]);
  generatingLmInterval = setInterval(() => {
    idx = (idx + 1) % GENERATING_LM_MESSAGES.length;
    setText('generating-lm-message', GENERATING_LM_MESSAGES[idx]);
  }, 4000);
}

// --- Helper download ---
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

// --- Vue erreur générique ---
function showError(message, returnView) {
  setText('error-message', message || 'Erreur inconnue');
  $('btn-error-retry').onclick = () => show(returnView);
  show('view-error');
}

// ============================================================
// Démarrage
// ============================================================
init();
