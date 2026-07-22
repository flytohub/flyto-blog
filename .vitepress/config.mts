import { defineConfig } from 'vitepress'
import {
  defaultOgLocale,
  manifestKeywordTerms,
  publishedAlternateLinks,
  siteUrl,
} from './seo-contract'

const SITE_URL = siteUrl
const CORE_MODULE_COUNT = 451
const CORE_CATALOG_CATEGORY_COUNT = 84
const BUILT_IN_RECIPE_COUNT = 41
const CORE_RUNTIME_SUMMARY = `${CORE_MODULE_COUNT} registry-backed modules across ${CORE_CATALOG_CATEGORY_COUNT} catalog categories, ${BUILT_IN_RECIPE_COUNT} built-in recipes, MCP transports, evidence capture, and replayable YAML execution`
const SITE_DESCRIPTION = 'Plain-language Flyto2 guides for AI workflow automation tools, open-source AI agent frameworks, MCP server automation, browser automation, CTEM, ASM, and AI search visibility.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
const ORGANIZATION_ID = 'https://flyto2.com/#organization'
const WEBSITE_ID = `${SITE_URL}/#website`
const BLOG_ID = `${SITE_URL}/#blog`
const SEO_KEYWORDS = [
  'Flyto2 blog',
  'AI workflow automation',
  'AI workflow automation tools',
  'AI workflow automation platform',
  'open source AI agent framework',
  'open source AI workflow automation',
  'MCP server automation',
  'MCP automation tools',
  'no-code browser automation',
  'self-hosted workflow automation',
  'agentic AI workflow automation',
  'CTEM',
  'attack surface management',
  'external attack surface management',
  'EASM',
  'ASM',
  'dark web monitoring',
  'AI security platform',
  'MCP security',
  'MSSP',
  'BYO security integrations',
  'AI search visibility',
  'llms.txt',
  'data workflow automation',
  'zero-person company agent',
  'intelligence workflow automation',
  'OSINT workflow automation',
  'pentest',
  'red team',
  `${CORE_MODULE_COUNT} modules`,
  `${CORE_CATALOG_CATEGORY_COUNT} catalog categories`,
  `${BUILT_IN_RECIPE_COUNT} recipes`,
  ...manifestKeywordTerms(),
]
const DISCOVERY_LINKS = [
  ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'Flyto2 Blog RSS', href: `${SITE_URL}/rss.xml` }],
  ['link', { rel: 'alternate', type: 'application/atom+xml', title: 'Flyto2 Blog Atom', href: `${SITE_URL}/atom.xml` }],
  ['link', { rel: 'alternate', type: 'application/feed+json', title: 'Flyto2 Blog JSON Feed', href: `${SITE_URL}/feed.json` }],
] as [string, Record<string, string>][]
const NON_CONTENT_PATHS = new Set([
  'AGENTS.md',
  'ARCHITECTURE.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'CONTRIBUTING.md',
  'DECISIONS.md',
  'POSTING.md',
  'PROJECT.md',
  'README.md',
  'ROADMAP.md',
  'SECURITY.md',
  'STATE.md',
  'tasks.md',
  'docs/README.md',
  'public/blog/CREDITS.md',
])

function toPublicPath(url: string) {
  return url.startsWith('http') ? new URL(url).pathname : url
}

function isNonContentPath(relativePath: string) {
  return NON_CONTENT_PATHS.has(relativePath)
    || relativePath.startsWith('docs/')
    || relativePath.startsWith('public/')
    || relativePath.startsWith('social/')
    || relativePath.startsWith('video/')
    || relativePath.startsWith('workflows/')
    || relativePath.startsWith('handoffs/')
}

function cleanContentPath(path: string) {
  return path
    .replace(/^\/+/, '')
    .replace(/\/$/, '')
    .replace(/\.md$/, '')
}

