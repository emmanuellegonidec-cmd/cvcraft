import { load, type CheerioAPI } from 'cheerio'

export type JobSource =
  | 'linkedin'
  | 'apec'
  | 'hellowork'
  | 'wttj'
  | 'indeed'
  | 'unknown'

export type WorkplaceType = 'remote' | 'hybrid' | 'onsite' | null

export type ImportStatus =
  | 'pending'
  | 'needs_review'
  | 'imported'
  | 'manual'
  | 'failed'

export type NormalizedJobOffer = {
  source_platform: JobSource
  source_url: string
  source_hostname: string
  external_job_id: string | null

  title: string | null
  company_name: string | null
  location_text: string | null
  workplace_type: WorkplaceType
  employment_type: string | null
  seniority_level: string | null
  department: string | null

  salary_text: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string | null

  description: string | null
  requirements: string | null
  benefits: string | null
  posted_at_text: string | null
  raw_text: string | null

  import_status: ImportStatus
  extraction_confidence: number | null

  parser_name: string | null
  parser_version: string | null
}

type ParserContext = {
  url: string
  html: string
  $: CheerioAPI
  hostname: string
}

type JobAdapter = {
  source: JobSource
  canHandle: (url: string) => boolean
  parse: (ctx: ParserContext) => NormalizedJobOffer
}

const PARSER_VERSION = '1.0.0'

function cleanText(value?: string | null): string | null {
  if (!value) return null
  const cleaned = value.replace(/\s+/g, ' ').trim()
  return cleaned.length ? cleaned : null
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function text($: CheerioAPI, selector: string): string | null {
  return cleanText($(selector).first().text())
}

function attr($: CheerioAPI, selector: string, name: string): string | null {
  return cleanText($(selector).first().attr(name))
}

function bodyText($: CheerioAPI): string | null {
  return cleanText($('body').text())
}

function detectWorkplaceType(
  ...values: Array<string | null | undefined>
): WorkplaceType {
  const merged = values.filter(Boolean).join(' ').toLowerCase()

  if (
    merged.includes('remote') ||
    merged.includes('télétravail') ||
    merged.includes('full remote') ||
    merged.includes('100% télétravail')
  ) {
    return 'remote'
  }

  if (merged.includes('hybrid') || merged.includes('hybride')) {
    return 'hybrid'
  }

  if (
    merged.includes('on-site') ||
    merged.includes('onsite') ||
    merged.includes('sur site') ||
    merged.includes('présentiel')
  ) {
    return 'onsite'
  }

  return null
}

function parseSalary(salaryText: string | null): {
  salary_min: number | null
  salary_max: number | null
  currency: string | null
} {
  if (!salaryText) {
    return { salary_min: null, salary_max: null, currency: null }
  }

  const currency =
    salaryText.includes('€') || salaryText.toLowerCase().includes('eur')
      ? 'EUR'
      : salaryText.includes('$')
      ? 'USD'
      : null

  const numbers = Array.from(salaryText.matchAll(/(\d[\d\s.,]*)/g))
    .map((m) => m[1].replace(/\s/g, '').replace(',', '.'))
    .map((n) => Number.parseFloat(n))
    .filter((n) => Number.isFinite(n))

  if (numbers.length >= 2) {
    return {
      salary_min: numbers[0] ?? null,
      salary_max: numbers[1] ?? null,
      currency,
    }
  }

  if (numbers.length === 1) {
    return {
      salary_min: numbers[0] ?? null,
      salary_max: null,
      currency,
    }
  }

  return { salary_min: null, salary_max: null, currency }
}

function computeConfidence(job: Partial<NormalizedJobOffer>, base = 0.35): number {
  let score = base
  if (job.title) score += 0.2
  if (job.company_name) score += 0.15
  if (job.location_text) score += 0.1
  if (job.description) score += 0.2
  if (job.salary_text) score += 0.05
  if (job.employment_type) score += 0.05
  return Math.min(0.99, Number(score.toFixed(2)))
}

function createEmptyJob(source: JobSource, url: string): NormalizedJobOffer {
  return {
    source_platform: source,
    source_url: url,
    source_hostname: getHostname(url),
    external_job_id: null,

    title: null,
    company_name: null,
    location_text: null,
    workplace_type: null,
    employment_type: null,
    seniority_level: null,
    department: null,

    salary_text: null,
    salary_min: null,
    salary_max: null,
    currency: null,

    description: null,
    requirements: null,
    benefits: null,
    posted_at_text: null,
    raw_text: null,

    import_status: 'failed',
    extraction_confidence: null,

    parser_name: null,
    parser_version: PARSER_VERSION,
  }
}

function finalizeJob(
  source: JobSource,
  parserName: string,
  url: string,
  partial: Partial<NormalizedJobOffer>
): NormalizedJobOffer {
  const salary = parseSalary(partial.salary_text ?? null)

  const job: NormalizedJobOffer = {
    ...createEmptyJob(source, url),
    ...partial,
    salary_min: partial.salary_min ?? salary.salary_min,
    salary_max: partial.salary_max ?? salary.salary_max,
    currency: partial.currency ?? salary.currency,
    parser_name: parserName,
    parser_version: PARSER_VERSION,
  }

  const hasCoreData = Boolean(job.title || job.company_name || job.description)

  job.import_status = hasCoreData ? 'needs_review' : 'failed'
  job.extraction_confidence =
    partial.extraction_confidence ?? computeConfidence(job)

  return job
}

function extractJsonLdJobPosting($: CheerioAPI): Record<string, unknown> | null {
  const scripts = $('script[type="application/ld+json"]').toArray()

  for (const script of scripts) {
    const raw = $(script).contents().text()
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw)

      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed]

      for (const item of candidates) {
        if (
          item &&
          typeof item === 'object' &&
          String((item as Record<string, unknown>)['@type'] || '')
            .toLowerCase()
            .includes('jobposting')
        ) {
          return item as Record<string, unknown>
        }
      }
    } catch {
      continue
    }
  }

  return null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' ? cleanText(value) : null
}

