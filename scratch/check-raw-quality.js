const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
const raw = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));

raw.forEach((r, i) => {
  const ls = r.lessons || [];
  const prs = r.pdfRows || [];
  const pipeSecs = ls.filter(l => (l.section || '').includes(' | ')).length + prs.filter(p => (p.section || '').includes(' | ')).length;
  const genericTitles = ls.filter(l => /^(học livestream|bài giảng|video|xem video|link|chữa bài)$/i.test((l.title || '').trim())).length;
  const titlesCount = new Map();
  for (const l of ls) titlesCount.set(l.title, (titlesCount.get(l.title) || 0) + 1);
  const topDup = [...titlesCount.entries()].sort((a,b) => b[1]-a[1])[0];
  if (pipeSecs > 0 || genericTitles > 0 || (topDup && topDup[1] > 5) || ls.length === 0) {
    console.log(`${i}. [${r.subject}] ${r.sheetTitle || r.rawName} | L=${ls.length} PR=${prs.length} | pipeSecs=${pipeSecs} generic=${genericTitles} | topDup=${topDup ? `"${topDup[0]}" x${topDup[1]}` : 'none'}`);
  }
});
