const https = require('https');
const fs = require('fs');

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 3000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ status: res.statusCode, ok: (res.statusCode >= 200 && res.statusCode < 400 && !blocked) });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false, err: e.message }));
    req.setTimeout(6000, () => { req.destroy(); resolve({ status: 0, ok: false, err: 'timeout' }); });
  });
}

async function main() {
  const raw2k8 = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-teachers-raw.json', 'utf8'));
  console.log('Total teachers in 2k9-teachers-raw.json (from sheet 2K8):', raw2k8.length);

  for (const t of raw2k8) {
    const lessons = t.lessons || [];
    const pdfRows = t.pdfRows || [];
    const sections = new Set(lessons.map(l => l.section).filter(Boolean));
    const chapters = new Set(lessons.map(l => l.chapterHint).filter(Boolean));

    const yt = lessons.find(l => l.videoId);
    const dv = lessons.find(l => l.driveVideoUrl);
    const pdf = lessons.find(l => l.pdfUrl) || (pdfRows[0]?.pdfs?.[0] ? { pdfUrl: pdfRows[0].pdfs[0].url } : null);

    const [ytOk, dvOk, pdfOk] = await Promise.all([
      yt ? checkUrl(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${yt.videoId}&format=json`).then(r => r.status === 200) : Promise.resolve(null),
      dv ? checkUrl(dv.driveVideoUrl.replace('/view', '/preview')).then(r => r.ok) : Promise.resolve(null),
      pdf ? checkUrl(pdf.pdfUrl).then(r => r.ok) : Promise.resolve(null)
    ]);

    console.log(`[Row ${t.row}] ${t.subject} | ${t.rawName.slice(0, 35)} | lessons=${lessons.length} pdfRows=${pdfRows.length} sections=${sections.size} chHints=${chapters.size} | YT=${ytOk} DV=${dvOk} PDF=${pdfOk}`);
  }
}

main();
