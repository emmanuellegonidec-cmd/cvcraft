// extension/content/content.js
// Jean find my Job — Content script France Travail (v3.0 — message au service worker)
// Session 4 — 26 avril 2026

(function () {
  'use strict';

  // ============================================================
  // CONSTANTES
  // ============================================================
  const FT_OFFER_REGEX = /^https:\/\/candidat\.francetravail\.fr\/offres\/recherche\/detail\/([A-Z0-9]+)/i;
  const BUTTON_ID = 'jfmj-capture-btn';

  // Mapping schema.org employmentType -> francais (rythme de travail)
  const WORK_SCHEDULE_MAP = {
    FULL_TIME: 'Temps plein',
    PART_TIME: 'Temps partiel',
    CONTRACTOR: 'Independant',
    TEMPORARY: 'Temporaire',
    INTERN: 'Stage',
    VOLUNTEER: 'Benevole',
    PER_DIEM: 'Vacation',
    OTHER: 'Autre'
  };

  // ============================================================
  // 1. DETECTION : sommes-nous sur une page d'offre ?
  // ============================================================
  function detectOfferPage() {
    const match = window.location.href.match(FT_OFFER_REGEX);
    return match ? match[1].toUpperCase() : null;
  }

  // ============================================================
  // 2. EXTRACTION DES DONNEES
  //    Strategie : microdata schema.org (prioritaire)
  //                + fallback texte structure pour les champs hors microdata
  // ============================================================
  function extractJobData(offerId) {
    const data = {
      source: 'francetravail',
      externalId: offerId,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      title: null,
      company: null,
      location: null,
      contractType: null,    // CDI / CDD - 12 Mois / Interim / etc. (depuis le texte FT)
      workSchedule: null,    // Temps plein / Temps partiel / Stage / etc. (depuis microdata)
      workingHours: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      description: null,
      postedAt: null,
      experienceLabel: null,
      educationLevel: null,
      qualification: null,
      industry: null,
      skills: [],
      _extractionMethod: null
    };

    // ---- 1. Microdata JobPosting ----
    const jobPostingEl = document.querySelector('[itemtype*="schema.org/JobPosting"]');
    if (jobPostingEl) {
      Object.assign(data, extractFromMicrodata(jobPostingEl));
      data._extractionMethod = 'microdata';
    }

    // ---- 2. Fallback texte (pour les champs non couverts par microdata) ----
    const textData = extractFromText();
    let usedText = false;
    for (const key in textData) {
      const isEmpty = (data[key] === null || data[key] === '' || (Array.isArray(data[key]) && data[key].length === 0));
      if (isEmpty && textData[key] !== null && textData[key] !== undefined) {
        data[key] = textData[key];
        usedText = true;
      }
    }
    if (usedText) {
      data._extractionMethod = data._extractionMethod === 'microdata' ? 'microdata+text' : 'text';
    }

    return data;
  }

  // ============================================================
  // 2A. EXTRACTION VIA MICRODATA SCHEMA.ORG
  // ============================================================
  function extractFromMicrodata(root) {
    const r = {};

    // Titre
    const titleEl = root.querySelector('[itemprop="title"]');
    if (titleEl) r.title = cleanText(titleEl.textContent);

    // Lieu : on prend [itemprop="address"] (plus precis), sinon jobLocation
    const locEl = root.querySelector('[itemprop="jobLocation"]');
    if (locEl) {
      const addrEl = locEl.querySelector('[itemprop="address"]') || locEl;
      r.location = cleanText(addrEl.textContent.split('\n')[0]);
    }

    // Date de publication
    const dateEl = root.querySelector('[itemprop="datePosted"]');
    if (dateEl) {
      const isoAttr = dateEl.getAttribute('content') || dateEl.getAttribute('datetime');
      if (isoAttr) {
        r.postedAt = isoAttr;
      } else {
        const txt = cleanText(dateEl.textContent);
        const match = txt.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (match) {
          r.postedAt = parseFrenchDate(match[1], match[2], match[3]);
        } else {
          r.postedAt = txt;
        }
      }
    }

    // Description
    const descEl = root.querySelector('[itemprop="description"]');
    if (descEl) r.description = cleanText(descEl.textContent);

    // Heures de travail
    const hoursEl = root.querySelector('[itemprop="workHours"]');
    if (hoursEl) r.workingHours = cleanText(hoursEl.textContent.replace(/\s*\n\s*/g, ' • '));

    // Rythme de travail (FULL_TIME / PART_TIME / etc.) -> workSchedule en francais
    const empTypeEl = root.querySelector('[itemprop="employmentType"]');
    if (empTypeEl) {
      const raw = (cleanText(empTypeEl.textContent) || cleanText(empTypeEl.getAttribute('content') || '')).toUpperCase();
      if (raw && WORK_SCHEDULE_MAP[raw]) {
        r.workSchedule = WORK_SCHEDULE_MAP[raw];
      } else if (raw) {
        r.workSchedule = raw; // valeur brute si pas mappee
      }
    }

    // Salaire
    const salaryEl = root.querySelector('[itemprop="baseSalary"]');
    if (salaryEl) {
      const minEl = salaryEl.querySelector('[itemprop="minValue"]');
      const maxEl = salaryEl.querySelector('[itemprop="maxValue"]');
      const valEl = salaryEl.querySelector('[itemprop="value"]');
      const curEl = salaryEl.querySelector('[itemprop="currency"]');
      const unitEl = salaryEl.querySelector('[itemprop="unitText"]');

      const min = readNumericMicrodata(minEl);
      const max = readNumericMicrodata(maxEl);
      const val = readNumericMicrodata(valEl);

      if (min !== null) r.salaryMin = min;
      if (max !== null) r.salaryMax = max;
      if (val !== null && (r.salaryMin === undefined || r.salaryMin === null)) {
        r.salaryMin = val;
        r.salaryMax = val;
      }
      if (curEl) {
        r.salaryCurrency = cleanText(curEl.textContent) || cleanText(curEl.getAttribute('content') || '') || null;
      }
      if (unitEl) {
        r.salaryPeriod = cleanText(unitEl.textContent) || cleanText(unitEl.getAttribute('content') || '') || null;
      }
    }

    // Qualification
    const qualEl = root.querySelector('[itemprop="qualifications"]');
    if (qualEl) r.qualification = cleanText(qualEl.textContent);

    // Secteur
    const indEl = root.querySelector('[itemprop="industry"]');
    if (indEl) r.industry = cleanText(indEl.textContent);

    // Experience requise
    const expEl = root.querySelector('[itemprop="experienceRequirements"]');
    if (expEl) r.experienceLabel = cleanText(expEl.textContent);

    // Competences (plusieurs)
    const skillEls = root.querySelectorAll('[itemprop="skills"]');
    if (skillEls.length > 0) {
      r.skills = Array.from(skillEls)
        .map(function (e) { return cleanText(e.textContent); })
        .filter(Boolean);
    }

    // Entreprise
    const orgEl = root.querySelector('[itemprop="hiringOrganization"]');
    if (orgEl) {
      const nameEl = orgEl.querySelector('[itemprop="name"]');
      const nameTxt = nameEl ? cleanText(nameEl.textContent) : '';
      if (nameTxt) r.company = nameTxt;
    }

    return r;
  }

  function readNumericMicrodata(el) {
    if (!el) return null;
    const txt = cleanText(el.textContent) || cleanText(el.getAttribute('content') || '');
    if (!txt) return null;
    const num = parseFloat(txt.replace(',', '.').replace(/[^\d.\-]/g, ''));
    return isNaN(num) ? null : num;
  }

  function parseFrenchDate(day, monthName, year) {
    const months = {
      'janvier': '01', 'fevrier': '02', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'aout': '08', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12', 'décembre': '12'
    };
    const m = months[monthName.toLowerCase()];
    if (!m) return null;
    const d = String(parseInt(day, 10)).padStart(2, '0');
    return year + '-' + m + '-' + d;
  }

  function cleanText(s) {
    if (!s) return '';
    return s.replace(/\s+/g, ' ').trim();
  }

  // ============================================================
  // 2B. EXTRACTION VIA TEXTE STRUCTURE (fallback)
  // ============================================================
  function extractFromText() {
    const r = {
      contractType: null,
      educationLevel: null,
      company: null
    };

    const bodyText = (document.body && document.body.innerText) || '';

    // Type de contrat (CDI / CDD - 12 Mois / Interim / etc.)
    const contractMatch = bodyText.match(/Type de contrat\s*[:\n]+\s*([^\n]+(?:\n[^\n:]+)?)/i);
    if (contractMatch) {
      const parts = contractMatch[1].split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      r.contractType = parts.join(' - ');
    }

    // Formation
    const formationMatch = bodyText.match(/Formation\s*\n+\s*([^\n]+)/i);
    if (formationMatch) {
      r.educationLevel = formationMatch[1].trim();
    }

    // Entreprise
    const employerMatch = bodyText.match(/Employeur\s*\n+\s*([^\n]+)/i);
    if (employerMatch) {
      const candidate = employerMatch[1].trim();
      if (candidate && !candidate.match(/^Voir la page|^#/i)) {
        r.company = candidate;
      }
    }

    return r;
  }

  // ============================================================
  // 3. BOUTON FLOTTANT
  // ============================================================
  function injectFloatingButton(offerId) {
    if (document.getElementById(BUTTON_ID)) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Capturer cette offre dans Jean find my Job');

    const icon = document.createElement('span');
    icon.className = 'jfmj-btn-icon';
    icon.textContent = '📋';

    const label = document.createElement('span');
    label.className = 'jfmj-btn-label';
    label.textContent = 'Capturer cette offre';

    btn.appendChild(icon);
    btn.appendChild(label);

    btn.addEventListener('click', function () {
      handleCaptureClick(offerId, btn, label);
    });

    document.body.appendChild(btn);
  }

  // ============================================================
  // 4. CLIC SUR "CAPTURER" → ENVOI AU SERVICE WORKER (session 4)
  // ============================================================
  function handleCaptureClick(offerId, btn, label) {
    btn.classList.add('jfmj-loading');
    btn.disabled = true;
    label.textContent = 'Capture…';

    try {
      const data = extractJobData(offerId);

      // ---- Logs console (utiles pour le debug, conserves de la session 3) ----
      console.group('%c[Jean find my Job] 📋 Offre capturée', 'background:#F5C400;color:#111;font-weight:bold;padding:2px 6px;');
      console.log('🆔 ID externe :', data.externalId);
      console.log('📌 Titre :', data.title);
      console.log('🏢 Entreprise :', data.company);
      console.log('📍 Lieu :', data.location);
      console.log('📝 Type de contrat :', data.contractType);
      console.log('🕐 Rythme de travail :', data.workSchedule);
      console.log('⏱️  Durée / horaires :', data.workingHours);
      console.log('💰 Salaire :', data.salaryMin, '-', data.salaryMax, data.salaryCurrency, '/', data.salaryPeriod);
      console.log('📅 Publié/actualisé le :', data.postedAt);
      console.log('🎓 Formation :', data.educationLevel);
      console.log('💼 Expérience :', data.experienceLabel);
      console.log('🏷️  Qualification :', data.qualification);
      console.log('🏭 Secteur :', data.industry);
      console.log('🛠️  Compétences (' + (data.skills ? data.skills.length : 0) + ') :', data.skills);
      console.log('📄 Description (extrait) :', data.description ? data.description.slice(0, 200) + '…' : null);
      console.log('🔧 Méthode d\'extraction :', data._extractionMethod);
      console.log('📦 Objet complet :', data);
      console.groupEnd();

      // ---- Envoi au service worker pour ouverture du side panel ----
      chrome.runtime.sendMessage(
        { type: 'JFMJ_CAPTURE_OFFER', data: data },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error('[Jean] Erreur sendMessage :', chrome.runtime.lastError);
            showButtonError(btn, label, '✗ Erreur');
            return;
          }

          if (response && response.ok) {
            // Le side panel est ouvert : feedback succès sur le bouton
            btn.classList.remove('jfmj-loading');
            btn.classList.add('jfmj-success');
            label.textContent = '✓ Panel ouvert';
            setTimeout(function () {
              btn.classList.remove('jfmj-success');
              label.textContent = 'Capturer cette offre';
              btn.disabled = false;
            }, 2200);
          } else {
            console.error('[Jean] Service worker n\'a pas pu ouvrir le panel :', response);
            showButtonError(btn, label, '✗ Panel KO');
          }
        }
      );
    } catch (e) {
      console.error('[Jean] Erreur capture :', e);
      showButtonError(btn, label, '✗ Erreur');
    }
  }

  function showButtonError(btn, label, txt) {
    btn.classList.remove('jfmj-loading');
    btn.classList.add('jfmj-error');
    label.textContent = txt;
    setTimeout(function () {
      btn.classList.remove('jfmj-error');
      label.textContent = 'Capturer cette offre';
      btn.disabled = false;
    }, 2200);
  }

  // ============================================================
  // 5. INIT
  // ============================================================
  function init() {
    const offerId = detectOfferPage();
    if (!offerId) return;

    if (document.body) {
      injectFloatingButton(offerId);
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        injectFloatingButton(offerId);
      });
    }
  }

  init();
})();