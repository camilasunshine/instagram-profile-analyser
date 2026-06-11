---
name: instagram-analyser
description: >
  Full Instagram performance analysis skill. Use this ALWAYS when someone wants to analyse
  Instagram posts, understand what content performs best, get competitor research, or produce
  a PDF report from their Instagram data. Triggers for: "analyse my Instagram", "analyse these
  handles", "Instagram performance report", "what posts work for me", "competitor analysis for
  Instagram", "content strategy from my posts", "Instagram PDF report", or any variation of
  someone sharing a Google Sheets URL from an Instagram export or pasting CSV post data.
  The skill runs an interactive intake flow (cards), researches live competitors, analyses the
  data, and outputs both an in-conversation visual report and a downloadable PDF.
---

# Instagram Performance Analyser Skill

## What this skill does

Takes one or more Instagram handles + a data export (CSV/Google Sheets from a tool like
Phantombuster, Apify, or similar), researches real competitors, and produces:

1. An interactive visual report (in-conversation React widget)
2. A downloadable PDF (generated via Python + ReportLab)

Both outputs cover: top/bottom posts with reasons, timezone strategy, hashtag analysis,
competitor comparison, and 5 content format recommendations.

---

## Step 0 — Intake (ALWAYS start here)

Before touching any data, check what information you have. You need:

| Required | Optional but improves output |
|----------|------------------------------|
| At least one Instagram handle | Brand colours (hex) |
| Post data (CSV or Sheet URL) | Niche description in their own words |
| Their audience language (EN / PT / ES / other) | Target geography (e.g. AU + US) |
| What they sell / offer | Competitor handles they already know |

**If any required field is missing**, ask using card-style questions (see §Card Questions below).
**Do not proceed to analysis until you have handle + data + language + a rough niche.**

If the user pastes a Google Sheets URL, note: the data will appear in the `<documents>` block
as CSV text. Parse it from there — do not attempt to fetch the URL.

---

## Step 1 — Parse the data

The CSV will have these key columns (exact names may vary — map by content):

```
pk, image (thumbnail URL), type (Image/Video/Reel), caption, like_count,
comment_count, view_count, video_duration, date, hashtags/0..N, mentions/0..N
```

**Image/thumbnail column detection** — search for these column name patterns in order:
`image`, `thumbnail`, `display_url`, `media_url`, `img`, `cover`, `photo`
If found, store the URL per post for display in the widget and PDF. If the URL is a CDN
URL (e.g. Instagram scontent- domains), it will render directly. If it fails to load,
show a type-labelled placeholder (▶ for Video, 🎬 for Reel, 🖼 for Image).

**Compute per post:**
- `score = likes + (comments × 3)` — comments weighted higher (algorithm signal)
- `hour_aest` = extract hour from `date` field (UTC → AEST = UTC+10 or +11 DST)
- `hashtag_count` = count non-empty hashtag columns
- `caption_length` = character count of caption
- `has_cta` = True if caption contains comment trigger keywords (COMMENT, DM, drop, reply)
- `img_url` = resolved thumbnail URL or empty string

**Compute aggregates:**
- Avg likes / comments by type (Image, Video, Reel)
- Avg score by posting hour
- Avg score with hashtags vs without
- Avg score by caption length bucket (0–100, 100–300, 300–700, 700+)
- Post frequency per month (to spot consistency gaps)

---

## Step 2 — Competitor research

Use `web_search` to find **real, active** competitors. Do not invent handles.

### Search strategy

Run 2–3 targeted searches based on the niche the user described:

```
Search 1: instagram.com "[niche keyword 1]" "[niche keyword 2]" followers 2025
Search 2: instagram "[exact role description]" account followers engagement
Search 3: instagram "[adjacent niche]" coach OR healer OR practitioner followers
```

**Follower target:** aim for accounts with ~5× the user's follower count.
If the user's count is unknown, target 5K–30K range as default for coaches/healers/consultants.

