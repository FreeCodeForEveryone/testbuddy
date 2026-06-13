# testbuddy

An interactive, single-page comparison of **Devin** and other AI developer
tools — built with plain HTML, CSS, and JavaScript (no build step, no
dependencies) and deployed to **GitHub Pages**.

## What's inside

Compares eight tools — **Devin, OpenAI Codex, Claude Code, Cursor, GitHub
Copilot, Windsurf, Replit Agent, and ChatGPT** — across nine capabilities.

- **Build your comparison** — toggle tools on/off and see a live SVG radar chart.
- **Capability scorecard** — a sortable, filterable table of 0–5 scores across
  nine engineering capabilities (autonomy, refactoring, testing, browser use,
  PR creation, deployment, and more).
- **Capability spotlight** — pick one capability and rank every tool with
  animated bars.
- **Tool deep-dive** — researched notes on each tool with links to primary
  sources (official docs/announcements).
- Dark/light theme toggle, persisted in `localStorage`.

Ratings are a research-backed but opinionated snapshot (mid-2025). Each tool in
`data.js` carries `notes` and `sources`; edit it to change tools, capabilities,
or scores — the UI is fully data-driven.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes the
site to GitHub Pages. Enable Pages once under **Settings → Pages → Build and
deployment → Source: GitHub Actions**.

## Files

- `index.html` — page markup and section scaffolding
- `styles.css` — styles, including a dark theme
- `data.js` — the tools, capabilities, scores, notes, and sources (edit me!)
- `script.js` — radar chart, scorecard table, spotlight bars, deep-dive cards, theme toggle
- `.github/workflows/deploy.yml` — GitHub Pages deployment
