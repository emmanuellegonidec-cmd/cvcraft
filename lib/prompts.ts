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
