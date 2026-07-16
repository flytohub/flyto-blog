import { createContentLoader } from 'vitepress'
import { readFileSync } from 'node:fs'

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

interface RawPost {
  url: string
  frontmatter: Record<string, any>
  excerpt?: string
  src?: string
  content?: string
}

function markdownWordCount(markdown: string) {
  const text = markdown
    .replace(/^---[\s\S]*?---/, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_#>|~[\]()-]/g, ' ')

  return text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0
}

function postSource(entry: RawPost) {
  if (entry.src?.trim()) return entry.src
  if (entry.content?.trim()) return entry.content

  try {
    const relativePath = `${entry.url.replace(/^\/+/, '')}.md`
    return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
  } catch {
    return ''
  }
}

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw): PostData[] {
    return raw
      .map((entry) => {
        const { url, frontmatter, excerpt } = entry as RawPost
        const plainExcerpt = excerpt?.replace(/<[^>]+>/g, '').trim()
        const wordCount = markdownWordCount(postSource(entry as RawPost))
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
