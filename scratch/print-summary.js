const fs = require('fs');
const list = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/scratch/teacher-sources-summary.json', 'utf8'));
list.forEach((t, i) => {
  const tabs = t.col7_tabs.length ? ('col7: ' + t.col7_tabs.join(', ')) : (t.col4_tabs.length ? ('col4: ' + t.col4_tabs.join(', ')) : 'NO SHEETS');
  console.log(`${i}. [${t.subject}] ${t.name.slice(0, 40)} -> ${tabs}`);
});
