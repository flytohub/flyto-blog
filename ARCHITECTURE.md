# Architecture

## Runtime And Content

- VitePress compiles `index.md`, `tags.md`, and stable `posts/<slug>.md`
  article paths.
- `.vitepress/config.mts` owns sitemap filtering, canonical links, JSON-LD,
  article metadata, feed discovery, and non-content path handling.
- `.vitepress/seo-contract.ts` consumes the committed Flyto2 i18n SEO contract.
- `.vitepress/theme/` owns the editorial homepage, article heading injection,
  post data loading, and responsive visual treatment.
- `public/` contains covers, diagrams, brand assets, crawler files,
  AI-readable indexes, generated feeds, and the GitHub Pages CNAME.

Project memory, handoffs, workflows, social plans, video plans, and operator
documentation are internal source and must remain excluded from public content
and sitemap output.

## Editorial Flow

`POSTING.md` defines frontmatter. The article slug determines the public route
and canonical URL; publication date belongs in frontmatter. VitePress loads
article metadata into the homepage and injects a visible H1 plus canonical,
OpenGraph, Twitter, article, breadcrumb, and organization schema into each post.

Source audits validate metadata, covers, current Flyto2 facts, approved email
aliases, and cornerstone coverage. SEO scoring reads built HTML rather than
assuming source metadata rendered correctly.

## Discovery And SEO

`scripts/generate-discovery-feeds.mjs` derives RSS, Atom, JSON Feed, image
sitemap, social fallback image, and a source-hashed discovery manifest. The
build regenerates these before VitePress. Separate scripts audit source and
built metadata, score every page, analyze keyword and Search Console evidence,
and validate internal and external links.

## Distribution

- `social/posts/*.json` defines reviewable channel plans.
- `scripts/social-publish.mjs` defaults to dry-run and reaches LinkedIn or
  Facebook only when maintainer-owned runtime credentials are present.
- `video/plans/*.json` defines reviewed scene, SEO, asset, and output contracts.
- Video scripts generate plans, capture public Flyto2 pages, retrieve one
  allowlisted checksum-pinned stock source, synthesize narration, render
  multi-ratio review artifacts, and validate final media.
- Social publication, video rendering, and video upload are separate from site
  deployment. This repository does not contain video upload authority.

## Delivery And Verification

`.github/workflows/deploy.yml` verifies and deploys `.vitepress/dist` to GitHub
Pages. Cloudflare fronts `blog.flyto2.com`. Dedicated workflows run security,
CodeQL, SBOM, SEO/Lighthouse/link checks, review-first social publishing, and
manual video rendering.

`docs/documentation-manifest.json` owns the source-to-document map.
`scripts/generate-documentation-reference.mjs` inventories JavaScript,
TypeScript, Vue script declarations, post frontmatter, automation, distribution
plans, and public assets. `npm run docs:check` rejects drift before release.
