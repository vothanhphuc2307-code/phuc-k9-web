const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
const appDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\phuc-k9-web';

const raw2k8 = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));
console.log('=== 2K8 TEACHERS RAW (45 rows) ===');
raw2k8.forEach((r, i) => {
  const lessons = r.lessons || [];
  const pdfRows = r.pdfRows || [];
  const ytCount = lessons.filter(l => l.videoId).length;
  const dvCount = lessons.filter(l => l.driveVideoUrl).length;
  const pdfCount = lessons.filter(l => l.pdfUrl || l.solutionPdfUrl || (l.extraPdfs && l.extraPdfs.length)).length;
  const headerLikeSec = lessons.filter(l => /THỜI GIAN|Buổi|Tên bài|Tài liệu|Bài giảng/i.test(l.section || '')).length;
  const secs = [...new Set(lessons.map(l => l.section).filter(Boolean))];
  const hints = [...new Set(lessons.map(l => l.chapterHint).filter(Boolean))];
  console.log(`${i}: [${r.subject}] ${r.rawName} | L=${lessons.length} (YT=${ytCount}, DV=${dvCount}, LPDF=${pdfCount}) | PDFR=${pdfRows.length} | hints=${hints.length} secs=${secs.length} (hdrSec=${headerLikeSec})`);
  if (secs.length <= 4 && secs.length > 0) console.log('   secs:', secs.join(' || '));
  else if (secs.length > 4) console.log('   sample secs:', secs.slice(0, 3).join(' || '));
  if (hints.length > 0) console.log('   hints:', hints.slice(0, 4).join(' || '));
});

const dgnl = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));
console.log('\n=== 2K8 DGNL RAW ===');
dgnl.forEach((r, i) => {
  const secs = [...new Set((r.lessons || []).map(l => l.section).filter(Boolean))];
  const cts = [...new Set((r.lessons || []).map(l => l.courseTitle).filter(Boolean))];
  console.log(`${i}: [${r.examGroup}] p=${r.priority} ${r.teacher} | L=${(r.lessons||[]).length} | cts=${cts.length} secs=${secs.length}`);
  console.log('   cts:', cts.slice(0, 3).join(' || '));
});
