<script setup lang="ts">
const clusters = [
  { label: 'AI Workflow Automation', href: '/posts/workflow-automation' },
  { label: 'Open Source Automation', href: '/posts/modules-not-magic' },
  { label: 'MCP Server Automation', href: '/posts/mcp-server-guide' },
  { label: 'MCP Security', href: '/posts/mcp-security-risks-and-controls' },
  { label: 'CTEM', href: '/posts/what-is-ctem-continuous-threat-exposure-management' },
  { label: 'ASM / EASM', href: '/posts/attack-surface-management-guide' },
  { label: 'Dark Web Monitoring', href: '/posts/darkweb-monitoring-explained' },
  { label: 'AI Security', href: '/posts/ai-security-platform-guide' },
  { label: 'MSSP / BYO', href: '/posts/byo-mssp-integration-model' },
  { label: 'Pentest / Red Team', href: '/posts/pentest-vs-vulnerability-scan-vs-red-team' },
]
</script>

<template>
  <div class="blog-hero visible">
    <!-- Subtle mesh background -->
    <div class="hero-mesh" />

    <!-- Grid pattern overlay -->
    <div class="hero-grid" />

    <div class="hero-inner">
      <div class="hero-badge">
        <span class="badge-dot" />
        Flyto2 Blog
      </div>
      <h1 class="hero-title">
        <span class="title-line">AI workflow automation, MCP, </span><span class="title-line title-gradient">CTEM, and security guides</span>
      </h1>
      <p class="hero-desc">Practical guides for open-source AI agent automation, MCP server tooling, no-code browser workflows, evidence-backed CTEM, BYO integrations, and red-team validation.</p>
      <div class="topic-grid">
        <a v-for="cluster in clusters" :key="cluster.href" :href="cluster.href" class="topic-chip">
          {{ cluster.label }}
        </a>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">452</span>
          <span class="stat-label">Modules</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-num">MCP</span>
          <span class="stat-label">Agent Tools</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-num">CTEM</span>
          <span class="stat-label">Evidence</span>
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
}

.dark .hero-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
    radial-gradient(ellipse 60% 60% at 80% 20%, rgba(139, 92, 246, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 50% 80% at 50% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
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
  max-width: 760px;
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
  letter-spacing: 0;
  color: var(--vp-c-text-1);
}

.title-line {
  display: block;
}

.title-gradient {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
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
}

.topic-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.65rem;
  margin: 0 auto 2rem;
  max-width: 680px;
}
.topic-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2.1rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 82%, transparent);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.topic-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
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
  letter-spacing: 0;
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
  .topic-grid { justify-content: flex-start; }
  .hero-stats { gap: 1rem; padding: 0.6rem 1rem; }
}
</style>
