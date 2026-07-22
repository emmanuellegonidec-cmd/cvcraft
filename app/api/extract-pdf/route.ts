import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildExtractPrompt } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// Extraction du bloc JSON depuis une réponse texte (retire backticks + texte autour).
// ---------------------------------------------------------------------------
function extractJsonBlock(raw: string): string {
  const cleaned = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : '{}';
}

// ---------------------------------------------------------------------------
// Lecture ROBUSTE du JSON renvoyé par l'IA.
// Les modèles produisent parfois un JSON légèrement mal formé (virgule manquante
// ou en trop dans une liste, surtout sur des profils longs). Plutôt que d'abandonner,
// on répare en 3 niveaux : lecture directe → réparations simples → réparation par l'IA.
// ---------------------------------------------------------------------------
async function parseJsonRobuste(jsonStr: string): Promise<any> {
  // Niveau 1 — lecture directe (cas normal)
  try {
    return JSON.parse(jsonStr);
  } catch (_e) {
    // on continue vers les réparations
  }

  // Niveau 2 — réparations automatiques simples (virgules traînantes avant } ou ])
  try {
    const repaired = jsonStr.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  } catch (_e) {
    // on continue vers la réparation par l'IA
  }

  // Niveau 3 — réparation par l'IA : on lui redonne son JSON invalide à corriger.
  // Consigne stricte : corriger uniquement le formatage, ne rien inventer ni supprimer.
  const repair = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    thinking: { type: 'disabled' },
    messages: [{
      role: 'user',
      content: `Le texte ci-dessous est censé être un objet JSON mais il est invalide (erreur de syntaxe : virgule ou crochet manquant/en trop). Corrige UNIQUEMENT le formatage pour le rendre valide. Ne modifie, n'ajoute ni ne supprime AUCUNE donnée. Réponds avec le JSON corrigé seul, sans backticks ni texte autour.\n\n${jsonStr}`,
    }],
  } as any);

  const repairBlock = repair.content.find((b) => b.type === 'text');
  const repairedRaw = repairBlock?.type === 'text' ? repairBlock.text : '{}';
  return JSON.parse(extractJsonBlock(repairedRaw));
}

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF manquant' }, { status: 400 });
    }

    // ⚠️ Claude Vision : on envoie le PDF directement, Claude le lit visuellement.
    // Bien supérieur à pdfjs pour les PDF complexes (multi-colonnes Canva, éléments graphiques).
    // Le `as any` sur l'objet params contourne une limitation des types TypeScript du SDK Anthropic
    // qui ne connaissent pas encore les champs 'document' et 'thinking' (l'API, elle, les supporte).
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 8000,
      thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: buildExtractPrompt(),
          },
        ],
      }],
    } as any);

    // Lecture robuste : on cherche le bloc de type 'text' au lieu de lire content[0].
    // Ainsi, même si un bloc de réflexion passe devant, on récupère bien le texte.
    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.type === 'text' ? textBlock.text : '{}';

    // Extraction + lecture robuste (avec réparation automatique si nécessaire)
    const jsonStr = extractJsonBlock(raw);
    const parsed = await parseJsonRobuste(jsonStr);

    return NextResponse.json({ data: parsed });
  } catch (e: any) {
    return NextResponse.json(
      { error: "L'analyse du CV a échoué. Réessayez dans un instant." },
      { status: 500 }
    );
  }
}
