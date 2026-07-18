# SEO discovery surfaces

Date: 2026-07-18

## Scope

Closed the remaining practical discovery gaps in `flyto-blog` after the
Rank Math-style score and management gates were already passing.

## Added

- `scripts/generate-discovery-feeds.mjs`
  - Generates `public/rss.xml`.
  - Generates `public/atom.xml`.
  - Generates `public/feed.json`.
  - Generates `public/image-sitemap.xml`.
  - Generates `public/discovery-manifest.json`.
  - Generates a deterministic 1200x630 `public/og-image.png` fallback.
- `npm run seo:discovery`
- `npm run build` now runs `seo:discovery` before `vitepress build`.
- `public/.well-known/security.txt`
- `robots.txt` advertises:
  - `https://blog.flyto2.com/sitemap.xml`
  - `https://blog.flyto2.com/image-sitemap.xml`
  - `https://blog.flyto2.com/rss.xml`
  - `https://blog.flyto2.com/atom.xml`

## SEO gates

- `audit:seo` now verifies discovery files, feed item coverage, image sitemap
  coverage, `.well-known/security.txt`, feed alternate links, schema graph
  types, and public social-image asset reachability.
- `seo:score` now scores feed discovery links, schema graph depth, reachable
  social images, and image sitemap coverage.
- `seo:manage` now includes discovery file health in the management score.

## Verification

Latest local checks:

```text
npm run verify
npx @lhci/cli@0.15.1 autorun --config=./lighthouserc.cjs
npm run links:external -- .external-links.txt
flyto-indexer task validate --run-tests=false
flyto-indexer verify --full-scan
flyto-indexer scan_secrets
```

Current local SEO result:

```text
SEO score gate: average 100, lowest 100, pages 68
SEO management gate: score 100, recommendations 16, rank targets 20
Internal links checked: 2294
External manifest: 80 clean URLs
Secret scan: 0 findings
```

## Notes

- Do not hand-edit generated discovery files. Edit post frontmatter/body and
  run `npm run seo:discovery` or `npm run build`.
- Google Search Central still does not guarantee ranking from structured data,
  feeds, or sitemaps. These surfaces help discovery, understanding, and
  maintainability; real ranking work still depends on Search Console data,
  click-through rate, useful content, and legitimate external mentions.
