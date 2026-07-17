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
└── YYYY-MM-DD-slug.md      # frontmatter + markdown body
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
npm run build
```

## Contributing a post

1. Fork + branch.
2. Add `posts/YYYY-MM-DD-your-slug.md`.
3. Open PR; tag `@flytohub/editors` for review.

Not a team member but want to contribute a guest post? Open a
[Discussion](https://github.com/flytohub/flyto-core/discussions/categories/ideas)
with an outline first.

## Related

- [flyto2.com](https://flyto2.com)
- [flyto-docs](https://github.com/flytohub/flyto-docs) — product documentation (not essays)
- [flyto-landing-page](https://github.com/flytohub/flyto-landing-page)
- [flyto-indexer](https://github.com/flytohub/flyto-indexer) — code intelligence MCP for AI-assisted engineering
