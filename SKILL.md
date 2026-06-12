---
name: instagram-analyser
description: Analyse an Instagram profile's post performance from a CSV export. Identifies top and bottom performing posts, posting time patterns, and content format trends. Offers optional paid deep-dive add-ons (competitor comparison, strategic recommendations, full report). Use this skill whenever someone asks to analyse their Instagram, review post performance, or understand what content works on their profile.
---

# Instagram Profile Analyser

## Overview

This skill analyses a CSV export of someone's Instagram posts and produces a
free performance report directly in the conversation: top and bottom posts,
posting-time patterns, content-format breakdown, and plain-language tips on
what's working and what isn't.

It also offers three optional paid add-ons (Deep Analysis, Competitor
Comparison, Strategic Recommendations — or all three bundled) which the user
unlocks via a Stripe payment link.

Always respond in English, regardless of the language the user writes in.

---

## Step 1 — Get the data

If the user hasn't uploaded a CSV yet, explain how to get one. Keep it simple
and friendly — most users are not technical.

Use this explanation:

> To analyse your Instagram profile, I need a CSV export of your posts. Here's
> the easiest free way to get one:
>
> 1. Go to **apify.com** and create a free account (no credit card needed for
>    the free tier).
> 2. Once logged in, open this actor: **Fast Instagram Profile Posts Scraper**
>    → https://console.apify.com/actors/Gv87i5PtUqPlLcM2W
> 3. Click **Try for free** (or **Run**).
> 4. In the input field, enter your Instagram username (without the @), e.g.
>    `camila.sunshine.online`.
> 5. Click **Start** / **Run**. It takes 1–2 minutes.
> 6. When it finishes, go to the **Output** tab → click **Export** → choose
>    **CSV**.
> 7. Download the file and upload it here.
>
> Tip: the free Apify plan includes enough credits to run this a few times per
> month — plenty for regular check-ins on your profile.

If the user says they already have a CSV (from Apify, Phantombuster, or
Instagram's own export), skip straight to Step 2.

---

## Step 2 — Parse and analyse

Once the CSV is uploaded:

1. Read the file (use the file-reading skill if it's not already in context).
2. Map columns flexibly — look for columns containing: `like`, `comment`,
   `type`/`media_type`, `date`/`timestamp`, `caption`, `hashtag`, and
   `image`/`thumbnail`/`display_url`.
3. For each post compute:
   - `score = likes + comments * 3`
   - `hour` = UTC hour extracted from the date/timestamp
   - `hashtag_count` = number of non-empty `hashtags/0..N` columns
   - `has_cta` = true if caption contains words like "comment", "DM", "drop",
     "reply", "tag", "send"
4. Sort posts by `score` descending. Take the top 10 and bottom 10.
5. Group by content type (Image / Video / Reel) and compute average likes per
   type.
6. Group by posting hour (UTC) and compute average score per hour.
7. Compute hashtag impact: average likes for posts with hashtags vs. without.
8. Count "dead zone" posts published between 1am–5am UTC.

---

## Step 3 — Present the free report

Present the report directly in the conversation (use the Visualizer for an
inline dashboard if helpful — interleave charts with text). Structure:

### Dashboard metrics (with plain-language tips)

For each metric, state the number AND a one-line verdict (good / needs work)
plus a concrete tip:

- **Total posts analysed**
- **Best-performing format** (avg likes) — tip: lean into this format more
- **Hashtag impact** — if positive (>5 likes diff), tip to keep using
  hashtags; if neutral/negative, tip that hashtags aren't driving discovery
  for this account and effort may be better spent on hooks/timing
- **Dead-zone posts** (1–5am UTC) — if >0, tip to shift posting to 7–11am
  AEST / local peak hours; if 0, confirm timing is solid
- **Best posting window** — state the window with the highest average score

Use colour language consistently: 🟢 good, 🟡 okay/neutral, 🔴 needs
attention — matching against each metric's verdict.

### Top 10 posts

For each: caption preview, type, likes/comments, and a 1-sentence reason it
performed well (format, timing, CTA presence, hashtag use, etc.)

### Bottom 10 posts

Same format, but with a constructive reason it underperformed and what to do
differently.

### Charts

If using the Visualizer, create:
- A bar chart of average likes by content type, colour-coded green (best),
  amber (middle), red (worst)
- A bar chart of average score by posting hour (UTC), colour-coded green
  (7–11am and 7–8pm), red (1–5am dead zone), amber (everything else)

---

## Step 4 — Offer the paid add-ons

After presenting the free report, offer three optional deep-dive add-ons.
Present them clearly, each with a Stripe payment link:

> Want to go deeper? Here are three optional add-ons:
>
> 1. **Deep Analysis — $5** — A detailed breakdown of *why* each top post
>    worked and exactly what to replicate, plus caption and hook patterns
>    across your best content.
>    → [Unlock Deep Analysis](STRIPE_LINK_DEEP_ANALYSIS)
>
> 2. **Competitor Comparison — $5** — I'll research 3 real accounts in your
>    niche that are outperforming you, what they're doing differently, and
>    where you have an edge.
>    → [Unlock Competitor Comparison](STRIPE_LINK_COMPETITOR)
>
> 3. **Strategic Recommendations — $5** — 5 tailored content formats for your
>    audience, each with a ready-to-use hook and posting strategy.
>    → [Unlock Strategic Recommendations](STRIPE_LINK_STRATEGY)
>
> Or get **all three for $10** → [Unlock Everything](STRIPE_LINK_BUNDLE)
>
> After payment, just paste your receipt or confirmation here and I'll run
> the add-on(s) right away.

Replace `STRIPE_LINK_*` placeholders with the actual Stripe payment link URLs
configured by the account owner (see `references/stripe_links.md` if present).

---

## Step 5 — Deliver paid add-ons

When the user confirms payment (pastes a receipt, confirmation email, or
says they've paid), deliver the relevant add-on(s) using the post data already
analysed:

- **Deep Analysis**: For each top-10 post, give a 2-3 sentence breakdown of
  the specific elements (hook structure, caption length, visual style implied
  by type, timing, CTA) that drove performance, plus a summary of repeatable
  patterns across all top posts.
- **Competitor Comparison**: Use web search to find 3 real, currently-active
  accounts in the same niche with larger followings. For each: handle, why
  they're bigger, one tactic to steal, and one edge this account has over
  them. Never fabricate handles — only use real accounts found via search.
- **Strategic Recommendations**: Provide exactly 5 content format
  recommendations tailored to the account's niche and audience, each with a
  ready-to-use hook line and a one-sentence rationale.

---

## Notes

- Never fabricate engagement numbers, competitor accounts, or post data —
  everything in the free report must come from the uploaded CSV.
- Keep the tone encouraging and practical — this is for coaches, healers, and
  wellness practitioners who may not be technical.
- If the CSV is missing required columns (likes, type, date), explain which
  columns are missing and ask the user to re-export with those fields
  included.
