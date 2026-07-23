import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useData } from 'vitepress'
import BlogList from './BlogList.vue'
import BlogHero from './BlogHero.vue'
import './custom.css'

const SECURITY_TAGS = new Set([
  'security',
  'ctem',
  'attack-surface',
  'easm',
  'mcp-security',
  'pentest',
  'red-team',
  'dark-web',
  'mssp',
])

function postTrack(tags: unknown) {
  const values = Array.isArray(tags) ? tags.map(String) : []
  return values.some(tag => SECURITY_TAGS.has(tag)) ? 'security' : 'flow'
}

const BlogPostTitle = {
  name: 'BlogPostTitle',
  setup() {
    const { frontmatter, page } = useData()

    return () => {
      if (!page.value.relativePath.startsWith('posts/') || !frontmatter.value.title) {
        return null
      }

      const track = postTrack(frontmatter.value.tags)
      const label = track === 'security' ? 'Flyto2 Security Guides' : 'Flyto2 Flow Guides'

      return h('header', { class: 'blog-post-heading' }, [
        h('p', { class: 'blog-post-kicker' }, label),
        h('h1', { class: 'blog-post-title' }, frontmatter.value.title),
      ])
    }
  },
}

const BlogPostContext = {
  name: 'BlogPostContext',
  setup() {
    const { frontmatter, page } = useData()

    return () => {
      if (!page.value.relativePath.startsWith('posts/')) return null

      const track = postTrack(frontmatter.value.tags)
      const isSecurity = track === 'security'

      return h('aside', { class: 'blog-post-context', 'aria-label': 'Continue with Flyto2' }, [
        h('p', { class: 'blog-post-context-kicker' }, isSecurity ? 'Flyto2 Warroom' : 'Flyto2 Flow'),
        h('h2', isSecurity ? 'Continue with security operations' : 'Continue with workflow automation'),
        h('p', isSecurity
          ? 'Connect this guide to focused CTEM, attack-surface, validation, and remediation resources.'
          : 'Connect this guide to focused MCP, browser automation, replay, and workflow implementation resources.'),
        h('div', { class: 'blog-post-context-links' }, [
          h('a', { href: isSecurity ? '/security/' : '/flow/' }, 'Browse the topic center'),
          h('a', { href: isSecurity ? 'https://flyto2.com/warroom/' : 'https://flyto2.com/flow/' }, 'View the product'),
          h('a', { href: isSecurity ? 'https://docs.flyto2.com/warroom/' : 'https://docs.flyto2.com/flow/' }, 'Read the documentation'),
        ]),
      ])
    }
  },
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(BlogPostTitle),
      'doc-after': () => h(BlogPostContext),
    })
  },
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('BlogHero', BlogHero)
  },
}
