# HỌC CÙNG PHÚC K9 — Midnight Aurora / Ecosystem Upgrade

## Giao diện
- Rebuilt visual layer with the Midnight Aurora design system: navy/purple/cyan palette, gradient hero, glass surfaces, sharper type hierarchy and more consistent spacing.
- Desktop: fixed navigation rail, wider content canvas, desktop search and compact account actions.
- Mobile: independent compact top bar, dedicated search button, seven-item bottom navigation, stacked learning layouts and larger touch controls.
- Motion: short page entrances, layered hover states and a 3D flashcard flip. Reduced-motion preferences are respected.
- Typography: Space Grotesk for display headings and Manrope/DM Sans for interface text, with system fallbacks.

## Hệ sinh thái học tập
- Preserved existing Toán, Tiếng Anh, Vật lí, Hóa học, exam, PDF, Drive, community, profile and admin routes.
- Added a dedicated Sinh học 12 hub using the links already present in the supplied source and the included Điện Biên Biology PDF. External resources open at their source; no new lesson links were invented.
- Added global search / command palette. Open with Ctrl+K or ⌘K, search routes and Math lesson titles, move with arrow keys and open with Enter.
- Added a flashcard workspace with sample cards, subject filters, search, shuffle, create/edit/delete, flip-to-reveal, review counts, and JSON import/export for moving decks between devices.
- Flashcard decks and review counts are stored in localStorage on the current device/browser. They are not synced to the account or Redis.
- Exposed the existing Math course catalog as `window.courseData` so dashboard, progress and global lesson search can read the same dataset.

## Technical preservation
- No changes were made to `api/`, `lib/`, Redis, Blob, authentication, environment variable names or the existing Vercel API contracts.
- Added `assets/phuck9-vip.css` and `assets/phuck9-vip.js`.
- Updated `sw.js` cache key and precache list so browsers do not keep the older UI bundle.

## Validation
- `node --check` passed for the new UI JavaScript and service worker.
- CSS parsing passed with no parser errors for the base stylesheet, Study Atelier stylesheet and new VIP stylesheet.
- JSON parsing passed for `package.json`, `vercel.json`, `manifest.webmanifest` and `exam-template.json`.
- Live browser rendering was not verified in this environment because the isolated browser runtime blocked local page navigation.
- No production deployment, sign-in/API integration, Redis/Blob integration, Lighthouse, or real-device test was performed.

## Deployment
1. Extract this ZIP and upload the **contents** of `phuc-k9-web-main/` into the repository root so `index.html` remains at the root.
2. Keep all existing Vercel environment variables unchanged.
3. Deploy to a Vercel Preview first.
4. Test sign-in, sign-out, dashboard, admin, Math/English/Physics/Chemistry pages, new Biology page, command search, flashcards, PDF links, uploads and mobile navigation.
5. Promote only after those flows pass. Back up Redis/Blob data before any production change.
