# Học Cùng Phúc K9 — audit source and Studio UI v2

## What this package is
This ZIP is based on the supplied source tree. It keeps the existing Vercel Functions / Redis / Blob architecture and preserves most existing page markup so the existing app IDs, tab-switch functions, login hooks, and Admin flows are not wholesale replaced.

## Confirmed stack from source
- Frontend: large single-page `index.html` with HTML, inline CSS and JavaScript.
- Backend: CommonJS Vercel Functions under `api/`.
- Redis: `@upstash/redis`, used by `lib/redis.js` and server data flows.
- File store: Vercel Blob through `api/blob.js`.
- AI Tutor: OpenAI SDK in `api/ai.js`.
- Runtime declaration: Node.js 24.x in `package.json`.

## UI/animation/layout v2
The earlier package's UI addition was too superficial for the requested full visual overhaul. This package replaces that layer with `assets/phuck9-studio-v2.css` and `assets/phuck9-studio-v2.js`, loaded last in the document so the redesign can override the many legacy inline styles. The redesigned presentation includes:
- A new visual system: warm paper, lavender, mint and peach in light mode, soft plum/ink in dark mode.
- Reworked desktop app shell: wider, clearer sidebar and header, increased typography, improved navigation states and content spacing.
- Reworked homepage hero, quick-action cards, subject cards, progress and chapter areas.
- Separate tablet/mobile layout with stacked hero, touch-sized controls, swipeable subject strip, compact quick-action grid and bottom navigation.
- One-shot page transitions, viewport-triggered reveal, modal entrance, `prefers-reduced-motion` support and less reliance on expensive continuous blur/animation.
- Removal of the forced maintenance overlay from the delivered prior iteration; the exam bank should display actual backend data or its real empty/error state.
- Cache version bump to `phuc-k9-app-v4-studio-ui` and precaching of the new UI assets.

This is a visual/layout overhaul over the existing DOM, not a rewrite of every piece of the 1.4 MB legacy index. That choice is intentional: fully rebuilding the markup and controllers in one move could break authentication, admin actions, exam IDs, and data hooks.

## Validation performed for this package
- `node --check` run on every `.js` file in `api/`, `lib/`, and `assets/`.
- JSON parse checks passed for `package.json`, `vercel.json`, `manifest.webmanifest`, and `exam-template.json`.
- Confirmed `index.html` references the new v2 UI files and not the previous academic-UI bundle; service worker has the v4 version and precache entries.
- ZIP created from the complete project tree.

## Not verified
- No deploy was made to the live Vercel project.
- No integration test against the user's real Redis or Blob, no real sign-in/API test against production, and no Lighthouse or real device performance measurement has been performed in this turn.
- Do not promote to production until preview testing covers login, admin, upload, exam import/publish/start/save/submit/review, existing student history, mobile navigation and offline/cache refresh. Back up Redis and keep the existing production deployment available for rollback.

## Deploy recommendation
Upload the *contents* of `phuc-k9-web-main/` to a separate branch with `index.html` at the repository root, not the ZIP itself. Connect the Preview deployment to the same environment variable names through Vercel settings without exposing values. Test Preview first; only promote when existing records and all main flows pass.
