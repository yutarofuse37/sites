# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **static personal website** (plain HTML/CSS/vanilla JS) deployed to GitHub Pages. There is **no `package.json`, no npm dependencies, no lint config, and no automated test suite**. Toolchain used: Node.js (for the prerender build) and Python 3 (for the local dev server) — both are preinstalled on the VM, so there is nothing to `install`.

### Services / how to run

- **Dev server (run this to view the site):** `python3 -m http.server 8080` from the repo root, then open `http://localhost:8080/index.html`. The site renders `#content` client-side by fetching `data/*.json` via `site.js`, so it must be served over HTTP (opening the files via `file://` will not load the JSON).
- Key routes: `/index.html` (JA home), `/en/index.html` (EN home), `/papers.html` + `/en/papers.html` (Papers/Talks), `/admin/` (content editor).
- **Bilingual switching is URL-based**, not in-page toggling: the JA and EN versions live at separate paths (`/` vs `/en/`). The header "JA | EN" links navigate between them.

### Build

- `node scripts/prerender.cjs` prerenders the JSON content into the 4 HTML files (`index.html`, `en/index.html`, `papers.html`, `en/papers.html`) **in place** so crawlers see real text. It edits git-tracked source files, so revert with `git checkout -- index.html en/index.html papers.html en/papers.html` after a local build test if you don't intend to commit the prerendered output.
- Gotcha: the GitHub Pages workflow (`.github/workflows/pages.yml`) invokes `node scripts/prerender.mjs`, but the script on disk is `scripts/prerender.cjs`. Run the `.cjs` file locally.

### Testing notes

- No unit/lint/test tooling exists; verify changes by serving locally and viewing the pages.
- When browser-testing the language switch, **disable Chrome's Google Translate** first — it auto-translates the Japanese page and masks whether the site's own `/en/` routing works. Verify by watching the address bar change to `.../en/...`.

### Admin editor

- `/admin/` edits content by committing to GitHub via a user-supplied fine-grained Personal Access Token (Contents: Read & write). Saving requires a real token and network access to GitHub; the login/UI itself works without one.
