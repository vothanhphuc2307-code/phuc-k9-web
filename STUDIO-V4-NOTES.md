# Học Cùng Phúc K9 — Studio V4 Studybook + Performance

## Visual changes
- Added a subtle ruled-paper canvas and schoolbook palette: cream, lavender, mint, peach and butter yellow.
- Added small static emoji stickers (books, pencil, lab flask, division, star, flower) as decorative accents; no continuously moving emoji/particle effects.
- Added subject-based sticker marks on shortcut cards, hand-highlight styling on headings and paper-like edges.
- Applied a coordinated pastel/paper treatment to existing lesson, exam-bank, PDF, dashboard and admin card families without changing their API/data schemas.
- Kept the existing dedicated mobile layout and tuned stickers and touch behavior for small screens.

## Performance changes
- Replaced the course visual script's body-wide mutation callback with observers scoped to the chapter grid and chapter accordion.
- Replaced the visual-rail script's body-wide media scan on every mutation with a home-tab observer; only newly inserted nodes are inspected.
- Removed the V38 global body observer that re-scanned up to 160 items and recreated reveal observers after arbitrary DOM changes. Initial setup, navigation and auth refreshes remain.
- Narrowed the dashboard observer's callback to relevant Admin node insertions, retaining auth-sync handling.
- Moved the existing fallback JPEG from an inline base64 script string to `assets/phuc-k9-fallback-teacher.jpg`; its image content is unchanged and is only needed when an image fails.
- Reduced global transition properties, disabled card lift effects on touch devices, and removed reveal transitions from hundreds of legacy elements. No new perpetual animations or scroll listeners.
- Updated Service Worker cache identifier to `phuc-k9-studio-v4-studybook`.

## Validation
- Syntax checks of inline JS and project API files, JSON validation, CSS parsing where supported, JPEG signature verification, ZIP integrity check.
- Not deployed to Vercel; no production Redis/Blob tests, no Lighthouse metrics, and no production browser screenshot are claimed. Validate through a Vercel Preview before publishing.
