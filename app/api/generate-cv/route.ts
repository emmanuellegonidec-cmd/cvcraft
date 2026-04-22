import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Reconstruit un rendu markdown lisible à partir du CV enrichi,
// pour garder la compatibilité avec le champ `content` stocké en BDD
// et offrir un texte humainement lisible si besoin.
function renderMarkdown(cv: any): string {
  const lines: string[] = [];
  const fullName = [cv.firstName, cv.lastName].filter(Boolean).join(' ');
  if (fullName) lines.push(`# ${fullName}`);
  if (cv.title) lines.push(`**${cv.title}**`);

  const contact = [cv.email, cv.phone, cv.city, cv.linkedin].filter(Boolean).join(' · ');
  if (contact) lines.push(contact);

  if (cv.summary) {
    lines.push('', '## Profil professionnel', cv.summary);
  }

  if (Array.isArray(cv.experiences) && cv.experiences.length) {
    lines.push('', '## Expériences professionnelles');
    for (const e of cv.experiences) {
      const dates = [e.start, e.end].filter(Boolean).join(' – ');
      const header = [e.role, e.company].filter(Boolean).join(' — ');
      lines.push('', `### ${header}${dates ? `  *(${dates})*` : ''}`);
      if (e.description) {
        for (const l of String(e.description).split('\n').filter(Boolean)) {
          lines.push(`- ${l.replace(/^[-•]\s*/, '')}`);
        }
      }
    }
  }

  if (Array.isArray(cv.education) && cv.education.length) {
    lines.push('', '## Formation');
    for (const e of cv.education) {
      const head = [e.degree, e.school].filter(Boolean).join(' — ');
      lines.push(`- ${head}${e.year ? `  *(${e.year})*` : ''}`);
    }
  }

  if (cv.skills) {
    lines.push('', '## Compétences', cv.skills);
  }

  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Garantit des valeurs par défaut pour lang et tone si le formulaire
    // ne les envoie pas, pour éviter que le prompt contienne "undefined".
    const safeData = {
      ...data,
      lang: data.lang || 'français',
      tone: data.tone || 'professionnel',
      experiences: data.experiences || [],
      education: data.education || [],
    };

    const prompt = buildGeneratePrompt(safeData);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Nettoyage robuste du JSON retourné par Claude
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();

    // Extraction du bloc JSON si du texte traîne autour
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : '{}';

    let enriched;
    try {
      enriched = JSON.parse(jsonStr);
    } catch (parseErr) {
      return NextResponse.json({
        error: "L'IA a renvoyé une réponse mal formée. Réessaie dans quelques secondes.",
      }, { status: 500 });
    }

    // Merge défensif : on conserve les champs factuels de l'entrée au cas où
    // Claude aurait involontairement modifié un champ qu'il ne devait pas toucher.
    const merged = {
      ...safeData,
      // Champs que l'IA a le droit d'enrichir :
      summary: enriched.summary ?? safeData.summary ?? '',
      skills: enriched.skills ?? safeData.skills ?? '',
      // Experiences : on garde ids + champs factuels, on n'accepte que la description enrichie
      experiences: Array.isArray(enriched.experiences)
        ? safeData.experiences.map((exp: any, i: number) => ({
            ...exp,
            description: enriched.experiences[i]?.description ?? exp.description ?? '',
          }))
        : safeData.experiences,
      // Education : on ne touche à rien (pas enrichissable)
      education: safeData.education,
    };

    return NextResponse.json({
      data: merged,              // ← nouveau : données enrichies pour alimenter form côté client
      cv: renderMarkdown(merged), // ← champ existant : markdown lisible pour sauvegarde BDD
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
