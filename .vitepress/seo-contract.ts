import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SeoLocale {
  hreflang: string
  og_locale: string
}

interface SeoContract {
  defaultLocale: string
  xDefaultLocale: string
  locales: Record<string, SeoLocale>
  surface: {
    origin: string
    keywordClusters: Array<{
      primary: string
      longTail: string[]
    }>
  }
}

const configDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(configDir, '..')
const contractPath = join(rootDir, '.seo', 'i18n-seo-manifest.json')

export const i18nSeoContract = JSON.parse(readFileSync(contractPath, 'utf8')) as SeoContract
export const siteUrl = i18nSeoContract.surface.origin
export const defaultOgLocale =
  i18nSeoContract.locales[i18nSeoContract.defaultLocale]?.og_locale ?? 'en_US'

const knownLocales = new Set(Object.keys(i18nSeoContract.locales))

function contentPathFromCanonicalPath(canonicalPath: string) {
  const normalized = canonicalPath.replace(/^\/+|\/+$/g, '')
  const [firstSegment, ...rest] = normalized.split('/')

  if (firstSegment && knownLocales.has(firstSegment) && firstSegment !== i18nSeoContract.defaultLocale) {
    return rest.join('/')
  }

  return normalized
}

function markdownCandidates(contentPath: string, locale: string) {
  const prefix = locale === i18nSeoContract.defaultLocale ? '' : `${locale}/`
  const localizedPath = `${prefix}${contentPath}`.replace(/^\/+|\/+$/g, '')

  if (!localizedPath) return ['index.md']
  return [`${localizedPath}.md`, `${localizedPath}/index.md`]
}

function hasPublishedPage(contentPath: string, locale: string) {
  return markdownCandidates(contentPath, locale).some((candidate) => existsSync(join(rootDir, candidate)))
}

function localizedUrlForContentPath(contentPath: string, locale: string) {
  const prefix = locale === i18nSeoContract.defaultLocale ? '' : `/${locale}`
  const suffix = contentPath ? `/${contentPath}` : ''
  return `${siteUrl}${prefix}${suffix}`
}

export function manifestKeywordTerms() {
  return i18nSeoContract.surface.keywordClusters.flatMap((cluster) => [
    cluster.primary,
    ...cluster.longTail,
  ])
}

export function publishedAlternateLinks(canonicalPath: string) {
  const contentPath = contentPathFromCanonicalPath(canonicalPath)
  const locales = Object.keys(i18nSeoContract.locales).filter((locale) =>
    hasPublishedPage(contentPath, locale),
  )
  const links = locales.map((locale) => [
    'link',
    {
      rel: 'alternate',
      hreflang: i18nSeoContract.locales[locale].hreflang,
      href: localizedUrlForContentPath(contentPath, locale),
    },
  ] as [string, Record<string, string>])

  if (locales.includes(i18nSeoContract.xDefaultLocale)) {
    links.push([
      'link',
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: localizedUrlForContentPath(contentPath, i18nSeoContract.xDefaultLocale),
      },
    ])
  }

  return links
}
