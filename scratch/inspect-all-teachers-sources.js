const fs = require('fs');
const file = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

console.log('Total entries:', data.length);

const summary = data.map(t => {
  const col7 = (t.checked || []).find(c => c.col === 7 && c.ok);
  const col4 = (t.checked || []).find(c => c.col === 4 && c.ok);
  const col6 = (t.checked || []).find(c => c.col === 6 && c.ok);
  return {
    subject: t.subject,
    name: t.name,
    col7_id: col7 ? col7.id : null,
    col7_tabs: col7 ? col7.tabs : [],
    col4_id: col4 ? col4.id : null,
    col4_tabs: col4 ? col4.tabs : [],
    col6_id: col6 ? col6.id : null,
    col6_tabs: col6 ? col6.tabs : []
  };
});

fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/scratch/teacher-sources-summary.json', JSON.stringify(summary, null, 2));
console.log('Saved teacher-sources-summary.json');
