// extension/content/content.js
// Jean find my Job — Content script France Travail
// Session 3 — 26 avril 2026

(function () {
  'use strict';

  // ============================================================
  // CONSTANTES
  // ============================================================
  const FT_OFFER_REGEX = /^https:\/\/candidat\.francetravail\.fr\/offres\/recherche\/detail\/([A-Z0-9]+)/i;
  const BUTTON_ID = 'jfmj-capture-btn';

  // ============================================================
  // 1. DETECTION : sommes-nous sur une page d'offre ?
  // ============================================================
  function detectOfferPage() {
    const match = window.location.href.match(FT_OFFER_REGEX);
    return match ? match[1].toUpperCase() : null;
  }

  // ============================================================
  // 2. EXTRACTION DES DONNEES (JSON-LD prioritaire + DOM fallback)
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
      contractType: null,
      workingHours: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      description: null,
      postedAt: null,
      experienceMonths: null,
      educationLevel: null,
      industry: null,
      _extractionMethod: null
    };

    // Niveau 1 : JSON-LD
    const jsonLdData = extractFromJsonLd();
    if (jsonLdData) {
      Object.assign(data, jsonLdData);
      data._extractionMethod = 'json-ld';
    }

    // Niveau 2 : DOM (complète les trous)
    const domData = extractFromDom();
    let usedDom = false;
    for (const key in domData) {
      if ((data[key] === null || data[key] === undefined) && domData[key] !== null) {
        data[key] = domData[key];
        usedDom = true;
      }
    }
    if (usedDom) {
      data._extractionMethod = data._extractionMethod === 'json-ld' ? 'mixed' : 'dom';
    }

    return data;
  }

  // ---------- JSON-LD ----------
  function extractFromJsonLd() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        let parsed;
        try {
          parsed = JSON.parse(script.textContent);
        } catch (e) {
          continue;
        }
        const candidates = Array.isArray(parsed) ? parsed : [parsed];
        for (const obj of candidates) {
          if (!obj) continue;
          const type = obj['@type'];
          const isJobPosting =
            type === 'JobPosting' ||
            (Array.isArray(type) && type.includes('JobPosting'));
          if (isJobPosting) {
            return parseJobPosting(obj);
          }
        }
      }
    } catch (e) {
      console.warn('[Jean] Erreur extraction JSON-LD :', e);
    }
    return null;
  }

  function parseJobPosting(jp) {
    const r = {};

    if (jp.title) r.title = String(jp.title).trim();

    if (jp.description) {
      const tmp = document.createElement('div');
      tmp.innerHTML = jp.description;
      r.description = tmp.textContent.trim();
    }

    if (jp.datePosted) r.postedAt = String(jp.datePosted);

    if (jp.employmentType) {
      r.contractType = mapEmploymentType(jp.employmentType);
    }

    if (jp.hiringOrganization) {
      r.company = jp.hiringOrganization.name || null;
    }

    if (jp.jobLocation) {
      const loc = Array.isArray(jp.jobLocation) ? jp.jobLocation[0] : jp.jobLocation;
      if (loc && loc.address) {
        const a = loc.address;
        const parts = [a.addressLocality, a.postalCode, a.addressRegion, a.addressCountry].filter(Boolean);
        r.location = parts.join(', ');
      }
    }

    if (jp.baseSalary) {
      const bs = jp.baseSalary;
      r.salaryCurrency = bs.currency || null;
      if (bs.value && typeof bs.value === 'object') {
        if (bs.value.minValue) r.salaryMin = parseFloat(bs.value.minValue);
        if (bs.value.maxValue) r.salaryMax = parseFloat(bs.value.maxValue);
        if (bs.value.value && r.salaryMin === undefined) {
          r.salaryMin = parseFloat(bs.value.value);
          r.salaryMax = parseFloat(bs.value.value);
        }
        if (bs.value.unitText) r.salaryPeriod = String(bs.value.unitText);
      }
    }

    if (jp.industry) r.industry = String(jp.industry);

    if (jp.experienceRequirements) {
      const exp = jp.experienceRequirements;
      if (typeof exp === 'object' && exp.monthsOfExperience) {
        r.experienceMonths = parseInt(exp.monthsOfExperience, 10);
      } else if (typeof exp === 'string') {
        const m = exp.match(/(\d+)\s*an/i);
        if (m) r.experienceMonths = parseInt(m[1], 10) * 12;
      }
    }

    if (jp.educationRequirements) {
      const edu = jp.educationRequirements;
      if (typeof edu === 'object' && edu.credentialCategory) {
        r.educationLevel = String(edu.credentialCategory);
      } else if (typeof edu === 'string') {
        r.educationLevel = edu;
      }
    }

    return r;
  }

  function mapEmploymentType(type) {
    const types = Array.isArray(type) ? type : [type];
    const mapping = {
      FULL_TIME: 'Temps plein',
      PART_TIME: 'Temps partiel',
      CONTRACTOR: 'Independant',
      TEMPORARY: 'Interim / CDD',
      INTERN: 'Stage',
      VOLUNTEER: 'Benevole',
      PER_DIEM: 'Vacation',
      OTHER: 'Autre'
    };
    return types.map(function (t) { return mapping[t] || t; }).join(', ');
  }

  // ---------- DOM fallback ----------
  function extractFromDom() {
    const r = {
      title: null,
      company: null,
      location: null,
      contractType: null,
      workingHours: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      description: null,
      postedAt: null
    };

    // Titre : H1 (en retirant le prefixe "Offre n° XXXXX" si present)
    const h1 = document.querySelector('h1');
    if (h1) {
      r.title = h1.textContent.replace(/^\s*Offre\s+n[°ºo]\s*[A-Z0-9]+\s*/i, '').trim();
    }

    // Texte global de la page pour les regex
    const bodyText = (document.body && document.body.innerText) || '';

    // Type de contrat : "Type de contrat\n: CDI"
    const contractMatch = bodyText.match(/Type de contrat\s*[:\n]+\s*([^\n]+)/i);
    if (contractMatch) r.contractType = contractMatch[1].trim();

    // Duree du travail : "37H/semaine"
    const hoursMatch = bodyText.match(/Dur[ée]e du travail\s*[:\n]+\s*(\d+\s*H[^\n]*)/i);
    if (hoursMatch) r.workingHours = hoursMatch[1].trim();

    // Salaire annuel : "Annuel de 40000.0 Euros à 43000.0 Euros"
    const salaryMatch = bodyText.match(/Annuel de\s*([\d.,]+)\s*Euros?\s*(?:[àa]\s*([\d.,]+)\s*Euros?)?/i);
    if (salaryMatch) {
      r.salaryMin = parseFloat(salaryMatch[1].replace(',', '.'));
      r.salaryMax = salaryMatch[2] ? parseFloat(salaryMatch[2].replace(',', '.')) : r.salaryMin;
      r.salaryCurrency = 'EUR';
    }

    // Date de publication / actualisation : "Actualisé le 23 avril 2026"
    const postedMatch = bodyText.match(/Actualis[ée] le\s*(\d{1,2}\s+\w+\s+\d{4})/i);
    if (postedMatch) r.postedAt = postedMatch[1].trim();

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

  function handleCaptureClick(offerId, btn, label) {
    btn.classList.add('jfmj-loading');
    btn.disabled = true;
    label.textContent = 'Capture…';

    try {
      const data = extractJobData(offerId);

      console.group('%c[Jean find my Job] 📋 Offre capturée', 'background:#F5C400;color:#111;font-weight:bold;padding:2px 6px;');
      console.log('🆔 ID externe :', data.externalId);
      console.log('📌 Titre :', data.title);
      console.log('🏢 Entreprise :', data.company);
      console.log('📍 Lieu :', data.location);
      console.log('📝 Contrat :', data.contractType);
      console.log('⏱️ Durée :', data.workingHours);
      console.log('💰 Salaire :', data.salaryMin, '-', data.salaryMax, data.salaryCurrency, '/', data.salaryPeriod);
      console.log('📅 Publié/actualisé le :', data.postedAt);
      console.log('🎓 Formation :', data.educationLevel);
      console.log('💼 Expérience (mois) :', data.experienceMonths);
      console.log('🏭 Secteur :', data.industry);
      console.log('📄 Description (extrait) :', data.description ? data.description.slice(0, 200) + '…' : null);
      console.log('🔧 Méthode d\'extraction :', data._extractionMethod);
      console.log('📦 Objet complet :', data);
      console.groupEnd();

      btn.classList.remove('jfmj-loading');
      btn.classList.add('jfmj-success');
      label.textContent = '✓ Capturée !';
      setTimeout(function () {
        btn.classList.remove('jfmj-success');
        label.textContent = 'Capturer cette offre';
        btn.disabled = false;
      }, 2200);
    } catch (e) {
      console.error('[Jean] Erreur capture :', e);
      btn.classList.remove('jfmj-loading');
      btn.classList.add('jfmj-error');
      label.textContent = '✗ Erreur';
      setTimeout(function () {
        btn.classList.remove('jfmj-error');
        label.textContent = 'Capturer cette offre';
        btn.disabled = false;
      }, 2200);
    }
  }

  // ============================================================
  // 4. INIT
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
