// =====================================================
// Configuration Supabase (anon key, OK d'etre publique)
// =====================================================
const SUPABASE_URL = 'https://kjsqfgpewjzierlxzdyj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc3FmZ3Bld2p6aWVybHh6ZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTgyNDUsImV4cCI6MjA4OTA3NDI0NX0.UlR7xF9grcPIPQ30WjLYojD76bPvnwFGBQgIizf1wu4';

// =====================================================
// URLs externes Jean
// =====================================================
const JEAN_DASHBOARD_URL = 'https://jeanfindmyjob.fr/dashboard';
const JEAN_HOME_URL = 'https://jeanfindmyjob.fr/';

// =====================================================
// Cle utilisee dans chrome.storage.local
// =====================================================
const STORAGE_KEY = 'jfmj_session';

// =====================================================
// References DOM
// =====================================================
const zoneLogin = document.getElementById('zone-login');
const zoneAccount = document.getElementById('zone-account');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');
const submitBtn = document.getElementById('submit-btn');
const userEmailEl = document.getElementById('user-email');
const openJeanBtn = document.getElementById('open-jean-btn');
const logoutBtn = document.getElementById('logout-btn');
const signupLink = document.getElementById('signup-link');

// =====================================================
// UI : afficher la zone "compte connecte"
// =====================================================
function showAccountZone(email) {
  zoneLogin.classList.add('hidden');
  zoneAccount.classList.remove('hidden');
  userEmailEl.textContent = email;
}

// =====================================================
// UI : afficher la zone "formulaire de connexion"
// =====================================================
function showLoginZone() {
  zoneAccount.classList.add('hidden');
  zoneLogin.classList.remove('hidden');
  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';
  emailInput.value = '';
  passwordInput.value = '';
}

// =====================================================
// UI : afficher un message d'erreur sous le formulaire
// =====================================================
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
}

// =====================================================
// Au chargement : verifie si une session existe deja
// =====================================================
async function checkExistingSession() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const session = result[STORAGE_KEY];

  if (!session || !session.access_token) {
    showLoginZone();
    return;
  }

  // Verifie si le token est expire (expires_at en secondes UNIX)
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at < nowInSeconds) {
    // Token expire : on efface la session et on remontre le formulaire
    // (la gestion du refresh token sera ajoutee dans une session ulterieure)
    await chrome.storage.local.remove([STORAGE_KEY]);
    showLoginZone();
    return;
  }

  // Session valide
  showAccountZone(session.user.email);
}

// =====================================================
// Connexion via Supabase Auth
// =====================================================
async function handleLogin(event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Email et mot de passe requis.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connexion...';
  errorMsg.classList.add('hidden');

  try {
    const response = await fetch(
      SUPABASE_URL + '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: email, password: password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const rawError = data.error_description || data.msg || data.error || '';
      if (rawError.toLowerCase().includes('invalid login credentials')) {
        showError('Email ou mot de passe incorrect.');
      } else if (rawError.toLowerCase().includes('email not confirmed')) {
        showError('Ton email n\'est pas encore confirme.');
      } else {
        showError(rawError || 'Erreur de connexion. Reessaie.');
      }
      return;
    }

    // Succes : on stocke la session complete
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      token_type: data.token_type,
      user: data.user,
    };

    await chrome.storage.local.set({ [STORAGE_KEY]: session });
    showAccountZone(data.user.email);
  } catch (err) {
    console.error('[Jean] Erreur de connexion :', err);
    showError('Connexion impossible. Verifie ta connexion internet.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
  }
}

// =====================================================
// Deconnexion
// =====================================================
async function handleLogout() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  const session = result[STORAGE_KEY];

  // Tentative d'invalidation cote serveur (best effort)
  if (session && session.access_token) {
    try {
      await fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + session.access_token,
        },
      });
    } catch (err) {
      console.warn('[Jean] Logout serveur a echoue (sans gravite) :', err);
    }
  }

  // Effacement local dans tous les cas
  await chrome.storage.local.remove([STORAGE_KEY]);
  showLoginZone();
}

// =====================================================
// Ouvrir le dashboard Jean
// =====================================================
function handleOpenJean() {
  chrome.tabs.create({ url: JEAN_DASHBOARD_URL });
}

// =====================================================
// Lien "creer un compte" : ouvre la home Jean
// =====================================================
function handleSignup(event) {
  event.preventDefault();
  chrome.tabs.create({ url: JEAN_HOME_URL });
}

// =====================================================
// Initialisation au chargement de la popup
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  openJeanBtn.addEventListener('click', handleOpenJean);
  signupLink.addEventListener('click', handleSignup);

  checkExistingSession();
});
