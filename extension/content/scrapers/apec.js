// extension/content/scrapers/apec.js
// Jean find my Job — Scraper APEC (session 9bis — v0.9.11)
// Session 10 Bloc 1 — Ajout du champ informationsComplementaires
// Session 10 Bloc 2 — Fix description : preservation des sauts de ligne issus des <br> dans les <p>
//
// Strategie : JSON-LD JobPosting primary (couvre titre, entreprise, lieu, salaire,
// description, qualifications, dates, secteur, type d'emploi) + DOM fallback uniquement
// pour contractType (CDI/CDD/Freelance) qui n'est pas dans le JSON-LD APEC.

(function () {
  'use strict';

  // URL pattern : https://www.apec.fr/candidat/.../detail-offre/{ID}?...
  // ID format observe : chiffres + lettre finale (ex: 178485022W)
  const APEC_OFFER_REGEX = /^https:\/\/www\.apec\.fr\/.+\/detail-offre\/([^/?#]+)/i;

  // Mapping employmentType (Schema.org) -> libelle francais (identique a WTJ)
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

  // Patterns pour detecter le contractType dans le DOM (bandeau meta APEC)
  // Ordre important : du plus specifique au plus generique.
  // Une offre libellee "CDD et Alternance - Contrat d'apprentissage" est une
  // alternance : il faut donc tester Alternance AVANT CDD.
  const CONTRACT_PATTERNS = [
    { regex: /Alternance|Apprentissage/i, label: 'Alternance' },
    { regex: /\bStage\b/i, label: 'Stage' },
    { regex: /Int(e|é)rim/i, label: 'Interim' },
    { regex: /Freelance/i, label: 'Freelance' },
    { regex: /\bCDI\b/i, label: 'CDI' },
    { regex: /\bCDD\b/i, label: 'CDD' }
  ];

  function match(url) {
    const m = url.match(APEC_OFFER_REGEX);
    if (!m) return null;
    return m[1]; // ex: "178485022W"
  }

  function extract(externalId) {
    const data = {
      source: 'apec',
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
      _extractionMethod: null
    };

    // 1. JSON-LD JobPosting : source primaire APEC
    const ldData = extractFromJsonLd();
    if (ldData) {
      Object.assign(data, ldData);
      data._extractionMethod = 'json-ld';
    }

    // 2. DOM fallback : contractType (jamais dans le JSON-LD APEC)
    if (!data.contractType) {
      const domContract = extractContractTypeFromDom();
      if (domContract) {
        data.contractType = domContract;
        data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
      }
    }

    // 3. Session 10 : construction du texte "Informations complementaires"
    data.informationsComplementaires = buildInformationsComplementaires(data);

    return data;
  }

  // ============================================================
  // JSON-LD : extraction principale
  // ============================================================
  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const parsed = JSON.parse(scripts[i].textContent);
        if (parsed && parsed['@type'] === 'JobPosting') {
          return parseJobPostingLd(parsed);
        }
      } catch (e) {
        // Ignore les blocs non-JSON ou non-JobPosting
      }
    }
    return null;
  }

  function parseJobPostingLd(j) {
    const r = {};

    if (j.title) r.title = cleanInline(j.title);

    // Date : APEC envoie "2026-04-08 16:39:23 +0200" -> normalisation ISO
    if (j.datePosted) {
      try {
        const d = new Date(j.datePosted);
        r.postedAt = !isNaN(d.getTime()) ? d.toISOString() : j.datePosted;
      } catch (e) {
        r.postedAt = j.datePosted;
      }
    }

    // Description (HTML -> texte lisible avec puces)
    if (j.description) {
      r.description = htmlToReadableText(j.description);
    }

    // Qualifications = "Profil recherche" chez APEC, c'est un champ JSON-LD distinct
    if (j.qualifications) {
      const qText = htmlToReadableText(j.qualifications);
      if (qText) {
        r.requirements = qText;
        // Extrait court (200 chars) pour le champ qualification distinct
        r.qualification = cleanInline(qText).substring(0, 200);
      }
    }

    // Type d'emploi / horaires
    if (j.employmentType) {
      const raw = String(j.employmentType).toUpperCase();
      r.workSchedule = WORK_SCHEDULE_MAP[raw] || raw;
    }

    // Niveau d'education
    if (j.educationRequirements && j.educationRequirements.credentialCategory) {
      r.educationLevel = mapEducationLevel(j.educationRequirements.credentialCategory);
    }

    // Experience : garde-fou anti-bug APEC observe (souvent "1" mois alors
    // que la description dit "10 ans minimum"). On ignore si < 12 mois.
    if (j.experienceRequirements && j.experienceRequirements.monthsOfExperience !== undefined) {
      const months = parseInt(j.experienceRequirements.monthsOfExperience, 10);
      if (!isNaN(months) && months >= 12) {
        const years = Math.round(months / 12);
        r.experienceLabel = years + ' an' + (years > 1 ? 's' : '') + ' minimum';
      }
      // Si months < 12 : on ignore (donnee non fiable), experienceLabel reste null
    }

    // Entreprise (nom + description si presente)
    if (j.hiringOrganization) {
      if (j.hiringOrganization.name) {
        r.company = cleanInline(j.hiringOrganization.name);
      }
      if (j.hiringOrganization.description) {
        r.companyDescription = htmlToReadableText(j.hiringOrganization.description);
      }
    }

    // Lieu (postal + ville)
    let loc = j.jobLocation;
    if (Array.isArray(loc)) loc = loc[0];
    if (loc && loc.address) {
      const addr = loc.address;
      const city = cleanInline(addr.addressLocality || '');
      const postal = cleanInline(addr.postalCode || '');
      if (postal && city) {
        r.location = postal + ' - ' + city;
      } else if (city) {
        r.location = city;
      } else if (postal) {
        r.location = postal;
      }
    }

    // Secteur d'activite
    if (j.industry) r.industry = cleanInline(j.industry);

    // Salaire
    if (j.baseSalary) {
      const bs = j.baseSalary;
      if (bs.currency) r.salaryCurrency = bs.currency;
      if (bs.value && typeof bs.value === 'object') {
        const v = bs.value;
        if (v.minValue !== undefined) r.salaryMin = parseNum(v.minValue);
        if (v.maxValue !== undefined) r.salaryMax = parseNum(v.maxValue);
        if (v.value !== undefined && (r.salaryMin === null || r.salaryMin === undefined)) {
          r.salaryMin = parseNum(v.value);
          r.salaryMax = parseNum(v.value);
        }
        if (v.unitText) r.salaryPeriod = v.unitText;
      }
    }

    return r;
  }

  // ============================================================
  // DOM fallback : contractType (CDI/CDD/Freelance/Stage/Alternance/Interim)
  // ============================================================
  function extractContractTypeFromDom() {
    // On restreint la recherche au bloc de metadonnees de l'offre affichee.
    // Sur une page de resultats, le menu lateral (lien "Alternance") et les
    // autres offres de la liste apparaissent avant dans le DOM et faussaient
    // le type de contrat.
    const scopeEl =
      document.querySelector('apec-offre-metadata') ||
      document.querySelector('.card-offer__header');
    const scope = scopeEl || document;

    // Dans le bloc de l'offre, on accepte des libelles longs du type
    // "1 CDD et Alternance - Contrat d'apprentissage de 12 mois".
    // Sans perimetre, on reste prudent (30 caracteres) pour eviter les faux positifs.
    const maxLen = scopeEl ? 120 : 30;

    const candidates = scope.querySelectorAll('span, p, div, li');
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      // Element feuille ou semi-feuille uniquement (pas de gros conteneur)
      if (el.children.length > 2) continue;
      const txt = cleanInline(el.textContent);
      if (!txt || txt.length === 0 || txt.length > maxLen) continue;

      for (let j = 0; j < CONTRACT_PATTERNS.length; j++) {
        if (CONTRACT_PATTERNS[j].regex.test(txt)) {
          return CONTRACT_PATTERNS[j].label;
        }
      }
    }
    return null;
  }

  // ============================================================
  // Helpers
  // ============================================================

  function htmlToReadableText(html) {
    if (!html) return '';
    // APEC fournit la description en TEXTE BRUT (aucune balise) et sans aucun
    // saut de ligne : les phrases se collent ("...communication.Vous contribuerez").
    // On restaure des coupures lisibles avant le nettoyage.
    if (typeof html === 'string' && html.indexOf('<') === -1) {
      return cleanMultiline(restoreLineBreaks(html));
    }
    let doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      return cleanMultiline(String(html));
    }
    const blocks = [];
    walk(doc.body, blocks);
    if (blocks.length > 0) {
      return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    // Fallback : pas de P/UL trouves mais texte present
    return cleanMultiline(doc.body.innerText || doc.body.textContent || '');
  }

  // Reintroduit des sauts de ligne dans un texte brut sans mise en forme :
  //  - apres une fin de phrase suivie d'une majuscule
  //  - devant chaque puce
  // APEC encode les accents en notation HTML (&eacute;, &rsquo;, &agrave;...)
  // meme quand le texte ne contient aucune balise. Sans decodage, l'utilisateur
  // lit "d&eacute;ploiement" au lieu de "deploiement".
  function decodeEntities(str) {
    if (!str || String(str).indexOf('&') === -1) return str;
    try {
      const el = document.createElement('textarea');
      el.innerHTML = String(str);
      return el.value;
    } catch (e) {
      return str;
    }
  }

  function restoreLineBreaks(s) {
    if (!s) return '';
    return String(s)
      .replace(/([.!?])\s*([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ])/g, '$1\n$2')
      .replace(/\s*([•·])\s*/g, '\n$1 ')
      .replace(/\n{3,}/g, '\n\n');
  }

  function cleanMultiline(s) {
    if (!s) return '';
    const lines = String(decodeEntities(s)).replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let prevEmpty = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\s+/g, ' ').trim();
      if (line.length === 0) {
        if (!prevEmpty && out.length > 0) {
          out.push('');
          prevEmpty = true;
        }
      } else {
        out.push(line);
        prevEmpty = false;
      }
    }
    return out.join('\n').trim();
  }

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
      // Session 10 Bloc 2 : preserve les \n issus des <br> en nettoyant ligne par ligne.
      // (avant : cleanInline collapsait \s+ en un seul espace et detruisait les sauts de ligne.)
      const t = cleanMultilineNoEmpty(clone.textContent);
      if (t) out.push(t);
      return;
    }

    if (tag === 'BR') return;

    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      walk(kids[i], out);
    }
  }

  // Variante de cleanMultiline : retire les lignes vides (utile dans le walker P
  // ou les sauts \n\n successifs sont du bruit, vs. cleanMultiline qui preserve
  // les paragraphes pour les descriptions plain text).
  function cleanMultilineNoEmpty(s) {
    if (!s) return '';
    const lines = String(decodeEntities(s)).split('\n').map(function (l) {
      return l.replace(/[ \t]+/g, ' ').trim();
    }).filter(Boolean);
    return lines.join('\n');
  }

  function mapEducationLevel(credentialCategory) {
    const map = {
      'high school': 'Bac',
      'associate degree': 'Bac+2',
      'bachelor degree': 'Bac+3',
      'professional certificate': 'Certification professionnelle',
      'postgraduate degree': 'Bac+5 et plus',
      'doctoral degree': 'Doctorat'
    };
    const key = String(credentialCategory).toLowerCase().trim();
    return map[key] || credentialCategory;
  }

  function parseNum(v) {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? null : n;
  }

  function cleanInline(s) {
    if (!s) return '';
    return String(decodeEntities(s)).replace(/\s+/g, ' ').trim();
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
  window.JFMJ_SCRAPERS.apec = {
    name: 'apec',
    label: 'APEC',
    match: match,
    extract: extract
  };
})();
