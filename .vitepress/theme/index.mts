import DefaultTheme from 'vitepress/theme'
import BlogList from './BlogList.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BlogList', BlogList)
  },
}
