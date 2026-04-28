// extension/content/content.js
// Jean find my Job — Routeur multi-sites (v0.8.0 — session 8)
// Detecte le site via les scrapers enregistres dans window.JFMJ_SCRAPERS,
// affiche le bouton flottant et delegue l'extraction au scraper actif.

(function () {
  'use strict';

  const BUTTON_ID = 'jfmj-capture-btn';

  // 1. DETECTION : trouver le scraper qui matche l'URL courante
  function detectScraper() {
    const scrapers = window.JFMJ_SCRAPERS || {};
    const url = window.location.href;

    for (const name in scrapers) {
      const s = scrapers[name];
      if (typeof s.match !== 'function') continue;
      const offerId = s.match(url);
      if (offerId) {
        return { scraper: s, offerId: offerId };
      }
    }
    return null;
  }

  // 2. BOUTON FLOTTANT
  function injectFloatingButton(scraper, offerId) {
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
      handleCaptureClick(scraper, offerId, btn, label);
    });

    document.body.appendChild(btn);
  }

  // 3. CLIC SUR "CAPTURER" -> envoi au service worker
  function handleCaptureClick(scraper, offerId, btn, label) {
    btn.classList.add('jfmj-loading');
    btn.disabled = true;
    label.textContent = 'Capture…';

    try {
      const data = scraper.extract(offerId);

      console.group('%c[Jean find my Job] 📋 Offre capturée — ' + scraper.label, 'background:#F5C400;color:#111;font-weight:bold;padding:2px 6px;');
      console.log('🔌 Source :', data.source);
      console.log('🆔 ID externe :', data.externalId);
      console.log('📌 Titre :', data.title);
      console.log('🏢 Entreprise :', data.company);
      console.log('📍 Lieu :', data.location);
      console.log('📝 Type de contrat :', data.contractType);
      console.log('🕐 Rythme de travail :', data.workSchedule);
      console.log('⏱️ Durée / horaires :', data.workingHours);
      console.log('💰 Salaire :', data.salaryMin, '-', data.salaryMax, data.salaryCurrency, '/', data.salaryPeriod);
      console.log('📅 Publié/actualisé le :', data.postedAt);
      console.log('🎓 Formation :', data.educationLevel);
      console.log('💼 Expérience :', data.experienceLabel);
      console.log('🏷️ Qualification :', data.qualification);
      console.log('🏭 Secteur :', data.industry);
      console.log('🛠️ Compétences (' + (data.skills ? data.skills.length : 0) + ') :', data.skills);
      console.log('📄 Description (extrait) :', data.description ? data.description.slice(0, 200) + '…' : null);
      console.log('🔧 Méthode d\'extraction :', data._extractionMethod);
      console.log('📦 Objet complet :', data);
      console.groupEnd();

      chrome.runtime.sendMessage(
        { type: 'JFMJ_CAPTURE_OFFER', data: data },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error('[Jean] Erreur sendMessage :', chrome.runtime.lastError);
            showButtonError(btn, label, '✗ Erreur');
            return;
          }

          if (response && response.ok) {
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

  // 4. INIT + detection des changements d'URL en SPA (WTJ et LinkedIn)
  function init() {
    const detected = detectScraper();
    if (detected) {
      console.log('[Jean find my Job] Scraper actif :', detected.scraper.label, '- Offre :', detected.offerId);
      if (document.body) {
        injectFloatingButton(detected.scraper, detected.offerId);
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          injectFloatingButton(detected.scraper, detected.offerId);
        });
      }
    }

    // Detection des navigations SPA : si l'URL change sans rechargement,
    // on retire le bouton et on re-detecte. Indispensable pour WTJ et LinkedIn
    // qui utilisent du routing client-side.
    let lastUrl = window.location.href;
    setInterval(function () {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        const existing = document.getElementById(BUTTON_ID);
        if (existing) existing.remove();
        // Petit delai pour laisser le DOM de la nouvelle page se charger
        setTimeout(function () {
          const newDetected = detectScraper();
          if (newDetected) {
            console.log('[Jean find my Job] SPA navigation - nouveau scraper :', newDetected.scraper.label);
            injectFloatingButton(newDetected.scraper, newDetected.offerId);
          }
        }, 800);
      }
    }, 1000);
  }

  init();
})();