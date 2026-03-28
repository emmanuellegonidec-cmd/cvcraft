import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// ─── Auth (même pattern que toutes les routes) ────────────────────────────────
function createAuthedClient(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

async function getAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createAuthedClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return { userId: user.id, supabase };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}

// ─── Prompt d'extraction ──────────────────────────────────────────────────────
const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'analyse d'offres d'emploi.
Analyse ce document et extrais les informations suivantes.
Réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte autour, sans commentaires.

{
  "title": "intitulé exact du poste",
  "company": "nom de l'entreprise",
  "location": "ville ou région",
  "job_type": "CDI ou CDD ou Stage ou Alternance ou Freelance",
  "description": "toutes les missions listées, en texte",
  "requirements": "profil recherché, diplômes, compétences techniques et soft skills",
  "salary_text": "salaire si mentionné, sinon null",
  "department": "département ou service si mentionné, sinon null",
  "benefits": "avantages mentionnés, sinon null"
}

Règles :
- Si une info n'est pas clairement présente dans le document, mets null
- Pour "description" : inclus toutes les missions, même celles sous forme de liste
- Pour "requirements" : inclus le niveau de diplôme, les années d'expérience, les compétences
- Pour "job_type" : utilise uniquement l'une des valeurs listées ci-dessus
- Ne jamais inventer d'information qui n'est pas dans le document`;

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 MB)' }, { status: 400 });
    }

    const mimeType = file.type;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain',
    ];

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez PDF, Word (.docx), image JPG/PNG ou texte.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    let messageContent: Anthropic.MessageParam['content'];

    if (mimeType === 'application/pdf') {
      const base64Data = buffer.toString('base64');
      messageContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: EXTRACTION_PROMPT },
      ];

    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const textContent = result.value;
      if (!textContent.trim()) {
        return NextResponse.json({ error: 'Impossible de lire ce fichier Word. Essayez en PDF.' }, { status: 422 });
      }
      messageContent = [
        { type: 'text', text: `Voici le contenu d'un document Word :\n\n${textContent}\n\n${EXTRACTION_PROMPT}` },
      ];

    } else if (mimeType === 'text/plain') {
      const textContent = buffer.toString('utf-8');
      messageContent = [
        { type: 'text', text: `Voici le contenu d'un fichier texte :\n\n${textContent}\n\n${EXTRACTION_PROMPT}` },
      ];

    } else {
      const base64Data = buffer.toString('base64');
      const imageMediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp';
      messageContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: imageMediaType, data: base64Data },
        } as Anthropic.ImageBlockParam,
        { type: 'text', text: EXTRACTION_PROMPT },
      ];
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: messageContent }],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    const cleanJson = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    let extractedData: Record<string, unknown>;
    try {
      extractedData = JSON.parse(cleanJson);
    } catch {
      console.error('Erreur parsing JSON Claude:', rawText);
      return NextResponse.json(
        { error: "Impossible d'analyser le document. Essayez un format différent (PDF recommandé)." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: extractedData });

  } catch (error) {
    console.error('Erreur import-file:', error);
    return NextResponse.json({ error: "Erreur lors de l'analyse du fichier." }, { status: 500 });
  }
}
