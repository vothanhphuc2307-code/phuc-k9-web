const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
const raw = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));

for (const idx of [0, 1, 2, 11, 15, 24, 34, 37, 40]) {
  const r = raw[idx];
  console.log(`\n=== [${idx}] ${r.subject} | ${r.sheetTitle} ===`);
  const byHintSec = new Map();
  for (const l of r.lessons || []) {
    const key = `${l.chapterHint || ''} >>> ${l.section || ''}`;
    if (!byHintSec.has(key)) byHintSec.set(key, []);
    byHintSec.get(key).push(l.title);
  }
  console.log('Total unique (hint >>> section) from lessons:', byHintSec.size);
  let c = 0;
  for (const [k, titles] of byHintSec) {
    if (c++ < 8) {
      console.log(`  [${titles.length}] ${k} => ex: ${titles.slice(0, 3).join(' | ')}`);
    }
  }
  if ((r.pdfRows || []).length) {
    const pHints = new Map();
    for (const pr of r.pdfRows) {
      const k = `${pr.chapterHint || ''} >>> ${pr.section || ''}`;
      if (!pHints.has(k)) pHints.set(k, []);
      pHints.get(k).push(pr.title);
    }
    console.log('Total unique (hint >>> section) from pdfRows:', pHints.size, '(rows:', r.pdfRows.length, ')');
    let pc = 0;
    for (const [k, titles] of pHints) {
      if (pc++ < 4) console.log(`  PDF [${titles.length}] ${k} => ex: ${titles.slice(0, 3).join(' | ')}`);
    }
  }
}
