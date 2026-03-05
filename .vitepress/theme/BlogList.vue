<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

// Intersection Observer for scroll animations
const listRef = ref<HTMLElement>()
onMounted(() => {
  if (!listRef.value) return
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  )
  listRef.value.querySelectorAll('.animate-item').forEach((el) => observer.observe(el))
})
</script>

<template>
  <div class="blog-list" ref="listRef">
    <!-- Tag filter bar -->
    <div v-if="tag" class="tag-filter-bar animate-item">
      <div class="tag-filter-inner">
        <span class="tag-filter-label">Filtering by</span>
        <span class="tag-filter-chip" :style="{ '--tag-color': tagColor(tag) }">{{ tag }}</span>
        <a href="/" class="tag-filter-clear">Clear filter</a>
      </div>
    </div>

    <!-- Featured post -->
    <a v-if="!tag && filtered.length" :href="filtered[0].url" class="featured-card animate-item">
      <div class="featured-cover" :style="filtered[0].cover ? { backgroundImage: `url(${filtered[0].cover})` } : {}">
        <div v-if="!filtered[0].cover" class="featured-cover-fallback">
          <div class="cover-pattern" />
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
          <span class="read-more">
            Read more
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </div>
      </div>
    </a>

    <!-- Section label -->
    <div v-if="!tag && filtered.length > 1" class="section-label animate-item">
      <span class="section-line" />
      <span class="section-text">Latest Posts</span>
      <span class="section-line" />
    </div>

    <!-- Post grid -->
    <div class="posts-grid">
      <a
        v-for="(post, i) in (tag ? filtered : filtered.slice(1))"
        :key="post.url"
        :href="post.url"
        class="post-card animate-item"
        :style="{ '--stagger': i }"
      >
        <div class="card-cover" :style="post.cover ? { backgroundImage: `url(${post.cover})` } : {}">
          <div v-if="!post.cover" class="card-cover-fallback" :style="{ '--hue': (i * 47 + 200) % 360 }">
            <div class="cover-dots" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div class="card-cover-shine" />
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
  padding: 2.5rem 1.5rem 4rem;
}

/* Scroll animation */
.animate-item {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.animate-item.in-view {
  opacity: 1;
  transform: translateY(0);
}
.post-card.animate-item {
  transition-delay: calc(var(--stagger, 0) * 0.08s);
}

/* Tag filter bar */
.tag-filter-bar { margin-bottom: 2rem; }
.tag-filter-inner {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; border-radius: 10px;
  background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);
}
.tag-filter-label { font-size: 0.875rem; color: var(--vp-c-text-3); }
.tag-filter-chip {
  padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
  background: color-mix(in srgb, var(--tag-color) 15%, transparent); color: var(--tag-color);
}
.tag-filter-clear {
  margin-left: auto; font-size: 0.8rem; color: var(--vp-c-text-3);
  text-decoration: none; transition: color 0.2s;
}
.tag-filter-clear:hover { color: var(--vp-c-brand-1); }

/* Section label */
.section-label { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.section-line { flex: 1; height: 1px; background: var(--vp-c-divider); }
.section-text {
  font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--vp-c-text-3); white-space: nowrap;
}

/* Featured card */
.featured-card {
  display: grid; grid-template-columns: 1fr 1fr;
  border-radius: 16px; overflow: hidden;
  background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);
  text-decoration: none; margin-bottom: 2.5rem;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
}
.featured-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 30px rgba(0,0,0,0.06), 0 0 0 1px color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent);
  transform: translateY(-3px);
}
.featured-cover {
  min-height: 300px; position: relative; overflow: hidden;
  background: linear-gradient(135deg, color-mix(in srgb, var(--vp-c-brand-soft) 60%, transparent) 0%, var(--vp-c-bg-soft) 100%);
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
}
.featured-cover-fallback { color: var(--vp-c-brand-1); opacity: 0.25; position: relative; z-index: 1; }
.cover-pattern {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--vp-c-brand-1) 8%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--vp-c-brand-1) 6%, transparent) 0%, transparent 50%);
  animation: patternFloat 8s ease-in-out infinite alternate;
}
@keyframes patternFloat {
  0% { transform: scale(1); }
  100% { transform: scale(1.1) translate(2%, -2%); }
}
.featured-body { padding: 2rem; display: flex; flex-direction: column; justify-content: center; }
.featured-meta { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
.featured-title {
  font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin: 0 0 0.75rem;
  color: var(--vp-c-text-1); letter-spacing: -0.01em;
}
.featured-excerpt {
  font-size: 0.95rem; line-height: 1.6; color: var(--vp-c-text-2); margin: 0 0 1.25rem;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.post-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.read-more {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.875rem; font-weight: 600; color: var(--vp-c-brand-1); white-space: nowrap;
}
.read-more svg { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.featured-card:hover .read-more svg { transform: translateX(4px); }

/* Post grid */
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

.post-card {
  display: flex; flex-direction: column; border-radius: 12px; overflow: hidden;
  background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider);
  text-decoration: none;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
}
.post-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 6px 24px rgba(0,0,0,0.05), 0 0 0 1px color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
  transform: translateY(-4px);
}
.card-cover {
  height: 160px; position: relative; overflow: hidden;
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, var(--vp-c-bg-soft) 100%);
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
}
.card-cover-fallback { color: hsl(var(--hue, 200), 60%, 60%); opacity: 0.25; position: relative; z-index: 1; }
.cover-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, currentColor 0.5px, transparent 0.5px);
  background-size: 16px 16px; opacity: 0.08;
}
.card-cover-shine {
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%);
  transform: translateX(-100%); transition: transform 0.6s ease;
}
.post-card:hover .card-cover-shine { transform: translateX(100%); }

.card-body { padding: 1.25rem; display: flex; flex-direction: column; flex: 1; }
.card-meta { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
.card-title {
  font-size: 1.1rem; font-weight: 650; line-height: 1.35; margin: 0 0 0.5rem;
  color: var(--vp-c-text-1); transition: color 0.2s;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.post-card:hover .card-title { color: var(--vp-c-brand-1); }
.card-excerpt {
  font-size: 0.875rem; line-height: 1.6; color: var(--vp-c-text-3); margin: 0 0 1rem; flex: 1;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Shared */
.post-date, .reading-time { font-size: 0.8rem; color: var(--vp-c-text-3); }
.meta-dot { color: var(--vp-c-text-3); font-size: 0.7rem; }
.post-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.post-tag {
  display: inline-block; padding: 0.15rem 0.5rem; border-radius: 6px;
  font-size: 0.75rem; font-weight: 500;
  background: color-mix(in srgb, var(--tag-color) 12%, transparent); color: var(--tag-color);
  transition: background 0.2s;
}
.post-card:hover .post-tag { background: color-mix(in srgb, var(--tag-color) 18%, transparent); }

.empty { text-align: center; color: var(--vp-c-text-3); padding: 4rem 0; line-height: 2; }

@media (max-width: 768px) {
  .featured-card { grid-template-columns: 1fr; }
  .featured-cover { min-height: 180px; }
  .posts-grid { grid-template-columns: 1fr; }
}
</style>
