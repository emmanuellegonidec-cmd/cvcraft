// extension/content/scrapers/hellowork.js
// Jean find my Job — Scraper HelloWork (v1.0)
//
// Strategie : JSON-LD JobPosting primary (couvre titre, entreprise, lieu, salaire,
// description, competences, dates, secteur, formation, type d'emploi) + DOM fallback
// uniquement pour contractType (CDI/CDD/Alternance) quand il n'est pas deductible
// du JSON-LD.
//
// Specificites HelloWork (vs APEC) :
//   - employmentType est un TABLEAU (ex: ["INTERN","FULL_TIME"]) melangeant le type
//     de contrat (INTERN -> Stage) et le rythme (FULL_TIME -> Temps plein).
//   - experienceRequirements peut etre une simple chaine ("no requirements") au lieu
//     d'un objet { monthsOfExperience }.
//   - skills sont fournis directement dans le JSON-LD (tableau de chaines).

(function () {
  'use strict';

  // URL pattern : https://www.hellowork.com/fr-fr/emplois/{ID}.html
  // ID format observe : numerique (ex: 81136065). Tolere d'eventuels parametres apres .html
  const HELLOWORK_OFFER_REGEX = /^https:\/\/www\.hellowork\.com\/fr-fr\/emplois\/(\d+)\.html/i;

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

  // Patterns pour detecter le contractType dans le DOM (badge sous le titre)
  // Utile pour CDI/CDD/Alternance que le JSON-LD ne code pas explicitement.
  const CONTRACT_PATTERNS = [
    { regex: /\bCDI\b/i, label: 'CDI' },
    { regex: /\bCDD\b/i, label: 'CDD' },
    { regex: /Freelance/i, label: 'Freelance' },
    { regex: /Alternance/i, label: 'Alternance' },
    { regex: /\bStage\b/i, label: 'Stage' },
    { regex: /Interim/i, label: 'Interim' }
  ];

  function match(url) {
    const m = url.match(HELLOWORK_OFFER_REGEX);
    if (!m) return null;
    return m[1]; // ex: "81136065"
  }

  function extract(externalId) {
    const data = {
      source: 'hellowork',
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

    // 1. JSON-LD JobPosting : source primaire HelloWork
    const ldData = extractFromJsonLd();
    if (ldData) {
      Object.assign(data, ldData);
      data._extractionMethod = 'json-ld';
    }

    // 2bis. Experience affichee sur la page (prioritaire sur le minimum JSON-LD)
    const domExp = extractExperienceFromDom();
    if (domExp) data.experienceLabel = domExp;

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

    // Qualifications = "Profil recherche" (champ JSON-LD distinct chez HelloWork)
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

    // Experience : objet { monthsOfExperience } OU chaine ("no requirements").
    // On ne garde que le cas objet fiable (>= 12 mois). Les chaines sont ignorees.
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

    // Competences : fournies directement par HelloWork (tableau ou chaine)
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
  // Deux passes :
  //  1. un element dont le texte est EXACTEMENT un type de contrat (le badge de
  //     l'offre, en tete de page) ;
  //  2. a defaut seulement, un texte qui en contient un.
  // Sans cette priorite, un mot "Stage" croise dans un menu ou une phrase plus
  // haut dans la page l'emportait sur le vrai contrat de l'offre.
  function extractContractTypeFromDom() {
    const candidates = document.querySelectorAll('span, p, div, li');

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        if (el.children.length > 2) continue;
        const txt = cleanInline(el.textContent);
        if (!txt || txt.length === 0 || txt.length > 30) continue;

        for (let j = 0; j < CONTRACT_PATTERNS.length; j++) {
          const p = CONTRACT_PATTERNS[j];
          if (pass === 0) {
            if (txt.toUpperCase() === p.label.toUpperCase()) return p.label;
          } else if (p.regex.test(txt)) {
            return p.label;
          }
        }
      }
    }
    return null;
  }

  // L'experience affichee ("Exp. 1 a 7 ans") est plus riche que le minimum
  // present dans la fiche technique (monthsOfExperience). On la prefere.
  function extractExperienceFromDom() {
    const candidates = document.querySelectorAll('span, p, div, li');
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (el.children.length > 2) continue;
      const txt = cleanInline(el.textContent);
      if (!txt || txt.length > 40) continue;
      const m = txt.match(/^Exp\.?\s*:?\s*(.+)$/i);
      if (m && m[1] && /an|mois|d(é|e)butant|junior|senior/i.test(m[1])) {
        return cleanInline(m[1]);
      }
    }
    return null;
  }

  // ============================================================
  // Helpers
  // ============================================================

  // Conversion HTML -> texte lisible.
  // On insere des sauts de ligne aux balises de bloc (titres, paragraphes, listes,
  // <br>) puis on extrait tout le texte. Robuste pour le HTML concatene de HelloWork
  // (ou du texte peut se trouver hors des balises <p>).
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
  window.JFMJ_SCRAPERS.hellowork = {
    name: 'hellowork',
    label: 'HelloWork',
    match: match,
    extract: extract
  };
})();
