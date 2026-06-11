# Instagram Profile Analyser

A full Instagram performance analysis tool for wellness practitioners, coaches, and healers ... built by [Camila Sunshine](https://instagram.com/camila.sunshine.online) as part of the [Scalable Magic](https://scalablemagic.com) ecosystem.

---

## What it does

Takes one or more Instagram handles + a post data export and produces:

- An **interactive visual dashboard** (React) with top/bottom posts, charts, timezone strategy, competitor analysis, and content format recommendations
- A **downloadable PDF report** ready to share with clients or your team

---

## Features

- Parses CSV exports from tools like Phantombuster, Apify, or Instagram Insights
- Scores every post by engagement weight (likes + comments × 3)
- Breaks down performance by content type (Image, Video, Reel)
- Timezone analysis for AU, US, UK, or global audiences
- Live competitor research via web search (no fabricated data)
- 5 tailored content format recommendations with hook examples
- PDF report with cover page, executive summary, and branded styling
- Thumbnail images in both widget and PDF (with graceful fallback)

---

## Files

| File | Description |
|------|-------------|
| `instagram-analyser.jsx` | Full React component ... the interactive dashboard UI |
| `SKILL.md` | Claude skill definition ... intake flow, analysis logic, PDF generation steps |

---

## How to use

### As a Claude Skill

1. Download `instagram-analyser.skill`
2. Install it in your Claude workspace (Settings ... Skills ... Install from file)
3. In any chat, say: *"analyse my Instagram"* or *"I want an Instagram performance report"*
4. Claude will guide you through the intake flow and run the full analysis

### As a standalone React component

1. Copy `instagram-analyser.jsx` into your React project
2. Import and render `<InstagramAnalyser />` (default export)
3. The component handles its own state and data parsing

---

## Data format

The component expects a CSV export with these columns (column names are mapped flexibly):

```
pk, image, type, caption, like_count, comment_count, view_count,
video_duration, date, hashtags/0..N, mentions/0..N
```

Compatible export tools: **Phantombuster** (Instagram Profile Scraper), **Apify** (Instagram Scraper), manual Instagram Insights export.

---

## Tech stack

- React (functional components + hooks)
- Inline styles only (no CSS framework dependency)
- Chart.js via CDN for bar charts
- ReportLab (Python) for PDF generation
- Web search for live competitor research

---

## Brand palette

Built with the Camila Sunshine brand palette:

| Token | Hex | Use |
|-------|-----|-----|
| Coral | `#F46D56` | Primary actions, badges |
| Peach | `#F4B081` | Accents, chart bars |
| Sand | `#E9D2BF` | Borders |
| Cream | `#FFF7ED` | Backgrounds |
| Cacao | `#57362B` | Headings |
| Aqua | `#A7D5D2` | Secondary badges |

---

## Part of the Scalable Magic toolset

This analyser is one piece of a broader content intelligence system for wellness practitioners scaling from 1:1 to 1:many. Other tools in the ecosystem include Instagram carousel builder, Stories creator, and the Content In Flow web app.

---

*Built with Claude ... Anthropic AI*
