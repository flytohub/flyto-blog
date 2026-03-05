<script setup lang="ts">
import { onMounted, ref } from 'vue'

const visible = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})
</script>

<template>
  <div class="blog-hero" :class="{ visible }">
    <!-- Animated mesh gradient background -->
    <div class="hero-mesh" />

    <!-- Floating orbs -->
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />

    <!-- Grid pattern overlay -->
    <div class="hero-grid" />

    <div class="hero-inner">
      <div class="hero-badge">
        <span class="badge-dot" />
        Flyto2 Blog
      </div>
      <h1 class="hero-title">
        <span class="title-line">Engineering Insights</span>
        <span class="title-line title-gradient">&amp; Updates</span>
      </h1>
      <p class="hero-desc">Product announcements, technical deep dives, and workflow automation tutorials from the Flyto2 team.</p>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">412+</span>
          <span class="stat-label">Modules</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-num">MCP</span>
          <span class="stat-label">Native</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-num">OSS</span>
          <span class="stat-label">Open Source</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-hero {
  position: relative;
  overflow: hidden;
  padding: 5rem 1.5rem 4rem;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

/* Animated mesh gradient */
.hero-mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 60% 60% at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 70%),
    radial-gradient(ellipse 50% 80% at 50% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
  animation: meshShift 12s ease-in-out infinite alternate;
}

.dark .hero-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 60% 60% at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 50% 80% at 50% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
}

@keyframes meshShift {
  0% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.1) translate(-2%, 3%); }
  100% { transform: scale(1.05) translate(2%, -2%); }
}

/* Floating orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  opacity: 0;
  animation: orbFloat 8s ease-in-out infinite alternate;
}
.blog-hero.visible .orb { opacity: 1; transition: opacity 1.5s ease; }

.orb-1 {
  width: 300px; height: 300px;
  top: -60px; right: -80px;
  background: rgba(99, 102, 241, 0.12);
  animation-delay: 0s;
  animation-duration: 10s;
}
.orb-2 {
  width: 200px; height: 200px;
  bottom: -40px; left: -60px;
  background: rgba(59, 130, 246, 0.1);
  animation-delay: -3s;
  animation-duration: 8s;
}
.orb-3 {
  width: 150px; height: 150px;
  top: 40%; left: 60%;
  background: rgba(139, 92, 246, 0.08);
  animation-delay: -5s;
  animation-duration: 12s;
}

.dark .orb-1 { background: rgba(99, 102, 241, 0.2); }
.dark .orb-2 { background: rgba(59, 130, 246, 0.15); }
.dark .orb-3 { background: rgba(139, 92, 246, 0.12); }

@keyframes orbFloat {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(15px, -20px) scale(1.05); }
  66% { transform: translate(-10px, 10px) scale(0.95); }
  100% { transform: translate(5px, -5px) scale(1.02); }
}

/* Subtle grid pattern */
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
}

.dark .hero-grid {
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
}

/* Content */
.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 680px;
  margin: 0 auto;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.9rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
  margin-bottom: 1.5rem;
  opacity: 0;
  transform: translateY(12px);
}
.blog-hero.visible .hero-badge {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
}

.badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* Title */
.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 0 1.25rem;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
}

.title-line {
  display: block;
  opacity: 0;
  transform: translateY(20px);
}
.blog-hero.visible .title-line {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
}
.blog-hero.visible .title-line:nth-child(2) {
  transition-delay: 0.35s;
}

.title-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradientShift 4s ease-in-out infinite alternate;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

/* Description */
.hero-desc {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 2rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0;
  transform: translateY(16px);
}
.blog-hero.visible .hero-desc {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.45s;
}

/* Stats */
.hero-stats {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 80%, transparent);
  border: 1px solid var(--vp-c-divider);
  backdrop-filter: blur(8px);
  opacity: 0;
  transform: translateY(16px);
}
.blog-hero.visible .hero-stats {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.stat-num {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  letter-spacing: -0.01em;
}
.stat-label {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-divider {
  width: 1px;
  height: 24px;
  background: var(--vp-c-divider);
}

@media (max-width: 640px) {
  .blog-hero { padding: 3rem 1rem 2.5rem; }
  .hero-title { font-size: 2rem; }
  .hero-desc { font-size: 0.95rem; }
  .hero-stats { gap: 1rem; padding: 0.6rem 1rem; }
}
</style>
