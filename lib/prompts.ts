import { CVFormData } from './types';

// ⚠️ Prompt de génération — refonte 23 avril 2026
// Structure : pipeline forcé en 3 étapes + 6 règles explicites + 1 exemple concret bon/mauvais.
// Objectifs : préserver les chiffres source, injecter les keywords de façon éthique,
// forme verbale à l'infinitif, narrative bridge dans le summary.
export function buildGeneratePrompt(data: CVFormData): string {
  let p = `Tu es un expert en rédaction de CV ATS-friendly. Tu optimises ce CV en ${data.lang}, ton ${data.tone}.\n`;

  if (data.targetJob) {
    p += `\nPOSTE VISÉ : "${data.targetJob}"
Adapte le vocabulaire et le cadrage du contenu pour ce type de poste. Mets en avant en priorité les expériences et compétences les plus pertinentes pour ce poste (sans jamais en inventer).\n`;
  } else {
    p += `\nAucun poste visé n'est renseigné — optimise le CV de manière générique, professionnelle et ATS-friendly, en restant fidèle aux données fournies.\n`;
  }

  p += `
=== FORMAT DE SORTIE ===
Tu retournes UNIQUEMENT un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Structure exacte attendue (mêmes champs qu'en entrée) :
{
  "firstName": "",
  "lastName": "",
  "title": "",
  "email": "",
  "phone": "",
  "city": "",
  "linkedin": "",
  "summary": "",
  "experiences": [
    { "role": "", "company": "", "start": "", "end": "", "description": "" }
  ],
  "education": [
    { "degree": "", "school": "", "year": "" }
  ],
  "skills": ""
}

=== PIPELINE OBLIGATOIRE EN 3 ÉTAPES ===

ÉTAPE 1 — IDENTIFIER LES KEYWORDS CIBLES
Analyse en silence les données en entrée (summary, expériences, skills) et le poste visé.
Identifie 10 à 15 mots-clés métier pertinents qui apparaissent dans le profil OU qui correspondent au type de poste visé ET sont plausiblement couverts par l'expérience de la personne.
Tu ne retournes PAS cette liste — elle sert uniquement à guider les étapes 2 et 3.

ÉTAPE 2 — DISTRIBUTION STRATÉGIQUE
Répartis les keywords dans 3 zones :
- Summary : 4 à 5 keywords les plus importants (zone lue en 6 secondes par un recruteur)
- Premier bullet de chaque expérience : 1 à 2 keywords pertinents pour le poste
- Skills : listing exhaustif, groupé par thème si pertinent

ÉTAPE 3 — RÉÉCRITURE
Réécris summary, experiences[].description et skills en appliquant les keywords distribués à l'étape 2.
Tous les autres champs factuels (firstName, lastName, title, email, phone, city, linkedin, experiences[].role, experiences[].company, experiences[].start, experiences[].end, education[].degree, education[].school, education[].year) sont REPRIS TELS QUELS, sans modification.
Tu conserves le MÊME NOMBRE d'expériences et de formations qu'en entrée, dans le MÊME ORDRE.

=== RÈGLE #1 — PRÉSERVATION ABSOLUE DES CHIFFRES ===

Tous les chiffres, pourcentages, montants et volumes présents dans les données source DOIVENT apparaître dans la version réécrite :
- Pourcentages : 30%, +15%, -20%
- Montants : 1,4 M€, 66k€, 600K€, 12M€
- Tailles d'équipe / portefeuille : 12 personnes, 21 clients
- Durées et volumes : 5 ans, 3 projets, 740 offres

Si une description source contient 3 chiffres, la description réécrite en contient AU MINIMUM 3. Tu ne paraphrases PAS un chiffre en mot flou ("significatif", "important", "conséquent", "fort") — tu conserves le chiffre exact.

Les chiffres sont la preuve de valeur du candidat. Les perdre détruit la valeur du CV.

=== RÈGLE #2 — KEYWORD INJECTION ÉTHIQUE ===

TU PEUX :
- Reformuler une expérience existante avec le vocabulaire exact du poste visé
- Remplacer "animation d'équipe" par "management d'équipe" si le poste parle de management
- Remplacer "gestion de projets" par "pilotage de projets transverses" si c'est le langage du domaine cible

TU NE PEUX PAS :
- Ajouter une compétence, un outil ou une méthodologie absents du profil source
- Si la personne n'a jamais fait de SAP, ne pas mettre "SAP" même si c'est dans le titre du poste visé
- Inventer une certification, un diplôme, un chiffre, un résultat ou un projet

=== RÈGLE #3 — NARRATIVE BRIDGE DANS LE SUMMARY ===

Si un poste visé est renseigné ET qu'il y a un décalage apparent entre l'expérience passée et le poste cible, le summary fait le pont entre les deux.

Template FR : "[X] ans en [domaine passé]. Aujourd'hui focus sur [domaine du poste visé], avec un attachement à [valeur transversale : performance, pilotage, structuration, transformation, etc.]."

Si le poste visé est dans la continuité directe de l'expérience, pas besoin de bridge — rester sur une accroche classique dense en keywords.

=== RÈGLE #4 — FORME VERBALE DES BULLETS ===

Chaque bullet d'expérience commence par un verbe à L'INFINITIF.
Exemples : Piloter, Déployer, Optimiser, Accompagner, Structurer, Coordonner, Analyser, Conduire, Orchestrer, Négocier, Concevoir, Développer, Animer, Gérer, Superviser, Mettre en place.

PAS de présent 3e personne ("Pilote"), PAS de participe passé ("Piloté"), PAS de nominalisation ("Pilotage de...").

=== RÈGLE #5 — ANTI-HALLUCINATION ===

Tu utilises UNIQUEMENT les informations fournies. N'invente AUCUN chiffre, AUCUNE donnée, AUCUN fait, AUCUNE compétence, AUCUNE méthode, AUCUN outil, AUCUN projet.
Si une information est absente en entrée, renvoie une chaîne vide "" dans le JSON. N'utilise PAS de placeholders du type [X années] ou [chiffre].

=== RÈGLE #6 — CADRAGE DES CONTENUS ===

summary : 3 à 4 lignes maximum, dense en keywords, sans phrases creuses ni adjectifs gratuits ("dynamique", "passionné", "motivé" sans contexte).

experiences[].description : 3 à 5 lignes séparées par des retours à la ligne "\\n". Chaque ligne commence par un verbe à l'infinitif (Règle #4). Orientée résultat plutôt que tâche. Préserve les chiffres source (Règle #1).

skills : liste séparée par des virgules, items courts (1 à 4 mots maximum par item), groupés par thème si pertinent.

=== EXEMPLE CONCRET ===

DONNÉE SOURCE (experience.description) :
"Responsable des campagnes marketing digital pour le segment Luxe. J'ai développé un nouveau programme CRM qui a fait passer le taux d'ouverture de 12% à 50%, pour un budget annuel de 1,4 M€ et 21 clients grands comptes (66k€ en moyenne)."

✅ BONNE RÉÉCRITURE (chiffres préservés, verbes à l'infinitif, orientée résultat) :
"Piloter les campagnes marketing digital sur le segment Luxe pour 21 clients grands comptes (66k€ en moyenne)
Déployer un programme CRM ayant fait passer le taux d'ouverture de 12% à 50%
Gérer un budget annuel de 1,4 M€ en optimisant le ROI par canal"

❌ MAUVAISE RÉÉCRITURE (chiffres perdus, vocabulaire flou, forme verbale conjuguée) :
"Pilote la stratégie de campagnes marketing digital à forte valeur ajoutée sur le segment premium
Optimise significativement les performances CRM via un programme personnalisé
Gère un budget conséquent en assurant un ROI optimal"

--- DONNÉES DU CV EN ENTRÉE ---

{
  "firstName": ${JSON.stringify(data.firstName || '')},
  "lastName": ${JSON.stringify(data.lastName || '')},
  "title": ${JSON.stringify(data.title || '')},
  "email": ${JSON.stringify(data.email || '')},
  "phone": ${JSON.stringify(data.phone || '')},
  "city": ${JSON.stringify(data.city || '')},
  "linkedin": ${JSON.stringify(data.linkedin || '')},
  "summary": ${JSON.stringify(data.summary || '')},
  "experiences": ${JSON.stringify(data.experiences || [])},
  "education": ${JSON.stringify(data.education || [])},
  "skills": ${JSON.stringify(data.skills || '')}
}

--- FIN DES DONNÉES ---

Retourne maintenant l'objet JSON optimisé en appliquant strictement le pipeline en 3 étapes et les 6 règles ci-dessus.`;

  return p;
}

