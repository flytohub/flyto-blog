import DefaultTheme from 'vitepress/theme'
import BlogList from './BlogList.vue'
import BlogHero from './BlogHero.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
    app.component('BlogHero', BlogHero)
  },
}
