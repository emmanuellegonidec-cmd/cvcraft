import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ cv: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
