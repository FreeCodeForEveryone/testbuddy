# testbuddy

An interactive, single-page comparison of **Devin** and other AI developer
tools — built with plain HTML, CSS, and JavaScript (no build step, no
dependencies) and deployed to **GitHub Pages**.

## What's inside

- **Build your comparison** — toggle tools on/off and see a live SVG radar chart.
- **Capability scorecard** — a sortable, filterable table of 0–5 scores across
  eight engineering capabilities (autonomy, refactoring, testing, browser use,
  PR creation, and more).
- **Capability spotlight** — pick one capability and rank every tool with
  animated bars.
- Dark/light theme toggle, persisted in `localStorage`.

All ratings are an opinionated snapshot. Edit `data.js` to change the tools,
capabilities, or scores — the UI is fully data-driven.

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
- `data.js` — the tools, capabilities, and scores (edit me!)
- `script.js` — radar chart, scorecard table, spotlight bars, theme toggle
- `.github/workflows/deploy.yml` — GitHub Pages deployment
