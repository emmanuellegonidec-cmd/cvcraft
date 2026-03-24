import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  detectJobSource,
  parseJobHtml,
  type JobSource,
  type NormalizedJobOffer,
} from '@/lib/job-import-adapters'

export type ImportJobInput = {
  url: string
  userId: string
  accessToken: string
}

export type ImportJobResult = {
  success: boolean
  source: JobSource
  job: NormalizedJobOffer | null
  savedJobId: string | null
  editUrl: string | null
  duplicateOf: string | null
  message: string
  error: string | null
}

type SaveImportedJobParams = {
  userId: string
  accessToken: string
  job: NormalizedJobOffer
  rawHtml?: string | null
  importError?: string | null
}

function getAuthedSupabase(accessToken: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

function cleanUrl(url: string): string {
  return url.trim()
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function getSafeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function truncate(value: string | null | undefined, max = 20000): string | null {
  if (!value) return null
  return value.length > max ? value.slice(0, max) : value
}

function normalizeImportUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')

    if (hostname.includes('indeed.')) {
      const jk = parsed.searchParams.get('jk') || parsed.searchParams.get('vjk')
      if (jk) {
        return `${parsed.protocol}//${parsed.hostname}/viewjob?jk=${encodeURIComponent(jk)}`
      }
    }

    return parsed.toString()
  } catch {
    return url
  }
}

// ─────────────────────────────────────────────────────────────────
// DÉTECTION PAGE DE LOGIN / BLOCAGE
// LinkedIn renvoie sa page d'auth quand il détecte un bot serveur.
// On détecte ça en cherchant des marqueurs fiables dans le HTML.
// ─────────────────────────────────────────────────────────────────

function isBlockedPage(html: string): boolean {
  const markers = [
    'authwall',
    'auth-wall',
    'sign-in-modal',
    'Inscrivez-vous ou identifiez-vous',
    'Sign in to view',
    'Join to apply',
    'Rejoignez LinkedIn',
    'S\'identifier avec',
    'Mot de passe oublié',
    'create a free account',
    'li-page-signin',
    'session_redirect',
  ]
  const lowerHtml = html.toLowerCase()
  return markers.some((m) => lowerHtml.includes(m.toLowerCase()))
}

// ─────────────────────────────────────────────────────────────────
// EXTRACTION VIA CLAUDE + WEB SEARCH (fallback quand scraping bloqué)
// On active web_search pour que Claude retrouve l'offre depuis son ID.
// ─────────────────────────────────────────────────────────────────

