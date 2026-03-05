import { defineConfig } from 'vitepress'
import { createContentLoader } from 'vitepress'

export default defineConfig({
  title: 'Flyto2 Blog',
  description: 'Product updates, tutorials, and engineering insights from the Flyto2 team.',
  lang: 'en-US',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'Flyto2 Blog' }],
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

  // Transform page metadata for blog posts
  transformPageData(pageData) {
    if (pageData.relativePath.startsWith('posts/')) {
      pageData.frontmatter.layout = pageData.frontmatter.layout || 'doc'
      pageData.frontmatter.sidebar = false
      pageData.frontmatter.editLink = false
      pageData.frontmatter.lastUpdated = false
    }
  },
})
