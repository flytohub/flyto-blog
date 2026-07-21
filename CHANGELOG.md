# Changelog

## Unreleased

### Added

- Added the community growth post and social syndication plan for Flyto2
  open-source AI workflow automation.
- Added `scripts/social-publish.mjs`, `npm run social:dry-run`,
  `npm run social:publish`, and `npm run social:check` for review-first
  LinkedIn/Facebook draft and publish flows.
- Added a `Social Publish` GitHub Action for manual or scheduled social
  publishing with dry-run fallback when platform secrets are missing.
- Added an open-source-safe video production starter with video plans,
  storyboard rendering, private-first YouTube metadata, and a manual MP4 render
  workflow.
- Upgraded video production with Markdown-to-plan generation, release-style
  video QA, long-tail keyword fields, thumbnail candidates, narration drafts,
  and 16:9 / 9:16 / 1:1 output variants.
- Upgraded rendered videos with a live public Flyto2 product recording,
  checksum-verified licensed footage of real people, neural narration,
  transitions, generated ambient audio, burned captions, aspect-aware framing,
  and one final-video verification frame per scene and output ratio.
- Added four long-form SEO/AEO/GEO blog posts for AI search visibility,
  zero-person company agents, data workflow automation, and intelligence
  workflow automation.
- Added the new topic clusters and citation guidance to `public/llms.txt` and
  `public/llms-full.txt`.
- Added `npm run audit:seo` to validate built homepage metadata, every blog
  post, sitemap inclusion, robots policy, llms files, keyword evidence, brand
  hygiene, and email-domain hygiene.
- Added `npm run seo:score`, a Rank Math-style page scoring gate with JSON and
  Markdown reports for technical SEO, focus keywords, readability, links/images,
  and AI visibility signals.
- Added `npm run seo:manage`, a Rank Math-style SEO management report for
  keyword gaps, rank targets, optional Search Console CSV opportunities,
  internal links, focus-keyword cannibalization, and editor recommendations.
- Added explicit `focusKeyword` and `relatedKeywords` frontmatter support for
  post-level SEO scoring, then hardened low-scoring posts so the local SEO
  score gate reaches 100 average and 100 lowest score.
- Added deterministic SEO discovery generation for `rss.xml`, `atom.xml`,
  `feed.json`, `image-sitemap.xml`, `discovery-manifest.json`, and a real
  1200x630 `og-image.png` fallback.
- Added Organization/WebSite/Blog/WebPage schema graph coverage, feed
  discovery links, image-sitemap coverage checks, and public social-image
  reachability checks to the SEO audit and score gates.
- Added `.well-known/security.txt` with Flyto2 security contact metadata.
- Added `.env.example` and `.seo/search-console/README.md` to document SEO
  thresholds and safe local Search Console export formats.
- Added a dedicated SEO workflow with local audit, Lighthouse SEO assertions,
  public-link checks, and SEO report artifacts.
- Added project memory files, workflow docs, and handoff registry.
- Added `.seo/i18n-seo-manifest.json`, `.vitepress/seo-contract.ts`, and
  `npm run seo:sync` so blog canonical/hreflang, keyword evidence, and SEO
  audit checks stay aligned with `flyto-i18n`.

### Changed

- Fixed blog reading-time calculation so long posts use Markdown word count
  instead of falling back to `1 min read`.
- Updated VitePress non-content path handling so project memory does not enter
  public sitemap output.
- Updated project state and roadmap to reflect first-pass coverage for Data,
  Zero-person Agent, Big Data / Intelligence, and AI search visibility.
- Injected manifest-derived en/x-default alternates for current English blog
  pages while keeping future localized-post support file-existence based.
