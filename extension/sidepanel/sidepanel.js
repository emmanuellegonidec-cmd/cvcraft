// ============================================================
// Jean find my Job — Side panel logic
// Session 9bis-bis v0.9.2 :
//   - 🆕 Dropdown CV en 2 groupes : ⭐ Mes favoris + 📋 Tous mes CV
//   - 🆕 Plus de pré-sélection auto (placeholder "— Choisis un CV —")
//   - 🆕 Bouton "Lancer l'analyse" désactivé tant qu'aucun CV n'est choisi
//   - 🆕 Lecture data.all (nouveau format de la route extension/user-documents)
// Session 7 v0.7.0 :
//   - Bouton "✓ J'ai postulé" → marque la candidature comme postulée
//   - Création automatique d'une relance à J+7
//   - Vue de succès dédiée après mark-applied
// Session 6 v0.6.1 (final2) :
//   - Zone documents simplifiée : télécharger CV + bouton "Optimiser mon CV"
//   - LM retirée (sera côté Jean web uniquement)
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
// Analyse CV vs offre
// ============================================================
$('btn-analyze-from-success')?.addEventListener('click', () => startAnalysisFlow());
$('btn-analyze-from-exists')?.addEventListener('click', () => startAnalysisFlow());
$('btn-cancel-analysis')?.addEventListener('click', () => show('view-success'));
$('btn-back-to-success')?.addEventListener('click', () => show('view-success'));

async function startAnalysisFlow() {
  show('view-loading');

  try {
    const res = await fetch(`${JEAN_API_BASE}/api/extension/user-documents`, {
      headers: { 'Authorization': `Bearer ${currentSessionToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    // Session 9bis-bis : on lit data.all (nouveau) avec fallback data.cvs (ancien)
    const allCvs = Array.isArray(data.all) ? data.all : (data.cvs || []);
    const favoriteCvs = Array.isArray(data.favorites) ? data.favorites : allCvs.filter(c => c.is_favorite);

    const analyzableCvs = allCvs.filter(c => c.is_analyzable);

    if (analyzableCvs.length === 0) {
      show('view-no-cv');
      return;
    }

    // Si un seul CV analysable, on saute la dropdown
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
    showError(e.message || 'Erreur de chargement des CV', 'view-success');
  }
}

// Session 9bis-bis : dropdown en 2 groupes (favoris + tous), pas de pré-sélection auto
function populateCvChooser(allCvs, favoriteCvs) {
  const select = $('select-cv');
  select.innerHTML = '';

  // Placeholder en 1ère position (forcer un choix volontaire)
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— Choisis un CV —';
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  // Groupe 1 : ⭐ Mes favoris
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

  // Groupe 2 : 📋 Tous mes CV (sauf ceux déjà dans favoris)
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

  // Bouton "Lancer l'analyse" désactivé tant que pas de choix
  const launchBtn = $('btn-launch-analysis');
  if (launchBtn) {
    launchBtn.disabled = true;
    launchBtn.dataset.originalText = launchBtn.dataset.originalText || launchBtn.textContent;
  }

  // Activer le bouton dès qu'un CV valide est choisi
  select.addEventListener('change', () => {
    if (launchBtn) {
      launchBtn.disabled = !select.value;
    }
  });
}

$('btn-launch-analysis')?.addEventListener('click', () => {
  const select = $('select-cv');
  if (!select.value) {
    return; // Pas de CV choisi, on ignore
  }
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

    const data = await res.json();
    const atsPayload = data.result || data;
    renderAtsResult(atsPayload);

    show('view-ats-result');
  } catch (e) {
    console.error('[analyse - launch] erreur:', e);
    showError(e.message || "Erreur pendant l'analyse", 'view-success');
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
    const fileName = filePath.split('/').pop() || 'cv.pdf';
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
// SESSION 7 v0.7.0 — Bouton "✓ J'ai postulé"
// → Marque la candidature comme postulée dans Jean
// → Crée automatiquement une action de relance à J+7
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

    const data = await res.json();

    // Format date FR (ex: "4 mai 2026")
    let relanceDateLabel = 'J+7';
    if (data.relance_date) {
      try {
        const d = new Date(data.relance_date + 'T00:00:00');
        relanceDateLabel = d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch (_) {
        relanceDateLabel = data.relance_date;
      }
    }
    setText('applied-relance-date', relanceDateLabel);
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
