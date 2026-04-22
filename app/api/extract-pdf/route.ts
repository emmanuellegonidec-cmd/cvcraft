import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildExtractPrompt } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json({ error: 'PDF manquant' }, { status: 400 });
    }

    // ⚠️ Claude Vision : on envoie le PDF directement, Claude le lit visuellement.
    // Bien supérieur à pdfjs pour les PDF complexes (multi-colonnes Canva, éléments graphiques).
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ data: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
