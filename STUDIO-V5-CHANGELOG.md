# Học Cùng Phúc K9 — Studio V5 Study Desk

## Design direction
- Student studybook aesthetic: warm paper/ruled-note surface, calm lavender, mint, peach and butter accent colors; small static stickers rather than floating emoji.
- Adds a daily Study Desk section with distinct desktop, tablet and phone layouts.
- Applies a scoped color bridge to common legacy blue/indigo utility classes in app content, making old lesson/exam cards closer to the new palette without changing backend data/API contracts.
- New theme storage key `phuc_theme_studio_v5`; fresh browser profile opens in light paper theme, while dark mode remains user-toggleable.

## New functional features (browser-local only)
1. Focus timer: 25 min, 50 min and 5 min presets; start/pause/reset; deadline-based countdown survives background-tab throttling and reload; finished focus sessions counted on the current browser.
2. Daily checklist: three starter tasks; add, check and delete; up to eight tasks per day; refreshes by local calendar date.
3. Quick scratch note: up to 2,000 characters, auto-saved to localStorage after a short debounce; clear requires confirmation.

The timer, tasks and note are saved in the browser on the current device. They do not sync to the user's account or backend; the interface labels this explicitly.

## Performance / accessibility
- Retains targeted mutation observers and lazy media-loading changes in V4.
- Adds no continuous particle/emoji animation; disables selected legacy pulse/ping/bounce decoration within app content.
- Uses short state transitions, a responsive layout, keyboard focus styling and `prefers-reduced-motion` support.
- Advances Service Worker cache identifier to `phuc-k9-studio-v5-study-desk`.

## Checks and limitations
- ZIP integrity passed; 75 inline JavaScript blocks passed `node --check`; 82 CSS blocks parsed with zero parser errors; packaged JSON and webmanifest parse successfully.
- A small Node DOM-harness test passed the timer default/preset/countdown/pause persistence, checklist add, and note auto-save flows. Browser screenshots and full end-to-end UI behavior could not be confirmed because available Chromium navigation was blocked by the environment. Timer/task/note features have not been tested against production backend, and no Vercel/Redis/Blob/Lighthouse benchmark is claimed.
- Test through a Vercel Preview before publishing to Production. Preserve current environment variables and data.
