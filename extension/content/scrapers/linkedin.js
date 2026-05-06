// extension/content/scrapers/linkedin.js
// Jean find my Job — Scraper LinkedIn (session 8 + fixes post-session 9 — v0.9.4)
// Session 10 Bloc 1 — Ajout du champ informationsComplementaires
// Session 10 Bloc 2 — Fix description : preservation des sauts de ligne issus des <br> dans les <p>
//                     (supersede par Bloc 5 ci-dessous)
// Session 10 Bloc 3 — Fix salaire : regex etendue pour gerer le suffixe periode
//                     (/yr, /mo, /h, /an, /mois) entre la devise et le separateur.
//                     Format LinkedIn 2026 : "50K €/yr - 54K €/yr"
// Session 10 Bloc 4 — Fix lieu : filtres anti-parasites pour rejeter les chaines aberrantes
//                     type "Selectionne, Growth marketingGrowth marketingWebynLevallois-Perret".
//                     1) Rejet des chaines contenant "Selectionne"/"Selected" (label sidebar).
//                     2) Rejet des chaines avec mots colles ([minuscule][MAJUSCULE] sans separateur).
//                     3) Longueur max reduite de 100 a 80 caracteres.
// Session 10 Bloc 5 — Refonte du walker pour preserver la mise en page de la description.
//                     Avant : seuls <p> et <ul>/<ol> etaient traites, les noeuds texte directs
//                     etaient ignores, les <h3>/<div>/<section> ne faisaient pas separateur.
//                     Resultat : titres de section colles aux paragraphes ("...go-to-market.
//                     Indicateurs de succesPipeline...").
//                     Apres : 1) noeuds texte traites, 2) tags block (<p>, <div>, <h1-6>,
//                     <section>, <article>, <blockquote>) entoures de \n, 3) <br> partout
//                     converti en \n, 4) tags inline (<span>, <strong>, <em>) en texte continu,
//                     5) tags parasites ignores (<style>, <script>, <button>, <svg>, <iframe>).
//                     Nouvel API : walk(node, acc) ou acc = {text: ''} (au lieu d'un array
//                     de blocs joints par \n\n).
//
// LinkedIn 2026 : DOM 100% en classes CSS obfusquees (hashees) + systeme SDUI

