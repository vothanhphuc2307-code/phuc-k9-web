const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
const raw2k8 = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));
const sheet2k8 = JSON.parse(fs.readFileSync(path.join(scratchDir, 'sheet-2k8.json'), 'utf8'));

console.log('--- ALL 45 2K8 TEACHERS DETAILS ---');
raw2k8.forEach((r, i) => {
  const lessons = r.lessons || [];
  const pdfRows = r.pdfRows || [];
  console.log(`${i}. row=${r.row} [${r.subject}] raw="${r.rawName}" title="${r.sheetTitle}" | L=${lessons.length} PDFR=${pdfRows.length}`);
  if (lessons.length === 0 && pdfRows.length === 0) {
    const sr = sheet2k8.find(x => x.row === r.row);
    console.log('   sheet2k8 row:', JSON.stringify(sr));
  }
});
