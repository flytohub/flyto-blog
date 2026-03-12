---
title: "Template: Exchange Rate Alert — Monitor Currency Rates with Telegram, Discord & Slack"
description: A step-by-step guide to using the Exchange Rate Alert community template. Fetch live rates from a free API and get notified on Telegram, Discord, Slack, or LINE — no API key required.
date: 2026-03-06
tags: [template, tutorial, notification, free-api]
author: Flyto2 Team
cover: /exchange-rate-alert.svg
---

Monitor live currency exchange rates and get instant notifications — no API key required. This guide walks you through the **Exchange Rate Alert** community template.

<!-- more -->

![Exchange Rate Alert Template](/exchange-rate-alert-template.png)

## What It Does

The Exchange Rate Alert template is a 3-step workflow that:

1. **Fetches live exchange rates** from the free [ExchangeRate API](https://open.er-api.com/)
2. **Builds a formatted report** with your selected currency pair
3. **Sends a notification** to Telegram, Discord, Slack, LINE, or any webhook

```
fetch_rate → build_report → send_report
```

No API key is needed — the ExchangeRate API offers ~1,500 free requests per month.

## Quick Start

### 1. Import the Template

Go to the **Marketplace**, search for **Exchange Rate Alert**, and click **Install**.

### 2. Configure the Fields

After importing, you'll see three fields in the Builder UI:

| Field | Default | Description |
|-------|---------|-------------|
| **Base** | `USD` | Base currency code (e.g., `USD`, `EUR`, `JPY`) |
| **Target** | `EUR` | Target currency code |
| **Webhook URL** | — | Your notification webhook URL |

### 3. Set Up Your Notification Channel

#### Telegram

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts to create your bot
3. Copy the **Bot Token** (looks like `123456:ABC-DEF...`)
4. Send any message to your new bot
5. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in your browser
6. Find your **Chat ID** in the response (e.g., `8719660788`)
7. In the template:
   - **Webhook URL**: `https://api.telegram.org/bot<TOKEN>/sendMessage`
   - Add `chat_id` in the `send_report` step params

#### Discord

1. Go to **Server Settings** > **Integrations** > **Webhooks**
2. Click **New Webhook**, choose a channel, and copy the URL
3. **Webhook URL**: `https://discord.com/api/webhooks/xxx/yyy`

#### Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) > **Create New App**
2. Enable **Incoming Webhooks** and add to a channel
3. **Webhook URL**: `https://hooks.slack.com/services/xxx/yyy/zzz`

#### LINE Notify

1. Go to [notify-bot.line.me](https://notify-bot.line.me/) and generate a token
2. **Webhook URL**: `https://notify-api.line.me/api/notify`

### 4. Run It

Click **Execute** and you'll receive a message like:

```
Exchange Rate Report

Base: USD
Last Updated: Thu, 06 Mar 2026 00:02:31 +0000
Rates: {"EUR": 0.92, "GBP": 0.79, "JPY": 149.85, ...}
```

## How It Works Under the Hood

### Step 1: `fetch_rate` — HTTP Request

Calls `https://open.er-api.com/v6/latest/[[base]]` where `[[base]]` is replaced with your chosen currency code (e.g., `USD`).

### Step 2: `build_report` — Text Template

Formats the raw API response into a readable report using `data.text.template`:

```yaml
template: |
  Exchange Rate Report
  Base: {base}
  Last Updated: {time}
  Rates: {rates}
variables:
  base: "[[base]]"
  time: "${fetch_rate.data.body.time_last_update_utc}"
  rates: "${fetch_rate.data.body.rates}"
```

### Step 3: `send_report` — Notify Send

Sends the formatted report via `notify.send`. The module auto-detects the platform from the webhook URL — no extra configuration needed for Discord, Slack, or LINE.

## Customization Ideas

- **Add a filter step** — Only notify when a specific rate crosses a threshold (e.g., USD/JPY > 150)
- **Schedule it** — Add a `trigger.schedule` to run every hour or daily
- **Multiple currencies** — Duplicate the workflow for different currency pairs
- **Rich formatting** — Use Discord embeds or Slack blocks by customizing the `title` field

## API Reference

- **ExchangeRate API**: [open.er-api.com](https://open.er-api.com/)
- **Rate Limit**: ~1,500 requests/month (free tier)
- **Supported Currencies**: 150+ currencies including crypto
- **No API key required**

---

Ready to try it? [Install the template from the Marketplace](https://flyto2.com/marketplace) and start monitoring exchange rates in minutes.