async function extractJobWithClaude(
  url: string,
  source: JobSource
): Promise<Partial<NormalizedJobOffer> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  // Extraire l'ID LinkedIn depuis l'URL
  const jobIdMatch = url.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})\/?/)
  const jobId = jobIdMatch?.[1] ?? null

  const prompt = jobId
    ? `Tu es un assistant spécialisé dans l'extraction d'offres d'emploi.

Voici une URL d'offre LinkedIn : ${url}
ID LinkedIn de l'offre : ${jobId}

Cherche cette offre d'emploi LinkedIn (ID: ${jobId}) et extrais les informations disponibles.

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication :
{
  "title": "titre du poste ou null",
  "company_name": "nom de l'entreprise ou null",
  "location_text": "lieu ou null",
  "employment_type": "type de contrat (CDI, CDD, Stage, etc.) ou null",
  "seniority_level": "niveau hiérarchique ou null",
  "description": "courte description du poste ou null",
  "external_job_id": "${jobId}"
}`
    : `Tu es un assistant spécialisé dans l'extraction d'offres d'emploi.

URL : ${url}

Extrait uniquement ce qui est explicitement dans l'URL. Ne devine pas.

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "title": null,
  "company_name": null,
  "location_text": null,
  "employment_type": null,
  "seniority_level": null,
  "description": null,
  "external_job_id": null
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()

    // Récupérer le dernier bloc text (après éventuel tool_use)
    const textBlock = data?.content
      ?.filter((b: { type: string }) => b.type === 'text')
      ?.at(-1)?.text ?? ''

    const cleaned = textBlock.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as Partial<NormalizedJobOffer>
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// FETCH AVEC PLUSIEURS STRATÉGIES POUR CONTOURNER LE BLOCAGE
// ─────────────────────────────────────────────────────────────────

async function fetchJobPage(url: string, source: JobSource): Promise<{
  ok: boolean
  status: number
  html: string | null
  error: string | null
  wasBlocked: boolean
}> {
  // Stratégie 1 : fetch standard avec headers navigateur
  const strategies: Array<{ headers: Record<string, string> }> = [
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.fr/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'cross-site',
        'Upgrade-Insecure-Requests': '1',
      },
    },
    // Stratégie 2 : via version mobile (parfois moins bloquée)
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.google.fr/',
      },
    },
  ]

  for (const strategy of strategies) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: strategy.headers,
        redirect: 'follow',
        cache: 'no-store',
      })

      const html = await response.text()
      const wasBlocked = isBlockedPage(html)

      if (response.ok && !wasBlocked) {
        return { ok: true, status: response.status, html, error: null, wasBlocked: false }
      }

      if (wasBlocked) {
        // On continue avec la stratégie suivante
        continue
      }

      return {
        ok: false,
        status: response.status,
        html,
        error: `Échec récupération page (${response.status})`,
        wasBlocked: false,
      }
    } catch (error) {
      // Continue vers stratégie suivante
    }
  }

  // Toutes les stratégies ont échoué ou sont bloquées
  return {
    ok: false,
    status: 0,
    html: null,
    error: 'Page bloquée ou inaccessible depuis le serveur',
    wasBlocked: true,
  }
}

async function findDuplicateJob(
  userId: string,
  accessToken: string,
  job: NormalizedJobOffer
) {
  const supabase = getAuthedSupabase(accessToken)

  if (job.external_job_id) {
    const { data } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('source_platform', job.source_platform)
      .eq('external_job_id', job.external_job_id)
      .maybeSingle()

    if (data?.id) return data.id as string
  }

  const { data } = await supabase
    .from('jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('source_url', job.source_url)
    .maybeSingle()

  return data?.id ?? null
}

async function logImportEvent(params: {
  userId: string
  accessToken: string
  jobId?: string | null
  sourcePlatform: string
  sourceUrl: string
  sourceHostname?: string | null
  parserName?: string | null
  parserVersion?: string | null
  rawPayload?: Record<string, unknown> | null
  rawText?: string | null
  importError?: string | null
}) {
  const supabase = getAuthedSupabase(params.accessToken)

  await supabase.from('job_import_logs').insert({
    user_id: params.userId,
    job_id: params.jobId ?? null,
    source_platform: params.sourcePlatform,
    source_url: params.sourceUrl,
    source_hostname: params.sourceHostname ?? null,
    parser_name: params.parserName ?? null,
    parser_version: params.parserVersion ?? null,
    raw_payload: params.rawPayload ?? null,
    raw_text: truncate(params.rawText, 50000),
    import_error: params.importError ?? null,
  })
}

async function saveImportedJob({
  userId,
  accessToken,
  job,
  rawHtml = null,
  importError = null,
}: SaveImportedJobParams): Promise<{
  jobId: string | null
  duplicateOf: string | null
}> {
  const supabase = getAuthedSupabase(accessToken)

  const duplicateId = await findDuplicateJob(userId, accessToken, job)

  if (duplicateId) {
    await logImportEvent({
      userId,
      accessToken,
      jobId: duplicateId,
      sourcePlatform: job.source_platform,
      sourceUrl: job.source_url,
      sourceHostname: job.source_hostname,
      parserName: job.parser_name,
      parserVersion: job.parser_version,
      rawPayload: job as Record<string, unknown>,
      rawText: job.raw_text ?? rawHtml,
      importError: importError ?? 'duplicate_detected',
    })

    return { jobId: duplicateId, duplicateOf: duplicateId }
  }

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      title: job.title ?? 'Offre importée',
      company: job.company_name ?? 'Entreprise inconnue',
      location: job.location_text ?? '',
      description: truncate(job.description, 50000) ?? '',
      source_platform: job.source_platform,
      source_url: job.source_url,
      source_hostname: job.source_hostname,
      external_job_id: job.external_job_id,
      workplace_type: job.workplace_type,
      employment_type: job.employment_type,
      seniority_level: job.seniority_level,
      department: job.department,
      salary_text: job.salary_text,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      currency: job.currency,
      requirements: truncate(job.requirements, 20000),
      benefits: truncate(job.benefits, 20000),
      posted_at_text: job.posted_at_text,
      raw_text: truncate(job.raw_text ?? rawHtml, 50000),
      import_status: job.import_status,
      extraction_confidence: job.extraction_confidence,
      parser_name: job.parser_name,
      parser_version: job.parser_version,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const jobId = data?.id as string

  await logImportEvent({
    userId,
    accessToken,
    jobId,
    sourcePlatform: job.source_platform,
    sourceUrl: job.source_url,
    sourceHostname: job.source_hostname,
    parserName: job.parser_name,
    parserVersion: job.parser_version,
    rawPayload: job as Record<string, unknown>,
    rawText: job.raw_text ?? rawHtml,
    importError,
  })

  return { jobId, duplicateOf: null }
}

// ─────────────────────────────────────────────────────────────────
// CONSTRUCTION D'UN JOB MINIMAL DEPUIS L'URL (dernier recours)
// Quand ni le scraping ni Claude ne fonctionnent, on construit
// une fiche vide mais importable, que l'utilisateur peut compléter.
// ─────────────────────────────────────────────────────────────────

function buildMinimalJobFromUrl(
  url: string,
  source: JobSource,
  claudeData: Partial<NormalizedJobOffer> | null
): NormalizedJobOffer {
  // Extraction de l'ID depuis l'URL LinkedIn
  const jobIdMatch = url.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})\/?/)
  const externalId = claudeData?.external_job_id ?? jobIdMatch?.[1] ?? null

  return {
    source_platform: source,
    source_url: url,
    source_hostname: getSafeHostname(url),
    external_job_id: externalId,
    title: claudeData?.title ?? null,
    company_name: claudeData?.company_name ?? null,
    location_text: claudeData?.location_text ?? null,
    workplace_type: null,
    employment_type: claudeData?.employment_type ?? null,
    seniority_level: claudeData?.seniority_level ?? null,
    department: null,
    salary_text: null,
    salary_min: null,
    salary_max: null,
    currency: null,
    description: claudeData?.description ?? null,
    requirements: null,
    benefits: null,
    posted_at_text: null,
    raw_text: null,
    import_status: 'needs_review',
    extraction_confidence: claudeData?.title ? 0.35 : 0.1,
    parser_name: claudeData?.title ? 'claudeFallbackAdapter' : 'urlOnlyAdapter',
    parser_version: '1.0.0',
  }
}

export async function importJobFromUrl({
  url,
  userId,
  accessToken,
}: ImportJobInput): Promise<ImportJobResult> {
  const cleanedUrl = cleanUrl(url)
  const normalizedUrl = normalizeImportUrl(cleanedUrl)

  if (!normalizedUrl) {
    return {
      success: false,
      source: 'unknown',
      job: null,
      savedJobId: null,
      editUrl: null,
      duplicateOf: null,
      message: 'URL manquante.',
      error: 'URL manquante',
    }
  }

  if (!isValidHttpUrl(normalizedUrl)) {
    return {
      success: false,
      source: 'unknown',
      job: null,
      savedJobId: null,
      editUrl: null,
      duplicateOf: null,
      message: 'URL invalide.',
      error: 'URL invalide',
    }
  }

  const source = detectJobSource(normalizedUrl)
  const sourceHostname = getSafeHostname(normalizedUrl)

  // ── ÉTAPE 1 : Tentative de scraping normal ─────────────────────
  const fetchResult = await fetchJobPage(normalizedUrl, source)

  let job: NormalizedJobOffer

  if (fetchResult.ok && fetchResult.html) {
    // Scraping réussi → parsing normal
    try {
      job = parseJobHtml(normalizedUrl, fetchResult.html)
    } catch (error) {
      const parserError = error instanceof Error ? error.message : 'Erreur de parsing'
      await logImportEvent({
        userId,
        accessToken,
        sourcePlatform: source,
        sourceUrl: normalizedUrl,
        sourceHostname,
        rawText: fetchResult.html,
        importError: parserError,
      })
      return {
        success: false,
        source,
        job: null,
        savedJobId: null,
        editUrl: null,
        duplicateOf: null,
        message: 'Le parsing de la page a échoué.',
        error: parserError,
      }
    }
  } else {
    // ── ÉTAPE 2 : Scraping bloqué → fallback Claude + web search ──
    const claudeData = await extractJobWithClaude(normalizedUrl, source)
    job = buildMinimalJobFromUrl(normalizedUrl, source, claudeData)

    await logImportEvent({
      userId,
      accessToken,
      sourcePlatform: source,
      sourceUrl: normalizedUrl,
      sourceHostname,
      rawPayload: { fetchError: fetchResult.error, wasBlocked: fetchResult.wasBlocked, claudeData },
      importError: fetchResult.wasBlocked ? 'page_blocked_claude_fallback' : fetchResult.error,
    })
  }

  // ── ÉTAPE 3 : Sauvegarde ───────────────────────────────────────
  try {
    const { jobId, duplicateOf } = await saveImportedJob({
      userId,
      accessToken,
      job,
      rawHtml: fetchResult.html,
      importError: null,
    })

    const wasBlocked = !fetchResult.ok || fetchResult.wasBlocked
    const message = duplicateOf
      ? 'Cette offre existe déjà dans ton tableau de bord.'
      : wasBlocked
        ? 'Offre importée depuis l\'URL (LinkedIn a bloqué le scraping — complète les infos manquantes).'
        : 'Offre importée avec succès.'

    return {
      success: true,
      source,
      job,
      savedJobId: jobId,
      editUrl: jobId ? `/dashboard/job/${jobId}` : null,
      duplicateOf,
      message,
      error: null,
    }
  } catch (error) {
    const saveError = error instanceof Error ? error.message : 'Erreur de sauvegarde'
    return {
      success: false,
      source,
      job,
      savedJobId: null,
      editUrl: null,
      duplicateOf: null,
      message: 'Le parsing a marché, mais pas la sauvegarde.',
      error: saveError,
    }
  }
}
