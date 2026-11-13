const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
const appDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\phuc-k9-web';

const raw2k8 = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));
const dgnl2k8 = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));

const ytSet = new Set();
const driveSet = new Set();
for (const r of raw2k8) {
  for (const l of r.lessons || []) {
    if (l.videoId) ytSet.add(l.videoId);
    for (const u of [l.driveVideoUrl, l.videoUrl, l.pdfUrl, l.solutionPdfUrl, ...(l.extraPdfs||[]).map(x=>x.url)]) {
      if (u && u.includes('drive.google.com')) driveSet.add(u);
    }
  }
  for (const pr of r.pdfRows || []) {
    for (const p of pr.pdfs || []) {
      if (p.url && p.url.includes('drive.google.com')) driveSet.add(p.url);
    }
  }
}
for (const r of dgnl2k8) {
  for (const l of r.lessons || []) {
    if (l.videoId) ytSet.add(l.videoId);
    for (const u of [l.driveVideoUrl, l.videoUrl, l.pdfUrl, l.solutionPdfUrl, ...(l.extraPdfs||[]).map(x=>x.url)]) {
      if (u && u.includes('drive.google.com')) driveSet.add(u);
    }
  }
}

console.log(`2K8+DGNL unique YT: ${ytSet.size}, unique Drive URLs: ${driveSet.size}`);

// Inspect how many lessons have section vs chapterHint in 2K8 raw
let totalLessons = 0, totalPdfRows = 0, lessonsWithPdf = 0, lessonsWithVid = 0;
for (const r of raw2k8) {
  totalLessons += (r.lessons||[]).length;
  totalPdfRows += (r.pdfRows||[]).length;
  for (const l of r.lessons || []) {
    if (l.pdfUrl || l.solutionPdfUrl || (l.extraPdfs&&l.extraPdfs.length)) lessonsWithPdf++;
    if (l.videoId || l.driveVideoUrl) lessonsWithVid++;
  }
}
console.log(`2K8 totalLessons=${totalLessons} (withVid=${lessonsWithVid}, withPdf=${lessonsWithPdf}), totalPdfRows=${totalPdfRows}`);

// Check if any 2K9 courses have ALL public PDFs or what percentage of 2K9 folder courses are Drive files vs folders
const window = {};
eval(fs.readFileSync(path.join(appDir, 'assets/pk9-2k9-manifest.js'), 'utf8'));
const public2k9Ids = [
  '2k9-toan-toan-anh-giao-kid',
  '2k9-dgnl-bo-tro-tsa-hsa',
  '2k9-toan-thay-nguyen-phan-tien',
  '2k9-vat-li-thay-vu-tuan-anh',
  '2k9-vat-li-thay-nguyen-dang-ai-bui-xuan-dat',
  '2k9-ngu-van-co-suong-mai',
  '2k9-dia-li-co-mai-anh-lop-hoc-dia-ly',
  '2k9-dgnl-danh-gia-tu-duy-bmc-2009'
];
const cache = {};
for (const c of (window.PK9_CATALOG || []).filter(x => public2k9Ids.includes(x.id))) {
  const fn = path.basename(c.dataFile);
  if (!cache[fn]) cache[fn] = JSON.parse(fs.readFileSync(path.join(appDir, 'assets/2k9-teachers', fn), 'utf8'));
  const chs = cache[fn][c.id] || [];
  let yt=0, dv=0, pFile=0, pDir=0, tot=0;
  for (const ch of chs) {
    for (const t of ch.topics || []) {
      tot++;
      if (t.v) yt++;
      if (t.dv) dv++;
      const ps = [t.p, t.sp, ...(t.ep||[]).map(x=>x.url)].filter(Boolean);
      for (const u of ps) {
        if (u.includes('/folders/')) pDir++;
        else pFile++;
      }
    }
  }
  console.log(`2K9 candidate ${c.id}: chapters=${chs.length}, topics=${tot}, yt=${yt}, dv=${dv}, pFile=${pFile}, pDir=${pDir}`);
}
