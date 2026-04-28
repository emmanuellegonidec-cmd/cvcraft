// extension/content/scrapers/francetravail.js
// Jean find my Job — Scraper France Travail (session 8 v0.8.1 — lisibilite description)

(function () {
  'use strict';

  const FT_OFFER_REGEX = /^https:\/\/candidat\.francetravail\.fr\/offres\/recherche\/detail\/([A-Z0-9]+)/i;

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

  function match(url) {
    const m = url.match(FT_OFFER_REGEX);
    return m ? m[1].toUpperCase() : null;
  }

  function extract(externalId) {
    const data = {
      source: 'francetravail',
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

    // 1. Microdata JobPosting (prioritaire)
    const jobPostingEl = document.querySelector('[itemtype*="schema.org/JobPosting"]');
    if (jobPostingEl) {
      Object.assign(data, extractFromMicrodata(jobPostingEl));
      data._extractionMethod = 'microdata';
    }

    // 2. Fallback texte (champs non couverts par microdata)
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

  function extractFromMicrodata(root) {
    const r = {};

    const titleEl = root.querySelector('[itemprop="title"]');
    if (titleEl) r.title = cleanInline(titleEl.textContent);

    const locEl = root.querySelector('[itemprop="jobLocation"]');
    if (locEl) {
      const addrEl = locEl.querySelector('[itemprop="address"]') || locEl;
      r.location = cleanInline(addrEl.textContent.split('\n')[0]);
    }

    const dateEl = root.querySelector('[itemprop="datePosted"]');
    if (dateEl) {
      const isoAttr = dateEl.getAttribute('content') || dateEl.getAttribute('datetime');
      if (isoAttr) {
        r.postedAt = isoAttr;
      } else {
        const txt = cleanInline(dateEl.textContent);
        const m = txt.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (m) {
          r.postedAt = parseFrenchDate(m[1], m[2], m[3]);
        } else {
          r.postedAt = txt;
        }
      }
    }

    // Description : on preserve les paragraphes et puces
    const descEl = root.querySelector('[itemprop="description"]');
    if (descEl) r.description = nodeToReadableText(descEl);

    const hoursEl = root.querySelector('[itemprop="workHours"]');
    if (hoursEl) r.workingHours = cleanInline(hoursEl.textContent.replace(/\s*\n\s*/g, ' • '));

    const empTypeEl = root.querySelector('[itemprop="employmentType"]');
    if (empTypeEl) {
      const raw = (cleanInline(empTypeEl.textContent) || cleanInline(empTypeEl.getAttribute('content') || '')).toUpperCase();
      if (raw && WORK_SCHEDULE_MAP[raw]) {
        r.workSchedule = WORK_SCHEDULE_MAP[raw];
      } else if (raw) {
        r.workSchedule = raw;
      }
    }

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
        r.salaryCurrency = cleanInline(curEl.textContent) || cleanInline(curEl.getAttribute('content') || '') || null;
      }
      if (unitEl) {
        r.salaryPeriod = cleanInline(unitEl.textContent) || cleanInline(unitEl.getAttribute('content') || '') || null;
      }
    }

    const qualEl = root.querySelector('[itemprop="qualifications"]');
    if (qualEl) r.qualification = cleanInline(qualEl.textContent);

    const indEl = root.querySelector('[itemprop="industry"]');
    if (indEl) r.industry = cleanInline(indEl.textContent);

    const expEl = root.querySelector('[itemprop="experienceRequirements"]');
    if (expEl) r.experienceLabel = cleanInline(expEl.textContent);

    const skillEls = root.querySelectorAll('[itemprop="skills"]');
    if (skillEls.length > 0) {
      r.skills = Array.from(skillEls)
        .map(function (e) { return cleanInline(e.textContent); })
        .filter(Boolean);
    }

    const orgEl = root.querySelector('[itemprop="hiringOrganization"]');
    if (orgEl) {
      const nameEl = orgEl.querySelector('[itemprop="name"]');
      const nameTxt = nameEl ? cleanInline(nameEl.textContent) : '';
      if (nameTxt) r.company = nameTxt;
    }

    return r;
  }

  function readNumericMicrodata(el) {
    if (!el) return null;
    const txt = cleanInline(el.textContent) || cleanInline(el.getAttribute('content') || '');
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

  function cleanInline(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  // Convertit un sous-arbre DOM en texte lisible :
  // - <p>     -> texte + saut de ligne
  // - <ul>    -> chaque <li> sur sa propre ligne, prefixee par "• "
  // - <br>    -> saut de ligne
  // - sinon   -> on parcourt les enfants
  function nodeToReadableText(node) {
    if (!node) return '';

    const blocks = [];
    walk(node, blocks);

    return blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    function walk(n, out) {
      if (!n) return;
      const tag = n.tagName;

      if (n.nodeType === 3) {
        // Noeud texte : on l'ignore au top level (sera capture par les paragraphes parents)
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = n.querySelectorAll(':scope > li');
        for (let i = 0; i < items.length; i++) {
          const t = cleanInline(items[i].textContent);
          if (t) out.push('• ' + t);
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

      if (tag === 'BR') {
        out.push('');
        return;
      }

      // Conteneur : on descend dans les enfants
      const kids = n.childNodes;
      for (let i = 0; i < kids.length; i++) {
        walk(kids[i], out);
      }
    }
  }

  function extractFromText() {
    const r = {
      contractType: null,
      educationLevel: null,
      company: null
    };

    const bodyText = (document.body && document.body.innerText) || '';

    const contractMatch = bodyText.match(/Type de contrat\s*[:\n]+\s*([^\n]+(?:\n[^\n:]+)?)/i);
    if (contractMatch) {
      const parts = contractMatch[1].split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      r.contractType = parts.join(' - ');
    }

    const formationMatch = bodyText.match(/Formation\s*\n+\s*([^\n]+)/i);
    if (formationMatch) {
      r.educationLevel = formationMatch[1].trim();
    }

    const employerMatch = bodyText.match(/Employeur\s*\n+\s*([^\n]+)/i);
    if (employerMatch) {
      const candidate = employerMatch[1].trim();
      if (candidate && !candidate.match(/^Voir la page|^#/i)) {
        r.company = candidate;
      }
    }

    return r;
  }

  // Enregistrement dans le namespace global JFMJ
  window.JFMJ_SCRAPERS = window.JFMJ_SCRAPERS || {};
  window.JFMJ_SCRAPERS.francetravail = {
    name: 'francetravail',
    label: 'France Travail',
    match: match,
    extract: extract
  };
})();