function isNonContentPublicPath(path: string) {
  const cleanPath = cleanContentPath(path)
  const asMarkdownPath = `${cleanPath}.md`

  return NON_CONTENT_PATHS.has(asMarkdownPath)
    || cleanPath.startsWith('docs/')
    || cleanPath.startsWith('public/')
    || cleanPath.startsWith('social/')
    || cleanPath.startsWith('video/')
    || cleanPath.startsWith('workflows/')
    || cleanPath.startsWith('handoffs/')
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function keywordValues(frontmatter: Record<string, any>, tags: string[]) {
  return [
    frontmatter.focusKeyword,
    ...arrayValue(frontmatter.relatedKeywords),
    ...tags,
  ].filter(Boolean).map(String)
}

export default defineConfig({
  title: 'Flyto2 Blog',
  titleTemplate: ':title | Flyto2',
  description: SITE_DESCRIPTION,
  lang: 'en-US',
  cleanUrls: true,
  sitemap: {
    hostname: SITE_URL,
    transformItems(items) {
      return items.filter((item) => {
        const path = toPublicPath(item.url)
        return !isNonContentPublicPath(path)
      })
    },
  },
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ...DISCOVERY_LINKS,
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Flyto2 Blog' }],
    ['meta', { property: 'og:title', content: 'Flyto2 Blog - AI Workflow Automation, MCP, CTEM, and Security Guides' }],
    ['meta', { property: 'og:description', content: SITE_DESCRIPTION }],
    ['meta', { property: 'og:url', content: SITE_URL }],
    ['meta', { property: 'og:image', content: DEFAULT_OG_IMAGE }],
    ['meta', { property: 'og:image:alt', content: 'Flyto2 Blog - AI workflow automation, MCP, CTEM, and security guides' }],
    ['meta', { property: 'og:locale', content: defaultOgLocale }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Flyto2 Blog - AI Workflow Automation, MCP, CTEM, and Security Guides' }],
    ['meta', { name: 'twitter:description', content: SITE_DESCRIPTION }],
    ['meta', { name: 'twitter:image', content: DEFAULT_OG_IMAGE }],
    ['meta', { name: 'twitter:image:alt', content: 'Flyto2 Blog - AI workflow automation, MCP, CTEM, and security guides' }],
    // SEO
    ['meta', { name: 'keywords', content: SEO_KEYWORDS.join(', ') }],
    ['meta', { name: 'author', content: 'Flyto2 Team' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': ORGANIZATION_ID,
          name: 'Flyto2',
          url: 'https://flyto2.com',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
          sameAs: [
            'https://github.com/flytohub',
            'https://www.youtube.com/@Flyto2',
            'https://pypi.org/project/flyto-core/',
          ],
          contactPoint: [
            { '@type': 'ContactPoint', email: 'support@flyto2.com', contactType: 'customer support' },
            { '@type': 'ContactPoint', email: 'security@flyto2.com', contactType: 'security' },
          ],
        },
        {
          '@type': 'WebSite',
          '@id': WEBSITE_ID,
          name: 'Flyto2 Blog',
          url: SITE_URL,
          publisher: { '@id': ORGANIZATION_ID },
          inLanguage: 'en-US',
        },
        {
          '@type': 'Blog',
          '@id': BLOG_ID,
          name: 'Flyto2 Blog',
          description: SITE_DESCRIPTION,
          url: SITE_URL,
          isPartOf: { '@id': WEBSITE_ID },
          publisher: { '@id': ORGANIZATION_ID },
          image: DEFAULT_OG_IMAGE,
          inLanguage: 'en-US',
          about: [
            'AI workflow automation',
            'open source AI agent framework',
            'MCP server automation',
            'no-code browser automation',
            'CTEM',
            'attack surface management',
            'dark web monitoring',
            'AI security',
            'MCP security',
            CORE_RUNTIME_SUMMARY,
          ],
        },
      ],
    })],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Flyto2 Blog',

    nav: [
      { text: 'Blog', link: '/' },
      { text: 'Tags', link: '/tags' },
      { text: 'Community', link: 'https://flyto2.com/community/' },
      { text: 'Docs', link: 'https://docs.flyto2.com' },
      { text: 'Flyto2', link: 'https://flyto2.com' },
    ],

    sidebar: false,

    socialLinks: [
      { icon: 'youtube', link: 'https://www.youtube.com/@Flyto2' },
      { icon: 'github', link: 'https://github.com/flytohub' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: `Copyright 2025-${new Date().getFullYear()} Flyto2`,
    },
  },

  // Per-post SEO: inject og:title, og:description, article structured data
  transformPageData(pageData) {
    const canonicalPath = pageData.relativePath === 'index.md'
      ? ''
      : pageData.relativePath
          .replace(/(^|\/)index\.md$/, '$1')
          .replace(/\.md$/, '')
          .replace(/\/$/, '')
    const canonicalUrl = `${SITE_URL}${canonicalPath ? `/${canonicalPath}` : ''}`
    const noindex = isNonContentPath(pageData.relativePath)

    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head || []),
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ...publishedAlternateLinks(canonicalPath),
      ...(noindex ? [['meta', { name: 'robots', content: 'noindex, follow' }] as [string, Record<string, string>]] : []),
    ]

    if (pageData.relativePath.startsWith('posts/')) {
      pageData.frontmatter.layout = pageData.frontmatter.layout || 'doc'
      pageData.frontmatter.sidebar = false
      pageData.frontmatter.editLink = false
      pageData.frontmatter.lastUpdated = false

      const title = pageData.frontmatter.title || pageData.title
      const description = pageData.frontmatter.description || pageData.description || ''
      const date = pageData.frontmatter.date || ''
      const dateModified = pageData.lastUpdated
        ? new Date(pageData.lastUpdated).toISOString()
        : date
      const tags = pageData.frontmatter.tags || []
      const keywords = keywordValues(pageData.frontmatter, tags)
      const author = pageData.frontmatter.author || 'Flyto2 Team'
      const url = canonicalUrl
      const cover = pageData.frontmatter.cover || '/og-image.png'
      const image = cover.startsWith('http') ? cover : `${SITE_URL}${cover}`
      const imageAlt = `${title} - Flyto2 Blog`

      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head || []),
        ['meta', { property: 'og:type', content: 'article' }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { property: 'og:image', content: image }],
        ['meta', { property: 'og:image:alt', content: imageAlt }],
        ['meta', { property: 'article:published_time', content: date }],
        ['meta', { property: 'article:modified_time', content: dateModified }],
        ['meta', { property: 'article:author', content: author }],
        ['meta', { property: 'article:section', content: tags[0] || 'Flyto2 guides' }],
        ...tags.map((t: string) => ['meta', { property: 'article:tag', content: t }] as [string, Record<string, string>]),
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['meta', { name: 'twitter:image', content: image }],
        ['meta', { name: 'twitter:image:alt', content: imageAlt }],
        ['script', { type: 'application/ld+json' }, JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': `${url}#webpage`,
              url,
              name: title,
              description,
              isPartOf: { '@id': WEBSITE_ID },
              primaryImageOfPage: { '@type': 'ImageObject', url: image },
              inLanguage: 'en-US',
            },
            {
              '@type': 'BlogPosting',
              '@id': `${url}#article`,
              headline: title,
              description,
              datePublished: date,
              dateModified,
              image: { '@type': 'ImageObject', url: image, caption: imageAlt },
              author: { '@type': 'Organization', name: author, url: 'https://flyto2.com' },
              publisher: { '@id': ORGANIZATION_ID },
              url,
              mainEntityOfPage: { '@id': `${url}#webpage` },
              isPartOf: { '@id': BLOG_ID },
              isAccessibleForFree: true,
              inLanguage: 'en-US',
              articleSection: tags[0] || 'Security',
              keywords: keywords.join(', '),
              about: keywords.slice(0, 8).map((name) => ({ '@type': 'Thing', name })),
              mentions: [
                { '@type': 'SoftwareApplication', name: 'flyto-core', url: 'https://pypi.org/project/flyto-core/' },
                { '@type': 'SoftwareSourceCode', name: 'Flyto2 open-source repositories', url: 'https://github.com/flytohub' },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              '@id': `${url}#breadcrumb`,
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Flyto2 Blog', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: title, item: url },
              ],
            },
          ],
        })],
      ]
    }
  },
})
