import { createContentLoader } from 'vitepress'

export interface PostData {
  title: string
  url: string
  date: string
  excerpt: string | undefined
  tags: string[]
  author: string
}

declare const data: PostData[]
export { data }

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw): PostData[] {
    return raw
      .map(({ url, frontmatter, excerpt }) => ({
        title: frontmatter.title || 'Untitled',
        url,
        date: frontmatter.date ? new Date(frontmatter.date).toISOString().slice(0, 10) : '',
        excerpt: excerpt?.replace(/<[^>]+>/g, '').trim(),
        tags: frontmatter.tags || [],
        author: frontmatter.author || 'Flyto2 Team',
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  },
})