// ⚠️ Prompt d'extraction pour Claude Vision : le PDF est attaché directement au message,
// Claude le lit visuellement. Prompt volontairement simple pour éviter qu'il ré-interprète
// ou redistribue du contenu entre les sections.
export function buildExtractPrompt(): string {
  return `Extrais les données de ce CV PDF et retourne UNIQUEMENT un JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Format attendu :
{"firstName":"","lastName":"","title":"","email":"","phone":"","city":"","linkedin":"","summary":"","skills":"","experiences":[{"role":"","company":"","start":"","end":"","description":""}],"education":[{"degree":"","school":"","year":""}]}

Règles strictes :

1. Extrais ce qui est écrit dans le CV, n'invente rien et ne déplace rien entre les sections.

2. Chaque expérience dans "experiences" = UN poste unique avec SES propres dates et SEULEMENT les bullets/texte qui lui sont directement associés dans le CV. Ne mélange JAMAIS le contenu de deux expériences différentes. Si tu as un doute, isole le contenu dans l'expérience la plus pertinente uniquement.

3. "skills" : UNIQUEMENT des items courts (1 à 4 mots maximum par item) séparés par des virgules. Typiquement : outils/logiciels, langues, compétences techniques courtes, thèmes de compétence condensés. N'inclus PAS de phrases descriptives longues, PAS de réalisations chiffrées, PAS de bullets détaillés. Si tu trouves des bullets longs dans une section "Compétences clés", condense-les en titre court ou ignore-les.

4. "education[].degree" : intitulé du diplôme SEUL. Exclus les parenthèses type "(8 mois)", exclus les préfixes "Réalisation : …" ou descriptions de projets d'école.
   Exemple : "ESCP Extension (8 mois) — IA, No Code et transformation digitale — Réalisation : Plateforme IA de veille…" → degree = "IA, No Code et transformation digitale", school = "ESCP Extension".

5. "summary" : 2 à 4 lignes maximum, uniquement l'accroche/profil personnel en haut du CV. Ne copie pas les compétences ni les expériences.

6. Cherche activement les sections "Formation/Études/Diplômes", "Compétences/Skills/Outils", "Expériences/Parcours", même si elles sont en colonne latérale ou en bas de page. Capture TOUTES les entrées.

7. Dates d'expérience : utilise le format tel qu'écrit dans le CV (ex : "2021", "2021/24", "2025/26"). Pour "end", utilise "Présent" si pas de date de fin.`;
}

