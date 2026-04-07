# StoryAtlas

StoryAtlas is a local-first worldbuilding and writing studio built with Flask, SQLite, vanilla JavaScript, and a single-page interface. It is designed to feel lighter than a full wiki engine while still being detailed enough for characters, factions, locations, lore, timelines, story arcs, and manuscript drafts.

## What this upgraded version adds

- cleaner dashboard with quick-start actions, recent pages, writing prompts, and coverage tracking
- workspace views for World Bible, Story Board, Connections, Project Stats, and Scratch Pad
- working command palette with `Ctrl/Cmd + K`
- readable quick search dropdown with keyboard navigation
- better entry cards with completeness indicators
- field guidance on forms so pages are easier to fill out
- dark mode with more readable contrast
- bottom status bar for project name, total entries, word count, and save state
- onboarding flow for brand-new projects
- JSON backup export and JSON import restore
- existing ZIP export kept intact for full project packaging

## Quick start

```bash
cd personal_idea_wiki
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Controls

- `Ctrl/Cmd + K` opens the command palette
- type in the search bar to search entries
- type `/` in the search bar to jump into command mode
- `Esc` closes search, command palette, or help

## Backup and restore

Use **Project Settings** to:

- export a ZIP package of the full project
- export a raw JSON backup
- import a JSON backup back into the local app

JSON import expects a StoryAtlas backup structure with:

- `meta`
- collection arrays for characters, locations, factions, items, lore, history, systems, cultures, plots, chapters, timelineEvents, manuscripts, and bibliography

## Files worth knowing

- `app.py` — Flask backend and export/import routes
- `static/app.js` — original SPA logic
- `static/enhanced.js` — enhancement layer for extra UX and workspace features
- `static/styles.css` — styling, including dark mode and responsive layout
- `templates/index.html` — main app shell

## VS Code

A launch profile is included so you can start the server directly from the Run and Debug panel.
