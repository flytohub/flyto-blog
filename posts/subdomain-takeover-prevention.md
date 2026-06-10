---
title: "Subdomain Takeover: How It Works and How to Prevent It"
description: "Subdomain takeover explained — how dangling DNS records and deprovisioned services let attackers hijack your subdomains, how to detect them, and a prevention checklist."
date: 2026-06-10
tags: ["subdomain takeover","DNS security","attack surface","misconfiguration"]
author: Flyto2 Team
cover: /blog/subdomain-takeover-prevention.jpg
---

![Subdomain Takeover: How It Works and How to Prevent It](/blog/subdomain-takeover-prevention.jpg)

A subdomain takeover happens when an attacker gains control of one of your subdomains — say `status.example.com` or `blog.example.com` — without ever touching your servers or your DNS provider. They do it by claiming a third-party resource your DNS still points to but that you no longer own. The DNS record outlived the service it referenced, leaving a "dangling" pointer that anyone can re-register and fill with their own content. The result: a fully trusted subdomain of your brand, serving an attacker's payload over your own name and often your own TLS reputation.

<!-- more -->

## What a subdomain takeover actually is

Most takeovers come down to one root cause: a **dangling DNS record**. Your DNS zone contains a record — usually a `CNAME`, sometimes an `A`, `NS`, or `MX` — that points to a resource on an external platform. At some point that resource gets deleted, the project is decommissioned, or the trial expires. The cloud service releases the underlying hostname or endpoint back into its pool. But the DNS record in your zone is never cleaned up. It still resolves, still points outward, and now points at something that is up for grabs.

An attacker who can re-register that target resource — create a GitHub Pages site with the same name, claim the freed S3 bucket, spin up a Heroku app, register the Fastly or Azure hostname — instantly inherits every request that resolves through your subdomain.

## How the attack works, step by step

1. **Enumerate subdomains.** The attacker pulls your subdomains from certificate transparency logs, passive DNS, and brute-force wordlists. This is cheap, fast, and entirely external.
2. **Resolve and fingerprint.** For each subdomain they follow the `CNAME` chain and look at what answers. They are hunting for service-specific error pages — "There isn't a GitHub Pages site here," "NoSuchBucket," "no such app" from a PaaS — that signal the target is unclaimed.
3. **Confirm the dangle.** A telltale fingerprint plus a target they are allowed to register equals a confirmed takeover candidate.
4. **Claim the resource.** They register the freed bucket name, create the Pages repo, or provision the app endpoint that your `CNAME` already points to.
5. **Serve content under your name.** Now `subdomain.example.com` loads their content. Because the browser sees a legitimate subdomain of your domain, every trust signal works in the attacker's favor.

## Why it matters: the real impact

A hijacked subdomain is not a cosmetic problem. Because it carries your domain's identity, it enables abuse that a lookalike domain never could:

| Impact | Why the takeover enables it |
| --- | --- |
| Phishing / credential theft | Victims see a genuine subdomain of your brand and trust the login form |
| Cookie theft / session hijacking | Cookies scoped to `.example.com` are sent to the attacker's subdomain |
| OAuth / SSO abuse | Redirect URIs or trusted origins on `*.example.com` can be weaponized |
| Content Security Policy bypass | If your CSP allows `*.example.com`, attacker scripts load on your real app |
| Malware & SEO poisoning | Reputable domain hosts malicious downloads or spam, harming reputation |
| Brand & trust damage | Defacement or fraud appears to come from you directly |

The danger scales with how permissive your other controls are. Wildcard cookies, wildcard CSP, and wildcard SSO origins all turn a "minor" marketing subdomain into a foothold against your core application.

## How to detect dangling records

Detection is mostly about systematically asking, for every record you publish, "does the thing this points to still exist and still belong to me?"

