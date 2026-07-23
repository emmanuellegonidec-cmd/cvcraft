// lib/emailValidation.ts
// Detection des adresses email jetables (temporaires).
// Utilise a l'inscription pour bloquer les faux comptes.
// Aucun accent dans ce fichier (evite les problemes d'encodage).

/**
 * Liste des domaines d'emails jetables les plus courants.
 * Pour en ajouter un : ajouter une ligne dans le tableau ci-dessous.
 */
const DISPOSABLE_DOMAINS = new Set<string>([
  // --- Francophones / tres utilises en France ---
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'jetable.org',
  'jetable.net',
  'jetable.com',
  'trashmail.fr',
  'trashmail.com',
  'trashmail.net',
  'nomail.xl.cx',
  'monmail.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'speed.1s.fr',
  'courriel.fr.nf',

  // --- Internationaux majeurs ---
  'mailinator.com',
  'mailinator.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'grr.la',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'tempr.email',
  'tmpmail.org',
  'tmpmail.net',
  'throwawaymail.com',
  'maildrop.cc',
  'mailnesia.com',
  'mytemp.email',
  'dispostable.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'nada.email',
  'inboxkitten.com',
  'emailondeck.com',
  'mohmal.com',
  'mailcatch.com',
  'spambog.com',
  'spamgourmet.com',
  'mailexpire.com',
  'meltmail.com',
  'incognitomail.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  '33mail.com',
  'anonbox.net',
  'burnermail.io',
  'moakt.com',
  'mail-temporaire.fr',
  'mail-temp.com',
  'linshiyouxiang.net',
  'harakirimail.com',
  'discard.email',
  'discardmail.com',
  'mailde.de',
  'mailde.info',
  'lroid.com',
  'byom.de',
  'einrot.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'armyspy.com',
  'emltmp.com',
  'mailtemp.info',
  'tempinbox.com',
  'trbvm.com',
  'yomail.info',
  'zetmail.com',
  'mail7.io',
  'luxusmail.org',
  'vomoto.com',
  'crazymailing.com',
  'tempmailaddress.com',
  'emailtemporanea.net',
  'minuteinbox.com',
  'mailpoof.com',
  'edu.aiot.ze.cx',
  'freeml.net',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'spambox.us',
  'spamdecoy.net',
  'e4ward.com',
  'kurzepost.de',
  'objectmail.com',
  'proxymail.eu',
  'rcpt.at',
  'trash-mail.at',
  'trash-mail.com',
  'trashmail.at',
  'trashmail.de',
  'trashmail.me',
  'wegwerfadresse.de',
  'nospam.ze.tc',
  'nomail.pw',
  'mailmetrash.com',
  'thankyou2010.com',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailin8r.com',
  'notmailinator.com',
  'reallymymail.com',
  'sogetthis.com',
  'suremail.info',
  'thisisnotmyrealemail.com',
  'veryrealemail.com',
  'zippymail.info',
]);

/**
 * Verifie si un email utilise un domaine jetable.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Verifie le format basique d'un email.
 */
export function isValidEmailFormat(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validation complete a utiliser a l'inscription.
 * Retourne { valid: true } ou { valid: false, error: "message a afficher" }
 */
export function validateSignupEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  const clean = (email || '').trim();

  if (!clean) {
    return { valid: false, error: 'Merci de saisir une adresse email.' };
  }

  if (!isValidEmailFormat(clean)) {
    return { valid: false, error: "Le format de l'adresse email est invalide." };
  }

  if (isDisposableEmail(clean)) {
    return {
      valid: false,
      error:
        "Les adresses email temporaires ne sont pas acceptees. Merci d'utiliser une adresse personnelle ou professionnelle.",
    };
  }

  return { valid: true };
}
