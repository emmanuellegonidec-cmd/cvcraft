// extension/content/scrapers/indeed.js
// Jean find my Job — Scraper Indeed (v1.0)
//
// Strategie : JSON-LD JobPosting primary (couvre titre, entreprise, lieu, salaire,
// description, dates, type d'emploi) + DOM fallback uniquement pour contractType
// (CDI/CDD/Alternance) quand il n'est pas deductible du JSON-LD.
//
// Specificites Indeed :
//   - URL d'offre : https://fr.indeed.com/viewjob?jk={ID} (plein ecran) ou page de
//     resultats avec parametre vjk={ID}. On accepte les deux (jk ou vjk).
//   - @context est parfois en http:// (au lieu de https://) : sans incidence, on
//     detecte le noeud via @type === "JobPosting".
//   - La description est encodee avec des sequences unicode (\u003C = "<", etc.) :
//     JSON.parse les restitue automatiquement en vrai HTML, traite ensuite par
//     htmlToReadableText.
//   - Le salaire est frequemment renseigne (min/max, unitText "YEAR").

(function () {
  'use strict';

  // On ne traite que les pages fr.indeed.com portant un identifiant d'offre (jk ou vjk).
  const INDEED_DOMAIN_REGEX = /^https:\/\/fr\.indeed\.com\//i;
  const INDEED_JOBKEY_REGEX = /[?&](?:vjk|jk)=([0-9a-f]+)/i;

  // Mapping "rythme de travail" (Schema.org employmentType) -> libelle francais
  const WORK_SCHEDULE_MAP = {
    FULL_TIME: 'Temps plein',
    PART_TIME: 'Temps partiel',
    PER_DIEM: 'Vacation'
  };

  // Mapping "type de contrat" deductible de employmentType (Schema.org) -> libelle francais
  const CONTRACT_TYPE_MAP = {
    INTERN: 'Stage',
    TEMPORARY: 'Interim',
    CONTRACTOR: 'Freelance',
    APPRENTICESHIP: 'Alternance',
    VOLUNTEER: 'Benevolat'
  };

  // Patterns pour detecter le contractType dans le DOM (badge de l'offre)
  // Utile pour CDI/CDD/Alternance que le JSON-LD Indeed ne code pas explicitement.
  const CONTRACT_PATTERNS = [
    { regex: /\bCDI\b/i, label: 'CDI' },
    { regex: /\bCDD\b/i, label: 'CDD' },
    { regex: /Freelance/i, label: 'Freelance' },
    { regex: /Alternance/i, label: 'Alternance' },
    { regex: /Apprentissage/i, label: 'Alternance' },
    { regex: /\bStage\b/i, label: 'Stage' },
    { regex: /Interim/i, label: 'Interim' },
    { regex: /Intérim/i, label: 'Interim' }
  ];

  function match(url) {
    if (!INDEED_DOMAIN_REGEX.test(url)) return null;
    const m = url.match(INDEED_JOBKEY_REGEX);
    if (!m) return null;
    return m[1]; // ex: "ff450c67eae7568f"
  }

  async function extract(externalId) {
    const data = {
      source: 'indeed',
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

    // 1. JSON-LD JobPosting : source primaire Indeed (page plein ecran /viewjob)
    let ldData = extractFromJsonLd(document);
    if (ldData) {
      Object.assign(data, ldData);
      data._extractionMethod = 'json-ld';
    } else {
      // 1b. Page de resultats (jobs?...&vjk=) : l'offre est affichee dans le volet de
      //     droite, sans JSON-LD. On va lire la fiche de la page plein ecran en
      //     arriere-plan (meme domaine, session de l'utilisateur).
      const remote = await extractFromViewjobPage(externalId);
      if (remote) {
        Object.assign(data, remote);
        data._extractionMethod = 'json-ld-viewjob';
      }
    }

    // 2. DOM fallback : contractType si non deductible du JSON-LD (ex: CDI/CDD)
    if (!data.contractType) {
      const domContract = extractContractTypeFromDom();
      if (domContract) {
        data.contractType = domContract;
        data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
      }
    }

    // 3. Construction du texte "Informations complementaires"
    data.informationsComplementaires = buildInformationsComplementaires(data);

    // Garde-fou : sans titre, la capture serait vide. Mieux vaut une erreur explicite.
    if (!data.title) {
      throw new Error("Indeed : impossible de lire cette offre (fiche JobPosting introuvable).");
    }

    return data;
  }

  // ============================================================
  // Lecture de la fiche depuis la page plein ecran /viewjob
  // ============================================================
  async function extractFromViewjobPage(jobKey) {
    if (!jobKey) return null;
    try {
      const url = window.location.origin + '/viewjob?jk=' + encodeURIComponent(jobKey);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return extractFromJsonLd(doc);
    } catch (e) {
      console.warn('[Jean] Indeed : lecture de la page plein ecran impossible', e);
      return null;
    }
  }

  // ============================================================
  // JSON-LD : extraction principale
  // ============================================================
  function extractFromJsonLd(root) {
    const doc = root || document;
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (let i = 0; i < scripts.length; i++) {
      try {
        const parsed = JSON.parse(scripts[i].textContent);
        const jp = findJobPosting(parsed);
        if (jp) return parseJobPostingLd(jp);
      } catch (e) {
        // Ignore les blocs non-JSON
      }
    }
    return null;
  }

  // Recherche recursive d'un noeud @type === "JobPosting" (gere tableaux et @graph)
  function findJobPosting(node) {
    if (!node) return null;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        const found = findJobPosting(node[i]);
        if (found) return found;
      }
      return null;
    }
    if (typeof node === 'object') {
      if (node['@type'] === 'JobPosting') return node;
      if (Array.isArray(node['@graph'])) return findJobPosting(node['@graph']);
    }
    return null;
  }

  function parseJobPostingLd(j) {
    const r = {};

    if (j.title) r.title = cleanInline(j.title);

    // Date de publication -> normalisation ISO
    if (j.datePosted) {
      try {
        const d = new Date(j.datePosted);
        r.postedAt = !isNaN(d.getTime()) ? d.toISOString() : j.datePosted;
      } catch (e) {
        r.postedAt = j.datePosted;
      }
    }

    // Description (HTML -> texte lisible avec puces et paragraphes)
    if (j.description) {
      r.description = htmlToReadableText(j.description);
    }

    // Qualifications (champ JSON-LD distinct si present)
    if (j.qualifications) {
      const qText = htmlToReadableText(j.qualifications);
      if (qText) {
        r.requirements = qText;
        r.qualification = cleanInline(qText).substring(0, 200);
      }
    }

    // employmentType : tableau OU chaine. On separe le rythme (workSchedule)
    // du type de contrat (contractType).
    if (j.employmentType) {
      const types = Array.isArray(j.employmentType) ? j.employmentType : [j.employmentType];
      for (let i = 0; i < types.length; i++) {
        const raw = String(types[i]).toUpperCase().trim();
        if (WORK_SCHEDULE_MAP[raw] && !r.workSchedule) {
          r.workSchedule = WORK_SCHEDULE_MAP[raw];
        } else if (CONTRACT_TYPE_MAP[raw] && !r.contractType) {
          r.contractType = CONTRACT_TYPE_MAP[raw];
        }
      }
    }

    // Niveau d'education
    if (j.educationRequirements && j.educationRequirements.credentialCategory) {
      r.educationLevel = mapEducationLevel(j.educationRequirements.credentialCategory);
    }

    // Experience : objet { monthsOfExperience } OU chaine. On ne garde que le cas
    // objet fiable (>= 12 mois). Les chaines sont ignorees.
    if (j.experienceRequirements && typeof j.experienceRequirements === 'object' &&
        j.experienceRequirements.monthsOfExperience !== undefined) {
      const months = parseInt(j.experienceRequirements.monthsOfExperience, 10);
      if (!isNaN(months) && months >= 12) {
        const years = Math.round(months / 12);
        r.experienceLabel = years + ' an' + (years > 1 ? 's' : '') + ' minimum';
      }
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

    // Lieu (code postal + ville)
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

    // Competences (si fournies : tableau ou chaine)
    if (Array.isArray(j.skills)) {
      r.skills = j.skills.map(function (s) { return cleanInline(String(s)); }).filter(Boolean);
    } else if (typeof j.skills === 'string' && j.skills.trim()) {
      r.skills = j.skills.split(',').map(function (s) { return cleanInline(s); }).filter(Boolean);
    }

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
    const candidates = document.querySelectorAll('span, p, div, li');
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      // Element feuille ou semi-feuille uniquement (pas de gros conteneur)
      if (el.children.length > 2) continue;
      const txt = cleanInline(el.textContent);
      if (!txt || txt.length === 0 || txt.length > 30) continue;

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

  // Conversion HTML -> texte lisible.
  // On insere des sauts de ligne aux balises de bloc (titres, paragraphes, listes,
  // <br>) puis on extrait tout le texte.
  function htmlToReadableText(html) {
    if (!html) return '';
    // Deja du texte plain (pas de balises) -> nettoyage direct
    if (typeof html === 'string' && html.indexOf('<') === -1) {
      return cleanMultiline(html);
    }
    let doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      return cleanMultiline(String(html));
    }
    const body = doc.body;
    if (!body) return cleanMultiline(String(html));

    // Listes : prefixe puce + saut de ligne
    const lis = body.querySelectorAll('li');
    for (let i = 0; i < lis.length; i++) {
      lis[i].prepend('\u2022 ');
      lis[i].append('\n');
    }
    // Titres : isolement par des sauts de ligne
    const heads = body.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (let i = 0; i < heads.length; i++) {
      heads[i].prepend('\n\n');
      heads[i].append('\n');
    }
    // Paragraphes : saut de ligne apres
    const ps = body.querySelectorAll('p');
    for (let i = 0; i < ps.length; i++) {
      ps[i].append('\n\n');
    }
    // Sauts de ligne explicites
    const brs = body.querySelectorAll('br');
    for (let i = 0; i < brs.length; i++) {
      brs[i].replaceWith('\n');
    }

    return cleanMultiline(body.textContent || '');
  }

  function cleanMultiline(s) {
    if (!s) return '';
    const lines = String(s).replace(/\r\n/g, '\n').split('\n');
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
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // ============================================================
  // Champ "Informations complementaires"
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
  window.JFMJ_SCRAPERS.indeed = {
    name: 'indeed',
    label: 'Indeed',
    match: match,
    extract: extract
  };
})();
