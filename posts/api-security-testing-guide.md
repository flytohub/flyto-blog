---
title: "API Security Testing: A Practical How-To Guide"
description: "A practical how-to guide to API security testing: the OWASP API Top 10, finding shadow and zombie APIs, a step-by-step testing approach, and a hardening checklist."
date: 2026-06-10
tags: ["API security","OWASP API","application security","testing"]
author: Flyto2 Team
cover: /blog/api-security-testing-guide.jpg
---

![API Security Testing: A Practical How-To Guide](/blog/api-security-testing-guide.jpg)

APIs are where most of your business logic now lives, and they are where most modern breaches now happen. A web page is a small, curated surface; the API behind it exposes every object, every parameter, and every permission decision your code makes. API security testing is the practice of probing those endpoints the way an attacker would — checking that authentication holds, that one user cannot read another user's data, and that responses do not quietly leak more than the UI ever shows. This guide explains how API security testing works, gives you a repeatable step-by-step approach, walks through the OWASP API Top 10 risks that matter most, and ends with a hardening checklist you can act on.

<!-- more -->

## What API security testing actually is

API security testing evaluates the *behavior* of an endpoint, not just the shape of its responses. Functional tests ask "does this return the right invoice?" Security tests ask "can I return *someone else's* invoice, with no token, with a tampered ID, or with a role I should not have?"

It sits across two familiar techniques:

- **Static analysis (SAST)** reads source code and finds missing authorization checks, hardcoded secrets, and unsafe deserialization before anything ships.
- **Dynamic analysis (DAST)** hits a running API with crafted requests and observes what comes back.

Most real programs need both. Static analysis tells you where the authorization check *should* be; dynamic testing proves whether it actually fires at runtime. For a deeper comparison of where each technique wins and fails, see our overview of [application security testing approaches](/posts/unified-security-scoring-guide).

## The OWASP API Top 10 risks that matter most

The OWASP API Security Top 10 is the standard reference. You do not need to memorize all ten, but three categories cause the overwhelming majority of real-world API incidents.

| Risk | What it looks like | How to test for it |
| --- | --- | --- |
| **BOLA** (Broken Object Level Authorization) | `GET /api/orders/1043` returns *another* tenant's order | Authenticate as user A, request user B's object IDs, confirm a 403/404 |
| **Broken authentication** | Weak JWT validation, no token expiry, guessable reset tokens | Replay expired tokens, strip the signature, swap `alg` to `none` |
| **Excessive data exposure** | API returns `password_hash`, internal flags, full PII; the UI just hides them | Read the raw JSON, not the rendered page — diff fields against what the client uses |

### BOLA: the number-one API risk

BOLA — also called IDOR — is the single most common serious API flaw. It happens when an endpoint authenticates *who you are* but never checks *whether this object belongs to you*. The fix is an authorization check on every object access; the test is to systematically swap identifiers between accounts and watch for data that should be off-limits.

### Broken authentication

Look for tokens that never expire, refresh flows that issue tokens without re-validating the user, and JWTs that accept `none` as an algorithm. Test the *negative* cases: an expired token, a tampered signature, and a token from a deleted account should all fail closed.

### Excessive data exposure (and mass assignment)

Developers often return the full database object and rely on the frontend to display only some fields. An attacker reads the raw response. The mirror image is **mass assignment**: the API blindly binds incoming JSON to a model, so a user can set `"role": "admin"` on a profile-update call. Test by sending extra fields you should not control and checking whether they stick.

## Step-by-step: how to run an API security test

1. **Inventory every endpoint.** You cannot test what you do not know exists. Pull routes from the OpenAPI/Swagger spec, the gateway config, and — critically — from observed traffic, because specs drift.
2. **Find shadow and zombie APIs.** *Shadow* APIs are undocumented endpoints (a forgotten `/v3/internal`, a debug route, a partner integration nobody tracked). *Zombie* APIs are old versions (`/v1`) left running after `/v2` shipped, often without the newer auth checks. These unmanaged endpoints are where attackers concentrate. Discovery means correlating your declared spec against what is actually reachable from the outside.
3. **Map authentication and roles.** Create at least two low-privilege test accounts in different tenants, plus one admin. You need these to prove isolation.
4. **Test authorization (BOLA first).** For every object-scoped endpoint, request another account's IDs. Automate the ID-swapping; humans miss endpoints, scripts do not.
5. **Test authentication edges.** Expired tokens, missing tokens, tampered JWTs, and replayed tokens should all be rejected.
6. **Inspect every response body.** Diff returned fields against what the client consumes. Flag any secret, internal flag, or extra PII.
7. **Probe input handling.** Injection, oversized payloads, and missing rate limits. An API with no rate limit on `/login` is a credential-stuffing target.
8. **Re-test the fixes and record evidence.** A finding is not closed until a regression test proves it stays closed.

## Common mistakes

- **Testing the UI instead of the API.** The browser is a polite client. `curl` and a proxy are not. Always look at raw traffic.
- **Only testing documented endpoints.** Your spec is the *happy path*. The risk lives in the routes nobody documented.
- **Assuming "authenticated" means "authorized."** A valid token is not permission to touch a specific object. BOLA exists precisely in that gap.
- **Ignoring old versions.** Decommission zombie APIs; do not just stop linking to them.
- **One-and-done scans.** APIs change weekly. Untested change is the whole problem.

## Hardening checklist

- [ ] Enforce object-level authorization on **every** endpoint that takes an ID
- [ ] Validate JWTs fully: signature, expiry, issuer, audience — reject `alg: none`
- [ ] Return only the fields the client needs; never serialize the full model
- [ ] Use allow-lists for writable fields to block mass assignment
- [ ] Rate-limit authentication and sensitive endpoints
- [ ] Maintain a live API inventory and reconcile it against runtime traffic
- [ ] Decommission deprecated versions; do not leave zombies running
- [ ] Add a security regression test for every fixed finding

## Where Flyto2 fits

API security fails at the seam between *what is exposed externally* and *what the code actually checks*. Most tools live on one side of that seam.

The Flyto2 Warroom is built to close that loop. Its **external attack surface** discovery enumerates the domains, hosts, and reachable endpoints an attacker can see — the same correlation that surfaces shadow and zombie APIs in our [attack surface management guide](/posts/attack-surface-management-guide). Its **code intelligence** surface maps that exposure back to the routes and authorization logic in your repositories, so a publicly reachable endpoint can be tied to the function that is supposed to guard it. The BYO/MSSP model means you keep the scanners and proxies you already run; the Warroom integrates their output, correlates external findings with internal code, and runs scoring in one closed loop instead of ten disconnected dashboards.

Underneath, the Flyto2 automation engine provides 452 deterministic, replayable modules — so an API probe (authenticate as user A, request user B's object, assert the response code) is captured as evidence and re-runnable as a regression test, not a one-off manual check. If your APIs include MCP servers, the same discipline applies to that newer surface; see [MCP security risks and controls](/posts/mcp-security-risks-and-controls) for the tool-exposure and authorization pitfalls specific to it.

API security testing is not a one-time audit. Inventory, test authorization first, read every response body, and re-test on every change — then wire that loop to your external surface and your code so a finding becomes something you can actually fix and keep fixed.
