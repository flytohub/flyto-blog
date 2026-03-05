import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Flyto2 Blog',
  description: 'Product updates, tutorials, and engineering insights from the Flyto2 team.',
  lang: 'en-US',
  cleanUrls: true,
  sitemap: { hostname: 'https://blog.flyto2.com' },
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'canonical', href: 'https://blog.flyto2.com' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Flyto2 Blog' }],
    ['meta', { property: 'og:title', content: 'Flyto2 Blog — Engineering Insights & Updates' }],
    ['meta', { property: 'og:description', content: 'Product updates, tutorials, and engineering insights from the Flyto2 team.' }],
    ['meta', { property: 'og:url', content: 'https://blog.flyto2.com' }],
    ['meta', { property: 'og:image', content: 'https://blog.flyto2.com/og-image.png' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Flyto2 Blog — Engineering Insights & Updates' }],
    ['meta', { name: 'twitter:description', content: 'Product updates, tutorials, and engineering insights from the Flyto2 team.' }],
    ['meta', { name: 'twitter:image', content: 'https://blog.flyto2.com/og-image.png' }],
    // SEO
    ['meta', { name: 'keywords', content: 'flyto2, workflow automation, MCP, modules, enterprise platform, code intelligence, AI agents' }],
    ['meta', { name: 'author', content: 'Flyto2 Team' }],
    ['meta', { name: 'robots', content: 'index, follow' }],
    // JSON-LD structured data
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Flyto2 Blog',
      description: 'Product updates, tutorials, and engineering insights from the Flyto2 team.',
      url: 'https://blog.flyto2.com',
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
    if (pageData.relativePath.startsWith('posts/')) {
      pageData.frontmatter.layout = pageData.frontmatter.layout || 'doc'
      pageData.frontmatter.sidebar = false
      pageData.frontmatter.editLink = false
      pageData.frontmatter.lastUpdated = false

      const title = pageData.frontmatter.title || pageData.title
      const description = pageData.frontmatter.description || pageData.description || ''
      const date = pageData.frontmatter.date || ''
      const tags = pageData.frontmatter.tags || []
      const author = pageData.frontmatter.author || 'Flyto2 Team'
      const url = `https://blog.flyto2.com/${pageData.relativePath.replace(/\.md$/, '')}`

      pageData.frontmatter.head = [
        ['meta', { property: 'og:type', content: 'article' }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { property: 'article:published_time', content: date }],
        ['meta', { property: 'article:author', content: author }],
        ...tags.map((t: string) => ['meta', { property: 'article:tag', content: t }] as [string, Record<string, string>]),
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['script', { type: 'application/ld+json' }, JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          description,
          datePublished: date,
          author: { '@type': 'Person', name: author },
          publisher: {
            '@type': 'Organization',
            name: 'Flyto2',
            url: 'https://flyto2.com',
          },
          url,
          keywords: tags.join(', '),
        })],
      ]
    }
  },
})
