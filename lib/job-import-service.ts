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

async function extractJobWithClaude(
  url: string,
  source: JobSource
): Promise<Partial<NormalizedJobOffer> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const jobIdMatch = url.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})\/?/)
  const jobId = jobIdMatch?.[1] ?? null

  const externalIdJson = jobId ? '"' + jobId + '"' : 'null'

  const prompt = 'Tu es un assistant spécialisé dans l\'extraction d\'offres d\'emploi.\n\n'
    + 'Accède à cette page et extrais les informations directement depuis son contenu : ' + url + '\n\n'
    + 'IMPORTANT — deux champs distincts à extraire depuis la page de l\'offre :\n'
    + '- "description" = le descriptif du POSTE uniquement (missions, responsabilités, profil recherché, compétences requises).\n'
    + '- "company_description" = le descriptif de l\'ENTREPRISE uniquement (activité, secteur, valeurs, taille, chiffres clés).\n\n'
    + 'Ne cherche pas d\'informations sur d\'autres sites. Extrais uniquement ce qui est présent dans la page de l\'offre.\n\n'
    + 'Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :\n'
    + '{\n'
    + '  "title": "titre exact du poste ou null",\n'
    + '  "company_name": "nom de l\'entreprise ou null",\n'
    + '  "location_text": "ville et mode de travail (ex: Paris · Hybride) ou null",\n'
    + '  "employment_type": "CDI ou CDD ou Stage ou Alternance ou Freelance ou null",\n'
    + '  "seniority_level": "niveau hiérarchique ou null",\n'
    + '  "description": "description complète du POSTE telle qu\'elle apparaît dans l\'offre ou null",\n'
    + '  "company_description": "description de l\'ENTREPRISE telle qu\'elle apparaît dans l\'offre ou null",\n'
    + '  "salary_text": "fourchette salariale ou null",\n'
    + '  "recruitment_process": "description du processus de recrutement si mentionné dans l\'offre (étapes, entretiens, délais...), sinon null",\n'
    + '  "external_job_id": ' + externalIdJson + '\n'
    + '}'

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
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()

    const textBlock = data?.content
      ?.filter((b: { type: string }) => b.type === 'text')
      ?.at(-1)?.text ?? ''

    const cleaned = textBlock.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned) as Partial<NormalizedJobOffer>
  } catch {
    return null
  }
}

async function fetchJobPage(url: string, source: JobSource): Promise<{
  ok: boolean
  status: number
  html: string | null
  error: string | null
  wasBlocked: boolean
}> {
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

      if (wasBlocked) continue

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

  return {
    ok: false,
    status: 0,
    html: null,
    error: 'Page bloquée ou inaccessible depuis le serveur',
    wasBlocked: true,
  }
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

function buildMinimalJobFromUrl(
  url: string,
  source: JobSource,
  claudeData: Partial<NormalizedJobOffer> | null
): NormalizedJobOffer {
  const jobIdMatch = url.match(/\/jobs\/view\/(?:[^/]*?-)?(\d{6,})\/?/)
  const externalId = claudeData?.external_job_id ?? jobIdMatch?.[1] ?? null

  return {
    source_platform: source,
    source_url: url,
    source_hostname: getSafeHostname(url),
    external_job_id: externalId,
    title: claudeData?.title ?? null,
    company_name: claudeData?.company_name ?? null,
    company_description: claudeData?.company_description ?? null,
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
    recruitment_process: claudeData?.recruitment_process ?? null,
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
      success: false, source: 'unknown', job: null, savedJobId: null,
      editUrl: null, duplicateOf: null, message: 'URL manquante.', error: 'URL manquante',
    }
  }

  if (!isValidHttpUrl(normalizedUrl)) {
    return {
      success: false, source: 'unknown', job: null, savedJobId: null,
      editUrl: null, duplicateOf: null, message: 'URL invalide.', error: 'URL invalide',
    }
  }

  const source = detectJobSource(normalizedUrl)
  const sourceHostname = getSafeHostname(normalizedUrl)
  const fetchResult = await fetchJobPage(normalizedUrl, source)

  let job: NormalizedJobOffer

  if (fetchResult.ok && fetchResult.html) {
    try {
      job = parseJobHtml(normalizedUrl, fetchResult.html)
    } catch (error) {
      const parserError = error instanceof Error ? error.message : 'Erreur de parsing'
      await logImportEvent({
        userId, accessToken, sourcePlatform: source, sourceUrl: normalizedUrl,
        sourceHostname, rawText: fetchResult.html, importError: parserError,
      })
      return {
        success: false, source, job: null, savedJobId: null,
        editUrl: null, duplicateOf: null, message: 'Le parsing de la page a échoué.', error: parserError,
      }
    }
  } else {
    const claudeData = await extractJobWithClaude(normalizedUrl, source)
    job = buildMinimalJobFromUrl(normalizedUrl, source, claudeData)
    await logImportEvent({
      userId, accessToken, sourcePlatform: source, sourceUrl: normalizedUrl, sourceHostname,
      rawPayload: { fetchError: fetchResult.error, wasBlocked: fetchResult.wasBlocked, claudeData },
      importError: fetchResult.wasBlocked ? 'page_blocked_claude_fallback' : fetchResult.error,
    })
  }

  // ✅ On retourne les données extraites SANS sauvegarder
  // La sauvegarde est faite une seule fois par le bouton "Ajouter l'offre" du formulaire
  return {
    success: true,
    source,
    job,
    savedJobId: null,
    editUrl: null,
    duplicateOf: null,
    message: 'Offre extraite avec succès.',
    error: null,
  }
}
