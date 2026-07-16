---
title: "Shadow IT Discovery: Find and Manage Unsanctioned Assets"
description: "Shadow IT discovery guide: find unsanctioned SaaS, DNS, certificate transparency, cloud, and SSO assets, triage risk, and govern exposure."
date: 2026-06-10
tags: ["shadow IT","asset discovery","SaaS security","attack surface"]
author: Flyto2 Team
cover: /blog/shadow-it-discovery-guide.jpg
---

![Shadow IT Discovery: Find and Manage Unsanctioned Assets](/blog/shadow-it-discovery-guide.jpg)

Every organization runs more technology than its IT team approved. A marketing manager signs up for an analytics SaaS with a corporate card. An engineer spins up a quick demo box in a personal-looking cloud account. A contractor deploys a staging site on a subdomain nobody documented. None of this is malicious — it is people moving fast — but each one is an asset your security program does not know about, cannot patch, and never put in scope. That is shadow IT, and you cannot defend what you cannot see. Shadow IT discovery is the discipline of systematically finding those unsanctioned assets so you can govern them instead of getting breached through them.

<!-- more -->

## What is shadow IT (and shadow SaaS)?

**Shadow IT** is any hardware, software, cloud resource, or service used inside an organization without the knowledge or approval of the IT and security functions. It spans a wide range: a forgotten VM, an unmanaged laptop, a self-hosted app on an unregistered subdomain, an API key pasted into a third-party tool.

**Shadow SaaS** is the fastest-growing slice of shadow IT: cloud applications adopted directly by teams or individuals — file sharing, note-taking, design tools, AI assistants, CRMs, no-code builders — without procurement, security review, or single sign-on (SSO) enrollment. Because SaaS signup takes thirty seconds and a credit card, shadow SaaS accumulates faster than any inventory process can keep up.

### Why shadow IT keeps growing

- **Friction asymmetry.** Self-service SaaS is instant; the official request-and-review path is slow. People route around the slow path.
- **Decentralized budgets.** Department-level spending lets teams buy tools without central IT ever seeing the invoice.
- **Cloud elasticity.** Anyone with cloud credentials can create assets in minutes — and forget them just as fast.
- **AI tooling.** The wave of AI assistants and agents has put powerful, data-hungry tools one click away, often outside any review.
- **M&A and contractors.** Acquired companies and external partners bring their own undocumented estates.

The result is a steady drift between the assets you *think* you own and the assets that actually carry your name, your data, and your risk.

## Why shadow IT is a security problem

Unsanctioned assets are dangerous precisely because they sit outside your controls:

- **No patching or hardening** — they miss your vulnerability management cycle entirely.
- **No monitoring** — logs do not flow to your SIEM, so compromise goes unnoticed.
- **Data exposure** — sensitive data lands in SaaS tools with no data processing agreement and weak access controls.
- **Credential sprawl** — accounts outside SSO cannot be centrally disabled when someone leaves.
- **Expanded attack surface** — every forgotten subdomain or stale cloud bucket is a candidate entry point an attacker can find as easily as you can.

This is why shadow IT discovery is inseparable from [external attack surface management](/posts/what-is-easm-external-attack-surface-management): the unknown asset and the externally-exposed asset are frequently the same thing.

## Shadow IT discovery techniques

There is no single source of truth for shadow IT, which is exactly the problem. Effective discovery correlates several independent signals so that an asset hidden from one shows up in another.

| Technique | What it finds | Signal source |
|---|---|---|
| DNS enumeration | Subdomains, forgotten hosts, dev/staging sites | Passive DNS, zone data, brute-force resolution |
| Certificate transparency | Hostnames issued TLS certs, including internal-sounding names | Public CT logs (crt.sh and similar) |
| Cloud asset enumeration | VMs, buckets, functions, load balancers across accounts | Cloud provider APIs, org-level inventory |
| SSO and IdP logs | SaaS apps users actually authenticate to | Identity provider sign-in logs, OAuth grants |
| Expense and SaaS management | Tools purchased on cards or subscriptions | Finance/expense data, SaaS management platforms |
| Network and proxy logs | Outbound traffic to unsanctioned SaaS domains | Egress proxy, DNS resolver, CASB telemetry |
| WHOIS and IP ownership | Domains and netblocks registered to the org | Registrar and RIR data |

### 1. DNS and subdomain discovery

Start from the domains you know and expand outward. Passive DNS, brute-forced subdomain resolution, and registrar data surface hosts like `legacy-app.example.com` or `vendor-portal.example.com` that no team remembers standing up. Forgotten subdomains pointing at de-provisioned cloud resources are also a classic subdomain-takeover risk.

