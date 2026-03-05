---
title: Using Flyto2 as an MCP Server
date: 2025-03-05
tags: [tutorial, mcp]
author: Flyto2 Team
---

Learn how to connect flyto-core as an MCP server to Claude Desktop, Cursor, and other MCP-compatible clients.

<!-- more -->

## What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI models to external tools and data sources. flyto-core implements MCP, exposing all 412+ modules as tools that any MCP client can use.

## Setup with Claude Desktop

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "flyto-core": {
      "command": "python3",
      "args": ["-m", "flyto_core.mcp_server"]
    }
  }
}
```

Once connected, you can ask Claude to use any flyto-core module:

> "Encrypt this message with AES-GCM using the key 'my-secret'"

Claude will call the `crypto.encrypt` module and return the result.

## Available Transports

| Transport | Use Case |
|-----------|----------|
| STDIO | Local desktop apps (Claude Desktop, Cursor) |
| Streamable HTTP | Remote servers, cloud deployments |

## What Modules Are Available?

All 412+ modules become MCP tools, organized into 55 categories:

- **Browser** — Navigate, click, type, extract, screenshot
- **Data** — Parse JSON, CSV, XML, YAML
- **Cloud** — AWS S3, Azure Blob, Google Cloud Storage
- **Crypto** — AES encryption, JWT, HMAC
- And [many more](https://docs.flyto2.com/modules/)

## Next Steps

- Browse the full [module reference](https://docs.flyto2.com/modules/)
- Read the [MCP server documentation](https://docs.flyto2.com/mcp/)
- Try [flyto-ai](https://docs.flyto2.com/ai/) for natural language automation
