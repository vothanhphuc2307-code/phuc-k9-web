# Học Cùng Phúc K9 — Study Atelier Source Hub V3

This is a source-backed cleanup of the Study Atelier project. It keeps the existing Vercel/API/authentication/data architecture, but removes unsupported online-exam UI and only exposes local PDFs that can be matched to a reference source.

## Current user-facing areas

- Study Atelier home shell, desktop sidebar and mobile bottom navigation.
- Course/video pages retained from the source.
- **Khóa học 2K8** page with a direct link to the Google Sheet the user supplied and an optional iframe that loads only after the user clicks the preview button.
- **Đề PDF có nguồn** with two actual PDFs already present in `exam-sources/`:
  - `lam-dong-toan-2026-lan-1.pdf`: the 2026 Lâm Đồng Grade-12 Math quality-assessment paper (not a midterm exam).
  - `dien-bien-sinh-2026-ma-0401.pdf`: the 2026 Điện Biên Grade-12 Biology graduation-practice paper, code 0401 (not a midterm exam).
- Unsupported “midterm/semester” and auto-scored exam sections remain hidden. These PDFs have open/download/source buttons only; the site does not pretend they are connected to an online test player.
- The generic Drive section links to the existing folder without claiming its contents are an exact exam set until those files have been checked.

## Google Sheet limitation

The supplied Google Sheet is linked exactly as provided, but its rows could not be fetched from this environment. The URL has different `gid` values in its query and fragment; this source does not guess which one is the 2K8 tab. To render native course cards, export **only the correct 2K8 tab** to CSV or XLSX and add that file to the project. No course names, teachers, prices or URLs have been invented.

## Important files

- `index.html`: shell, course tabs and source-backed PDF list.
- `style.css`: loading, motion and responsive styles for the course and PDF pages.
- `assets/phuck9-study-atelier.css` / `assets/phuck9-study-atelier.js`: Study Atelier shared UI.
- `assets/pk9-source-hub.js`: only source-backed PDF cards, filters, sheet button/embed, and guards against old generated exam routes.
- `api/` and `lib/`: existing Vercel functions, auth, Redis/Blob code. They were not intentionally migrated or removed.
- `sw.js`: cache version bumped to avoid reusing the previous app shell.

## Local static validation

- 54 inline JavaScript blocks passed `node --check` (JSON-LD skipped).
- `assets/pk9-source-hub.js`, `assets/site-effects.js`, `assets/phuck9-study-atelier.js` and `sw.js` passed syntax checks.
- `style.css` and `assets/phuck9-study-atelier.css` passed `tinycss2` parsing.
- `package.json`, `vercel.json` and `exam-template.json` are valid JSON.
- Verified that the two PDFs exist in the package, the three unsupported exam tabs are absent, and no visible HTML click handlers call the old start/submit exam functions.

## Before deploy

1. Back up the repository and create a separate branch.
2. Extract the ZIP; upload the **contents** of `phuc-k9-web-main/` into the repository root (not the ZIP itself, not a nested second project folder).
3. Do not delete or rename Vercel environment variables, Redis data or Blob data.
4. Deploy the branch as a Vercel Preview first.
5. Test login, course/video pages, the 2K8 source button, the two PDFs, documents, profile/dashboard, Admin upload and browser console before promoting to Production.
6. The source was not deployed from this environment. Live Redis/Blob/API and production rendering still require Preview testing.