function normalizeJsonLd(url: string, source: JobSource, jsonLd: Record<string, unknown>) {
  const hiringOrg =
    jsonLd.hiringOrganization && typeof jsonLd.hiringOrganization === 'object'
      ? (jsonLd.hiringOrganization as Record<string, unknown>)
      : null

  const jobLocation =
    jsonLd.jobLocation && typeof jsonLd.jobLocation === 'object'
      ? (jsonLd.jobLocation as Record<string, unknown>)
      : null

  const address =
    jobLocation?.address && typeof jobLocation.address === 'object'
      ? (jobLocation.address as Record<string, unknown>)
      : null

  const locationText = cleanText(
    [
      stringValue(address?.addressLocality),
      stringValue(address?.addressRegion),
      stringValue(address?.addressCountry),
    ]
      .filter(Boolean)
      .join(', ')
  )

  return finalizeJob(source, `${source}JsonLdAdapter`, url, {
    title: stringValue(jsonLd.title),
    company_name: stringValue(hiringOrg?.name),
    location_text: locationText,
    employment_type: Array.isArray(jsonLd.employmentType)
      ? cleanText((jsonLd.employmentType as unknown[]).map(String).join(', '))
      : stringValue(jsonLd.employmentType),
    description: stringValue(jsonLd.description),
    posted_at_text: stringValue(jsonLd.datePosted),
  })
}

function externalIdFromPath(url: string, regex: RegExp): string | null {
  const match = url.match(regex)
  return match?.[1] ?? null
}

