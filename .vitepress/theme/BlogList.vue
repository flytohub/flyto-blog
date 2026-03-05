<script setup lang="ts">
import { data as posts } from './posts.data.mts'

const props = defineProps<{
  tag?: string
}>()

const filtered = props.tag
  ? posts.filter(p => p.tags.includes(props.tag!))
  : posts

const TAG_COLORS: Record<string, string> = {
  announcement: '#10b981',
  tutorial: '#3b82f6',
  mcp: '#8b5cf6',
  platform: '#f59e0b',
  indexer: '#06b6d4',
  engineering: '#ec4899',
}

function tagColor(tag: string) {
  return TAG_COLORS[tag] || '#6b7280'
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="blog-list">
    <!-- Tag filter header -->
    <div v-if="tag" class="tag-filter-bar">
      <div class="tag-filter-inner">
        <span class="tag-filter-label">Filtering by</span>
        <span class="tag-filter-chip" :style="{ '--tag-color': tagColor(tag) }">{{ tag }}</span>
        <a href="/" class="tag-filter-clear">Clear filter</a>
      </div>
    </div>

    <!-- Featured post (first post, only on home) -->
    <a v-if="!tag && filtered.length" :href="filtered[0].url" class="featured-card">
      <div class="featured-cover" :style="filtered[0].cover ? { backgroundImage: `url(${filtered[0].cover})` } : {}">
        <div v-if="!filtered[0].cover" class="featured-cover-fallback">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
      </div>
      <div class="featured-body">
        <div class="featured-meta">
          <span class="post-date">{{ formatDate(filtered[0].date) }}</span>
          <span class="meta-dot">&middot;</span>
          <span class="reading-time">{{ filtered[0].readingTime }} min read</span>
        </div>
        <h2 class="featured-title">{{ filtered[0].title }}</h2>
        <p v-if="filtered[0].excerpt" class="featured-excerpt">{{ filtered[0].excerpt }}</p>
        <div class="post-footer">
          <div class="post-tags">
            <span v-for="t in filtered[0].tags" :key="t" class="post-tag" :style="{ '--tag-color': tagColor(t) }">{{ t }}</span>
          </div>
          <span class="read-more">Read more &rarr;</span>
        </div>
      </div>
    </a>

    <!-- Post grid -->
    <div class="posts-grid">
      <a
        v-for="(post, i) in (tag ? filtered : filtered.slice(1))"
        :key="post.url"
        :href="post.url"
        class="post-card"
      >
        <div class="card-cover" :style="post.cover ? { backgroundImage: `url(${post.cover})` } : {}">
          <div v-if="!post.cover" class="card-cover-fallback" :style="{ '--hue': (i * 47 + 200) % 360 }">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="post-date">{{ formatDate(post.date) }}</span>
            <span class="meta-dot">&middot;</span>
            <span class="reading-time">{{ post.readingTime }} min read</span>
          </div>
          <h3 class="card-title">{{ post.title }}</h3>
          <p v-if="post.excerpt" class="card-excerpt">{{ post.excerpt }}</p>
          <div class="post-tags">
            <span v-for="t in post.tags" :key="t" class="post-tag" :style="{ '--tag-color': tagColor(t) }">{{ t }}</span>
          </div>
        </div>
      </a>
    </div>

    <p v-if="!filtered.length" class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      <br>No posts found.
    </p>
  </div>
</template>

<style scoped>
.blog-list {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

/* Tag filter bar */
.tag-filter-bar {
  margin-bottom: 2rem;
}
.tag-filter-inner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.tag-filter-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}
.tag-filter-chip {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  background: color-mix(in srgb, var(--tag-color) 15%, transparent);
  color: var(--tag-color);
}
.tag-filter-clear {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-decoration: none;
}
.tag-filter-clear:hover {
  color: var(--vp-c-brand-1);
}

/* Featured card */
.featured-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-radius: 16px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 2.5rem;
}
.featured-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}
.featured-cover {
  min-height: 280px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, var(--vp-c-bg-soft) 100%);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.featured-cover-fallback {
  color: var(--vp-c-brand-1);
  opacity: 0.3;
}
.featured-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.featured-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.featured-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 0.75rem;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}
.featured-excerpt {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 1.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}
.read-more {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  white-space: nowrap;
}

/* Post grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.post-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.card-cover {
  height: 160px;
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, var(--vp-c-bg-soft) 100%);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-cover-fallback {
  color: hsl(var(--hue, 200), 60%, 60%);
  opacity: 0.25;
}

.card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.35;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-excerpt {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--vp-c-text-3);
  margin: 0 0 1rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Shared elements */
.post-date, .reading-time {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}
.meta-dot {
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
}

.post-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.post-tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: color-mix(in srgb, var(--tag-color) 12%, transparent);
  color: var(--tag-color);
}

.empty {
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 4rem 0;
  line-height: 2;
}

@media (max-width: 768px) {
  .featured-card {
    grid-template-columns: 1fr;
  }
  .featured-cover {
    min-height: 180px;
  }
  .posts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
