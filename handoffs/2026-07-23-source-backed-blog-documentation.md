# 2026-07-23 Source-Backed Blog Documentation Handoff

## Scope

Made the blog's editorial, runtime, SEO, social, video, discovery, and delivery
surfaces traceable to maintained documentation and verified the rendered public
experience at mobile and desktop sizes.

## Documentation Contract

- `docs/documentation-manifest.json` assigns every maintained source area to a
  durable document.
- `scripts/generate-documentation-reference.mjs` uses the TypeScript compiler
  AST and `gray-matter` to generate 12 reference pages.
- The generated inventory covers 520 declarations in 27 source files, all 67
  posts, 27 npm scripts, five workflows, 19 environment inputs, social/video
  plans, template and stock catalogs, and 74 public files.
- `scripts/check-documentation.mjs` rejects generated drift, unowned paths,
  malformed post metadata, dated route guidance, stale module counts, retired
  standalone product naming, and unapproved email domains.
- README, architecture, project memory, posting guidance, contribution
  guidance, social/video guides, and the technical whitepaper now describe the
  implemented contracts and boundaries.

## Public Surface Corrections

- Stable article filenames are documented as `posts/<slug>.md`; publication
  dates remain in frontmatter.
- Internal `docs/**` pages are excluded from the public sitemap and marked
  `noindex`.
- The homepage hero renders visibly before hydration, and its split heading
  produces one correctly spaced H1 string.

## Verification

- `npm run verify`: passed, including 2,675 internal links.
- SEO score: 100 average and 100 lowest across 68 public pages.
- SEO management: 100 with 20 rank targets; npm audit: zero vulnerabilities.
- Strict Flyto2 Indexer: 17/17 checks, 27 source files, 211 scanned symbols,
  and 100% source-reference coverage for documentable symbols.
- Browser checks at 390x844 and 1440x900: homepage and article metadata,
  canonical URLs, H1/H2 structure, immediate hero visibility, table sizing,
  navigation, and document width passed without horizontal overflow.

## External Limits

Local scores cannot prove search ranking, backlinks, clicks, or citations.
Search Console exports and provider-side crawl evidence remain external inputs.
