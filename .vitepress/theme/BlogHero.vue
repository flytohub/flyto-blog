<template>
  <div class="blog-hero">
    <div class="hero-inner">
      <div class="hero-badge">Flyto2 Blog</div>
      <h1 class="hero-title">Engineering Insights &amp; Updates</h1>
      <p class="hero-desc">Product announcements, technical deep dives, and workflow automation tutorials from the Flyto2 team.</p>
    </div>
    <div class="hero-glow" />
  </div>
</template>

<style scoped>
.blog-hero {
  position: relative;
  overflow: hidden;
  padding: 4rem 1.5rem 3rem;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
  background: linear-gradient(135deg, var(--vp-c-bg) 0%, var(--vp-c-bg-soft) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--vp-c-text-1) 0%, var(--vp-c-brand-1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin: 0;
}

.hero-glow {
  position: absolute;
  top: -80px;
  right: -120px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--vp-c-brand-soft) 0%, transparent 70%);
  opacity: 0.4;
  pointer-events: none;
}

@media (max-width: 640px) {
  .blog-hero {
    padding: 2.5rem 1rem 2rem;
  }
  .hero-title {
    font-size: 1.6rem;
  }
}
</style>
