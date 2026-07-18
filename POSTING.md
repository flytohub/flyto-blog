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

## Content rules

- **File name**: `posts/YYYY-MM-DD-slug.md` where slug matches the URL path.
- **Excerpt marker**: place `<!-- more -->` after the opening paragraph to control what appears in the index listing.
- **Links**: use root-relative paths (`/tags`) for internal links so they resolve correctly in production.
- **Images**: store in `public/` and reference as `/image-name.ext`.

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
