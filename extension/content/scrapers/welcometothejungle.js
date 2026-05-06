// extension/content/scrapers/welcometothejungle.js
// Jean find my Job — Scraper Welcome to the Jungle (session 9bis Bloc 5 — v0.9.10)
// Session 10 Bloc 1 — Ajout du champ informationsComplementaires
// Session 10 Bloc 2 — Fix description : preservation des sauts de ligne issus des <br> dans les <p>
//
// Hybride : JSON-LD (metadata + description) + DOM (sections Profil recherche / Qui sont-ils / Missions cles)

(function () {
  'use strict';

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

  // Titres connus dans le JSON-LD WTJ (en gras dans la description HTML, format Sia)
  const WTJ_LD_SECTION_TITLES = [
    "Description de l'entreprise",
    'Description du poste',
    'Qualifications',
    'Informations supplémentaires'
  ];

  function match(url) {
    if (!WTJ_OFFER_REGEX.test(url)) return null;
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
      informationsComplementaires: null,
      _extractionMethod: null
    };

    // 1. JSON-LD : metadata + description (avec splitter si format Sia, sinon description complete)
    const ldData = extractFromJsonLd();
    if (ldData) {
      Object.assign(data, ldData);
      data._extractionMethod = 'json-ld';
    }

    // 2. DOM : prefere sur JSON-LD pour les sections (toujours mieux formate)
    const domReq = extractSectionByH4('Profil recherché');
    if (domReq) {
      data.requirements = domReq;
      data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
    }

    const domComp = extractSectionByH4('Qui sont-ils ?');
    if (domComp) {
      data.companyDescription = domComp;
      data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
    }

    // 2bis. "Missions cles" (cas Ecov ou le label est un span, pas un H4)
    const domMissions = extractSectionBySpan('Missions clés');
    if (domMissions) {
      const probe = domMissions.slice(0, 60).toLowerCase();
      const descHasMissions = data.description && data.description.toLowerCase().indexOf(probe) !== -1;
      if (!descHasMissions) {
        if (data.description) {
          data.description = 'Missions clés\n\n' + domMissions + '\n\n---\n\n' + data.description;
        } else {
          data.description = 'Missions clés\n\n' + domMissions;
        }
      }
      data._extractionMethod = data._extractionMethod === 'json-ld' ? 'json-ld+dom' : 'dom';
    }

    // 3. DOM fallback pour contrat & salaire (jamais dans le JSON-LD WTJ)
    const domMeta = extractMetaFromDom();
    let usedDomMeta = false;
    for (const key in domMeta) {
      const isEmpty = (data[key] === null || data[key] === '');
      if (isEmpty && domMeta[key] !== null && domMeta[key] !== undefined) {
        data[key] = domMeta[key];
        usedDomMeta = true;
      }
    }
    if (usedDomMeta && data._extractionMethod === 'json-ld') {
      data._extractionMethod = 'json-ld+dom';
    }

    // 4. Session 10 : construction du texte "Informations complementaires"
    data.informationsComplementaires = buildInformationsComplementaires(data);

    return data;
  }

  // ============================================================
  // JSON-LD : metadata + description avec splitter ou fallback complet
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
    if (j.datePosted) r.postedAt = j.datePosted;

    if (j.description) {
      const sections = splitWtjDescription(j.description);
      const knownSections = Object.keys(sections).filter(function (k) {
        return WTJ_LD_SECTION_TITLES.indexOf(k) !== -1;
      });

      if (knownSections.length > 0) {
        if (sections['Description du poste']) {
          r.description = sections['Description du poste'];
        }
        if (sections['Qualifications']) {
          r.requirements = sections['Qualifications'];
        }
        if (sections["Description de l'entreprise"]) {
          r.companyDescription = sections["Description de l'entreprise"];
        }

        if (!r.description) {
          r.description = htmlToReadableText(j.description);
        }
      } else {
        r.description = htmlToReadableText(j.description);
      }
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
      if (q) {
        r.qualification = q.substring(0, 200);
        if (r.requirements === undefined || r.requirements === null) {
          r.requirements = q;
        }
      }
    }

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
  // Splitter : pour le format Sia (titres en gras dans description HTML)
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
        result[currentTitle] = buffer.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
      }
      buffer = [];
    }

    const children = doc.body.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType !== 1) continue;

      const titleText = detectSectionTitle(node);
      if (titleText) {
        flush();
        currentTitle = titleText;
        continue;
      }

      walk(node, buffer);
    }
    flush();

    return result;
  }

  function detectSectionTitle(node) {
    if (node.tagName !== 'P') return null;
    const strongs = node.querySelectorAll('strong');
    if (strongs.length === 0) return null;

    const pText = cleanInline(node.textContent);
    const strongText = cleanInline(strongs[0].textContent);

    if (!strongText) return null;
    if (pText.length > strongText.length + 3) return null;

    for (let i = 0; i < WTJ_LD_SECTION_TITLES.length; i++) {
      const known = WTJ_LD_SECTION_TITLES[i];
      if (normalizeForCompare(strongText) === normalizeForCompare(known)) {
        return known;
      }
    }
    return null;
  }

  // ============================================================
  // DOM : recherche d'un <h4> par titre, retourne le contenu lisible
  // ============================================================
  function extractSectionByH4(titleText) {
    const h4s = document.querySelectorAll('h4');
    for (let i = 0; i < h4s.length; i++) {
      const h4 = h4s[i];
      const txt = cleanInline(h4.textContent);
      if (normalizeForCompare(txt) !== normalizeForCompare(titleText)) continue;

      // Strategie A : nextElementSibling du H4
      const sibling = h4.nextElementSibling;
      if (sibling) {
        const txtA = extractReadableText(sibling);
        if (txtA && txtA.length > 30) {
          return txtA;
        }
      }

      // Strategie B : tous les autres enfants du parent du H4
      const parent = h4.parentElement;
      if (parent) {
        const blocks = [];
        const kids = parent.childNodes;
        for (let j = 0; j < kids.length; j++) {
          const kid = kids[j];
          if (kid === h4) continue;
          if (kid.nodeType !== 1) continue;
          walk(kid, blocks);
        }
        if (blocks.length > 0) {
          return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
        }
        const clone = parent.cloneNode(true);
        const h4InClone = clone.querySelector('h4');
        if (h4InClone) h4InClone.remove();
        const fallback = cleanMultiline(clone.innerText || clone.textContent || '');
        if (fallback && fallback.length > 30) return fallback;
      }
    }
    return null;
  }

  // ============================================================
  // DOM : recherche d'une section dont le label est un <span> (et non un <h4>)
  // ============================================================
  function extractSectionBySpan(labelText) {
    const spans = document.querySelectorAll('span');
    const targetNorm = normalizeForCompare(labelText);

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      if (span.children.length > 0) continue;
      if (normalizeForCompare(cleanInline(span.textContent)) !== targetNorm) continue;

      let cur = span;
      for (let level = 0; level < 5; level++) {
        if (!cur || !cur.parentElement) break;
        const next = cur.nextElementSibling;
        if (next && next.textContent && next.textContent.trim().length > 30) {
          const txt = extractReadableText(next);
          if (txt && txt.length > 30) return txt;
        }
        cur = cur.parentElement;
      }
    }
    return null;
  }

  function extractReadableText(el) {
    if (!el) return '';
    const blocks = [];
    walk(el, blocks);
    if (blocks.length > 0) {
      return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    }
    const txt = el.innerText || el.textContent || '';
    return cleanMultiline(txt);
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

  // ============================================================
  // DOM : contrat & salaire (jamais dans le JSON-LD WTJ)
  // ============================================================
  function extractMetaFromDom() {
    const r = {
      contractType: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null
    };

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

    const salaryIcons = document.querySelectorAll('svg[alt="Salary"]');
    for (let i = 0; i < salaryIcons.length; i++) {
      const parent = salaryIcons[i].parentElement;
      if (parent) {
        const txt = cleanInline(parent.textContent);
        if (txt && txt.length < 100) {
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

  // ============================================================
  // Walker recursif : produit du texte lisible (paragraphes + puces)
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

  // Session 10 Bloc 2 : variante de cleanMultiline sans lignes vides (utilisee dans le walker P).
  function cleanMultilineNoEmpty(s) {
    if (!s) return '';
    const lines = String(s).split('\n').map(function (l) {
      return l.replace(/[ \t]+/g, ' ').trim();
    }).filter(Boolean);
    return lines.join('\n');
  }

  function htmlToReadableText(html) {
    if (!html) return '';
    let doc;
    try {
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (e) {
      return '';
    }
    const blocks = [];
    walk(doc.body, blocks);
    return blocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
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

  function normalizeForCompare(s) {
    if (!s) return '';
    return cleanInline(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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
  window.JFMJ_SCRAPERS.welcometothejungle = {
    name: 'welcometothejungle',
    label: 'Welcome to the Jungle',
    match: match,
    extract: extract
  };
})();
