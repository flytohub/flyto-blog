# Contributing a Post

Thank you for writing for the Flyto2 Blog!

## Who can contribute

- **Team members** — merge directly after peer review.
- **Guest posts** — open a [Discussion](https://github.com/flytohub/flyto-core/discussions/categories/ideas) with an outline first; we will invite you to submit a PR once the topic is approved.

## How to submit

1. Fork the repo and create a branch: `post/YYYY-MM-DD-your-slug`.
2. Add `posts/YYYY-MM-DD-your-slug.md` following the schema in [`POSTING.md`](./POSTING.md).
3. Run `npm install && npm run build` locally to confirm the build passes (especially dead-link checking).
4. Open a PR and tag `@flytohub/editors` for review.

## Editorial standards

- Accurate and tested — every command or step should work.
- SEO-friendly title and description (see [`POSTING.md`](./POSTING.md)).
- No competitor brand names in user-facing copy.
- English only (the blog is English-first).

## Review SLA

Team editors aim to review PRs within 3 business days.