const linkedinAdapter: JobAdapter = {
  source: 'linkedin',
  canHandle: (url) => {
    const u = safeUrl(url)
    return Boolean(
      u &&
        u.hostname.includes('linkedin.com') &&
        u.pathname.includes('/jobs/view/')
    )
  },
  parse: ({ url, $, html }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) return normalizeJsonLd(url, 'linkedin', jsonLd)

    return finalizeJob('linkedin', 'linkedinAdapter', url, {
      external_job_id: externalIdFromPath(url, /\/jobs\/view\/(\d+)/),
      title:
        attr($, 'meta[property="og:title"]', 'content') ||
        text($, 'h1'),
      company_name:
        text($, '.topcard__org-name-link') ||
        text($, '.job-details-jobs-unified-top-card__company-name'),
      location_text:
        text($, '.topcard__flavor--bullet') ||
        text($, '.job-details-jobs-unified-top-card__primary-description-container'),
      employment_type: cleanText($('li:contains("Employment type") span').last().text()),
      seniority_level: cleanText($('li:contains("Seniority level") span').last().text()),
      department: cleanText($('li:contains("Job function") span').last().text()),
      description:
        attr($, 'meta[name="description"]', 'content') ||
        text($, '.show-more-less-html__markup') ||
        text($, '.description__text'),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

const apecAdapter: JobAdapter = {
  source: 'apec',
  canHandle: (url) => {
    const u = safeUrl(url)
    return Boolean(
      u &&
        u.hostname.includes('apec.fr') &&
        u.pathname.includes('/emploi/detail-offre/')
    )
  },
  parse: ({ url, $, html }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) return normalizeJsonLd(url, 'apec', jsonLd)

    return finalizeJob('apec', 'apecAdapter', url, {
      external_job_id: externalIdFromPath(url, /detail-offre\/([^/?]+)/),
      title: text($, 'h1') || attr($, 'meta[property="og:title"]', 'content'),
      company_name:
        text($, '[data-cy="companyName"]') ||
        text($, '.company-name'),
      location_text:
        text($, '[data-cy="location"]') ||
        text($, '.place'),
      employment_type:
        text($, '[data-cy="contractType"]') ||
        text($, '.contract-type'),
      salary_text:
        text($, '[data-cy="salary"]') ||
        text($, '.salary'),
      description:
        text($, '[data-cy="jobDescription"]') ||
        text($, '.description') ||
        attr($, 'meta[name="description"]', 'content'),
      posted_at_text:
        text($, '[data-cy="publicationDate"]') ||
        text($, '.publication-date'),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

const helloworkAdapter: JobAdapter = {
  source: 'hellowork',
  canHandle: (url) => {
    const u = safeUrl(url)
    return Boolean(
      u &&
        u.hostname.includes('hellowork.com') &&
        u.pathname.includes('/emplois/')
    )
  },
  parse: ({ url, $, html }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) return normalizeJsonLd(url, 'hellowork', jsonLd)

    return finalizeJob('hellowork', 'helloworkAdapter', url, {
      external_job_id: externalIdFromPath(url, /\/emplois\/(\d+)\.html/),
      title: text($, 'h1') || attr($, 'meta[property="og:title"]', 'content'),
      company_name:
        text($, '[data-cy="company-name"]') ||
        text($, '.company'),
      location_text:
        text($, '[data-cy="job-location"]') ||
        text($, '.tw-text-slate-700'),
      employment_type:
        text($, '[data-cy="job-contract"]') ||
        text($, '.contract'),
      salary_text:
        text($, '[data-cy="job-salary"]') ||
        text($, '.salary'),
      description:
        text($, '[data-cy="job-description"]') ||
        text($, '.description') ||
        attr($, 'meta[name="description"]', 'content'),
      posted_at_text:
        text($, '[data-cy="job-publication-date"]') ||
        text($, '.publication-date'),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

const wttjAdapter: JobAdapter = {
  source: 'wttj',
  canHandle: (url) => {
    const u = safeUrl(url)
    return Boolean(
      u &&
        u.hostname.includes('welcometothejungle.com') &&
        u.pathname.includes('/jobs')
    )
  },
  parse: ({ url, $, html }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) return normalizeJsonLd(url, 'wttj', jsonLd)

    return finalizeJob('wttj', 'wttjAdapter', url, {
      external_job_id: externalIdFromPath(url, /\/jobs\/([^/?]+)/),
      title: text($, 'h1') || attr($, 'meta[property="og:title"]', 'content'),
      company_name:
        text($, '[data-testid="company-name"]') ||
        text($, 'a[href*="/companies/"]'),
      location_text:
        text($, '[data-testid="job-location"]') ||
        text($, '[data-testid="location"]'),
      employment_type:
        text($, '[data-testid="contract-type"]') ||
        text($, '[data-testid="job-contract"]'),
      department:
        text($, '[data-testid="job-department"]') ||
        text($, '[data-testid="department"]'),
      salary_text:
        text($, '[data-testid="salary"]') ||
        text($, '[data-testid="job-salary"]'),
      description:
        text($, '[data-testid="job-description"]') ||
        attr($, 'meta[name="description"]', 'content'),
      posted_at_text:
        text($, '[data-testid="job-publication-date"]') ||
        text($, 'time'),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

const indeedAdapter: JobAdapter = {
  source: 'indeed',
  canHandle: (url) => {
    const u = safeUrl(url)
    return Boolean(
      u &&
        u.hostname.includes('indeed.') &&
        u.pathname.includes('/viewjob')
    )
  },
  parse: ({ url, $, html }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) return normalizeJsonLd(url, 'indeed', jsonLd)

    return finalizeJob('indeed', 'indeedAdapter', url, {
      external_job_id: safeUrl(url)?.searchParams.get('jk') ?? null,
      title: text($, 'h1') || attr($, 'meta[property="og:title"]', 'content'),
      company_name:
        text($, '[data-company-name="true"]') ||
        text($, '[data-testid="inlineHeader-companyName"]'),
      location_text:
        text($, '[data-testid="job-location"]') ||
        text($, '[data-testid="inlineHeader-companyLocation"]'),
      employment_type:
        text($, '[data-testid="jobsearch-JobMetadataHeader-item"]'),
      salary_text:
        text($, '#salaryInfoAndJobType') ||
        text($, '[data-testid="attribute_snippet_testid"]'),
      description:
        text($, '#jobDescriptionText') ||
        attr($, 'meta[name="description"]', 'content'),
      posted_at_text:
        text($, '[data-testid="myJobsStateDate"]') ||
        text($, '.jobsearch-JobMetadataFooter'),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

const genericAdapter: JobAdapter = {
  source: 'unknown',
  canHandle: () => true,
  parse: ({ url, $, html, hostname }) => {
    const jsonLd = extractJsonLdJobPosting($)
    if (jsonLd) {
      return normalizeJsonLd(url, 'unknown', jsonLd)
    }

    return finalizeJob('unknown', 'genericAdapter', url, {
      source_hostname: hostname,
      title:
        attr($, 'meta[property="og:title"]', 'content') ||
        text($, 'h1') ||
        text($, 'title'),
      description:
        attr($, 'meta[name="description"]', 'content') ||
        text($, 'article') ||
        bodyText($),
      raw_text: bodyText($) ?? cleanText(html),
    })
  },
}

export const JOB_ADAPTERS: JobAdapter[] = [
  linkedinAdapter,
  apecAdapter,
  helloworkAdapter,
  wttjAdapter,
  indeedAdapter,
  genericAdapter,
]

export function detectJobSource(url: string): JobSource {
  const adapter = JOB_ADAPTERS.find((a) => a.canHandle(url))
  return adapter?.source ?? 'unknown'
}

export function parseJobHtml(url: string, html: string): NormalizedJobOffer {
  const $ = load(html)
  const hostname = getHostname(url)

  const adapter =
    JOB_ADAPTERS.find((a) => a.canHandle(url)) ?? genericAdapter

  return adapter.parse({
    url,
    html,
    $,
    hostname,
  })
}
