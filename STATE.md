# State

Current state on 2026-07-18:

- Blog SEO now consumes `.seo/i18n-seo-manifest.json`, synced from
  `flyto-i18n/dist/seo-manifest.json`. VitePress injects manifest-derived
  alternate links only for posts/pages that exist in the repo.
- Blog has VitePress sitemap, canonical links, OpenGraph, Twitter card, and
  article JSON-LD.
- Blog homepage, metadata, and AI-readable indexes now cover AI workflow
  automation, open-source AI agent frameworks, MCP server automation, no-code
  browser automation, and security education clusters.
- Public topics cover security, automation, Data workflow automation,
  Zero-person Company Agent, Big Data / Intelligence workflow automation, and
  AI search visibility.
- `public/robots.txt`, `public/llms.txt`, and `public/llms-full.txt` exist.
- Root project memory files are filtered as non-content by VitePress config.
- `npm run audit:seo` now verifies the built homepage, every blog post,
  sitemap coverage, robots policy, llms files, keyword matrix freshness,
  Flyto2 brand hygiene, `@flyto2.com` email hygiene, manifest source hash, and
  keyword evidence.
- `.github/workflows/seo.yml` adds a separate SEO gate with local metadata
  audit, Lighthouse SEO assertions, and public-link checks.

Known gaps:

- Data, Zero-person Agent, Big Data / Intelligence, and AI search visibility now
  have first-pass canonical posts; next work should add follow-up examples,
  templates, and multilingual strategy after docs and landing hreflang strategy
  stabilizes.
- Cloudflare/GitHub builds use the committed `.seo/i18n-seo-manifest.json`
  cache; run `npm run seo:sync` locally after changing `flyto-i18n` SEO source
  data.
- GitHub Pages deploy still depends on GitHub Actions availability. If Actions
  is blocked by account or billing state, local `npm run verify` can validate
  the site but production will not update until the deployment runner is
  restored.
