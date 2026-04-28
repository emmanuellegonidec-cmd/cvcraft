// extension/content/scrapers/linkedin.js
// Jean find my Job — Scraper LinkedIn (session 8 + fix post-session 9 — v0.9.1)
// LinkedIn 2026 : DOM 100% en classes CSS obfusquees (hashees) + systeme SDUI
// Strategie : exploiter les attributs semantiques componentkey (stables) + heuristiques sur textes
//
// v0.9.1 (fix post-session 9) : split explicite contractType / workSchedule sur le separateur "·"
// pour eviter "CDD · Temps plein" colle dans un seul champ. Ajout d'une normalisation
// (CDI, CDD, Stage, Alternance, etc.) pour avoir une casse coherente quelle que soit
// la langue du compte LinkedIn.

(function () {
  'use strict';

  const LI_URL_REGEX = /^https:\/\/www\.linkedin\.com\/jobs\//i;
  const LOG_PREFIX = '[Jean LinkedIn]';

  function match(url) {
    if (!LI_URL_REGEX.test(url)) return null;

    // Pattern 1: /jobs/view/{id}/ (page dediee a une offre)
    const pathMatch = url.match(/\/jobs\/view\/(\d+)/i);
    if (pathMatch) return pathMatch[1];

    // Pattern 2: /jobs/collections/.../?currentJobId={id} ou /jobs/search/?currentJobId={id}
    try {
      const u = new URL(url);
      const cid = u.searchParams.get('currentJobId');
      if (cid && /^\d+$/.test(cid)) return cid;
    } catch (e) {
      // URL parsing failed
    }

    return null;
  }

  function extract(externalId) {
    console.group('%c' + LOG_PREFIX + ' Extraction offre ' + externalId, 'background:#0077B5;color:white;padding:2px 6px;font-weight:bold;');

    const data = {
      source: 'linkedin',
      externalId: externalId,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      title: null,
      company: null,
      location: null,
      contractType: null,
      workSchedule: null,
      workingHours: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      description: null,
      requirements: null,
      companyDescription: null,
      postedAt: null,
      experienceLabel: null,
      educationLevel: null,
      qualification: null,
      industry: null,
      skills: [],
      _extractionMethod: 'dom-sdui'
    };

    data.title = extractTitle();
    logResult('title', data.title);

    data.company = extractCompany();
    logResult('company', data.company);

    data.location = extractLocation();
    logResult('location', data.location);

    data.description = extractDescription();
    logResult('description', data.description, true);

    data.companyDescription = extractCompanyDescription();
    logResult('companyDescription', data.companyDescription, true);

    data.postedAt = extractPostedAt();
    logResult('postedAt', data.postedAt);

    const insights = extractInsights();
    if (insights.contractType) data.contractType = insights.contractType;
    if (insights.workSchedule) data.workSchedule = insights.workSchedule;
    if (insights.experienceLabel) data.experienceLabel = insights.experienceLabel;
    if (insights.salaryMin !== null) {
      data.salaryMin = insights.salaryMin;
      data.salaryMax = insights.salaryMax;
      data.salaryCurrency = insights.salaryCurrency;
      data.salaryPeriod = insights.salaryPeriod;
    }
    logResult('contractType', data.contractType);
    logResult('workSchedule', data.workSchedule);
    logResult('experienceLabel', data.experienceLabel);
    logResult('salary', data.salaryMin ? (data.salaryMin + '-' + data.salaryMax + ' ' + data.salaryCurrency + '/' + data.salaryPeriod) : null);

    console.groupEnd();
    return data;
  }

  function logResult(field, value, truncate) {
    if (value === null || value === undefined || value === '') {
      console.log('%c  ✗ ' + field + ' : null', 'color:#c00;');
    } else {
      let display = value;
      if (truncate && typeof value === 'string' && value.length > 100) {
        display = value.substring(0, 100) + '… (' + value.length + ' chars)';
      }
      console.log('%c  ✓ ' + field + ' :', 'color:#080;', display);
    }
  }

  // ============================================================
  // Helper : trouver le conteneur TopCard (zone titre/entreprise/lieu/date)
  // Strategie : remonter de 4-6 niveaux a partir du h1
  // ============================================================
  function getTopCardContainer() {
    const h1 = document.querySelector('h1');
    if (!h1) return document.body;
    let container = h1;
    for (let i = 0; i < 6; i++) {
      if (container.parentElement) container = container.parentElement;
      else break;
    }
    return container;
  }

  // ============================================================
  // Title : h1 d'abord (le plus fiable), fallback sur document.title
  // ============================================================
  function extractTitle() {
    const h1 = document.querySelector('h1');
    if (h1) {
      const txt = cleanInline(h1.textContent);
      if (txt && txt.length > 2 && txt.length < 250) return txt;
    }

    // Fallback : document.title nettoye
    let t = document.title || '';
    t = t.replace(/\s*\|\s*LinkedIn\s*$/i, '');
    t = t.replace(/^\s*\(\d+\+?\)\s*/, '');
    t = t.replace(/^.+?\s+(?:recrute|hiring|recherche)\s+/i, '');
    t = cleanInline(t);
    if (t && t.length > 2 && t.length < 250) return t;

    return null;
  }

  // ============================================================
  // Company : 1er <a href*="/company/"> dans la TopCard, fallback document.title
  // ============================================================
  function extractCompany() {
    const topCard = getTopCardContainer();
    const links = topCard.querySelectorAll('a[href*="/company/"]');
    for (let i = 0; i < links.length; i++) {
      const txt = cleanInline(links[i].textContent);
      if (txt && txt.length > 0 && txt.length < 100 && !/voir|view|see/i.test(txt)) {
        return txt;
      }
    }

    // Fallback global (si la TopCard n'a pas de lien company visible)
    const allLinks = document.querySelectorAll('a[href*="/company/"]');
    for (let i = 0; i < allLinks.length; i++) {
      const txt = cleanInline(allLinks[i].textContent);
      if (txt && txt.length > 0 && txt.length < 100 && !/voir|view|see/i.test(txt)) {
        return txt;
      }
    }

    // Fallback document.title : "Company recrute Title"
    const t = document.title || '';
    let m = t.match(/^(.+?)\s+(?:recrute|hiring|recherche)\s+/i);
    if (m) return cleanInline(m[1]);

    return null;
  }

  // ============================================================
  // Location : pattern geo "Ville, Region, Pays" dans la TopCard
  // ============================================================
  function extractLocation() {
    const topCard = getTopCardContainer();
    const candidates = topCard.querySelectorAll('span, div');

    // Pattern : 2-4 segments separes par virgules, chaque segment commence par majuscule
    const locationPattern = /^[A-ZÀ-Ÿ][\w\s\-'À-ÿ.()]+(?:,\s*[A-ZÀ-Ÿ][\w\s\-'À-ÿ.()]+){1,3}$/;

    for (let i = 0; i < candidates.length; i++) {
      // Ignorer les elements qui ont des enfants block (on veut le texte feuille)
      const el = candidates[i];
      const childCount = el.children.length;
      if (childCount > 2) continue;

      const txt = cleanInline(el.textContent);
      if (!txt || txt.length < 5 || txt.length > 100) continue;
      if (/candidat|applicant|personne/i.test(txt)) continue;
      if (/republication|reposted/i.test(txt)) continue;
      if (/il y a|ago/i.test(txt)) continue;
      if (/^\d+\s*\+?$/.test(txt)) continue;

      if (locationPattern.test(txt)) {
        return txt;
      }
    }
    return null;
  }

  // ============================================================
  // Description : SDUI componentkey JobDetails_AboutTheJob (NOUVEAU)
  // ============================================================
  function extractDescription() {
    const el = document.querySelector('[componentkey^="JobDetails_AboutTheJob"]');
    if (el) {
      const blocks = [];
      walk(el, blocks);
      const txt = blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
      if (txt && txt.length > 50) return txt;
    }

    // Fallbacks : anciens selecteurs (au cas ou A/B testing ou rollback LinkedIn)
    const fallbacks = [
      '[data-sdui-component*="aboutTheJob"]',
      '#job-details',
      '.jobs-description__content .jobs-box__html-content',
      '.jobs-description-content__text',
      '.jobs-description__container'
    ];
    for (let i = 0; i < fallbacks.length; i++) {
      const f = document.querySelector(fallbacks[i]);
      if (f) {
        const blocks = [];
        walk(f, blocks);
        const txt = blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
        if (txt && txt.length > 50) return txt;
      }
    }
    return null;
  }

  // ============================================================
  // CompanyDescription : SDUI componentkey JobDetails_AboutTheCompany
  // ============================================================
  function extractCompanyDescription() {
    const el = document.querySelector('[componentkey^="JobDetails_AboutTheCompany"]');
    if (el) {
      const blocks = [];
      walk(el, blocks);
      const txt = blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
      if (txt && txt.length > 50) return txt;
    }

    const fallback = document.querySelector('[data-sdui-component*="aboutTheCompany"]');
    if (fallback) {
      const blocks = [];
      walk(fallback, blocks);
      const txt = blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
      if (txt && txt.length > 50) return txt;
    }
    return null;
  }

  // ============================================================
  // PostedAt : scan textes courts dans la TopCard
  // ============================================================
  function extractPostedAt() {
    const topCard = getTopCardContainer();
    const all = topCard.querySelectorAll('span, div');
    for (let i = 0; i < all.length; i++) {
      const txt = cleanInline(all[i].textContent);
      if (!txt || txt.length > 100) continue;
      const parsed = parsePostedRelative(txt);
      if (parsed) return parsed;
    }
    return null;
  }

  function parsePostedRelative(txt) {
    const t = txt.toLowerCase();

    // FR : "Il y a 3 jours", "Il y a une semaine", "Il y a un mois"
    let m = t.match(/il y a\s+(\d+|un|une)\s+(minute|heure|jour|semaine|mois|an)/);
    if (m) {
      const n = (m[1] === 'un' || m[1] === 'une') ? 1 : parseInt(m[1], 10);
      return relativeToIso(n, m[2]);
    }

    // EN : "3 days ago", "a week ago"
    m = t.match(/(\d+|a|an)\s+(minute|hour|day|week|month|year)s?\s+ago/);
    if (m) {
      const n = (m[1] === 'a' || m[1] === 'an') ? 1 : parseInt(m[1], 10);
      return relativeToIso(n, m[2]);
    }

    return null;
  }

  function relativeToIso(n, unit) {
    const ms = {
      minute: 60 * 1000,
      heure: 3600 * 1000,
      hour: 3600 * 1000,
      jour: 86400 * 1000,
      day: 86400 * 1000,
      semaine: 7 * 86400 * 1000,
      week: 7 * 86400 * 1000,
      mois: 30 * 86400 * 1000,
      month: 30 * 86400 * 1000,
      an: 365 * 86400 * 1000,
      year: 365 * 86400 * 1000
    };
    const offset = ms[unit];
    if (!offset) return null;
    return new Date(Date.now() - n * offset).toISOString();
  }

  // ============================================================
  // Insights : contractType, workSchedule, experienceLabel, salary
  // Scan tous les textes courts du body, applique les regex keywords
  //
  // v0.9.1 : split explicite sur "·" (point median LinkedIn) avant regex pour
  // garantir que "CDD · Temps plein" se traduit en contractType="CDD" +
  // workSchedule="Temps plein" sans collision possible.
  // ============================================================
  function extractInsights() {
    const result = {
      contractType: null,
      workSchedule: null,
      experienceLabel: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null
    };

    const topCard = getTopCardContainer();
    const all = topCard.querySelectorAll('span, div, button, li');

    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.children.length > 3) continue;
      const txt = cleanInline(el.textContent);
      if (!txt || txt.length < 2 || txt.length > 200) continue;

      // NOUVEAU v0.9.1 : split sur le separateur LinkedIn "·" (point median U+00B7)
      // ou "•" (bullet U+2022) si present. Sinon on traite le texte entier comme une
      // seule partie. Cela evite que "CDD · Temps plein" tombe dans un seul champ.
      const parts = txt.split(/\s*[·•]\s*/).map(function (p) { return cleanInline(p); }).filter(Boolean);
      const segments = parts.length > 1 ? parts : [txt];

      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s];

        if (!result.contractType) {
          const m = seg.match(/\b(CDI|CDD|Stage|Alternance|Freelance|Permanent|Contract|Internship|Apprenticeship|Temporaire|Independant|Interim|Intérim)\b/i);
          if (m) result.contractType = normalizeContractType(m[0]);
        }

        if (!result.workSchedule) {
          if (/temps partiel|part[- ]?time/i.test(seg)) result.workSchedule = 'Temps partiel';
          else if (/temps plein|full[- ]?time/i.test(seg)) result.workSchedule = 'Temps plein';
        }

        if (!result.experienceLabel) {
          const m = seg.match(/\b(Premier emploi|Stagiaire|Junior|Confirmé|Sénior|Senior|Cadre dirigeant|Entry level|Associate|Mid[- ]Senior level|Director|Executive|Internship|Expérimenté)\b/i);
          if (m) result.experienceLabel = m[0];
        }

        if (result.salaryMin === null) {
          const sal = parseSalaryFromText(seg);
          if (sal) {
            result.salaryMin = sal.min;
            result.salaryMax = sal.max;
            result.salaryCurrency = sal.currency;
            result.salaryPeriod = sal.period;
          }
        }
      }
    }

    return result;
  }

  // ============================================================
  // Normalisation du contractType : casse coherente quelle que soit
  // la langue du compte LinkedIn (FR/EN). On retombe toujours sur
  // les memes valeurs canoniques cote Jean.
  // ============================================================
  function normalizeContractType(raw) {
    const v = (raw || '').trim();
    if (/^cdi$/i.test(v) || /^permanent$/i.test(v)) return 'CDI';
    if (/^cdd$/i.test(v)) return 'CDD';
    if (/^stage$/i.test(v) || /^internship$/i.test(v)) return 'Stage';
    if (/^alternance$/i.test(v) || /^apprenticeship$/i.test(v)) return 'Alternance';
    if (/^freelance$/i.test(v) || /^independant$/i.test(v)) return 'Freelance';
    if (/^contract$/i.test(v) || /^temporaire$/i.test(v)) return 'Temporaire';
    if (/^interim$/i.test(v) || /^intérim$/i.test(v)) return 'Intérim';
    // Fallback : capitalisation simple
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }

  function parseSalaryFromText(text) {
    let currency = null;
    if (/€|EUR/.test(text)) currency = 'EUR';
    else if (/\$|USD/.test(text)) currency = 'USD';
    else if (/£|GBP/.test(text)) currency = 'GBP';
    else return null;

    // Range avec K
    let m = text.match(/(\d+(?:[.,]\d+)?)\s*[Kk]\s*[€$£]?\s*(?:[-–—]|à|to)\s*(\d+(?:[.,]\d+)?)\s*[Kk]/i);
    if (m) {
      return {
        min: parseFloat(m[1].replace(',', '.')) * 1000,
        max: parseFloat(m[2].replace(',', '.')) * 1000,
        currency: currency,
        period: detectPeriod(text)
      };
    }

    // Range avec nombres complets
    m = text.match(/(\d{1,3}(?:[\s,.]\d{3})+)\s*[€$£]?\s*(?:[-–—]|à|to)\s*(\d{1,3}(?:[\s,.]\d{3})+)/i);
    if (m) {
      return {
        min: parseInt(m[1].replace(/[\s,.]/g, ''), 10),
        max: parseInt(m[2].replace(/[\s,.]/g, ''), 10),
        currency: currency,
        period: detectPeriod(text)
      };
    }

    return null;
  }

  function detectPeriod(text) {
    const t = text.toLowerCase();
    if (/\bpar\s+an\b|\/\s*an\b|\/yr\b|\bper\s+year\b|annual/i.test(t)) return 'YEAR';
    if (/\bpar\s+mois\b|\/\s*mois\b|\/mo\b|\bper\s+month\b|monthly/i.test(t)) return 'MONTH';
    if (/\bpar\s+jour\b|\/\s*jour\b|\bper\s+day\b|daily/i.test(t)) return 'DAY';
    if (/\bpar\s+heure\b|\/\s*h\b|\/hr\b|\bper\s+hour\b|hourly/i.test(t)) return 'HOUR';
    return 'YEAR';
  }

  // ============================================================
  // Walker recursif (meme contrat que WTJ et FT)
  // ============================================================
  function walk(n, out) {
    if (!n) return;
    if (n.nodeType === 3) return;

    const tag = n.tagName;

    if (tag === 'UL' || tag === 'OL') {
      const items = n.querySelectorAll(':scope > li');
      const itemLines = [];
      for (let i = 0; i < items.length; i++) {
        const t = cleanInline(items[i].textContent);
        if (t) itemLines.push('• ' + t);
      }
      if (itemLines.length > 0) {
        out.push(itemLines.join('\n'));
      }
      return;
    }

    if (tag === 'P') {
      const clone = n.cloneNode(true);
      const brs = clone.querySelectorAll('br');
      for (let i = 0; i < brs.length; i++) {
        brs[i].replaceWith('\n');
      }
      const t = cleanInline(clone.textContent);
      if (t) out.push(t);
      return;
    }

    if (tag === 'BR' || tag === 'STYLE' || tag === 'SCRIPT' || tag === 'BUTTON' || tag === 'SVG') return;

    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      walk(kids[i], out);
    }
  }

  function cleanInline(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // Enregistrement dans le namespace global JFMJ
  window.JFMJ_SCRAPERS = window.JFMJ_SCRAPERS || {};
  window.JFMJ_SCRAPERS.linkedin = {
    name: 'linkedin',
    label: 'LinkedIn',
    match: match,
    extract: extract
  };

  console.log(LOG_PREFIX + ' Scraper LinkedIn v0.9.1 charge');
})();
