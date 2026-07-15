import { defineConfig } from 'vitepress'

const SITE_URL = 'https://blog.flyto2.com'
const CORE_MODULE_COUNT = 451
const CORE_CATALOG_CATEGORY_COUNT = 84
const BUILT_IN_RECIPE_COUNT = 41
const CORE_RUNTIME_SUMMARY = `${CORE_MODULE_COUNT} registry-backed modules across ${CORE_CATALOG_CATEGORY_COUNT} catalog categories, ${BUILT_IN_RECIPE_COUNT} built-in recipes, MCP transports, evidence capture, and replayable YAML execution`
const SITE_DESCRIPTION = `Practical security guides on CTEM, ASM, EASM, dark web monitoring, AI/MCP security, MSSP/BYO, pentest, and red-team workflows from Flyto2, backed by ${CORE_RUNTIME_SUMMARY}.`
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
  'public/blog/CREDITS.md',
])

function toPublicPath(url: string) {
  return url.startsWith('http') ? new URL(url).pathname : url
}

function isNonContentPath(relativePath: string) {
  return NON_CONTENT_PATHS.has(relativePath)
    || relativePath.startsWith('public/')
    || relativePath.startsWith('workflows/')
    || relativePath.startsWith('handoffs/')
}

export default defineConfig({
  title: 'Flyto2 Blog - CTEM, Attack Surface, Dark Web, and AI/MCP Security',
  description: SITE_DESCRIPTION,
  lang: 'en-US',
  cleanUrls: true,
  sitemap: {
    hostname: SITE_URL,
    transformItems(items) {
      return items.filter((item) => {
        const path = toPublicPath(item.url).replace(/^\/+/, '')
        return ![
          'CONTRIBUTING',
          'POSTING',
          'README',
          'SECURITY',
          'public/blog/CREDITS',
        ].includes(path)
      })
    },
  },
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Flyto2 Blog' }],
    ['meta', { property: 'og:title', content: 'Flyto2 Blog - CTEM, ASM, Dark Web, and AI/MCP Security' }],
    ['meta', { property: 'og:description', content: SITE_DESCRIPTION }],
    ['meta', { property: 'og:image', content: 'https://blog.flyto2.com/og-image.png' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Flyto2 Blog - CTEM, ASM, Dark Web, and AI/MCP Security' }],
    ['meta', { name: 'twitter:description', content: SITE_DESCRIPTION }],
    ['meta', { name: 'twitter:image', content: 'https://blog.flyto2.com/og-image.png' }],
    // SEO
    ['meta', { name: 'keywords', content: `Flyto2, CTEM, attack surface management, external attack surface management, EASM, ASM, dark web monitoring, AI security platform, MCP security, MSSP, BYO security integrations, pentest, red team, ${CORE_MODULE_COUNT} modules, ${CORE_CATALOG_CATEGORY_COUNT} catalog categories, ${BUILT_IN_RECIPE_COUNT} recipes` }],
    ['meta', { name: 'author', content: 'Flyto2 Team' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Flyto2 Blog',
      description: SITE_DESCRIPTION,
      url: 'https://blog.flyto2.com',
      about: [
        'CTEM',
        'attack surface management',
        'dark web monitoring',
        'AI security',
        'MCP security',
        CORE_RUNTIME_SUMMARY,
      ],
      publisher: {
        '@type': 'Organization',
        name: 'Flyto2',
        url: 'https://flyto2.com',
        logo: { '@type': 'ImageObject', url: 'https://blog.flyto2.com/logo.png' },
      },
    })],
  ],

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Flyto2 Blog',

    nav: [
      { text: 'Blog', link: '/' },
      { text: 'Tags', link: '/tags' },
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
      const author = pageData.frontmatter.author || 'Flyto2 Team'
      const url = canonicalUrl
      const cover = pageData.frontmatter.cover || '/og-image.png'
      const image = cover.startsWith('http') ? cover : `${SITE_URL}${cover}`

      pageData.frontmatter.head = [
        ...(pageData.frontmatter.head || []),
        ['meta', { property: 'og:type', content: 'article' }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { property: 'og:image', content: image }],
        ['meta', { property: 'article:published_time', content: date }],
        ['meta', { property: 'article:modified_time', content: dateModified }],
        ['meta', { property: 'article:author', content: author }],
        ...tags.map((t: string) => ['meta', { property: 'article:tag', content: t }] as [string, Record<string, string>]),
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['meta', { name: 'twitter:image', content: image }],
        ['script', { type: 'application/ld+json' }, JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: title,
              description,
              datePublished: date,
              dateModified,
              image,
              author: { '@type': 'Organization', name: author, url: 'https://flyto2.com' },
              publisher: {
                '@type': 'Organization',
                name: 'Flyto2',
                url: 'https://flyto2.com',
                logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
              },
              url,
              mainEntityOfPage: { '@type': 'WebPage', '@id': url },
              articleSection: tags[0] || 'Security',
              keywords: tags.join(', '),
            },
            {
              '@type': 'BreadcrumbList',
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
