import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // Tronque le texte à 6000 caractères pour éviter les dépassements
    const safeText = (text || '').slice(0, 6000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const prompt = `Tu es un extracteur de données CV. Analyse ce texte et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Le JSON doit avoir exactement cette structure :
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

Règles importantes :
- Toutes les valeurs doivent être des strings simples sans guillemets internes
- Le champ skills est une liste de compétences séparées par des virgules
- Ne mets aucun caractère spécial dans les valeurs
- Retourne UNIQUEMENT le JSON, rien d'autre

Texte du CV :
${safeText}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}';

    // Nettoyage robuste du JSON
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