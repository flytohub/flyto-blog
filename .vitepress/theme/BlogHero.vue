<template>
  <div class="blog-hero visible">
    <div class="hero-inner">
      <div class="hero-badge">
        <span class="badge-dot" />
        Flyto2 Blog
      </div>
      <h1 class="hero-title">
        Field guides for AI automation and continuous security
      </h1>
      <p class="hero-desc">Choose one problem space, then follow practical guides backed by workflows, source code, execution evidence, and honest implementation limits.</p>
      <div class="topic-grid" aria-label="Flyto2 content centers">
        <a href="/flow/" class="topic-card topic-flow">
          <span class="topic-kicker">Flyto2 Flow</span>
          <strong>AI workflow automation</strong>
          <span>Visual MCP tools, local browser automation, replay, and self-hosted workflow engineering.</span>
          <span class="topic-link">Explore Flow guides <span aria-hidden="true">&rarr;</span></span>
        </a>
        <a href="/security/" class="topic-card topic-security">
          <span class="topic-kicker">Flyto2 Warroom</span>
          <strong>Continuous security operations</strong>
          <span>CTEM, attack surface management, security validation, and evidence-backed remediation.</span>
          <span class="topic-link">Explore security guides <span aria-hidden="true">&rarr;</span></span>
        </a>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-num">452</span>
          <span class="stat-label">Core modules</span>
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
  padding: 4.5rem 1.5rem 3.5rem;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-soft) 66%, var(--vp-c-bg)) 0%, var(--vp-c-bg) 100%);
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
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0 auto 1.25rem;
  letter-spacing: 0;
  color: var(--vp-c-text-1);
  max-width: 820px;
}

/* Description */
.hero-desc {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0 0 2rem;
  max-width: 660px;
  margin-left: auto;
  margin-right: auto;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0 auto 2rem;
  max-width: 820px;
}
.topic-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 13rem;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  text-align: left;
  text-decoration: none;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.topic-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}
.topic-card strong {
  margin: 0.35rem 0 0.65rem;
  font-size: 1.2rem;
  line-height: 1.3;
}
.topic-card > span:not(.topic-kicker):not(.topic-link) {
  color: var(--vp-c-text-2);
  font-size: 0.92rem;
  line-height: 1.6;
}
.topic-kicker {
  color: var(--vp-c-brand-1);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.topic-security .topic-kicker {
  color: #0f766e;
}
.topic-link {
  margin-top: auto;
  padding-top: 1rem;
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-weight: 700;
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
  .blog-hero { padding: 2.75rem 1rem 2.25rem; }
  .hero-title { font-size: 1.9rem; }
  .hero-desc { font-size: 0.95rem; }
  .topic-grid { grid-template-columns: 1fr; }
  .topic-card { min-height: 11rem; padding: 1.2rem; }
  .hero-stats { gap: 1rem; padding: 0.6rem 1rem; }
}
</style>