**For each competitor found, capture:**
- Handle (verified from search result, not guessed)
- Follower count (from the search snippet)
- Bio summary / positioning
- Content patterns visible from search snippets or bio
- What they do that the user could learn from
- What gap the user has that the competitor doesn't fill

**Minimum 3 competitors.** If fewer than 3 are found in the first searches, broaden:
- Try adjacent niches (e.g. if "somatic business coach" returns nothing useful, try "nervous system coach" or "embodied entrepreneur")
- Try geography (add "Australia" or "US" to the query)

**Never fabricate follower counts or handles.** If uncertain, say so and show the search result.

---

## Step 3 — Timezone analysis

Ask (or infer from their handle/content) which audience they target.
Common configurations for English-language coaches:

| Target | Best post time (local) |
|--------|----------------------|
| AU only | 7–9am AEST |
| AU + US | 7–10am AEST (= AU morning + US afternoon/evening prior day) |
| US only | 9am–12pm ET |
| UK + EU | 8–10am GMT |
| Global | 8am AEST or 8am GMT (overlapping windows) |

Calculate what % of their posts landed in the optimal window vs dead zones.
Flag any posts that had strong content but bad timing (score < 5 but caption quality seems high).

---

## Step 4 — Build the visual report (in-conversation)

Render a React widget covering all sections in this order:

1. **Header** — handle(s), date range, post count, format split
2. **Key metrics** — 5 stat cards (top likes, avg likes by type, hashtag delta, posts in dead zone, posting frequency)
3. **Timezone table** — their target audiences + optimal windows + verdict
4. **Top 10 posts** — ranked cards with: type badge, likes/comments, hashtag badge, timing badge, timezone badge, reason paragraph
5. **Bottom 10 posts** — same format, left border red, diagnosis paragraph
6. **Patterns** — 6 insight cards (2-col grid)
7. **Charts** — bar chart: avg likes by type; bar chart: score by hour (colour-coded green/amber/red)
8. **Competitors** — 3 competitor cards with handle link, follower count, what they do well, the user's edge
9. **White space** — what nobody in the niche is doing yet (1–2 cards)
10. **5 recommended post formats** — with hook examples
11. **Additional insights** — saves metric note, frequency trend, any language/cultural observations

**Design rules for the widget:**
- Use CSS variables for all colours (light/dark mode compatible)
- **Metric cards: each of the 5 summary cards uses a distinct accent colour** —
  warm coral, sky blue, sage green, amber, violet. Never use the same background
  for two adjacent metric cards. This makes the dashboard scannable at a glance.
- **Post cards: always show a thumbnail** left of the caption text. Map the `image`
  column (or `thumbnail`, `display_url`, `media_url`) from the CSV. If the URL loads,
  show it as a 72×72px cover-cropped image with a small type badge overlay (IMG/VID/REE).
  If the URL fails or is absent, show a type-labelled emoji placeholder the same size.
- Badges: type (blue=video, green=image/reel), hashtag count (amber), timing (purple), stats (grey)
- Charts: use Chart.js from cdnjs
- No bullet points — prose reasoning in reason/diagnosis paragraphs
- Sentence case everywhere, no ALL CAPS labels
- Include "View post ↗" link on each card when `post_url` column is present

**If the user has shared brand colours**, apply them as accent colours in the widget.
Map: primary colour → badge backgrounds and chart bars; secondary → borders and section titles.

---

## Step 5 — Ask before generating PDF

After the widget renders, ask:

> "Would you like me to generate this as a downloadable PDF report?"

If YES → proceed to Step 6.
If NO → stop here.

---

## Step 6 — Generate the PDF

Read `/mnt/skills/public/pdf/SKILL.md` before writing any PDF code.

Use **ReportLab** (Platypus). Structure:

```
Cover page        — title, handle(s), date, generated-by line
Executive summary — 5 key findings in plain prose (half page)
Section 1         — Key metrics (table)
Section 2         — Timezone strategy (table)
Section 3         — Top 10 posts (each as a compact row with reason)
Section 4         — Bottom 10 posts (same, with diagnosis)
Section 5         — Key patterns (prose paragraphs)
Section 6         — Competitor analysis (one paragraph per competitor)
Section 7         — 5 recommended post formats (numbered, with hook example)
Section 8         — Additional insights
Footer            — page numbers, handle, date
```

