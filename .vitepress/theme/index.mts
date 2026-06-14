import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useData } from 'vitepress'
import BlogList from './BlogList.vue'
import BlogHero from './BlogHero.vue'
import './custom.css'

const BlogPostTitle = {
  name: 'BlogPostTitle',
  setup() {
    const { frontmatter, page } = useData()

    return () => {
      if (!page.value.relativePath.startsWith('posts/') || !frontmatter.value.title) {
        return null
      }

      return h('header', { class: 'blog-post-heading' }, [
        h('p', { class: 'blog-post-kicker' }, 'Flyto2 Security Blog'),
        h('h1', { class: 'blog-post-title' }, frontmatter.value.title),
      ])
    }
  },
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(BlogPostTitle),
    })
  },
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('BlogHero', BlogHero)
  },
}
