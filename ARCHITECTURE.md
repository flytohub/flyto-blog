# Architecture

Stack:

- VitePress.
- `posts/` contains long-form articles.
- `public/` contains static images, crawler files, and AI-readable indexes.

Important files:

- `.vitepress/config.mts` controls sitemap filtering, canonical links, JSON-LD,
  article metadata, and non-content path handling.
- `POSTING.md` defines article frontmatter.
- `tags.md` organizes topic clusters.
- `public/llms.txt` and `public/llms-full.txt` are AI-readable indexes.

Project memory files are internal and must remain non-content in VitePress.
