// extension/content/content.js
// Jean find my Job — Routeur multi-sites (v0.8.1)
// Detecte le site via les scrapers enregistres dans window.JFMJ_SCRAPERS,
// affiche le bouton flottant et delegue l'extraction au scraper actif.

(function () {
  'use strict';

  const BUTTON_ID = 'jfmj-capture-btn';
  const DEFAULT_LABEL = 'Capturer cette offre';

  // Drapeau : passe a true quand l'extension a ete rechargee/mise a jour
  // alors que cet onglet etait deja ouvert. Le script injecte survit dans la
  // page mais ne peut plus communiquer avec le service worker.
  let contextInvalidated = false;

  // 0. UTILITAIRES DE CONTEXTE
  // Quand Chrome met l'extension a jour, les onglets deja ouverts conservent
  // l'ancien script injecte. Toute tentative de dialogue avec le service worker
  // leve alors "Extension context invalidated". Ce n'est pas un bug du scraper :
  // seul un rechargement de la page peut retablir la liaison.
  function isContextInvalidated(err) {
    if (!err) return false;
    const msg = (err.message || String(err)).toLowerCase();
    return msg.includes('extension context invalidated') ||
           msg.includes('context invalidated') ||
           msg.includes('receiving end does not exist');
  }

  // Verifie que le pont avec l'extension est toujours vivant.
  function isExtensionAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

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

    // Session 10 Bloc B — Remplacement de l'emoji par le "J" Jean
    // pour coherence de marque avec l'icone de l'extension (style brutaliste).
    const icon = document.createElement('span');
    icon.className = 'jfmj-btn-icon';
    icon.textContent = 'J';

    const label = document.createElement('span');
    label.className = 'jfmj-btn-label';
    label.textContent = DEFAULT_LABEL;

    btn.appendChild(icon);
    btn.appendChild(label);

    btn.addEventListener('click', function () {
      handleCaptureClick(scraper, offerId, btn, label);
    });

    document.body.appendChild(btn);
  }

  // 3. CLIC SUR "CAPTURER" -> envoi au service worker
  function handleCaptureClick(scraper, offerId, btn, label) {
    // Garde-fou : si l'extension a ete rechargee, inutile d'aller plus loin.
    if (contextInvalidated || !isExtensionAlive()) {
      showReloadNeeded(btn, label);
      return;
    }

    btn.classList.add('jfmj-loading');
    btn.disabled = true;
    label.textContent = 'Capture…';

    try {
      // extract() reste synchrone : Chrome n'ouvre le panneau lateral que dans la
      // foulee immediate du clic. Toute attente ici empeche son ouverture.
      const data = scraper.extract(offerId);

      console.group('%c[Jean find my Job] Offre capturee — ' + scraper.label, 'background:#F5C400;color:#111;font-weight:bold;padding:2px 6px;');
      console.log('Source :', data.source);
      console.log('ID externe :', data.externalId);
      console.log('Titre :', data.title);
      console.log('Entreprise :', data.company);
      console.log('Lieu :', data.location);
      console.log('Type de contrat :', data.contractType);
      console.log('Rythme de travail :', data.workSchedule);
      console.log('Duree / horaires :', data.workingHours);
      console.log('Salaire :', data.salaryMin, '-', data.salaryMax, data.salaryCurrency, '/', data.salaryPeriod);
      console.log('Publie/actualise le :', data.postedAt);
      console.log('Formation :', data.educationLevel);
      console.log('Experience :', data.experienceLabel);
      console.log('Qualification :', data.qualification);
      console.log('Secteur :', data.industry);
      console.log('Competences (' + (data.skills ? data.skills.length : 0) + ') :', data.skills);
      console.log('Description (extrait) :', data.description ? data.description.slice(0, 200) + '…' : null);
      console.log('Methode d\'extraction :', data._extractionMethod);
      console.log('Objet complet :', data);
      console.groupEnd();

      chrome.runtime.sendMessage(
        { type: 'JFMJ_CAPTURE_OFFER', data: data },
        function (response) {
          if (chrome.runtime.lastError) {
            if (isContextInvalidated(chrome.runtime.lastError)) {
              showReloadNeeded(btn, label);
              return;
            }
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
              label.textContent = DEFAULT_LABEL;
              btn.disabled = false;
            }, 2200);
          } else {
            console.error('[Jean] Service worker n\'a pas pu ouvrir le panel :', response);
            showButtonError(btn, label, '✗ Panel KO');
          }
        }
      );
    } catch (e) {
      if (isContextInvalidated(e)) {
        showReloadNeeded(btn, label);
        return;
      }
      console.error('[Jean] Erreur capture :', e);
      showButtonError(btn, label, '✗ Erreur');
    }
  }

  // 3bis. CAS PARTICULIER : extension rechargee, onglet obsolete.
  // Message persistant (pas de retour automatique au libelle d'origine) :
  // tant que la page n'est pas rechargee, un nouveau clic echouera aussi.
  function showReloadNeeded(btn, label) {
    contextInvalidated = true;

    console.warn('[Jean] Extension rechargee ou mise a jour depuis l\'ouverture de cet onglet. Rechargez la page pour reactiver le bouton.');

    btn.classList.remove('jfmj-loading', 'jfmj-success');
    btn.classList.add('jfmj-error');
    label.textContent = '↻ Recharge la page';
    btn.title = 'L\'extension a ete mise a jour. Recharge la page (F5) pour reactiver la capture.';
    btn.disabled = false;

    // Un clic sur le bouton dans cet etat recharge directement la page.
    btn.onclick = function () {
      window.location.reload();
    };
  }

  function showButtonError(btn, label, txt) {
    btn.classList.remove('jfmj-loading');
    btn.classList.add('jfmj-error');
    label.textContent = txt;
    setTimeout(function () {
      btn.classList.remove('jfmj-error');
      label.textContent = DEFAULT_LABEL;
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
    const spaWatcher = setInterval(function () {
      // Si l'extension a ete rechargee, on arrete la surveillance : ce script
      // est orphelin, inutile de continuer a consommer des ressources.
      if (!isExtensionAlive()) {
        contextInvalidated = true;
        clearInterval(spaWatcher);
        return;
      }

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
