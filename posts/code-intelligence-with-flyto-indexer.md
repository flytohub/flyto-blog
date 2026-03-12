---
title: Code Intelligence with flyto-indexer
description: How flyto-indexer gives AI agents deep codebase understanding with impact analysis, cross-project references, dead code detection, and code health scoring.
date: 2025-03-05
tags: [tutorial, indexer, mcp]
author: Flyto2 Team
cover: /code-intelligence.svg
---

flyto-indexer is a zero-dependency MCP server that gives AI agents deep understanding of your codebase — impact analysis, cross-project references, and code quality scoring.

<!-- more -->

![Know What Breaks Before You Change It](/code-intelligence.svg)

## The Problem

AI coding assistants are great at writing code, but they don't understand the *blast radius* of their changes. Modifying a shared utility function might break 15 call sites across 3 projects — and the AI has no way to know.

## The Solution

flyto-indexer indexes your codebase and provides 30 MCP tools for code intelligence:

```bash
pip install flyto-indexer
flyto-index scan /path/to/project
```

### Impact Analysis

Before changing any function, check what depends on it:

```
> impact_analysis("flyto-core:src/utils/format.py:function:format_date")

Risk: HIGH
Call sites: 23
Projects affected: 3 (flyto-core, flyto-cloud, flyto-ai)
```

### Dead Code Detection

Find code that nobody calls:

```
> find_dead_code(project="flyto-core", min_lines=10)

Found 12 unreferenced functions (total 340 lines)
```

### Code Health Score

Get a quick quality overview:

```
> code_health_score(project="flyto-core")

Score: 82/100 (Grade: B)
- Complexity: 85/100
- Dead code: 78/100
- Documentation: 80/100
- Modularity: 86/100
```

## Supported Languages

Python (AST-based), TypeScript, JavaScript, Vue, Go, Rust, and Java.

## Get Started

Read the full [flyto-indexer documentation](https://docs.flyto2.com/indexer/) or install it now:

```bash
pip install flyto-indexer
```
