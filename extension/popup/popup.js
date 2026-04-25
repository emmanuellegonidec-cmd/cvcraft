// === popup.js ===
// Gère les interactions de la popup de l'extension Jean find my Job

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Jean] Popup chargée');

  const openJeanBtn = document.getElementById('open-jean');

  if (openJeanBtn) {
    openJeanBtn.addEventListener('click', () => {
      // Ouvre Jean find my Job dans un nouvel onglet
      chrome.tabs.create({
        url: 'https://jeanfindmyjob.fr/dashboard'
      });

      // Ferme la popup après le clic
      window.close();
    });
  }
});