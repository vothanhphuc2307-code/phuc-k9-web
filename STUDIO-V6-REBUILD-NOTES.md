# Phúc K9 Studio V6 — rebuild notes

## Why this rebuild exists
Earlier UI updates accumulated multiple overlapping visual styles, duplicated navigation/animation handlers, and remote font dependencies. This version removes selected obsolete visual layers and uses a stable local system-font stack for Vietnamese text.

## Changes made
- Rebuilt the home screen into a notebook-style layout with subject tiles, progress, resume area, study timer, checklist, quick notes, and chapter cards.
- Replaced the previous generated homepage injector and legacy sidebars with `assets/phuck9-studio-v6.js`, which mounts one desktop sidebar and one mobile bottom navigation and routes into existing tabs through `switchTab`.
- Added `assets/phuck9-studio-v6.css` for the paper/lavender/mint/peach design system, responsive behavior, reduced-motion handling, typography, and shared card styles.
- Removed obsolete UI-only styles/scripts that created competing sidebar/navigation/reveal/ripple effects. Preserved auth, admin, exam, upload, dashboard, and backend business logic.
- Removed the external Google font dependency and set the base font stack to Segoe UI/Arial; headlines use Georgia to support the school-notebook visual language.
- Updated generic old blue/purple cards on non-home tabs to paper/pastel colors; semantic red/green result states are intentionally not globally recolored.
- Updated the Service Worker cache namespace to force clients to fetch the rebuilt shell.

## Further cleanup completed
- Removed the old homepage-specific `home-v2` polling renderer and the older growth-hero injector, replacing their daily recall prompt with a native, self-contained 8-question quick-review card in the new homepage.
- Removed duplicate/obsolete visual effects and mobile quickbar handlers that conflicted with the new navigation.
- Fixed the favicon link to reference the existing `assets/phuc-k9-favicon.png`.
- HTML shrank from 1,495,743 bytes in the V5 workspace to 1,262,065 bytes in V6 (15.6% smaller); this is a source-size measurement, not a claim of runtime speed improvement.

## Verification
- Syntax/structure checks were run on JavaScript, CSS, JSON, and local asset references.
- This package has **not** been deployed to Vercel. Production Redis/Blob, authentication and browser visuals still require a Preview deployment test.
- No Lighthouse/FPS benchmark is claimed because reliable before/after browser measurements were not available in this run.
