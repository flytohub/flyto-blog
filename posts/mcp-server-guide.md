---
title: "Using Flyto2 as an MCP Server"
description: "Step-by-step guide to connecting flyto-core as an MCP server to Claude Desktop, Cursor, and other MCP-compatible AI clients, with security notes for tool-surface control."
date: 2025-03-05
tags: [tutorial, mcp, agent security]
author: Flyto2 Team
cover: /mcp-server.svg
---

Flyto2 can expose deterministic workflow modules through the Model Context Protocol (MCP). That means an MCP-compatible client can call Flyto2 tools for browser automation, HTTP requests, file operations, data transforms, validation, reporting, and other workflow steps.

<!-- more -->

![451 Modules as MCP Tools](/mcp-server.svg)

## What is MCP?

The Model Context Protocol is an open protocol for connecting AI models to external tools and data sources. Instead of a model only producing text, an MCP client can ask a server to run a tool with structured arguments and return a structured result.

The canonical protocol reference is the [Model Context Protocol specification](https://modelcontextprotocol.io/specification/2025-06-18), and the [MCP tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) defines how servers expose callable functions, schemas, results, and tool-safety expectations.

That tool boundary is powerful. It is also a security boundary. Once an AI client can call tools, the question becomes: what can those tools read, write, execute, and mutate?

Flyto2's MCP support is useful because it exposes deterministic modules rather than opaque actions. A module has a name, parameters, output shape, and operational behavior. That makes tool use easier to inspect, test, and govern.

## Basic setup

Install the Flyto2 core package in the Python environment used by your MCP client:

```bash
pip install flyto-core
```

Then add an MCP server entry to your client configuration. A local STDIO configuration typically looks like this:

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

After restarting the client, the Flyto2 MCP server should expose its modules as callable tools.

## STDIO vs Streamable HTTP

Flyto2 supports local and remote operating models:

| Transport | Use case |
|-----------|----------|
| STDIO | Local desktop clients such as Claude Desktop, Cursor, or other workstation-based clients |
| Streamable HTTP | Remote deployments, service environments, or hosted tool surfaces |

STDIO is usually the right first step because it keeps the server local and simple. Streamable HTTP is better when teams need shared infrastructure, remote execution, or service-to-service integration. The security posture is different for each transport, so do not treat them as interchangeable.

## What modules become tools?

Flyto2 modules cover workflow categories such as:

- browser automation: launch, navigate, click, type, extract, wait, screenshot
- HTTP and API operations
- file operations and document handling
- JSON, CSV, text, and data transformation
- crypto and hashing utilities
- validation and testing helpers
- queues, notifications, storage, and cloud operations

The exact module catalog depends on the installed Flyto2 version and any enabled extensions. The [module reference](https://docs.flyto2.com/modules/) is the best place to inspect available modules.

## Security checklist for MCP tool surfaces

MCP turns tool access into an agent-accessible surface, so treat setup like a security review rather than a convenience toggle.

Before exposing tools broadly, check:

- Which modules are enabled?
- Can any tool execute shell commands, read arbitrary files, write files, call external APIs, or mutate state?
- Are credentials stored in an appropriate secret store?
- Are tool calls logged without leaking secrets?
- Is network access expected and bounded?
- Is the server bound locally, internally, or publicly?
- Do users understand which workspace or project the tools can access?

These questions are the same reason Flyto2 treats MCP security as a war room surface. Agent tools, code risk, API exposure, cloud posture, and validation evidence belong in one security picture.

## Example workflow

After connecting the server, a user can ask an MCP client to run a workflow through Flyto2 modules:

```text
Open this page, extract the pricing table, normalize it to JSON, and save a report.
```

The client can call browser and data modules in sequence. A deterministic tool call is preferable to hidden browser automation because the steps can be inspected, logged, replayed, and validated.

For security teams, the same mechanism can support controlled validation workflows:

- open a staging target
- check a route or form behavior
- capture evidence
- compare a response against a baseline
- export a small report

That pattern is useful when a finding needs proof before it becomes remediation work.

## Common mistakes

The most common mistake is exposing too many tools too quickly. Start with the smallest module set that supports the workflow. Add file, shell, browser, API, or mutation-capable tools only when the use case requires them.

Another mistake is treating MCP as separate from application security. If an agent can call an API route or trigger a workflow, that path should be part of the same risk model as code, identity, cloud, and external exposure.

Finally, avoid storing credentials directly in client configuration files. Keep secrets in the appropriate vault or environment mechanism and make sure logs do not print raw values.

## Next steps

- Read the [MCP specification](https://modelcontextprotocol.io/specification/2025-06-18)
- Review the [MCP tools model](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- Browse the [module reference](https://docs.flyto2.com/modules/)
- Read the [MCP server documentation](https://docs.flyto2.com/mcp/)
- Review [MCP security in Warroom](https://docs.flyto2.com/warroom/surfaces/mcp-security)
- Read [AI Security Platform Guide](/posts/ai-security-platform-guide)
- Try [flyto-indexer for code intelligence](/posts/code-intelligence-with-flyto-indexer)

MCP is most useful when tools are powerful enough to perform real work and constrained enough to remain auditable. Flyto2's role is to keep those tool calls deterministic, inspectable, and connected to the evidence trail security teams need.
