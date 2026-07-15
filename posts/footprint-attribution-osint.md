---
title: "Footprint & Attribution: Mapping Assets to Owners Without Guessing"
description: A practical guide to digital footprint discovery and attribution — how an attribution graph expands from a handful of seeds, how ownership gating and de-correlated confidence keep it honest, and why "is this actually mine?" is the question that makes every downstream security score trustworthy.
date: 2026-06-10
tags: [security, footprint, osint]
author: Flyto2 Team
cover: /security/attack-surface-management.jpg
---

Your organization's digital footprint is bigger than your asset inventory says it is. Domains registered by a team that left two reorgs ago, a marketing microsite on someone else's hosting, a forgotten subdomain still pointing at a decommissioned vendor, an open-source repo that leaks an internal hostname — these are all part of what an attacker sees, and none of them are in your CMDB. Footprint discovery finds them. **Attribution** answers the harder question that comes next: of everything we found, what is actually *yours* — and how sure are we?

<!-- more -->

That second question is where most OSINT and footprint tooling quietly fails. It is tempting to call a name-similar host yours because the name matches, or because three feeds "agree." Both shortcuts produce a footprint that looks impressive and is wrong — and a wrong footprint poisons everything downstream, because every exposure score, every pentest target, and every unified risk number is computed over the assets you claimed. This post explains how footprint discovery and attribution work when they are built to be honest: generous recall, strict ownership, and confidence that has to be *earned* by independent evidence rather than laundered through a source count.

## Footprint discovery: from seeds to a graph

Footprint discovery starts from a deliberately small set of seeds — a root domain, an organization name, a GitHub handle — and expands outward. Each expansion round pulls from a different class of source and materializes new candidate entities and the relationships between them:

| Source class | What it surfaces |
|--------------|------------------|
| Passive DNS | Historically-resolved subdomains and hostnames |
| Certificate transparency | Hostnames that appear in issued TLS certificates |
| Live DNS | Current resolution, mail records, delegation |
| Website crawl | Linked properties, technologies, third-party includes |
| Repository extraction | Hostnames, services, and vendors leaked in code |

The output is not a flat list — it is a **graph**. Entities are typed (`domain`, `subdomain`, `ip`, `asn`, `vendor`, `technology`, `document`, `news_mention`, `app`) and connected by typed edges (`subdomain_of`, `resolves_to`, `in_asn`, and so on). Modeling footprint as a graph rather than a spreadsheet matters because attribution is a *path* problem: a host two hops from your seed through a confirmed subdomain and a confirmed IP is a very different claim than a host that shares only an ASN with you. You cannot reason about that difference without the edges.

In the Flyto2 war-room, this is the **Footprint / attribution** surface. It renders the org's footprint as a layered graph — seed at the origin, depth-1 entities on the first shell, and so on outward — lighting up entities by what moved (`newly_exposed`, `recently_changed`, `stale`) so an operator sees *change*, not a static re-read of inventory. The graph is fetched under the `footprint-graph` query key and stays live without polling: when an expansion run finishes, the engine emits `footprint.run.finalized`, which invalidates the view so it reflects the completed run the moment it lands.

## Attribution: the part everyone gets wrong

Discovery gives you recall — the broad set of things that *might* be connected to you. Attribution is precision — deciding which of those things you can honestly call your own. Keeping these two separate is the whole game, because the failure modes of footprint products are all collapses of that separation. There are three classic ones, and a footprint surface worth trusting pins each of them shut as an invariant rather than a best-effort heuristic.

### 1. Ownership gating: finding is not owning

The engine will happily *find* a name-similar host, a look-alike domain, or a third-party vendor surface — finding is cheap, and broad recall is what you want. But any finding that **asserts the entity is one of your own assets** has to pass an ownership gate first.

The distinction is concrete. A look-alike phishing domain (`acme-login.example` when you are `acme.example`) is a real, relevant finding — it flows through the war-room as an *external threat*, surfaced to the darkweb and exposure surfaces that should see it. What it never does is get labeled as one of your assets. A finding that claims a host is part of *your* attack surface will not fire without ownership evidence, and a malformed or connector-injected ownership-shaped claim cannot bypass the final organization-root attribution check. The same asset-inventory gate is applied uniformly, so a stale inventory row or a buggy connector can never silently re-label someone else's infrastructure as yours. Over-claiming ownership feels generous — "look how much we found!" — but it is the single most damaging thing a footprint tool can do, because it pollutes the asset map and inflates exposure numbers with hosts you do not control.

### 2. No confidence laundering via source count

