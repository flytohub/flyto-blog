# Flyto2 Blog Technical And Editorial Whitepaper

Status: current public editorial, discovery, and distribution contract. Last reviewed: 2026-07-22.

## Abstract

`flyto-blog` is the educational search surface for Flyto2. It converts common
automation, AI-agent, MCP, CTEM, attack-surface, application-security, data, and
intelligence questions into durable articles that can be read by people,
indexed by search engines, cited by answer engines, and reused in reviewed
social and video distribution.

The repository is intentionally more than a Markdown folder. VitePress builds
the public site; source audits validate editorial metadata and product claims;
discovery generators publish feeds and image indexes; score and management
passes evaluate technical and content signals; social and video pipelines turn
approved plans into review artifacts without putting publishing credentials in
source control.

## Audience And Scope

The site serves operators comparing workflow tools, developers adopting MCP and
browser automation, security teams learning CTEM and attack-path practices,
community contributors, and crawlers looking for stable explanatory sources.
Articles explain intent, tradeoffs, evidence, and next steps. Product pages own
commercial positioning; Docs owns exact installation and API instructions; the
source repositories remain the authority for shipped implementation details.

Articles must not turn roadmap items into available features, claim universal
replacement of a named product, invent benchmarks, imply access to customer
data, or present an SEO score as a guarantee of rank or traffic.

## Site Runtime

VitePress compiles `index.md`, `tags.md`, and `posts/*.md`. The custom theme
loads post metadata for the editorial homepage, injects a visible article H1,
and applies Flyto2 visual styling. `.vitepress/config.mts` owns navigation,
canonical URLs, published-language alternates, social metadata, article schema,
sitemap filtering, and the distinction between public content and internal
project memory.

GitHub Actions builds and deploys `.vitepress/dist` to GitHub Pages for
`blog.flyto2.com`. Cloudflare fronts the public hostname and supplies the
current edge TLS and HTTP-to-HTTPS behavior. Deployment is independent from
social publishing and video rendering.

## Editorial Contract

Every article is a stable `posts/<slug>.md` path. Frontmatter supplies title,
description, publication date, tags, author, and cover. `focusKeyword` and
`relatedKeywords` may override or refine the phrase inferred from the title.
The VitePress route determines the canonical URL; authors do not duplicate that
URL in every file.

The source audit checks metadata length, date shape, author, cover existence,
Flyto2 branding, approved email domains, cornerstone topics, and minimum corpus
size. The generated editorial reference records every article's route, keyword,
tags, word count, H2 count, links, and cover so content additions and removals
remain reviewable.

## SEO, AEO, And GEO

Search visibility is a coordinated contract:

- canonical links, OpenGraph, Twitter cards, article metadata, and JSON-LD;
- `sitemap.xml`, RSS, Atom, JSON Feed, and image sitemap discovery;
- `robots.txt`, `llms.txt`, `llms-full.txt`, and the discovery manifest;
- article focus and related terms, answer-shaped sections, evidence links, and
  internal topic-cluster links;
- Lighthouse, public link checks, score thresholds, and management reports;
- optional Search Console CSV evidence and production crawler-log evidence.

Local scores prove that known technical and editorial checks pass. They do not
prove backlinks, impressions, rankings, clicks, citations, or conversion.
External evidence must be reviewed separately and may change without a source
commit.

## Discovery Generation

`scripts/generate-discovery-feeds.mjs` derives RSS, Atom, JSON Feed, the image
sitemap, fallback social image, and discovery manifest from the article corpus.
Builds regenerate those outputs before VitePress runs. The SEO audit then checks
freshness, sitemap and feed advertisement, crawler policy, social-image
reachability, i18n manifest alignment, and current Flyto2 facts.

## Social Distribution

Social plans under `social/posts/` are public review inputs. The publisher is
dry-run-first and supports LinkedIn and Facebook Page APIs only when
maintainer-owned runtime credentials are present. GitHub Actions can run the
same reviewed plan manually or on schedule, but missing credentials produce a
dry-run artifact rather than an accidental partial publish.

Tokens, account cookies, refresh tokens, private identifiers, and live API
responses do not belong in the repository. Manual community channels remain
editorial checklist items until their own bounded integration is approved.

## Video Production

Video plans define scenes, narration, visual templates, product capture,
licensed human B-roll, captions, thumbnails, SEO metadata, and 16:9, 9:16, and
1:1 outputs. Validation is private-first: YouTube metadata stays private or
unlisted, synthetic narration is disclosed, stock sources are allowlisted and
checksum-pinned, and all generated media remains under ignored `video/dist/`.

The renderer creates deterministic storyboards and can combine responsive
Flyto2 product recordings, original layouts, licensed footage, neural narration,
ambient audio, transitions, burned captions, and per-scene verification frames.
The manual Video Render workflow produces review artifacts; it has no YouTube
upload authority.

## Security And Privacy

Public content and plans contain no customer data or credentials. Approved
public contact aliases use `@flyto2.com`; vulnerability reports use
`security@flyto2.com`. Product capture is restricted to public Flyto2 HTTPS
hosts and does not load browser profiles. Third-party media downloads are
restricted by provider allowlist, content type, size, and checksum.

## Documentation Contract

`docs/documentation-manifest.json` assigns every maintained executable source,
article, distribution plan, workflow, configuration file, and public asset to
durable documentation. `scripts/generate-documentation-reference.mjs` uses the
TypeScript compiler AST for JavaScript, TypeScript, and Vue script blocks, and
uses `gray-matter` for article metadata. `npm run docs:check` rejects ownership
gaps and generated-reference drift before the release build.

## Verification And Limits

`npm run verify` is the local release gate. It checks the documentation
contract, article and social/video inputs, script syntax, the production build,
internal links, SEO surfaces, page scores, and the SEO management report. CI
adds strict Flyto2 Indexer analysis, Lighthouse, external-link checks, secret
and dependency scans, CodeQL, and SBOM generation.

The repository cannot prove that GitHub Pages, Cloudflare, social APIs, search
engines, answer engines, or licensed-media providers are currently available.
Those are live-platform checks. Human review remains required for factual
claims, competitor framing, social publication, and every final video artifact.