### 2. Certificate transparency logs

Every public TLS certificate is logged to certificate transparency (CT) logs. Searching CT for your domains often reveals internal-sounding hostnames — `jira-test`, `vpn-old`, `s3-backup` — that someone exposed to the internet just long enough to get a cert. CT is one of the highest-signal, lowest-noise discovery sources available.

### 3. Cloud asset enumeration

Shadow IT loves cloud. Enumerating resources across all linked accounts — not just the "official" ones — exposes orphaned instances, public storage buckets, and one-off projects. Pair this with billing data: an unexpected charge is often the first trace of a shadow account.

### 4. SSO, IdP, and OAuth logs

Your identity provider sees what people actually use. Sign-in logs and OAuth grant records reveal SaaS apps in active use that never went through procurement. An employee granting a third-party app broad access to corporate mail or files is shadow SaaS in its riskiest form.

### 5. Egress and SaaS management signals

Outbound DNS and proxy logs show which SaaS domains your network talks to. Cross-referenced with expense data, this turns "we think we use ~40 SaaS tools" into a real, evidence-backed list — frequently several times larger than expected.

## Triage: not all shadow IT is equal

Discovery produces a list. Triage turns the list into action. Score each unsanctioned asset on a few practical axes:

1. **Exposure** — Is it reachable from the internet? Externally-exposed shadow assets jump the queue.
2. **Data sensitivity** — Does it hold customer data, credentials, or regulated information?
3. **Authentication posture** — Is it behind SSO and MFA, or a standalone password?
4. **Ownership clarity** — Can you identify an owner, or is it fully orphaned?
5. **Business criticality** — Is it load-bearing for a real workflow, or abandoned?

A reasonable order of operations: **externally-exposed + sensitive data + no MFA** is a fire to put out today; an internal, owned, low-data tool can be brought into governance on a normal cadence.

## Common mistakes

- **Treating discovery as one-time.** Shadow IT regrows the moment you stop looking. Discovery must be continuous, not an annual audit.
- **Relying on a single signal.** DNS-only or SSO-only misses huge categories. Correlate sources.
- **Blocking instead of governing.** Aggressively killing tools people rely on just pushes shadow IT further underground. Sanction the good ones; retire the rest.
- **No ownership assignment.** An asset without an owner never gets fixed. Attribution is the bridge from discovery to remediation.
- **Ignoring de-provisioning.** Offboarding that does not revoke shadow SaaS accounts leaves credentials live for ex-employees.

## A shadow IT governance checklist

- [ ] Maintain an authoritative asset inventory as the baseline for "known good."
- [ ] Run continuous external discovery (DNS, CT, cloud) — not periodic snapshots.
- [ ] Pull SSO/IdP sign-in and OAuth logs to surface shadow SaaS.
- [ ] Correlate finance/expense data against your sanctioned SaaS list.
- [ ] Triage every new asset by exposure, data sensitivity, and auth posture.
- [ ] Assign an owner to each discovered asset before closing the loop.
- [ ] Decide per asset: **sanction** (bring under SSO + monitoring), **migrate**, or **retire**.
- [ ] Feed confirmed assets back into the inventory so the baseline stays current.
- [ ] Wire de-provisioning so offboarding revokes shadow accounts too.

## Where Flyto2 fits

Shadow IT discovery only works when the signals live in one loop instead of seven disconnected tools. The Flyto2 Warroom treats the **asset map** as the authoritative inventory and the **external attack surface / CTEM** surface as continuous discovery — DNS enumeration, certificate transparency, and cloud enumeration run on a schedule, and every newly-found host is reconciled against what you already own. New, unattributed assets stand out precisely because the known set is deterministic. From there, ownership gating assigns each find to a real owner, and the same correlated view feeds risk scoring — so an externally-exposed, unsanctioned host does not just appear in a list, it changes your score.

Because Flyto2 is built on the same deterministic, evidence-and-replay automation engine (451 modules, MCP-native), each discovery step is reproducible: the DNS lookup, the CT query, the cloud enumeration all produce evidence you can re-run, not a black-box verdict. And the BYO/MSSP model means you can bring the discovery tools and SaaS management data you already pay for, supplement the gaps, and run correlation in one closed loop instead of paying again to re-scan from scratch.

For the foundations underneath this workflow, see [asset inventory as a security primitive](/posts/asset-inventory-security) and the broader [attack surface management guide](/posts/attack-surface-management-guide). Shadow IT discovery is not a separate project — it is what asset inventory and attack surface management look like when you take them seriously and keep them running.