Here is the subtle one. The intuitive way to compute confidence is to count how many sources agree: five feeds say this subdomain is yours, so confidence is high. That intuition is **wrong**, and acting on it is what we call *confidence laundering*.

The problem is correlation. Several "different" passive-DNS providers often resell the same underlying data, and a single certificate-transparency record can produce both a "subdomain of seed" signal and an "SSL SAN includes" signal — two rows, one source. If you count rows, you let the same piece of evidence vote multiple times under different names, and a single weak signal launders itself up to a confirmed tier.

The honest approach counts **independence classes, not raw rows**. Passive-DNS feeds collapse into one `passive_dns` class no matter how many vendors resold them; CT-log walkers collapse into one `ct` class; live DNS into `live_dns`. Three rows from the same underlying signal are *one* corroboration, not three — the difference between "five independent sources confirm this" and "we read the same cache five times." Only the former should ever move confidence toward confirmed.

### 3. IP and ASN adjacency is not ownership

Sharing an IP, a subnet, or an ASN with you is **not** ownership. In a cloud world, thousands of unrelated tenants share IPs behind the same load balancer and live in the same provider ASN. Promoting a host to "yours" because it co-tenants on a cloud IP would attribute half the internet to you.

The graph still models `ip` and `asn` as first-class entities with `resolves_to` and `in_asn` edges — precisely so an analyst can *see* shared-hosting and shared-ASN relationships and reason about them. But adjacency is *context for the human*, never a backdoor to ownership. To become an owned asset, a host has to clear the same attribution gate as everything else; sitting next to you in IP space buys it nothing.

The throughline across all three: **recall is generous, attribution is strict, and confidence is earned by independent evidence.** Every entity carries its source set and its ownership decision, so the graph is replayable and auditable — not a black-box "trust me."

## Why honest attribution is load-bearing

Footprint is the **attribution authority** for everything else. The invariants above matter so much because "this host is yours" gets decided *once*, in footprint, and then every other surface trusts that decision:

- **Asset map.** Confirmed, owned entities promote into the asset map as inventoried assets — already ownership-gated, so the inventory never inherits an unowned host. Bring your own asset list and footprint reconciles against it; what you lack, it discovers and supplements.
- **Pentest targets.** Owned, reachable hosts become candidate pentest targets. Footprint decides *what is worth testing*; pentest and red-team simulation decide *whether it actually breaks*.
- **Exposure / CTEM.** Footprint findings feed the external attack surface, where ownership-asserting issues respect the very same gate.
- **Unified score.** Because attribution is honest, the unified risk score is computed over assets that are genuinely yours — no phantom hosts inflating or deflating the number.

If footprint over-claimed ownership, every one of those downstream numbers would be quietly wrong. Honest attribution is what makes the rest of the war-room worth trusting.

## The BYO angle: reconcile, don't re-buy

This is also where the MSSP / bring-your-own model becomes concrete. The first thing you do on entry is **integrate the assets and tools you already own** — your existing inventory, your DNS, your registrar data — then **ingest external discovery to fill the gaps**, then **run attribution on the combined picture**. Footprint is the reconciliation point: your authoritative asset list and the discovered footprint meet in one attributed graph, the discovered-but-unowned noise gets gated out, and what survives is a graph you can act on.

You should not have to re-buy an attribution engine to get this. You bring the assets you already track; the surface supplements what you are missing and runs the correlation and scoring on the union. We charge for the **integration and the closed loop** — not for re-running attribution you could have run yourself — because the *honest, gated, de-correlated* graph is what makes everything downstream worth trusting.

And it is the same execution substrate throughout. The deterministic engine that powers our automation product line ([flyto-core](https://docs.flyto2.com/): 451 deterministic modules, MCP-native, YAML recipes, evidence and replay) is literally what runs the footprint expansion, collects the per-entity evidence, and drives the downstream pentest and red-team. Automation is the *how*; the war-room is the *what and why*.

## Where to go next

A footprint stops being a pile of OSINT trivia the moment attribution is honest: discovery is generous, ownership is gated, confidence is de-correlated, and the result is one graph every other surface can trust.

- Read the full [Footprint & Attribution surface docs](https://docs.flyto2.com/warroom/surfaces/footprint-attribution) — routes, the `footprint-graph` query key, the `footprint.run.finalized` event, and the `footprint-full-loop.yaml` recipe, end to end.
- See where confirmed entities land in the [Attack Surface Management guide](/posts/attack-surface-management-guide).
- Understand how darkweb leaks seed the footprint graph in [Darkweb Monitoring Explained](/posts/darkweb-monitoring-explained).
- Learn how honest attribution feeds one number in the [Scoring Methodology](https://docs.flyto2.com/warroom/scoring-methodology).
