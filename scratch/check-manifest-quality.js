const fs = require('fs');
const content = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/assets/pk9-2k9-manifest.js', 'utf8');
const m = content.match(/const full2k9 = (\[[\s\S]*?\]);\s*window\.PK9_CATALOG/);
const list = JSON.parse(m[1]);
console.log('Total entries:', list.length);
const ids = new Set();
const dupes = [];
list.forEach(t => {
  if (ids.has(t.id)) dupes.push(t.id);
  ids.add(t.id);
  console.log(`[${t.subject}] ${t.id} -> ${t.name} (${t.topicCount} topics, ${t.videoCount} videos, ${t.pdfFileCount} PDFs, ${t.chapterCount} chs)`);
});
console.log('\nDuplicates:', dupes);
