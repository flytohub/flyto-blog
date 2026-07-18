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
- `posts/community-growth-open-source-ai-workflow-automation.md` is the
  canonical community growth and social syndication post.
- `scripts/social-publish.mjs` provides dry-run-first LinkedIn/Facebook social
  syndication; live mode requires runtime credentials and is not tied to site
  deployment.
- `.github/workflows/social-publish.yml` can run social syndication manually or
  weekly; it publishes only when GitHub Secrets are configured and otherwise
  records a dry-run artifact.
- `video/plans/community-growth-open-source-ai-workflow-automation.json` is the
  first YouTube/Shorts/LinkedIn-ready video plan. `npm run video:from-post`
  can generate plans from Markdown posts, `npm run video:qa` validates video
  SEO/review metadata, and `npm run video:storyboard` generates storyboards,
  frames, thumbnail candidates, captions, voiceover drafts, manifests, and
  YouTube metadata without credentials.
- `.github/workflows/video-render.yml` is a manual artifact-only render path; it
  installs `ffmpeg` plus `rsvg-convert`, produces MP4 drafts for all variants
  or one selected variant, keeps artifacts for 14 days, and does not upload to
  YouTube.
- `public/robots.txt`, `public/llms.txt`, and `public/llms-full.txt` exist.
- Root project memory files are filtered as non-content by VitePress config.
- `npm run audit:seo` now verifies the built homepage, every blog post,
  sitemap coverage, robots policy, llms files, keyword matrix freshness,
  Flyto2 brand hygiene, `@flyto2.com` email hygiene, manifest source hash, and
  keyword evidence.
- `npm run seo:score` adds a Rank Math-style 100-point scoring gate for every
  built page. It scores technical metadata, focus keyword placement, content
  structure, links/images, and AI visibility signals, writes reports under
  `.seo/reports/`, and fails CI when homepage, page, or site-average thresholds
  are missed.
- `npm run social:check` verifies the social publisher dry-run, required
  channels, environment guards, GitHub Action guardrails, and no committed
  tokens.
- `npm run video:check` verifies video plan shape, canonical links, private or
  unlisted YouTube metadata, licensing notes, platform outputs, thumbnails,
  Flyto2 brand hygiene, email-domain hygiene, and no committed tokens.
- `npm run video:qa` adds release-style checks for long-tail keywords,
  title candidates, Shorts duration, mobile thumbnail density, narration
  drafts, and canonical source links.
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
