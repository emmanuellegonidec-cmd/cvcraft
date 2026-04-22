import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildExtractPrompt } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // Nettoyage des caractères de contrôle qui peuvent casser le parsing JSON.
    // ⚠️ On ne tronque PAS ici : la fonction buildExtractPrompt gère sa propre
    // limite (100 000 caractères), largement suffisante pour n'importe quel CV.
    const cleanedText = (text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const prompt = buildExtractPrompt(cleanedText);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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

    const parsed = JSON.parse(jsonStr);
    return NextResponse.json({ data: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
