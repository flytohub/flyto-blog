<h1 align="center">Flyto Blog</h1>

<p align="center">
  <b>Engineering notes, release stories, and showcases from the Flyto team.</b>
</p>

<p align="center">
  <a href="https://flyto2.com/blog">📰 Read online</a>
</p>

---

## What lives here

Long-form writing that doesn't belong inside a product README:

- **Release stories** — "v2.x shipped; here's what changed and why"
- **Engineering deep dives** — design decisions, migration stories
- **Showcase posts** — real automations customers have built
- **Post-mortems** — incident reports with blameless root-cause
- **Community spotlights** — plugin and template authors

## Format

```
posts/
└── YYYY-MM-DD-slug.md      # frontmatter + markdown body
```

Frontmatter schema lives in [`POSTING.md`](./POSTING.md) (or
[`CONTRIBUTING.md`](./CONTRIBUTING.md) if you're writing a post).

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
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
