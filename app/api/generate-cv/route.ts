import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const prompt = `Tu es un expert en rédaction de CV. Génère un CV complet en ${data.lang || 'français'}, ton ${data.tone || 'professionnel'}.
${data.targetJob ? `Optimise pour ce poste : "${data.targetJob}"` : ''}

Nom : ${data.firstName || ''} ${data.lastName || ''}
Titre : ${data.title || ''}
Email : ${data.email || ''} | Tél : ${data.phone || ''} | Ville : ${data.city || ''}
${data.summary ? `\nPROFIL :\n${data.summary}` : ''}
${data.experiences?.length ? `\nEXPÉRIENCES :\n${data.experiences.map((e: any) => `• ${e.role} chez ${e.company} (${e.start} – ${e.end})\n  ${e.description}`).join('\n')}` : ''}
${data.education?.length ? `\nFORMATION :\n${data.education.map((e: any) => `• ${e.degree} — ${e.school} (${e.year})`).join('\n')}` : ''}
${data.skills ? `\nCOMPÉTENCES :\n${data.skills}` : ''}

Utilise des verbes d'action forts. Structure claire avec sections bien définies. 400-600 mots.`;

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
