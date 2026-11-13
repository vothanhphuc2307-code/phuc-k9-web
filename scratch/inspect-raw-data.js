const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';

function inspectJson(name) {
  const fp = path.join(scratchDir, name);
  if (!fs.existsSync(fp)) {
    console.log(name, 'MISSING');
    return;
  }
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  if (Array.isArray(data)) {
    console.log(`\n=== ${name} (array len=${data.length}) ===`);
    console.log('keys[0]:', data[0] ? Object.keys(data[0]) : 'empty');
    if (name === '2k9-teachers-raw.json') {
      data.slice(0, 6).forEach((row, idx) => {
        const secs = new Set((row.lessons || []).map(l => l.section).filter(Boolean));
        const hints = new Set((row.lessons || []).map(l => l.chapterHint).filter(Boolean));
        console.log(`Row ${idx}: ${row.subject} | ${row.teacherName} | lessons=${(row.lessons||[]).length} | pdfRows=${(row.pdfRows||[]).length} | secs=${secs.size} (${[...secs].slice(0,4).join(' ; ')}) | hints=${hints.size} (${[...hints].slice(0,4).join(' ; ')})`);
        if (row.lessons && row.lessons[0]) {
          console.log('  sample lesson[0]:', JSON.stringify(row.lessons[0]).slice(0, 260));
        }
        if (row.pdfRows && row.pdfRows[0]) {
          console.log('  sample pdfRow[0]:', JSON.stringify(row.pdfRows[0]).slice(0, 220));
        }
      });
    } else if (name === '2k8-dgnl-raw.json') {
      data.forEach((row, idx) => {
        console.log(`DGNL ${idx}:`, Object.keys(row), row.title || row.name || row.track || row.category, 'items:', (row.items||row.lessons||row.chapters||[]).length);
      });
      console.log('sample[0]:', JSON.stringify(data[0]).slice(0, 400));
    } else {
      console.log('sample[0]:', JSON.stringify(data[0]).slice(0, 400));
    }
  } else {
    console.log(`\n=== ${name} (object keys=${Object.keys(data).join(', ')}) ===`);
    for (const k of Object.keys(data).slice(0, 5)) {
      const v = data[k];
      console.log(`  key ${k}:`, Array.isArray(v) ? `array(${v.length}) sample=${JSON.stringify(v[0]).slice(0, 220)}` : typeof v);
    }
  }
}

for (const f of ['2k9-teachers-raw.json', 'sheet-2k8.json', '2k8-dgnl-raw.json', '2k8-curated-raw.json']) {
  inspectJson(f);
}
