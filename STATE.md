# State

Current state on 2026-07-16:

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
  Flyto2 brand hygiene, and `@flyto2.com` email hygiene.
- `.github/workflows/seo.yml` adds a separate SEO gate with local metadata
  audit, Lighthouse SEO assertions, and public-link checks.

Known gaps:

- Data, Zero-person Agent, Big Data / Intelligence, and AI search visibility now
  have first-pass canonical posts; next work should add follow-up examples,
  templates, and multilingual strategy after docs and landing hreflang strategy
  stabilizes.
- GitHub Pages deploy still depends on GitHub Actions availability. If Actions
  is blocked by account or billing state, local `npm run verify` can validate
  the site but production will not update until the deployment runner is
  restored.