// ============================================================
// PROMPT DE GÉNÉRATION DE LETTRE DE MOTIVATION
// Session 6b.1 — 27 avril 2026
// ============================================================
//
// Principe directeur : la lettre est centrée sur les BESOINS DE L'ENTREPRISE,
// pas sur le candidat. Le candidat reformule ce que l'entreprise a écrit dans
// l'offre (sans diagnostiquer à sa place), puis démontre par des chiffres
// EXCLUSIVEMENT issus du profil/CV qu'il sait y répondre.
//
// Posture : humble, factuelle, au service du projet de l'entreprise.
// Pas d'auto-célébration, pas de promesses creuses, pas de superlatifs.
// ============================================================

export interface LMUserProfile {
  firstName?: string | null;
  lastName?: string | null;
  current_title?: string | null;
  target_title?: string | null;
  summary?: string | null;
  key_skills?: string[] | null;
  experience_level?: string | null;
  city?: string | null;
  sector?: string | null;
}

export interface LMJob {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  requirements?: string | null;
  recruitment_process?: string | null;
}

export interface LMGenerateOptions {
  tone: 'chaleureux' | 'sobre' | 'percutant';
  length: 250 | 300 | 400;
  lang: 'FR' | 'EN';
}

export function buildGenerateLMPrompt(
  profile: LMUserProfile,
  job: LMJob,
  cvMarkdown: string | null,
  options: LMGenerateOptions
): string {
  const { tone, length, lang } = options;
  const lengthMin = Math.round(length * 0.95);
  const lengthMax = Math.round(length * 1.05);

  const langLabel = lang === 'FR' ? 'français' : 'anglais';
  const greetingFr = '"Madame, Monsieur,"';
  const greetingEn = '"Dear Hiring Manager,"';
  const closingFr = '"Je vous prie d\'agréer, Madame, Monsieur, mes salutations distinguées."';
  const closingEn = '"Best regards,"';
  const greeting = lang === 'FR' ? greetingFr : greetingEn;
  const closing = lang === 'FR' ? closingFr : closingEn;

  const cvBlock = cvMarkdown
    ? `\n--- CV DE RÉFÉRENCE (markdown) ---\n${cvMarkdown}\n--- FIN CV ---\n`
    : `\nCV non fourni — appuie-toi sur le profil utilisateur uniquement. Si le profil ne contient aucun élément factuel ou chiffré, écris une lettre courte qui reste honnête et qui ne fabrique rien.\n`;

  return `Tu es un expert en lettres de motivation française. Tu rédiges UNE lettre de motivation en ${langLabel}, ton ${tone}, longueur cible ${length} mots (fourchette acceptable : ${lengthMin} à ${lengthMax} mots).

Description du ton à appliquer :
- chaleureux → Humain et accessible, avec une touche de chaleur. Première personne assumée. Quelques formulations qui montrent l'engagement personnel. Pas familier.
- sobre → Professionnel et factuel. Distance respectueuse. Phrases nettes, peu d'effet de style. Pas froid.
- percutant → Direct et dense. Orienté résultats. Phrases courtes. Verbes d'action. Pas agressif.

Contexte de la candidature :
L'utilisateur postule au poste "${job.title || ''}" chez ${job.company || ''}${job.location ? ` (lieu : ${job.location})` : ''}.

═══════════════════════════════════════════════════════════════
⚡ PRINCIPE DIRECTEUR — LIRE AVANT TOUT
═══════════════════════════════════════════════════════════════

L'axe central de cette lettre n'est PAS le candidat. C'est l'ENTREPRISE et ses besoins.

La lettre démontre que l'expertise du candidat répond aux besoins de l'entreprise tels qu'elle les a formulés dans l'offre — sans jamais lui apprendre ce qu'elle a déjà écrit, ni lui expliquer ses propres enjeux.

La logique de la lettre va de l'entreprise vers le candidat, jamais l'inverse :
1. Tu identifies les besoins / missions / exigences de l'entreprise à partir de l'offre d'emploi (sans les inventer ni les surinterpréter — tu te tiens au texte de l'offre).
2. Tu démontres que l'expertise du candidat répond à ces besoins, en t'appuyant EXCLUSIVEMENT sur des preuves chiffrées issues du profil ou du CV.
3. Tu restes humble : la lettre ne vante pas le candidat, elle expose des faits qui parlent d'eux-mêmes. Pas d'auto-célébration. Le candidat est au service du projet de l'entreprise, pas l'inverse.

Test de validation : si tu remplaces "je" par le nom du candidat dans la lettre, est-ce qu'elle ressemble à un argumentaire commercial centré sur lui ? Si oui, réécris.

La lettre doit ressembler à un raisonnement modeste : "Si je comprends bien ce que vous cherchez, mon parcours a justement permis de [preuve chiffrée]." Le candidat propose une lecture de l'offre — il n'impose pas un diagnostic à l'entreprise.

═══════════════════════════════════════════════════════════════
PIPELINE OBLIGATOIRE EN 3 ÉTAPES
═══════════════════════════════════════════════════════════════

ÉTAPE 1 — DIAGNOSTIC SILENCIEUX
Lis attentivement les données en entrée et identifie en silence :
- 2-3 missions, exigences ou éléments de contexte clairs de l'entreprise pour ce poste (déduits de l'offre, sans les surinterpréter)
- Pour chaque élément, 1 preuve chiffrée dans le profil/CV qui démontre que le candidat sait y répondre (% de croissance, montants gérés, tailles d'équipe, nombre de projets/clients, durée d'expertise sur le domaine concerné)
- 1 angle d'entreprise (mission, projet récent, valeur, positionnement) qui peut servir d'accroche si l'offre en mentionne un

Tu ne retournes PAS ce diagnostic. Il sert uniquement à structurer la lettre.

ÉTAPE 2 — STRUCTURE EN 4 PARAGRAPHES (axe besoins entreprise)

P1 — Accroche orientée entreprise (3-4 phrases) :
S'appuie sur ce que l'entreprise dit explicitement (offre, mission, contexte). Mentionne le nom de l'entreprise et l'intitulé du poste. Reformule un point précis du texte de l'offre — ne diagnostique pas, ne décrète pas un enjeu central. Ne commence PAS par "Je vous écris...", "C'est avec un grand intérêt...", "Suite à votre annonce...".

P2 — Adéquation besoin/preuve (4-6 phrases) :
Pour 1-2 missions/exigences identifiées à l'étape 1, fournis la preuve concrète issue du parcours du candidat. Chaque preuve = une phrase qui décrit le contexte + le résultat chiffré. Format type : "Vous mentionnez [élément précis de l'offre]. Sur ce type d'enjeu, j'ai [verbe d'action] [contexte concret] avec [résultat chiffré exact]." Préserve les chiffres EXACTS issus du profil/CV.

P3 — Apport concret pour l'entreprise (3-4 phrases) :
Projette l'expertise du candidat sur les missions du poste. Comment cette expérience peut se traduire en valeur opérationnelle pour l'entreprise (économies, accélération, structuration, sécurisation, déblocage). Reste factuel, pas de promesses creuses ni de superlatifs ("je serai un atout précieux", "je m'engage à dépasser vos objectifs"). Si tu n'as pas matière, sois bref plutôt que générique.

P4 — Conclusion sobre + formule de politesse (2-3 phrases) :
Invitation à un échange (sans formule cliché). Pas de "Je suis à votre disposition...", pas de "N'hésitez pas...". Termine par ${closing}.

ÉTAPE 3 — RÉDACTION
Rédige la lettre en appliquant les 8 règles ci-dessous.

═══════════════════════════════════════════════════════════════
8 RÈGLES STRICTES
═══════════════════════════════════════════════════════════════

RÈGLE #1 — PREUVE PAR LES CHIFFRES, EXCLUSIVEMENT DEPUIS LE PROFIL/CV
Toute affirmation sur le candidat (compétence, réalisation, expertise) DOIT être démontrée par un chiffre ou un fait précis présent dans les données en entrée (profil, CV). N'invente AUCUN chiffre, AUCUNE expérience, AUCUNE compétence, AUCUN outil, AUCUN projet, AUCUN diplôme. Si une affirmation ne peut pas être démontrée par une donnée d'entrée, NE LA FAIS PAS. Au moins 1 chiffre exact dans le P2, idéalement 1 dans le P3.

RÈGLE #2 — HUMILITÉ ET POSTURE DE SERVICE
Le candidat se positionne au service du projet de l'entreprise. JAMAIS d'auto-célébration. Bannir : "Je suis le candidat idéal", "Mon profil est parfaitement aligné", "Mon parcours unique", "Mes compétences exceptionnelles", "Je vous garantis...", "Je suis convaincu(e) d'être...".

Bannir AUSSI les formulations diagnostic-péremptoires : "Le problème que vous rencontrez...", "Votre véritable enjeu est...", "Ce qu'il vous faut...", "Le défi que vous devez relever...". Le candidat ne diagnostique pas l'entreprise. Il lit l'offre et propose une lecture qui peut être validée ou non.

Formulations modestes à privilégier : "Si je comprends bien votre offre...", "L'enjeu de [X] que vous évoquez dans le contexte du poste...", "La mission de [Y] décrite dans l'annonce...", "Vous mentionnez...". Le candidat reformule ce que l'entreprise a déjà dit, il n'invente pas un problème pour le résoudre.

À la place, formulations factuelles : "Mon expérience sur [X] correspond à votre besoin de [Y]", "Les [N] années passées sur [Z] m'ont permis de [résultat concret]".

RÈGLE #3 — INTERDICTIONS LEXICALES
Tu n'utilises JAMAIS : "dynamique", "motivé(e)", "passionné(e)", "rigoureux(se)", "force de proposition", "esprit d'équipe", "autonome", "adaptable", "polyvalent(e)" (tous sans démonstration chiffrée). Ni : "Je vous écris pour...", "C'est avec un grand intérêt que...", "Permettez-moi de...", "Je me permets de...", "Suite à votre annonce...", "Dans l'attente de votre retour...", "N'hésitez pas à me contacter...", "Je reste à votre disposition...".

RÈGLE #4 — STRUCTURE EN 4 PARAGRAPHES
EXACTEMENT 4 paragraphes, séparés par UN SEUL double saut de ligne (\\n\\n). Pas de titres, pas de listes à puces. Le tout précédé de ${greeting} sur sa propre ligne, séparée du P1 par un double saut de ligne.

RÈGLE #5 — NE PAS RÉSUMER LE CV
La lettre n'est PAS un résumé du CV. Elle DONNE ENVIE de lire le CV. Cite MAXIMUM 2 expériences précises (pas plus). Pas de liste exhaustive de compétences. Pas de chronologie de carrière. Choisis les éléments qui répondent DIRECTEMENT aux besoins identifiés à l'étape 1.

RÈGLE #6 — TON ET LONGUEUR
Respecte le ton et la longueur cible (fourchette ±5%). Compte la formule d'appel et la formule de politesse dans le total.

RÈGLE #7 — FORMAT DE SORTIE
Tu retournes UNIQUEMENT la lettre, sans préambule ("Voici la lettre :"), sans explication, sans markdown, sans gras, sans italique, sans listes, sans balises HTML, sans en-tête (objet, date, adresses), sans signature. L'utilisateur ajoutera la signature lui-même. Tu commences directement par la formule d'appel.

RÈGLE #8 — ANTI-PROMESSES, ANTI-SUPERLATIFS
Pas de promesses non démontrables ("Je m'engage à dépasser vos objectifs", "Je transformerai votre équipe"). Pas de superlatifs gratuits ("expertise unique", "compétences exceptionnelles", "résultats remarquables"). Faits, chiffres, actions concrètes uniquement.

═══════════════════════════════════════════════════════════════
EXEMPLES CONCRETS
═══════════════════════════════════════════════════════════════

--- PARAGRAPHE D'ACCROCHE ---

❌ MAUVAIS (centré sur le candidat, cliché) :
"C'est avec un grand intérêt que je vous adresse ma candidature pour le poste de Chef de projet marketing. Dynamique et motivée, je suis passionnée par votre secteur et je serais ravie de mettre mes compétences à votre service."

❌ MAUVAIS BIS (centré sur l'entreprise mais péremptoire, donneur de leçons) :
"Le repositionnement récent de Maison Lenôtre sur la pâtisserie premium accessible pose une question opérationnelle claire : comment maintenir l'exigence de la marque tout en élargissant l'audience digitale ? Le poste de Chef de projet marketing s'inscrit dans cette équation."

✅ BON (modeste, ancré dans ce que l'offre dit explicitement) :
"Le repositionnement récent de Maison Lenôtre sur la pâtisserie premium accessible m'a particulièrement intéressée, et je me reconnais dans le poste de Chef de projet marketing que vous proposez. Vous évoquez le pilotage de campagnes digitales sur un segment exigeant — c'est exactement le terrain de mes 7 dernières années, sur le luxe accessible."

--- PARAGRAPHE D'ADÉQUATION BESOIN/PREUVE ---

❌ MAUVAIS (auto-promotion vague, chiffres absents) :
"Mon expertise en marketing digital me permet de gérer efficacement des budgets importants et de piloter des équipes performantes. Je suis reconnue pour ma capacité à délivrer des résultats."

✅ BON (reformule l'offre + preuve chiffrée tirée du profil) :
"Vous mentionnez la structuration d'un programme CRM premium parmi les missions du poste. Chez [entreprise X], j'ai déployé un programme qui a fait passer le taux d'ouverture de 12% à 50%, sur un budget annuel de 1,4 M€ et 21 clients grands comptes (66k€ en moyenne). La logique d'individualisation par segment que vous évoquez dans le contexte du poste rejoint directement ce que ce dispositif a permis de mettre en place."

═══════════════════════════════════════════════════════════════
DONNÉES EN ENTRÉE
═══════════════════════════════════════════════════════════════

--- PROFIL UTILISATEUR ---
${JSON.stringify({
  firstName: profile.firstName || '',
  lastName: profile.lastName || '',
  current_title: profile.current_title || '',
  target_title: profile.target_title || '',
  summary: profile.summary || '',
  key_skills: profile.key_skills || [],
  experience_level: profile.experience_level || '',
  city: profile.city || '',
  sector: profile.sector || '',
}, null, 2)}
--- FIN PROFIL ---

--- OFFRE D'EMPLOI ---
${JSON.stringify({
  title: job.title || '',
  company: job.company || '',
  location: job.location || '',
  description: job.description || '',
  requirements: job.requirements || '',
  recruitment_process: job.recruitment_process || '',
}, null, 2)}
--- FIN OFFRE ---
${cvBlock}
═══════════════════════════════════════════════════════════════
DEMANDE FINALE
═══════════════════════════════════════════════════════════════

Rédige maintenant la lettre de motivation en appliquant strictement le principe directeur, le pipeline en 3 étapes et les 8 règles. Retourne UNIQUEMENT la lettre, en commençant par la formule d'appel.`;
}
