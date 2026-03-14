import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { buildGeneratePrompt } from '@/lib/prompts';
import { CVFormData } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const data: CVFormData = await req.json();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildGeneratePrompt(data) }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ cv: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
