// =====================================================
// Service Worker — Jean find my Job
// Rôle : pont entre le content script et le side panel
// =====================================================

// Stockage temporaire des données capturées (en mémoire du service worker)
// Le side panel viendra les chercher au chargement
let pendingCaptureData = null;

// Au clic sur l'icône de l'extension (toolbar), on ouvre la popup classique.
// Le side panel s'ouvre uniquement via le bouton "Capturer cette offre" du content script.

// Écoute les messages envoyés par le content script ou le side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[JFMJ SW] Message reçu :", message?.type);

  // Cas 1 : le content script a capturé une offre et demande l'ouverture du side panel
  if (message?.type === "JFMJ_CAPTURE_OFFER") {
    pendingCaptureData = {
      data: message.data,
      capturedAt: new Date().toISOString(),
      tabId: sender.tab?.id,
    };

    // Ouverture du side panel sur l'onglet actif
    if (sender.tab?.windowId) {
      chrome.sidePanel
        .open({ windowId: sender.tab.windowId })
        .then(() => {
          console.log("[JFMJ SW] Side panel ouvert");
          sendResponse({ ok: true });
        })
        .catch((err) => {
          console.error("[JFMJ SW] Erreur ouverture side panel :", err);
          sendResponse({ ok: false, error: err?.message });
        });
      // Indique qu'on répondra de façon asynchrone
      return true;
    }

    sendResponse({ ok: false, error: "Pas de windowId disponible" });
    return false;
  }

  // Cas 2 : le side panel demande les données capturées (au chargement)
  if (message?.type === "JFMJ_GET_PENDING_CAPTURE") {
    sendResponse({ ok: true, payload: pendingCaptureData });
    // Une fois lues, on les efface pour éviter une réutilisation accidentelle
    pendingCaptureData = null;
    return false;
  }

  return false;
});

// Log de démarrage (visible dans la console du service worker via chrome://extensions/)
console.log("[JFMJ SW] Service worker démarré — version 0.4.0");