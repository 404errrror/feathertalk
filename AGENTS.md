# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the configuration UI and entry point.
- `live.html` renders the animated character.
- `js/` contains runtime logic (`js/index.js`) and localStorage wiring (`js/localstorage.js`).
- `css/` contains `css/index.css` and `css/main.css`.
- `assets/` stores default PNGs used for character parts and icons.
- `start-local.bat` is a Windows helper for running a local server; `CNAME` is for GitHub Pages.

## Build, Test, and Development Commands
- `start-local.bat`: launches `http://localhost:8000/index.html` and runs `python -m http.server 8000`.
- `python -m http.server 8000`: cross-platform static server; open `http://localhost:8000/index.html` manually.
- No build step or package install is required; changes are reflected on refresh.

## Coding Style & Naming Conventions
- Vanilla HTML/CSS/JS only; avoid adding build tooling unless necessary.
- Use 2-space indentation and follow the existing DOM-query style (`document.querySelector`).
- Keep asset filenames lower-case and descriptive (e.g., `assets/mouthopen.png`).
- localStorage keys are prefixed with `ft` (e.g., `ftMouthOpen`); preserve this pattern.

## Testing Guidelines
- No automated tests are configured.
- Manual checks: load `index.html`, enter image URLs, click "live", confirm `live.html` updates; verify number keys 1-0 swap presets and mic permission prompts work.

## Commit & Pull Request Guidelines
- Commit history uses short Korean descriptions, sometimes with a trailing period; keep messages brief and change-focused.
- For PRs, include a summary, screenshots for UI changes, and note any manual testing performed.

## Configuration & Data
- User settings persist in browser localStorage; avoid breaking existing key formats without a migration note.
