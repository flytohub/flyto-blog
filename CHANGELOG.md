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
- Added four long-form SEO/AEO/GEO blog posts for AI search visibility,
  zero-person company agents, data workflow automation, and intelligence
  workflow automation.
- Added the new topic clusters and citation guidance to `public/llms.txt` and
  `public/llms-full.txt`.
- Added `npm run audit:seo` to validate built homepage metadata, every blog
  post, sitemap inclusion, robots policy, llms files, keyword evidence, brand
  hygiene, and email-domain hygiene.
- Added a dedicated SEO workflow with local audit, Lighthouse SEO assertions,
  and public-link checks.
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
