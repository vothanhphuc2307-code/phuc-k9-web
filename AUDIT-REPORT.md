# HỌC CÙNG PHÚC K9 — Source audit (Midnight Aurora ecosystem upgrade)

## Project architecture
- Frontend: single-page `index.html` with existing learning sections and legacy controllers.
- Backend: CommonJS Vercel Functions under `api/`.
- Redis: `@upstash/redis` through `lib/redis.js`.
- File storage: Vercel Blob through `api/blob.js`.
- AI tutor: OpenAI SDK in `api/ai.js`.
- Runtime: Node.js 24.x.

## Changes in this package
- Added the Midnight Aurora UI layer in `assets/phuck9-vip.css` and `assets/phuck9-vip.js`.
- Reworked the existing shell for a premium desktop app layout and an independently composed mobile layout.
- Added a command palette/global search (`Ctrl+K` / `⌘K`) for application routes and the existing Math lesson catalog.
- Added a Biology 12 hub using existing references already present in the supplied source, including the included Điện Biên Biology PDF.
- Added a local flashcard workspace with create/edit/delete, subject filtering, search, shuffle, review counts, flip interaction and JSON import/export for portability.
- Made the already-declared Math `courseData` visible as `window.courseData`, fixing shared dashboard/search consumers that read the catalog from `window`.
- Preserved existing authentication, admin, Redis, Blob and API files/contracts.
- Updated the service-worker cache key and precache list.

## Data and privacy boundaries
- Flashcard content and review counts are stored in browser `localStorage` on the current device. They do not sync through the existing account or Redis backend.
- The Biology page links to the references already stored in this project. External pages are not copied into this package.
- Existing server environment variables and production data are not included in the ZIP.

## Validation performed for this package
- New JavaScript files and service worker passed `node --check`.
- CSS parser found no errors in `style.css`, `assets/phuck9-study-atelier.css`, or `assets/phuck9-vip.css`.
- `package.json`, `vercel.json`, `manifest.webmanifest`, and `exam-template.json` passed JSON parsing.

## Not verified
- Browser visual verification could not be completed because this isolated browser environment blocked navigation to local test pages.
- No deployment to the live Vercel project was made.
- No integration test against the user's live Redis/Blob, sign-in, admin or API environment was performed.
- No Lighthouse or physical-device measurement was performed.

## Preview deployment checklist
Test sign-in/sign-out, profile and progress, admin, uploads, all existing subject pages, PDF routes, Biology resources, flashcard persistence, global search, browser console, desktop layout, mobile layout and PWA cache refresh. Back up Redis/Blob and keep a known-good deployment available for rollback before promoting to production.
