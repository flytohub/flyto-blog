import { createContentLoader } from 'vitepress'

export interface PostData {
  title: string
  url: string
  date: string
  excerpt: string | undefined
  tags: string[]
  author: string
  cover: string
  readingTime: number
}

declare const data: PostData[]
export { data }

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw): PostData[] {
    return raw
      .map(({ url, frontmatter, excerpt, src }) => {
        const plainExcerpt = excerpt?.replace(/<[^>]+>/g, '').trim()
        const wordCount = (src || '').split(/\s+/).length
        return {
          title: frontmatter.title || 'Untitled',
          url,
          date: frontmatter.date ? new Date(frontmatter.date).toISOString().slice(0, 10) : '',
          excerpt: plainExcerpt,
          tags: frontmatter.tags || [],
          author: frontmatter.author || 'Flyto2 Team',
          cover: frontmatter.cover || '',
          readingTime: Math.max(1, Math.ceil(wordCount / 200)),
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  },
})
