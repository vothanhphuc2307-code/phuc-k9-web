const fs = require('fs');
const path = require('path');

const file = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('Total checked rows:', data.length);
const subjects = {};
data.forEach(t => {
  const subj = t.subject || 'OTHER';
  subjects[subj] = subjects[subj] || [];
  subjects[subj].push(t);
});

for (const [subj, teachers] of Object.entries(subjects)) {
  console.log(`\n=== Subject: ${subj} (${teachers.length} entries) ===`);
  teachers.forEach(t => {
    console.log(`- ${t.teacher || t.name}`);
    console.log(`    col7: ${t.col7_status || 'none'} (${t.col7_id || ''})`);
    console.log(`    col4: ${t.col4_status || 'none'} (${t.col4_id || ''})`);
    console.log(`    col6: ${t.col6_status || 'none'} (${t.col6_id || ''})`);
  });
}
