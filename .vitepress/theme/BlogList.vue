<script setup lang="ts">
import { data as posts } from './posts.data.mts'

const props = defineProps<{
  tag?: string
}>()

const filtered = props.tag
  ? posts.filter(p => p.tags.includes(props.tag!))
  : posts
</script>

<template>
  <div class="blog-list">
    <div v-if="tag" class="tag-header">
      <h2>Posts tagged "{{ tag }}"</h2>
      <a href="/" class="back-link">&larr; All posts</a>
    </div>

    <article v-for="post in filtered" :key="post.url" class="post-card">
      <div class="post-meta">
        <time :datetime="post.date">{{ post.date }}</time>
        <span v-if="post.author" class="author">{{ post.author }}</span>
      </div>
      <h2>
        <a :href="post.url">{{ post.title }}</a>
      </h2>
      <p v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</p>
      <div v-if="post.tags.length" class="tags">
        <a v-for="t in post.tags" :key="t" :href="`/tags?tag=${t}`" class="tag">{{ t }}</a>
      </div>
    </article>

    <p v-if="!filtered.length" class="empty">No posts yet.</p>
  </div>
</template>

<style scoped>
.blog-list {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.tag-header {
  margin-bottom: 2rem;
}

.tag-header h2 {
  margin: 0 0 0.5rem;
}

.back-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.post-card {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.post-card:last-child {
  border-bottom: none;
}

.post-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.post-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  line-height: 1.4;
}

.post-card h2 a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.post-card h2 a:hover {
  color: var(--vp-c-brand-1);
}

.excerpt {
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
  line-height: 1.6;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.tag:hover {
  color: var(--vp-c-brand-1);
}

.empty {
  color: var(--vp-c-text-3);
  text-align: center;
  padding: 3rem 0;
}
</style>
