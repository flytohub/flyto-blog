# Posting Guide

This document describes the frontmatter schema every post must include.

## Required fields

```yaml
---
title: "Post title — descriptive and SEO-friendly"
description: "One-sentence summary shown on the index and in social cards (120–160 chars)."
date: YYYY-MM-DD
tags: [tag-1, tag-2, tag-3]    # lowercase-kebab, 2-5 tags
author: "Flyto2 Team"           # or your name for guest posts
cover: /slug.svg                # optional; 1200×630 image in public/
---
```

## Optional fields

| Field | Type | Description |
|-------|------|-------------|
| `cover` | string (path) | Hero image. Place under `public/`. Falls back to the default OG image if omitted. |
| `layout` | `"doc"` | Override the VitePress layout. Rarely needed. |
| `focusKeyword` | string | Preferred SEO focus phrase for `npm run seo:score`; use this when the title is broader than the search phrase. |
| `relatedKeywords` | string[] | Optional supporting long-tail phrases to check in the body. Keep this short and natural. |

## Content rules

- **File name**: `posts/YYYY-MM-DD-slug.md` where slug matches the URL path.
- **Excerpt marker**: place `<!-- more -->` after the opening paragraph to control what appears in the index listing.
- **Links**: use root-relative paths (`/tags`) for internal links so they resolve correctly in production.
- **Images**: store in `public/` and reference as `/image-name.ext`.

## SEO score gate

Every post is scored by `npm run seo:score` after the site builds. Treat it like
a CI version of a WordPress SEO panel:

- Put the focus keyword or long-tail phrase in the title, description, H1, and
  opening paragraph.
- Use `focusKeyword` when the best search phrase is shorter or clearer than the
  post title.
- Use at least three useful H2 sections.
- Add relevant internal links and at least one evidence link when the topic
  benefits from a source.
- Give every image descriptive alt text.
- Keep body copy answer-shaped so search engines and AI answer engines can
  extract the topic, entity, and next step.
- Do not hand-edit `public/rss.xml`, `public/atom.xml`, `public/feed.json`, or
  `public/image-sitemap.xml`; they are generated from post frontmatter by
  `npm run seo:discovery` during `npm run build`.
- Run `npm run seo:manage` after `npm run seo:score` to review keyword gaps,
  internal-link suggestions, rank targets, and Search Console opportunities.
  If Google Search Console CSV exports are unavailable, the report still gives
  local editor recommendations from the score report and keyword matrix.

## Social syndication

When a post should be promoted on LinkedIn, Facebook, GitHub, YouTube, package
pages, or similar channels:

1. Add a plan under `social/posts/<slug>.json`.
2. Keep the blog post as the canonical URL.
3. Run `npm run social:dry-run` and review the JSON payloads.
4. Use the `Social Publish` GitHub Action for reviewed automatic publishing, or
   run live publish locally with maintainer-owned credentials in environment
   variables.
5. Never commit tokens or generated secret-bearing responses.

Supported live environment variables are documented in `social/README.md`.

## Video drafts

When a post should become a YouTube or Shorts draft:

1. Generate a first plan with `npm run video:from-post -- posts/<slug>.md`
   or add a reviewed plan under `video/plans/<slug>.json`.
2. Keep the blog post as the canonical source URL.
3. Run `npm run video:qa`.
4. Run `npm run video:storyboard` for review artifacts, captions,
   thumbnails, voiceover draft, and platform metadata.
5. Use the manual `Video Render` GitHub Action to produce MP4 artifacts for
   all variants or one selected variant.
6. Keep YouTube upload/publish separate from blog deployment and social
   syndication.

Video plan rules live in `video/README.md`.
