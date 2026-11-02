# PHÚC K9 — Ecosystem V2 (2026-11-02)

## Giao diện / ổn định
- Added a final UI layer focused on interaction consistency and responsive layout.
- Mobile has five primary destinations plus a dedicated More sheet for the remaining modules. The old floating mobile quickbar and legacy header are hidden to prevent duplicate navigation.
- Added restrained CSS 3D depth to the study hero, floating orbital accents, and card hover depth; reduced-motion preferences disable continuous motion.
- Rebuilt the 2K8 section as an actual embedded Google Sheets preview using the intended tab `gid=662446747`, with a direct-open fallback and clear permission note. Google may block iframe embedding if the owner has not enabled link viewing.

## New study features
- Weekly/day-based study planner with subject, date, duration, note, completion status and delete. Stored in browser localStorage, not synced to account/backend.
- Saved-resource library: bookmark/unbookmark local PDFs and externally sourced exam materials, with search and source links. Also localStorage only.
- Expanded learning network with selected third-party course/material hubs; links open at source and are labelled as reference libraries.

## Real exam/resource library
- Added 29 curated source entries. These include verified subject folders from Trường THPT số 1 Ngô Gia Tự for Grade 12 mid-term II and final-term II exams/answer keys in 2025–2026, plus the school-wide exam archive and study-material archive. Source page remains attached to each entry.
- Added selected DOL THPT 2026 trial-exam source pages for KTPL, Literature, History and Technology. Clearly labelled as practice/trial material, not Ministry-issued official exam documents. Added Government News pages referencing the 2026 national Math/Physics papers and official answer-key publication; source cards distinguish papers, answer keys, and structure documents.
- Added Ministry Quality Management Department structure/illustrative exam source, Government News article about official 2025 answer-key publication, and school matrix/specification source.
- Kept the two existing local PDFs and their source links. No external exam contents were copied into this repository. The source catalog is curated and is not claimed to be an exhaustive crawl of every school or publisher.

## Code / deployment
- Added `assets/phuck9-ecosystem-v2.css` and `assets/phuck9-ecosystem-v2.js`.
- Rewrote `assets/pk9-source-hub.js` to implement delegated source filtering and 2K8 embed toggle consistently.
- Extended global search route entries for Planner and Saved Resources.
- Bumped service-worker cache namespace to force new CSS/JS.
- No changes to `api/`, authentication, Redis, Blob or environment-variable contracts.

## Known limitations / validation
- This build can provide a direct iframe to the 2K8 Google Sheet, but cannot override Google sharing permissions or guarantee that an owner-restricted sheet will embed.
- Externally hosted Google Drive folders and DOL pages can change or require sign-in; each card retains a link to its publisher/source page.
- Planner and saved resources are device/browser-local, not cross-device account sync.
- Checked JavaScript syntax for all changed scripts, CSS parsing, JSON/package metadata, 463 HTML IDs (no duplicates), local asset references (none missing), all 29 source records (unique IDs and source links), responsive navigation structure, and presence of the 2K8 iframe. An automated Chromium visual smoke test was attempted but this environment blocked local/file navigation, so a real browser/device pass, Vercel Preview login/API integration, and Google Sheet iframe permission test are still required before production promotion.

## Second-pass interaction fixes
- Fixed a syntax error in the 2K8 preview handler that could halt later feature initialization.
- Removed duplicate handlers from the exam/source hub so filtering and sheet preview are controlled in one place.
- Fixed saved-resource page rendering/removal and bookmark button state updates.
- Fixed command-palette routes for Planner and Saved Resources.
- Mobile navigation now keeps five primary routes plus a More sheet; the More sheet overlay class now matches its animation styles.
- Added additional 2026 public exam/answer-key reference pages and school archive links.
