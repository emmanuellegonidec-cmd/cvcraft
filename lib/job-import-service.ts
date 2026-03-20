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

async function fetchJobPage(url: string): Promise<{
  ok: boolean
  status: number
  html: string | null
  error: string | null
}> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        Referer: 'https://www.google.com/',
        Connection: 'keep-alive',
      },
      redirect: 'follow',
      cache: 'no-store',
    })

    const html = await response.text()

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        html,
        error: `Échec récupération page (${response.status})`,
      }
    }

    return {
      ok: true,
      status: response.status,
      html,
      error: null,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      html: null,
      error: error instanceof Error ? error.message : 'Erreur réseau inconnue',
    }
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

    return {
      jobId: duplicateId,
      duplicateOf: duplicateId,
    }
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

  if (error) {
    throw new Error(error.message)
  }

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

  return {
    jobId,
    duplicateOf: null,
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

  const fetchResult = await fetchJobPage(normalizedUrl)

  if (!fetchResult.ok || !fetchResult.html) {
    await logImportEvent({
      userId,
      accessToken,
      sourcePlatform: source,
      sourceUrl: normalizedUrl,
      sourceHostname,
      rawPayload: {
        source,
        hostname: sourceHostname,
        status: fetchResult.status,
      },
      rawText: fetchResult.html,
      importError: fetchResult.error,
    })

    return {
      success: false,
      source,
      job: null,
      savedJobId: null,
      editUrl: null,
      duplicateOf: null,
      message: 'Impossible de récupérer le contenu de la page.',
      error: fetchResult.error,
    }
  }

  let job: NormalizedJobOffer

  try {
    job = parseJobHtml(normalizedUrl, fetchResult.html)
  } catch (error) {
    const parserError =
      error instanceof Error ? error.message : 'Erreur de parsing inconnue'

    await logImportEvent({
      userId,
      accessToken,
      sourcePlatform: source,
      sourceUrl: normalizedUrl,
      sourceHostname,
      rawPayload: {
        source,
        hostname: sourceHostname,
      },
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

  try {
    const { jobId, duplicateOf } = await saveImportedJob({
      userId,
      accessToken,
      job,
      rawHtml: fetchResult.html,
      importError: null,
    })

    return {
      success: true,
      source,
      job,
      savedJobId: jobId,
      editUrl: jobId ? `/dashboard/jobs/${jobId}` : null,
      duplicateOf,
      message: duplicateOf
        ? 'Cette offre existe déjà.'
        : 'Offre importée avec succès.',
      error: null,
    }
  } catch (error) {
    const saveError =
      error instanceof Error ? error.message : 'Erreur de sauvegarde inconnue'

    await logImportEvent({
      userId,
      accessToken,
      jobId: null,
      sourcePlatform: job.source_platform,
      sourceUrl: job.source_url,
      sourceHostname: job.source_hostname,
      parserName: job.parser_name,
      parserVersion: job.parser_version,
      rawPayload: job as Record<string, unknown>,
      rawText: job.raw_text ?? fetchResult.html,
      importError: saveError,
    })

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