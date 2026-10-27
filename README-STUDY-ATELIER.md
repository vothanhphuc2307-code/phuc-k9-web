# Học Cùng Phúc K9 — Study Atelier

This source package introduces a new Study Atelier interface concept for the existing Vercel app.

## What changed

- Replaced the visible app shell with a static Study Atelier top bar, desktop sidebar and mobile bottom navigation.
- Replaced the home tab markup with a new study-oriented layout: warm paper canvas, editorial hero, subject cards, progress, continue-learning area, daily review prompt and study desk.
- Added `assets/phuck9-study-atelier.css` for the design system and responsive layouts.
- Added `assets/phuck9-study-atelier.js` for route wiring, navigation state, route search, daily review prompt and progress/chapter rendering.
- Updated the Service Worker cache version to `phuc-k9-study-atelier-v1-20261027`.
- Removed obsolete Studio V6 UI assets and temporary preview files from this package.

## Compatibility approach

The API functions, authentication workflows, Redis/Blob integration, course/exam data and specialized tab business logic were retained. The new shell/homepage and shared design system are rebuilt; specialized course, exam, admin, library and account views keep their existing functional markup and are styled through the new global system to reduce migration risk. They have not all been rewritten independently from scratch.

## Before deploy

1. Keep a backup/branch of the current repository.
2. Do not delete or rename existing Vercel environment variables or Redis/Blob data.
3. Replace files from this project at the repository root (the root must contain `index.html`, `api/`, `lib/`, `assets/`, and `vercel.json`; do not upload the ZIP itself).
4. Commit to a separate branch and let Vercel create a Preview deployment.
5. Verify login, Admin permissions, document uploads, course tabs, exam listing, timed attempts, grading, results, history, student library and AI tutor before promoting to Production.
6. Hard-refresh the Preview (`Ctrl+Shift+R`) after deployment. If the old screen remains, check the deployment commit and root directory in Vercel before editing more CSS.

## Local checks performed

- Rendered the UI using a browser automation preview at desktop 1440×1100 and mobile 390×844.
- Checked the desktop/mobile shell, no horizontal overflow in these viewports, navigation to the course tab via search, timer start/pause and adding a checklist item in the preview.
- Ran JavaScript syntax checks on inline and external scripts, JSON parsing and CSS parsing.

These checks are not a production deployment. Redis, Vercel Blob, live authentication, actual uploaded files and full production routes still need a Preview deployment test.
