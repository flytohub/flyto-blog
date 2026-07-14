---
title: "DMARC, SPF & DKIM: Email Authentication Setup Guide"
description: "A step-by-step DMARC SPF DKIM setup guide: how the three records stop email spoofing, the DNS entries to publish, a safe p=none to p=reject rollout, and a verification checklist."
date: 2026-06-10
author: Flyto2 Team
tags: ["DMARC","SPF","DKIM","email security"]
cover: /blog/dmarc-spf-dkim-email-security-guide.jpg
---

![DMARC, SPF & DKIM: Email Authentication Setup Guide](/blog/dmarc-spf-dkim-email-security-guide.jpg)

Email was never designed to prove who sent a message. The `From:` address you see is just a label the sender chose, which is why phishing and business-email-compromise attacks lean on it so heavily. SPF, DKIM, and DMARC are the three DNS-based standards that close that gap: together they let receiving mail servers verify that a message genuinely came from a domain you control, and tell them what to do when it doesn't. This guide explains how each record works, walks through the DNS setup, shows how to roll out from monitoring to enforcement without breaking legitimate mail, and gives you a verification checklist for the common mistakes.

<!-- more -->

## Why email authentication matters

Without authentication, anyone can send mail that claims to be from `you@flyto2.com`. Receivers have no reliable way to tell a real invoice from a spoofed one. The result is the everyday reality of phishing, invoice fraud, and brand impersonation. SPF, DKIM, and DMARC don't encrypt mail or stop spam outright — they answer a narrower, foundational question: **is this message really authorized by the domain it claims to come from?**

Each standard covers a different angle, and you need all three working together.

| Record | What it proves | Where it lives |
| --- | --- | --- |
| **SPF** | This IP is allowed to send for the domain | TXT record on the domain |
| **DKIM** | The message body/headers weren't forged or altered | TXT record on a selector subdomain |
| **DMARC** | SPF/DKIM must pass *and align* with the visible From — plus what to do if not | TXT record on `_dmarc` |

## How each record works

### SPF — Sender Policy Framework

SPF is a published list of the servers permitted to send mail for your domain. A receiving server looks up your SPF TXT record, checks the connecting IP against it, and gets a pass or fail. A typical record:

```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

`include:` pulls in your provider's authorized ranges. The mechanism at the end is the policy: `~all` is soft-fail (mark suspicious), `-all` is hard-fail (reject). SPF has a hard limit of **10 DNS lookups** — exceed it and SPF returns `permerror`, silently breaking authentication.

### DKIM — DomainKeys Identified Mail

DKIM adds a cryptographic signature to outgoing mail. Your sending platform signs each message with a private key; you publish the matching public key in DNS at a *selector*, e.g. `selector1._domainkey.yourcompany.com`. The receiver fetches that key and verifies the signature, which proves the signed parts of the message weren't altered in transit and really originated from a system holding your key.

### DMARC — the policy that ties it together

SPF and DKIM each authenticate a domain, but not necessarily the one the user sees. DMARC adds **alignment**: the SPF/DKIM-authenticated domain must match the `From:` domain. It also lets you publish a *policy* telling receivers what to do on failure, and request *reports* so you can see who is sending as you. A starter record:

```
v=DMARC1; p=none; rua=mailto:dmarc@flyto2.com; fo=1
```

`p=` is the enforcement level (`none`, `quarantine`, `reject`); `rua=` is where aggregate reports are sent.

## Step-by-step DNS setup

1. **Inventory every legitimate sender.** Marketing platform, helpdesk, CRM, billing, your mail provider, and any app that sends transactional mail. Missing one here is what breaks mail later. An external footprint scan helps you find sending systems and domains you forgot you owned.
2. **Publish SPF.** Create one TXT record at the apex with the `include:` for each authorized provider. Keep it to a single SPF record and watch the 10-lookup limit.
3. **Enable DKIM per sender.** Turn on DKIM in each platform, take the selector and public key it gives you, and publish the TXT record it specifies. Each sender gets its own selector.
4. **Publish DMARC in monitoring mode.** Start with `p=none` and a `rua=` address. This changes nothing about delivery — it only starts the flow of reports.
5. **Collect reports for 2-4 weeks.** Aggregate (RUA) reports are XML; feed them into a DMARC report viewer so you can see which sources pass, which fail, and which are spoofers.

## Rolling out from p=none to p=reject

This is where most deployments stall — going straight to `p=reject` will bounce legitimate mail from a sender you missed. Move in stages and only advance when reports are clean:

- **`p=none`** — Monitor. Identify every legitimate source and fix its SPF/DKIM alignment until those sources pass.
- **`p=quarantine; pct=25`** — Begin enforcement on a fraction of traffic; failing mail lands in spam. Increase `pct` toward 100 as confidence grows.
- **`p=quarantine`** (full) — All failing mail is quarantined. Confirm reports show no legitimate sources failing.
- **`p=reject`** — Failing mail is rejected outright. This is the goal: spoofed mail in your name is refused at the door.

The discipline is simple: **never advance a level while a legitimate sender is still failing in your reports.**

## Verification checklist and common pitfalls

Before and after each change, verify:

- [ ] Exactly **one** SPF record at the apex (multiple SPF records = `permerror`).
- [ ] SPF stays under **10 DNS lookups** (flatten or consolidate `include:` if not).
- [ ] DKIM is enabled and publishing a valid key for **every** sending platform.
- [ ] DMARC `rua=` points to a mailbox you actually monitor.
- [ ] At least one of SPF or DKIM **aligns** with the visible From domain — DMARC needs alignment, not just a generic pass.
- [ ] Subdomains are covered (consider an `sp=` policy and a DMARC record on active subdomains).
- [ ] Parked/non-sending domains have `v=spf1 -all` and `p=reject` so they can't be abused.

Common mistakes: stopping at `p=none` forever (you get reports but no protection); a third-party sender that passes SPF on *its* domain but never aligns with yours (only DKIM alignment will save it); and forgetting that your *unused* domains are prime spoofing targets — attackers love a domain you own but never send from.

## Where email authentication fits a wider attack surface

DMARC, SPF, and DKIM are part of your external attack surface, and they drift: a new SaaS tool starts sending mail and breaks SPF, a DKIM key gets rotated and not republished, or a look-alike domain appears to impersonate you. Checking these records once is not enough — they need to be watched the same way you watch open ports and certificates.

This is exactly the kind of continuous, evidence-backed check the Flyto2 Warroom is built around. Its footprint and external-attack-surface surfaces enumerate the domains you own, read their live DNS — including SPF, DKIM, and DMARC records — and flag misconfigurations like a missing DMARC policy, a record still stuck at `p=none`, or a parked domain with no anti-spoofing protection. Because the underlying checks run on the Flyto2 automation engine's deterministic modules, every finding is reproducible from the same DNS evidence rather than a one-off guess, and the results feed the same closed loop as the rest of your exposure data.

To go deeper on the surrounding surfaces, see our [Attack Surface Management guide](/posts/attack-surface-management-guide) for how mail authentication fits continuous external discovery, and [Footprint, Attribution & OSINT](/posts/footprint-attribution-osint) for how DNS and domain ownership evidence is gathered and attributed in the first place.

## The bottom line

SPF says *who* may send, DKIM proves *the message is intact*, and DMARC ties both to the address your users actually see and tells receivers what to do on failure. Set them up in order, roll DMARC from `p=none` to `p=reject` only as your reports go clean, and then keep watching — because the moment a new sender or a forgotten domain slips past, your authentication is only as good as its last verification.