(function () {
  'use strict';

  const LI_URL_REGEX = /^https:\/\/www\.linkedin\.com\/jobs\//i;
  const LOG_PREFIX = '[Jean LinkedIn]';

  // Session 10 Bloc 5 : tags reconnus comme block (entoures de \n) ou inline (texte continu).
  // Tout tag non liste ici (et non dans SKIP_TAGS) est traite comme inline par defaut.
  const BLOCK_TAGS = new Set([
    'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'PRE',
    'HEADER', 'FOOTER', 'NAV', 'ASIDE',
    'TR', 'TD', 'TH', 'TBODY', 'THEAD', 'TFOOT', 'TABLE',
    'FIGURE', 'FIGCAPTION', 'HR'
  ]);

  // Session 10 Bloc 5 : tags ignores (contenu et descendants non parcourus).
  const SKIP_TAGS = new Set([
    'STYLE', 'SCRIPT', 'BUTTON', 'SVG', 'NOSCRIPT', 'IFRAME', 'IMG', 'CANVAS', 'VIDEO', 'AUDIO'
  ]);

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
      informationsComplementaires: null,
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

    // Session 10 : construction du texte "Informations complementaires"
    data.informationsComplementaires = buildInformationsComplementaires(data);
    logResult('informationsComplementaires', data.informationsComplementaires, true);

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
  // Session 10 Bloc 4 : ajout de 3 filtres anti-parasites
  // ============================================================
  function extractLocation() {
    const topCard = getTopCardContainer();
    const candidates = topCard.querySelectorAll('span, div');

    // Pattern : 2-4 segments separes par virgules, chaque segment commence par majuscule
    const locationPattern = /^[A-ZÀ-Ÿ][\w\s\-'À-ÿ.()]+(?:,\s*[A-ZÀ-Ÿ][\w\s\-'À-ÿ.()]+){1,3}$/;

    // Session 10 Bloc 4 : detecte les mots colles (ex: "marketingGrowth", "WebynLevallois")
    // qui apparaissent quand textContent aplatit plusieurs spans adjacents en un seul bloc.
    // [minuscule][MAJUSCULE] sans separateur entre = signal d'une concatenation aberrante.
    // Note : "Ile-de-France", "Levallois-Perret", "Saint-Etienne" ne matchent pas car les
    // tirets servent de separateurs, donc pas de risque de faux positifs sur de vrais lieux.
    const concatenatedWordsPattern = /[a-zà-ÿ][A-ZÀ-Ÿ]/;

    for (let i = 0; i < candidates.length; i++) {
      // Ignorer les elements qui ont des enfants block (on veut le texte feuille)
      const el = candidates[i];
      const childCount = el.children.length;
      if (childCount > 2) continue;

      const txt = cleanInline(el.textContent);

      // Session 10 Bloc 4 : longueur max reduite de 100 a 80 caracteres
      if (!txt || txt.length < 5 || txt.length > 80) continue;

      if (/candidat|applicant|personne/i.test(txt)) continue;
      if (/republication|reposted/i.test(txt)) continue;
      if (/il y a|ago/i.test(txt)) continue;
      if (/^\d+\s*\+?$/.test(txt)) continue;

      // Session 10 Bloc 4 : filtre anti-parasite #1 ("Selectionne"/"Selected")
      if (/sélectionné|selected/i.test(txt)) continue;

      // Session 10 Bloc 4 : filtre anti-parasite #2 (mots colles)
      if (concatenatedWordsPattern.test(txt)) continue;

      if (locationPattern.test(txt)) {
        return txt;
      }
    }
    return null;
  }

  // ============================================================
  // Description : SDUI componentkey JobDetails_AboutTheJob
  // Session 10 Bloc 5 : utilise le nouveau walker rich-text.
  // ============================================================
  function extractDescription() {
    const el = document.querySelector('[componentkey^="JobDetails_AboutTheJob"]');
    if (el) {
      const txt = extractRichText(el);
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
        const txt = extractRichText(f);
        if (txt && txt.length > 50) return txt;
      }
    }
    return null;
  }

  // ============================================================
  // CompanyDescription : SDUI componentkey JobDetails_AboutTheCompany
  // Session 10 Bloc 5 : utilise le nouveau walker rich-text.
  // ============================================================
  function extractCompanyDescription() {
    const el = document.querySelector('[componentkey^="JobDetails_AboutTheCompany"]');
    if (el) {
      const txt = extractRichText(el);
      if (txt && txt.length > 50) return txt;
    }

    const fallback = document.querySelector('[data-sdui-component*="aboutTheCompany"]');
    if (fallback) {
      const txt = extractRichText(fallback);
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

      // Split sur le separateur LinkedIn "·" (point median U+00B7) ou "•" (bullet U+2022)
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
          // Session 10 Bloc 3 : on passe le segment ENTIER
          const sal = parseSalaryFromText(seg);
          if (sal) {
            result.salaryMin = sal.min;
            result.salaryMax = sal.max;
            result.salaryCurrency = sal.currency;
            result.salaryPeriod = sal.period;
          }
        }
      }

      // Session 10 Bloc 3 : fallback sur le texte complet
      if (result.salaryMin === null) {
        const sal = parseSalaryFromText(txt);
        if (sal) {
          result.salaryMin = sal.min;
          result.salaryMax = sal.max;
          result.salaryCurrency = sal.currency;
          result.salaryPeriod = sal.period;
        }
      }
    }

    return result;
  }

  function normalizeContractType(raw) {
    const v = (raw || '').trim();
    if (/^cdi$/i.test(v) || /^permanent$/i.test(v)) return 'CDI';
    if (/^cdd$/i.test(v)) return 'CDD';
    if (/^stage$/i.test(v) || /^internship$/i.test(v)) return 'Stage';
    if (/^alternance$/i.test(v) || /^apprenticeship$/i.test(v)) return 'Alternance';
    if (/^freelance$/i.test(v) || /^independant$/i.test(v)) return 'Freelance';
    if (/^contract$/i.test(v) || /^temporaire$/i.test(v)) return 'Temporaire';
    if (/^interim$/i.test(v) || /^intérim$/i.test(v)) return 'Intérim';
    return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  }

  // ============================================================
  // Session 10 Bloc 3 : parseSalaryFromText avec suffixe periode optionnel
  // ============================================================
  function parseSalaryFromText(text) {
    let currency = null;
    if (/€|EUR/.test(text)) currency = 'EUR';
    else if (/\$|USD/.test(text)) currency = 'USD';
    else if (/£|GBP/.test(text)) currency = 'GBP';
    else return null;

    // Pattern 1 : format "X K € - Y K €" avec K, suffixe periode optionnel
    let m = text.match(/(\d+(?:[.,]\d+)?)\s*[Kk]\s*[€$£]?(?:\s*\/\s*(?:yr|mo|hr|h|an|mois|year|month|hour))?\s*(?:[-–—]|à|to)\s*(\d+(?:[.,]\d+)?)\s*[Kk]/i);
    if (m) {
      return {
        min: parseFloat(m[1].replace(',', '.')) * 1000,
        max: parseFloat(m[2].replace(',', '.')) * 1000,
        currency: currency,
        period: detectPeriod(text)
      };
    }

    // Pattern 2 : format "45 000 € - 60 000 €", suffixe periode optionnel
    m = text.match(/(\d{1,3}(?:[\s,.]\d{3})+)\s*[€$£]?(?:\s*\/\s*(?:yr|mo|hr|h|an|mois|year|month|hour))?\s*(?:[-–—]|à|to)\s*(\d{1,3}(?:[\s,.]\d{3})+)/i);
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
  // Session 10 Bloc 5 : nouveau walker rich-text.
  // Strategie : on accumule du texte dans un objet { text }, et on insere des \n
  // selon la nature des tags traverses (block / inline / parasite).
  // Le nettoyage final (cleanRichText) collapse les sauts de ligne multiples
  // et trim chaque ligne.
  // ============================================================
  function extractRichText(rootEl) {
    if (!rootEl) return '';
    const acc = { text: '' };
    walk(rootEl, acc);
    return cleanRichText(acc.text);
  }

  function walk(n, acc) {
    if (!n) return;

    // Noeud texte : on ajoute le contenu tel quel.
    // Le nettoyage des espaces redondants se fait en fin de parcours dans cleanRichText.
    if (n.nodeType === 3) {
      if (n.textContent) {
        acc.text += n.textContent;
      }
      return;
    }

    // Ignorer les autres types de noeuds (commentaires, CDATA, etc.)
    if (n.nodeType !== 1) return;

    const tag = n.tagName;

    // Tags ignores : on ne descend pas dans leurs enfants.
    if (SKIP_TAGS.has(tag)) return;

    // <br> : saut de ligne, peu importe le contexte.
    if (tag === 'BR') {
      acc.text += '\n';
      return;
    }

    // <ul>/<ol> : on construit les bullets manuellement.
    if (tag === 'UL' || tag === 'OL') {
      if (acc.text && !acc.text.endsWith('\n')) {
        acc.text += '\n';
      }
      const items = n.querySelectorAll(':scope > li');
      for (let i = 0; i < items.length; i++) {
        const t = cleanInline(items[i].textContent);
        if (t) acc.text += '• ' + t + '\n';
      }
      acc.text += '\n';
      return;
    }

    // Tags block : on entoure le contenu de \n pour creer une separation.
    if (BLOCK_TAGS.has(tag)) {
      if (acc.text && !acc.text.endsWith('\n')) {
        acc.text += '\n';
      }
      const kids = n.childNodes;
      for (let i = 0; i < kids.length; i++) {
        walk(kids[i], acc);
      }
      if (!acc.text.endsWith('\n')) {
        acc.text += '\n';
      }
      return;
    }

    // Tags inline (span, strong, em, b, i, a, code, ...) : on descend simplement
    // sans ajouter de separateur. Le texte se concatene continumemt.
    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      walk(kids[i], acc);
    }
  }

  function cleanInline(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // Session 10 Bloc 5 : nettoyage final du texte multi-lignes.
  // - Trim chaque ligne et collapse les espaces internes
  // - Reduit les sauts de ligne multiples (3+) a 2 (= une ligne vide separatrice)
  // - Trim global au debut/fin
  function cleanRichText(s) {
    if (!s) return '';
    const rawLines = String(s).split('\n');
    const trimmedLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      trimmedLines.push(rawLines[i].replace(/[ \t]+/g, ' ').trim());
    }
    // Collapse les lignes vides consecutives a une seule
    const collapsed = [];
    let prevEmpty = false;
    for (let i = 0; i < trimmedLines.length; i++) {
      const line = trimmedLines[i];
      if (line === '') {
        if (!prevEmpty) {
          collapsed.push('');
        }
        prevEmpty = true;
      } else {
        collapsed.push(line);
        prevEmpty = false;
      }
    }
    return collapsed.join('\n').trim();
  }

  // ============================================================
  // Session 10 : helpers pour le champ "Informations complementaires"
  // ============================================================
  function buildInformationsComplementaires(d) {
    const lines = [];

    if (d.workingHours) {
      lines.push('Durée : ' + d.workingHours);
    }
    if (d.postedAt) {
      lines.push('Posté le : ' + formatDateFR(d.postedAt));
    }
    if (d.experienceLabel) {
      lines.push('Expérience : ' + d.experienceLabel);
    }
    if (d.qualification) {
      lines.push('Qualification : ' + d.qualification);
    }
    if (d.educationLevel) {
      lines.push('Formation : ' + d.educationLevel);
    }
    if (d.industry) {
      lines.push('Secteur : ' + d.industry);
    }

    return lines.length > 0 ? lines.join('\n') : null;
  }

  function formatDateFR(value) {
    if (!value) return '';
    const str = String(value);
    if (!/^\d{4}-\d{2}-\d{2}/.test(str)) return str;
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) {
      return str;
    }
  }

  // Enregistrement dans le namespace global JFMJ
  window.JFMJ_SCRAPERS = window.JFMJ_SCRAPERS || {};
  window.JFMJ_SCRAPERS.linkedin = {
    name: 'linkedin',
    label: 'LinkedIn',
    match: match,
    extract: extract
  };

  console.log(LOG_PREFIX + ' Scraper LinkedIn v0.9.4 charge');
})();
