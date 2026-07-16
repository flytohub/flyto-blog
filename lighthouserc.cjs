module.exports = {
  ci: {
    collect: {
      staticDistDir: './.vitepress/dist',
      url: [
        '/',
        '/posts/ai-browser-automation-guide.html',
        '/posts/mcp-server-guide.html',
        '/posts/attack-surface-management-guide.html',
        '/posts/what-is-ctem-continuous-threat-exposure-management.html',
        '/posts/ai-search-visibility-for-technical-products.html',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 1 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
