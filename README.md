<h1 align="center">Flyto2 Blog</h1>

<p align="center">
  <b>Plain-language guides for AI workflow automation, MCP server automation, CTEM, and practical Flyto2 engineering.</b>
</p>

<p align="center">
  <a href="https://blog.flyto2.com">Read online</a>
  · <a href="https://flyto2.com">Website</a>
  · <a href="https://docs.flyto2.com">Docs</a>
  · <a href="https://github.com/flytohub/flyto-core">Open source</a>
</p>

---

## What lives here

Long-form writing that answers the questions people actually search for before
they read the docs. Flyto2 Blog is the public editorial surface for AI workflow
automation tools, open-source AI agent frameworks, MCP server automation,
continuous threat exposure management, attack surface management, browser
automation, no-code API integration, email parsing automation, SEO/GEO/AEO, and
engineering release notes.

The voice should be practical and conversational: explain the problem, show the
tradeoff, give a concrete Flyto2 path, then link to the docs only when the
reader is ready to implement.

- **Release stories** — "v2.x shipped; here's what changed and why"
- **Engineering deep dives** — design decisions, migration stories
- **Showcase posts** — real automations customers have built
- **SEO/AEO/GEO guides** — AI search visibility, crawler logs, and answer-shaped
  technical content
- **Long-tail explainers** — "what is AI workflow automation", "open source AI
  agent framework", "MCP server automation", "n8n alternative", "Zapier
  alternative", "Make alternative", "Playwright alternative", "LangGraph
  alternative", and comparison-style posts
- **Product-line education** — automation, security, Data, Zero-person Company
  Agent, and Big Data / Intelligence workflows
- **Post-mortems** — incident reports with blameless root-cause
- **Community spotlights** — plugin and template authors

## Format

```
posts/
└── stable-kebab-slug.md    # frontmatter + markdown body
```

Frontmatter schema lives in [`POSTING.md`](./POSTING.md) (or
[`CONTRIBUTING.md`](./CONTRIBUTING.md) if you're writing a post).

## API / Content Model

Each post is a Markdown file with frontmatter metadata for title, summary,
date, category, tags, canonical URL, and publication status. Treat posts as a
public content API: landing pages, docs, social previews, AI answer engines,
and search crawlers all depend on stable titles, summaries, canonical links,
and long-tail keyword phrasing.

## Configuration

Keep public links canonical:

- Product pages use `https://flyto2.com`.
- Technical docs use `https://docs.flyto2.com`.
- Blog articles use `https://blog.flyto2.com`.
- Security contact uses `security@flyto2.com`.

## Install

```bash
npm install
```

## Usage

```bash
npm run dev        # http://localhost:3000
npm run build
```

## Testing

Run the production build before publishing public content:

```bash
npm run verify
```

`npm run verify` includes a Rank Math-style SEO score gate after the static
build. It scores every built page from 0-100 across technical metadata, focus
keyword placement, content structure, links/images, and AI visibility signals.
Reports are written to `.seo/reports/seo-score.json` and
`.seo/reports/seo-score.md`. CI fails when the homepage, any post, or the site
average falls below the configured thresholds.

The verification loop begins with `npm run docs:check`, which requires every
maintained executable source, article, workflow, configuration input,
distribution plan, and public asset to have a documentation owner and rejects
stale generated references. Regenerate with `npm run docs:reference`.

`npm run verify` also runs `npm run seo:manage`. That management pass creates
`.seo/reports/seo-management.json` and `.seo/reports/seo-management.md` with
rank targets, keyword gaps, internal-link suggestions, Search Console
opportunities when CSV exports are present, and editor recommendations for the
next content pass. Raw Search Console CSV files stay local under
`.seo/search-console/` and are ignored by Git.

`npm run build` runs `npm run seo:discovery` before VitePress. That generator
keeps public discovery surfaces in sync with Markdown posts: `rss.xml`,
`atom.xml`, `feed.json`, `image-sitemap.xml`, `discovery-manifest.json`, and a
real `og-image.png` fallback for social previews. `npm run audit:seo` fails if
these files are missing, stale, or not advertised from page metadata and
`robots.txt`.

For social drafts, run:

```bash
npm run social:dry-run
```

The `Social Publish` GitHub Action can publish approved plans to LinkedIn and a
Facebook Page once the maintainer-owned secrets are configured. Without those
secrets, the action records a dry-run artifact instead of failing or posting.

For YouTube/video drafts, run:

```bash
npm run video:from-post -- posts/community-growth-open-source-ai-workflow-automation.md --out video/plans/community-growth-open-source-ai-workflow-automation.json --force
npm run video:check
npm run video:qa
npm run video:storyboard
```

The manual `Video Render` GitHub Action installs render tools, turns a reviewed
plan under `video/plans/` into YouTube 16:9, Shorts 9:16, and LinkedIn 1:1 MP4
artifacts, and never reads YouTube tokens. Use its `variant` input to render
one output instead of all outputs.

## Contributing a post

1. Fork + branch.
2. Add `posts/your-stable-kebab-slug.md`; keep the publication date in
   frontmatter so the public URL does not change when editorial dates change.
3. If the post should be promoted, add or update a plan under `social/posts/`
   and verify it with `npm run social:check`.
4. If the post should become a video, generate or update a plan under
   `video/plans/` and verify it with `npm run video:qa`.
5. Open PR; tag `@flytohub/editors` for review.

Not a team member but want to contribute a guest post? Open a
[Discussion](https://github.com/flytohub/flyto-core/discussions/categories/ideas)
with an outline first.

## Related

- [flyto2.com](https://flyto2.com)
- [flyto-docs](https://github.com/flytohub/flyto-docs) — product documentation (not essays)
- [flyto-landing-page](https://github.com/flytohub/flyto-landing-page)
- [flyto-indexer](https://github.com/flytohub/flyto-indexer) — code intelligence MCP for AI-assisted engineering
- [Flyto2 community hub](https://flyto2.com/community/)

## Documentation

- [Technical and editorial whitepaper](./docs/WHITEPAPER.md)
- [Generated source and content reference](./docs/reference/README.md)
- [Posting contract](./POSTING.md)
- [Social distribution](./social/README.md)
- [Video production](./video/README.md)
