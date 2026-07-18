# Search Console Data

`npm run seo:manage` can use Google Search Console exports, but it does not
require credentials or call Google APIs. Keep raw exports local; `.gitignore`
excludes CSV and JSON files in this directory.

## queries.csv

Export the Search Console Performance queries table as CSV:

```csv
Query,Clicks,Impressions,CTR,Position
ai workflow automation,12,980,1.22%,11.4
```

## pages.csv

Export the Search Console Performance pages table as CSV:

```csv
Page,Clicks,Impressions,CTR,Position
https://blog.flyto2.com/posts/workflow-automation,8,460,1.73%,9.8
```

## query-pages.csv

Optional combined query/page export:

```csv
Query,Page,Clicks,Impressions,CTR,Position
mcp server automation,https://blog.flyto2.com/posts/mcp-server-guide,3,120,2.5%,8.6
```

## rank-targets.csv

Optional explicit rank targets. If this file is absent, `seo:manage` builds
targets from the keyword matrix.

```csv
Keyword,Page,Target Position,Priority
open source AI agent framework,https://blog.flyto2.com/posts/mcp-server-guide,10,high
```

Set `SEO_MANAGEMENT_REQUIRE_GSC=true` only when CI has these exports available.

## Sitemaps and feeds to submit

Submit or inspect these public discovery files in Google Search Console and
Bing Webmaster Tools after deployment:

- `https://blog.flyto2.com/sitemap.xml`
- `https://blog.flyto2.com/image-sitemap.xml`
- `https://blog.flyto2.com/rss.xml`
- `https://blog.flyto2.com/atom.xml`

`robots.txt` advertises the same files. `feed.json` is kept for RSS readers,
automation, AI citation tooling, and social syndication workflows, but Search
Console does not need a separate JSON Feed submission.