- **Inventory every DNS record**, not just the ones in your head. Export full zones from every DNS provider you use — takeovers love forgotten zones.
- **Resolve each record and follow the chain.** For `CNAME`s, walk to the final target. For `NS` and `MX`, confirm the delegated provider is still yours.
- **Fingerprint the response.** Compare the body against known "unclaimed service" signatures (GitHub Pages, S3, Azure, Heroku, Fastly, Shopify, Zendesk, and dozens more). A 404 from the platform's claim page is the strongest signal.
- **Watch certificate transparency logs.** New certs issued for your domains can surface subdomains you forgot you owned.
- **Re-check continuously.** A record that was safe last quarter becomes vulnerable the moment the backing service is deprovisioned. Point-in-time scans miss this; only continuous monitoring catches the window between deprovisioning and exploitation.

This is exactly the problem that [external attack surface management](/posts/what-is-easm-external-attack-surface-management) is built to solve — discovering assets from the outside in and re-checking them on a schedule, the way an attacker would.

## Prevention and cleanup checklist

Use this when standing up new subdomains and when retiring services:

- [ ] **Provision DNS last, deprovision DNS first.** When sunsetting a service, delete the DNS record *before* you release the cloud resource. This closes the window entirely.
- [ ] **Treat DNS records as owned assets with a lifecycle.** Every record should have an owner and a known backing service. Orphaned records are findings, not noise.
- [ ] **Avoid `CNAME`s to services that allow arbitrary claiming.** Where a provider supports domain-verification tokens (TXT proof of ownership), require them so a freed endpoint can't be re-bound by a stranger.
- [ ] **Audit zones on a recurring basis.** Schedule full-zone exports and fingerprint scans; don't rely on memory.
- [ ] **Tighten the blast radius.** Scope cookies, CSP `*.` allowances, and SSO redirect/origin lists as narrowly as possible so a takeover of a marketing subdomain can't reach production.
- [ ] **Cover internal and acquired domains too.** Mergers and shadow IT add zones nobody is watching.
- [ ] **Re-verify after every infrastructure change.** Tearing down a staging environment or a campaign microsite is the most common moment a dangle is born.

## Common mistakes that leave subdomains exposed

- **Deleting the app but keeping the `CNAME`.** The single most common cause. The record outlives the resource.
- **Trusting a one-time scan.** Takeover risk is a moving target; the vulnerable state appears later, after a cleanup elsewhere.
- **Ignoring "unimportant" subdomains.** `old-promo`, `test`, `vendor-portal` — attackers don't care about importance, only about trust inheritance.
- **No single source of truth for DNS.** Records spread across multiple providers, registrars, and teams mean nobody can answer "what do we publish?" See our note on building a real [asset inventory for security](/posts/asset-inventory-security).
- **Wildcard everything.** Wildcard cookies and CSP turn a small takeover into a large one.

## Closing the loop with continuous discovery

Subdomain takeover is fundamentally an **attack surface hygiene** problem: it exists in the gap between what your DNS still advertises and what your organization still operates. You can't fix what you can't see, and you can't see it once — you have to keep looking.

The Flyto2 **Warroom** treats your external attack surface as a continuously discovered, continuously verified inventory. Its external-attack-surface surface enumerates subdomains from certificate transparency, passive DNS, and seed expansion, resolves each record, follows `CNAME` chains, and fingerprints responses against known unclaimed-service signatures — then re-runs that loop on a schedule so a newly created dangle is caught in the window before exploitation, not in a post-incident review. Because Flyto2 is built on a deterministic automation engine with evidence and replay, every finding is a reproducible artifact: the record, the resolution chain, the response fingerprint, and the timestamp — not a one-line alert you have to take on faith.

That discovery feeds directly into your broader exposure program rather than living in a silo. For the full picture of how external discovery, prioritization, and remediation fit together, see our [attack surface management guide](/posts/attack-surface-management-guide).

A subdomain takeover is one of the cheapest attacks for an adversary and one of the most preventable for a defender — but only if your DNS records are inventoried, owned, and re-checked as the living assets they are.
