// extension/content/scrapers/welcometothejungle.js
// Jean find my Job — Scraper Welcome to the Jungle (session 8 — v0.8.1)
// Strategie : JSON-LD JobPosting prioritaire + split en 3 sections (description / requirements / company_description)
// + fallback DOM pour contrat et salaire

(function () {
  'use strict';

  // Pattern URL : https://www.welcometothejungle.com/fr/companies/{company}/jobs/{slug}_{loc}_{ID}
  const WTJ_OFFER_REGEX = /^https:\/\/www\.welcometothejungle\.com\/(fr|en)\/companies\/[^/]+\/jobs\/[^/?#]+/i;

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

  // Titres JSON-LD WTJ (en gras dans la description HTML) -> champ Supabase cible
  // L'ordre est important : on parcourt la description en cherchant ces titres dans cet ordre.
  const WTJ_SECTION_TITLES = [
    "Description de l'entreprise",
    'Description du poste',
    'Qualifications',
    'Informations supplémentaires'
  ];

  function match(url) {
    if (!WTJ_OFFER_REGEX.test(url)) return null;

    // L'ID externe est compose des 2 derniers segments du slug (ex: SIA_awO6eAP, IKXO_a21bW58)
    const pathMatch = url.match(/\/jobs\/([^/?#]+)/);
    if (!pathMatch) return null;

    const slug = pathMatch[1];
    const parts = slug.split('_');
    if (parts.length < 2) return null;

    return parts.slice(-2).join('_');
  }

  function extract(externalId) {
    const data = {
      source: 'welcometothejungle',
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
      _extractionMethod: null
    };

    // 1. JSON-LD JobPosting (prioritaire)
    const ldData = extractFromJsonLd();
    if (ldData) {
      Object.assign(data, ldData);
      data._extractionMethod = 'json-ld';
    }

    // 2. Fallback DOM pour les champs absents du JSON-LD (contrat juridique, salaire DOM)
    const domData = extractFromDom();
    let usedDom = false;
    for (const key in domData) {
      const isEmpty = (data[key] === null || data[key] === '' || (Array.isArray(data[key]) && data[key].length === 0));
      if (isEmpty && domData[key] !== null && domData[key] !== undefined) {
        data[key] = domData[key];
        usedDom = true;
      }
    }
    if (usedDom) {
      data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
    }

    return data;
  }

  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const parsed = JSON.parse(scripts[i].textContent);
        if (parsed && parsed['@type'] === 'JobPosting') {
          return parseJobPostingLd(parsed);
        }
      } catch (e) {
        // Ignore les blocs non-JSON ou non-JobPosting (FAQPage, BreadcrumbList, etc.)
      }
    }
    return null;
  }

  function parseJobPostingLd(j) {
    const r = {};

    if (j.title) r.title = cleanInline(j.title);
    if (j.datePosted) r.postedAt = j.datePosted;

    // Split de la description HTML en 4 sections via leurs titres en gras
    if (j.description) {
      const sections = splitWtjDescription(j.description);
      // sections est un objet { "Description de l'entreprise": "...", "Description du poste": "...", ... }

      const poste = sections['Description du poste'] || '';
      const profil = sections['Qualifications'] || '';
      const entreprise = sections["Description de l'entreprise"] || '';
      // 'Informations supplémentaires' volontairement ignoré (marketing, pas utile pour ATS/LM)

      r.description = poste || null;
      r.requirements = profil || null;
      r.companyDescription = entreprise || null;
    }

    if (j.employmentType) {
      const raw = String(j.employmentType).toUpperCase();
      r.workSchedule = WORK_SCHEDULE_MAP[raw] || raw;
    }

    if (j.educationRequirements && j.educationRequirements.credentialCategory) {
      r.educationLevel = mapEducationLevel(j.educationRequirements.credentialCategory);
    }

    if (j.experienceRequirements && j.experienceRequirements.monthsOfExperience !== undefined) {
      const months = parseInt(j.experienceRequirements.monthsOfExperience, 10);
      if (!isNaN(months) && months > 0) {
        const years = Math.round(months / 12);
        r.experienceLabel = years + ' an' + (years > 1 ? 's' : '') + ' minimum';
      }
    }

    if (j.hiringOrganization && j.hiringOrganization.name) {
      r.company = cleanInline(j.hiringOrganization.name);
    }

    // jobLocation peut etre un objet ou un tableau
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
      }
    }

    if (j.industry) r.industry = cleanInline(j.industry);

    if (j.qualifications) {
      const q = cleanInline(j.qualifications);
      if (q) r.qualification = q;
    }

    // baseSalary (optionnel sur WTJ)
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
  // Split de la description HTML en sections
  //
  // WTJ structure son champ description en blocs <p><strong>Titre</strong></p>
  // suivis du contenu. On parcourt les noeuds enfants du body parsé
  // et on accumule le texte sous le titre courant.
  // ============================================================
  function splitWtjDescription(html) {
    const result = {};

    let doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      return result;
    }

    let currentTitle = null;
    let buffer = [];

    function flush() {
      if (currentTitle && buffer.length > 0) {
        const text = buffer.join('\n').replace(/\n{3,}/g, '\n\n').trim();
        if (text) {
          result[currentTitle] = text;
        }
      }
      buffer = [];
    }

    const children = doc.body.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType !== 1) continue; // skip text nodes au top level

      // Detecte un titre de section : <p> contenant uniquement un <strong>
      const titleText = detectSectionTitle(node);
      if (titleText) {
        flush();
        currentTitle = titleText;
        continue;
      }

      // Sinon, on convertit le noeud en texte structure (paragraphes + listes)
      const blockText = nodeToReadableText(node);
      if (blockText) {
        buffer.push(blockText);
      }
    }
    flush();

    return result;
  }

  // Verifie si un noeud est un titre de section WTJ (<p><strong>Titre connu</strong></p>)
  // Retourne le titre normalise s'il en est un, sinon null.
  function detectSectionTitle(node) {
    if (node.tagName !== 'P') return null;

    const strongs = node.querySelectorAll('strong');
    if (strongs.length === 0) return null;

    // On compare le texte total du <p> au texte du <strong> :
    // si c'est essentiellement la meme chose, c'est un titre.
    const pText = cleanInline(node.textContent);
    const strongText = cleanInline(strongs[0].textContent);

    if (!strongText) return null;
    if (pText.length > strongText.length + 3) return null; // titre + autre contenu = pas un titre

    // Match exact ou approchant avec un des titres connus
    for (let i = 0; i < WTJ_SECTION_TITLES.length; i++) {
      const known = WTJ_SECTION_TITLES[i];
      if (normalizeForCompare(strongText) === normalizeForCompare(known)) {
        return known;
      }
    }

    return null;
  }

  // Convertit un noeud DOM en texte lisible :
  // - <p>     -> texte + saut de ligne
  // - <ul>    -> chaque <li> sur sa propre ligne, prefixee par "• "
  // - <br>    -> saut de ligne
  // - sinon   -> texte simple
  function nodeToReadableText(node) {
    if (!node) return '';

    const tag = node.tagName;

    if (tag === 'UL' || tag === 'OL') {
      const items = node.querySelectorAll('li');
      const lines = [];
      for (let i = 0; i < items.length; i++) {
        const t = cleanInline(items[i].textContent);
        if (t) lines.push('• ' + t);
      }
      return lines.join('\n');
    }

    if (tag === 'P') {
      // On preserve les <br> intra-paragraphe en les transformant en \n
      const clone = node.cloneNode(true);
      const brs = clone.querySelectorAll('br');
      for (let i = 0; i < brs.length; i++) {
        brs[i].replaceWith('\n');
      }
      return cleanInline(clone.textContent);
    }

    // Fallback : texte brut
    return cleanInline(node.textContent);
  }

  // ============================================================
  // Fallback DOM (pour les champs absents du JSON-LD)
  // ============================================================
  function extractFromDom() {
    const r = {
      contractType: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null
    };

    // Type de contrat : badge avec svg alt="Contract"
    const contractIcons = document.querySelectorAll('svg[alt="Contract"]');
    for (let i = 0; i < contractIcons.length; i++) {
      const parent = contractIcons[i].parentElement;
      if (parent) {
        const txt = cleanInline(parent.textContent);
        if (txt && txt.length > 0 && txt.length < 60) {
          r.contractType = txt;
          break;
        }
      }
    }

    // Salaire : badge avec svg alt="Salary" (formats : "40K à 60K €", "Non spécifié")
    const salaryIcons = document.querySelectorAll('svg[alt="Salary"]');
    for (let i = 0; i < salaryIcons.length; i++) {
      const parent = salaryIcons[i].parentElement;
      if (parent) {
        const txt = cleanInline(parent.textContent);
        if (txt && txt.length < 100) {
          // On cherche un range numerique
          const m = txt.match(/(\d+)\s*[Kk]?\s*(?:a|à|to|-)\s*(\d+)\s*[Kk]?\s*[€$£]?/);
          if (m) {
            const min = parseInt(m[1], 10);
            const max = parseInt(m[2], 10);
            const hasK = /\d\s*[Kk]/.test(txt);
            r.salaryMin = hasK ? min * 1000 : min;
            r.salaryMax = hasK ? max * 1000 : max;
            r.salaryCurrency = 'EUR';
            break;
          }
        }
      }
    }

    return r;
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

  // Texte inline : ecrase les espaces multiples (idem pour les titres et noms courts)
  function cleanInline(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // Normalisation pour comparer 2 titres : minuscules + retire accents + espaces uniques
  function normalizeForCompare(s) {
    if (!s) return '';
    return cleanInline(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Enregistrement dans le namespace global JFMJ
  window.JFMJ_SCRAPERS = window.JFMJ_SCRAPERS || {};
  window.JFMJ_SCRAPERS.welcometothejungle = {
    name: 'welcometothejungle',
    label: 'Welcome to the Jungle',
    match: match,
    extract: extract
  };
})();