import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import {
  buildGenerateLMPrompt,
  LMUserProfile,
  LMJob,
  LMGenerateOptions,
} from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ──────────────────────────────────────────────────────────────────
// CORS — autoriser les appels depuis l'extension Chrome
// ──────────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ──────────────────────────────────────────────────────────────────
// Auth : Bearer token (pattern projet)
// ──────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────
// Reconstruction markdown CV (recopiée à l'identique de /api/generate-lm)
// ──────────────────────────────────────────────────────────────────
function rebuildCvMarkdown(formData: any): string {
  if (!formData || typeof formData !== 'object') return '';
  const lines: string[] = [];
  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
  if (fullName) lines.push(`# ${fullName}`);
  if (formData.title) lines.push(`**${formData.title}**`);

  const contact = [formData.email, formData.phone, formData.city, formData.linkedin]
    .filter(Boolean).join(' · ');
  if (contact) lines.push(contact);

  if (formData.summary) lines.push('', '## Profil', formData.summary);

  if (Array.isArray(formData.experiences) && formData.experiences.length) {
    lines.push('', '## Expériences');
    for (const e of formData.experiences) {
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

  if (Array.isArray(formData.education) && formData.education.length) {
    lines.push('', '## Formation');
    for (const e of formData.education) {
      const head = [e.degree, e.school].filter(Boolean).join(' — ');
      lines.push(`- ${head}${e.year ? `  *(${e.year})*` : ''}`);
    }
  }

  if (formData.skills) lines.push('', '## Compétences', formData.skills);

  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────────
// Charge le CV de référence (creator markdown OU upload PDF base64)
// ──────────────────────────────────────────────────────────────────
async function loadCvByRef(
  ref: string,
  userId: string,
  supabase: any
): Promise<{ type: 'markdown'; text: string } | { type: 'pdf'; base64: string } | null> {
  if (!ref || typeof ref !== 'string') return null;

  if (ref.startsWith('creator:')) {
    const cvId = ref.slice('creator:'.length);
    const { data, error } = await supabase
      .from('cvs')
      .select('form_data, content')
      .eq('id', cvId)
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    const md = data.form_data ? rebuildCvMarkdown(data.form_data) : (data.content || '');
    return md ? { type: 'markdown', text: md } : null;
  }

  if (ref.startsWith('upload:')) {
    const filePath = ref.slice('upload:'.length);
    if (!filePath.startsWith(userId + '/')) return null;
    const { data, error } = await supabase.storage
      .from('job-documents')
      .download(filePath);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return { type: 'pdf', base64: buffer.toString('base64') };
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────
// Validation des options
// ──────────────────────────────────────────────────────────────────
function validateOptions(input: any): LMGenerateOptions | null {
  const validTones = ['chaleureux', 'sobre', 'percutant'] as const;
  const validLengths = [250, 300, 400] as const;
  const validLangs = ['FR', 'EN'] as const;

  const tone = input?.tone;
  const length = Number(input?.length);
  const lang = input?.lang;

  if (!validTones.includes(tone)) return null;
  if (!validLengths.includes(length as any)) return null;
  if (!validLangs.includes(lang)) return null;

  return { tone, length: length as 250 | 300 | 400, lang };
}

// ──────────────────────────────────────────────────────────────────
// POST /api/extension/generate-lm
// Body : { jobId, tone, length, lang, cvRef? }
// ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { userId, supabase } = await getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const body = await req.json();
    const jobId = body?.jobId;
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        { error: 'jobId requis' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const options = validateOptions(body);
    if (!options) {
      return NextResponse.json(
        { error: 'Paramètres invalides (tone/length/lang)' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // ── 1. Charger l'offre ──
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, requirements, recruitment_process, user_id')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: 'Offre introuvable' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const lmJob: LMJob = {
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      recruitment_process: job.recruitment_process,
    };

    // ── 2. Charger le profil ──
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, current_title, target_title, summary, key_skills, experience_level, city, sector, default_cv_ref')
      .eq('user_id', userId)
      .single();

    const lmProfile: LMUserProfile = {
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      current_title: profile?.current_title ?? null,
      target_title: profile?.target_title ?? null,
      summary: profile?.summary ?? null,
      key_skills: profile?.key_skills ?? null,
      experience_level: profile?.experience_level ?? null,
      city: profile?.city ?? null,
      sector: profile?.sector ?? null,
    };

    // ── 3. Résoudre la ref CV ──
    const effectiveCvRef: string | null =
      (body?.cvRef && typeof body.cvRef === 'string' && body.cvRef.length > 0)
        ? body.cvRef
        : (profile?.default_cv_ref || null);

    const cvData = effectiveCvRef
      ? await loadCvByRef(effectiveCvRef, userId, supabase)
      : null;

    // ── 4. Construire le prompt ──
    const cvMarkdown = cvData?.type === 'markdown' ? cvData.text : null;
    const prompt = buildGenerateLMPrompt(lmProfile, lmJob, cvMarkdown, options);

    // ── 5. Construire le message Claude ──
    const userContent: any[] = [];
    if (cvData?.type === 'pdf') {
      userContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: cvData.base64,
        },
      });
    }
    userContent.push({ type: 'text', text: prompt });

    // ── 6. Appel Claude ──
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: userContent as any }],
    });

    const rawContent =
      message.content[0]?.type === 'text' ? message.content[0].text : '';

    if (!rawContent || rawContent.trim().length === 0) {
      return NextResponse.json(
        { error: "L'IA n'a pas généré de contenu. Réessaie." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const lmContent = rawContent.trim();

    // ── 7. Sauvegarder dans la table `lms` ──
    const lmTitle = `LM - ${job.title || 'Sans titre'}${job.company ? ` — ${job.company}` : ''}`;
    const formData = {
      jobId,
      jobTitle: job.title,
      company: job.company,
      tone: options.tone,
      length: options.length,
      lang: options.lang,
      cvRef: effectiveCvRef,
      generatedAt: new Date().toISOString(),
      source: 'extension', // Trace pour distinguer des LM générées via Jean web
    };

    const { data: insertedLm, error: insertErr } = await supabase
      .from('lms')
      .insert({
        user_id: userId,
        title: lmTitle,
        template: 'generated',
        content: lmContent,
        form_data: formData,
      })
      .select('id, title, content, created_at')
      .single();

    if (insertErr || !insertedLm) {
      return NextResponse.json(
        { error: 'Échec de la sauvegarde de la LM en base' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // ── 8. Retour ──
    return NextResponse.json(
      {
        lm_id: insertedLm.id,
        title: insertedLm.title,
        content: insertedLm.content,
        created_at: insertedLm.created_at,
      },
      { headers: CORS_HEADERS }
    );
  } catch (e: any) {
    console.error('[extension/generate-lm] erreur:', e);
    return NextResponse.json(
      { error: e?.message || 'Erreur inattendue lors de la génération' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