**Post thumbnail handling in PDF:**
- For each post in the top/bottom 10, attempt to embed the thumbnail image.
- Use `requests.get(url, timeout=5)` to fetch the image bytes, then wrap in
  `reportlab.lib.utils.ImageReader` and draw as a 60×60pt image on the left of the row.
- If the fetch fails (timeout, 403, network error), substitute a coloured rectangle
  with the post type label (IMG / VID / REE) in white text — same dimensions.
- Never let a single failed image crash the PDF build — always use try/except per image.

**Brand colour integration:**
- If user provided hex colours: use primary as heading colour, secondary as table row stripe
- Default (no brand colours given): use `#3D302F` (dark warm) for headings, `#F4B081` (warm peach) accent
- Never use CSS variables in ReportLab — always hex directly

**Font stack:**
- Try to register a Google Font if available; fallback to Helvetica for body, Times-Bold for headings
- Use `colors.HexColor('#xxxxxx')` for all colour references

**Output path:** `/mnt/user-data/outputs/instagram_report_[handle]_[date].pdf`

After building, call `present_files` with the PDF path.

---

## Card Questions

When you need to ask clarifying questions before proceeding, render them as interactive
option cards using the `ask_user_input_v0` tool. Ask maximum 3 questions at once.

**Common card sets:**

### Set A — Missing niche context
```
Q1: "What's the main thing you help people with?"
Options: Somatic / nervous system | Business coaching | Healing / therapy | Creative / content | Other (tell me)

Q2: "Who is your primary audience?"
Options: Coaches and healers | Women entrepreneurs | ADHD / neurodivergent | General wellness | Mixed

Q3: "Which geography are you targeting?"
Options: Australia only | AU + US | US only | UK / Europe | Global English
```

### Set B — Missing data
```
Q1: "How are you sharing your post data?"
Options: Google Sheets link | CSV file upload | I'll paste the data | I don't have it yet

Q2: "Roughly how many followers do you currently have?"
Options: Under 1K | 1K–5K | 5K–15K | 15K–50K | 50K+
```

### Set C — Brand / PDF options
```
Q1: "Do you have brand colours you'd like in the PDF?"
Options: Yes, I'll share the hex codes | Use warm neutral defaults | Surprise me

Q2: "Who will this report be shared with?"
Options: Just for me | My team | Clients / students | Publishing / sharing publicly
```

---

## Edge cases

**Multiple handles:** Run the full analysis per handle, then add a comparison section
showing which handle performs better by type, timing, and topic.

**No post data (handle only):** Explain that without post-level data you can only do
competitor research and niche analysis — no performance ranking. Offer to do that
partial report and explain how they can export their data (Phantombuster Instagram
Profile Scraper, Apify, or Instagram Insights manual export).

**Non-English captions:** Note the language, still run all quantitative analysis,
and flag in the report that caption quality assessment is limited to structure
(length, CTAs, hashtags) rather than message resonance.

**Very small dataset (< 20 posts):** Flag that patterns are indicative, not statistically
reliable. Still run the analysis but add a caveat card at the top of the report.

**Private accounts:** You cannot access private account data. Acknowledge this and
ask if they have a manual export they can share.

---

## Output quality checklist

Before presenting the widget or PDF, verify:

- [ ] All competitor handles link to real Instagram URLs
- [ ] No follower counts were invented (only from search snippets)
- [ ] All post cards show actual data (no placeholders)
- [ ] Timezone table matches the user's stated target geography
- [ ] Top/bottom 10 reasons are post-specific (not generic)
- [ ] PDF uses hex colours, not CSS variables
- [ ] PDF file path includes the handle name and today's date
- [ ] `present_files` is called after PDF generation

---

## References

- PDF generation details: `/mnt/skills/public/pdf/SKILL.md`
- Frontend design guidance: `/mnt/skills/public/frontend-design/SKILL.md`
