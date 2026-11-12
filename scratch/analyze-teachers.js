const fs = require('fs');
const file = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

console.log('=== TEACHERS WITH VALID COL7 ===');
data.forEach(t => {
  const col7 = (t.checked || []).find(c => c.col === 7 && c.ok);
  if (col7) {
    console.log(`[${t.subject}] ${t.name} -> ID: ${col7.id} | Tabs: ${col7.tabs.join(', ')}`);
  }
});

console.log('\n=== TEACHERS WITH VALID COL4/6 ONLY ===');
data.forEach(t => {
  const col7 = (t.checked || []).find(c => c.col === 7 && c.ok);
  const col4 = (t.checked || []).find(c => (c.col === 4 || c.col === 6) && c.ok);
  if (!col7 && col4) {
    console.log(`[${t.subject}] ${t.name} -> ID: ${col4.id} | Tabs: ${col4.tabs.join(', ')}`);
  }
});

console.log('\n=== NO VALID SHEETS ===');
data.forEach(t => {
  const col7 = (t.checked || []).find(c => c.col === 7 && c.ok);
  const col4 = (t.checked || []).find(c => (c.col === 4 || c.col === 6) && c.ok);
  if (!col7 && !col4) {
    console.log(`[${t.subject}] ${t.name} -> Links: ${JSON.stringify(t.links)}`);
  }
});
