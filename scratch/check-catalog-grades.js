const fs = require('fs');
const path = require('path');

const base = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/assets';
const window = {};
eval(fs.readFileSync(path.join(base, 'pk9-curriculum.js'), 'utf8'));
eval(fs.readFileSync(path.join(base, 'pk9-2k9-manifest.js'), 'utf8'));
eval(fs.readFileSync(path.join(base, 'pk9-2k8-curated.js'), 'utf8'));
eval(fs.readFileSync(path.join(base, 'pk9-2k8-dgnl.js'), 'utf8'));

console.log('PK9_CATALOG total:', (window.PK9_CATALOG || []).length);
const byGrade = {};
for (const c of window.PK9_CATALOG || []) {
  byGrade[c.grade] = (byGrade[c.grade] || 0) + 1;
}
console.log('By grade:', byGrade);
console.log('Sample 2K8 Pro:', (window.PK9_CATALOG || []).filter(c => c.grade === '2K8 Pro' || c.grade === '2K8').map(c => `${c.id} (${c.subject}, ${c.teacher}, ch=${(c.chapters||[]).length}, t=${(c.chapters||[]).reduce((s,x)=>s+(x.topics||[]).length,0)})`));
console.log('Sample DGNL:', (window.PK9_CATALOG || []).filter(c => c.grade === 'DGNL' || c.grade === 'ĐGNL' || (c.subject||'').includes('ĐGNL') || (c.subject||'').includes('TSA')).map(c => `${c.id} (${c.grade} | ${c.subject} | ${c.teacher}, ch=${(c.chapters||[]).length})`));
