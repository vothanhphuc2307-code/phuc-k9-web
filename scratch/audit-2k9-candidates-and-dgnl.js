const https = require('https');
const fs = require('fs');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 8000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ status: res.statusCode, ok: (res.statusCode >= 200 && res.statusCode < 400 && !blocked), hasEntries: body.includes('flip-entry'), entryCount: (body.match(/flip-entry-title/g) || []).length });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false }));
    req.setTimeout(6000, () => { req.destroy(); resolve({ status: 0, ok: false }); });
  });
}

async function checkYt(id) {
  const r = await checkUrl(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
  return r.status === 200;
}

async function main() {
  const appDir = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
  const scratchDir = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch';

  const window = {};
  eval(fs.readFileSync(path.join(appDir, 'assets/pk9-2k9-manifest.js'), 'utf8'));
  const targets = [
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
  console.log('=== DEEP AUDIT OF 8 2K9 PUBLIC CANDIDATES (10 samples each) ===');
  for (const c of (window.PK9_CATALOG || []).filter(x => targets.includes(x.id))) {
    const fn = path.basename(c.dataFile);
    if (!cache[fn]) cache[fn] = JSON.parse(fs.readFileSync(path.join(appDir, 'assets/2k9-teachers', fn), 'utf8'));
    const chs = cache[fn][c.id] || [];
    const urls = [];
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        for (const u of [t.dv, t.p, t.sp, ...(t.ep||[]).map(x=>x.url)]) {
          if (u && urls.length < 15 && !urls.includes(u)) urls.push(u);
        }
      }
    }
    let ok = 0, fail = 0, folderItems = [];
    for (const u of urls.slice(0, 10)) {
      const m = u.match(/\/folders\/([A-Za-z0-9_-]+)/);
      const testUrl = m ? `https://drive.google.com/embeddedfolderview?id=${m[1]}#list` : u;
      const r = await checkUrl(testUrl);
      if (r.ok) ok++; else fail++;
      if (m) folderItems.push(r.entryCount);
    }
    console.log(`${c.id}: ok=${ok}/10 fail=${fail}/10 folderEntries=${JSON.stringify(folderItems.slice(0,5))}`);
  }

  console.log('\n=== CHECK YOUTUBE IN 2K8 DGNL ===');
  const dgnl = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));
  for (const r of dgnl) {
    const ytIds = [...new Set((r.lessons||[]).map(l=>l.videoId).filter(Boolean))];
    let ytOk = 0, ytFail = 0;
    for (const id of ytIds.slice(0, 8)) {
      if (await checkYt(id)) ytOk++; else ytFail++;
    }
    const dvUrls = [...new Set((r.lessons||[]).map(l=>l.driveVideoUrl).filter(Boolean))];
    let dvOk = 0, dvFail = 0;
    for (const u of dvUrls.slice(0, 5)) {
      const m = u.match(/\/folders\/([A-Za-z0-9_-]+)/);
      const testUrl = m ? `https://drive.google.com/embeddedfolderview?id=${m[1]}#list` : u;
      const res = await checkUrl(testUrl);
      if (res.ok) dvOk++; else dvFail++;
    }
    const pdfUrls = [...new Set((r.lessons||[]).map(l=>l.pdfUrl).filter(Boolean))];
    let pdfOk = 0, pdfFail = 0;
    for (const u of pdfUrls.slice(0, 5)) {
      const m = u.match(/\/folders\/([A-Za-z0-9_-]+)/);
      const testUrl = m ? `https://drive.google.com/embeddedfolderview?id=${m[1]}#list` : u;
      const res = await checkUrl(testUrl);
      if (res.ok) pdfOk++; else pdfFail++;
    }
    console.log(`[${r.examGroup}] ${r.teacher} (tot=${(r.lessons||[]).length}): YT ${ytOk}/${Math.min(8,ytIds.length)} | DV ${dvOk}/${Math.min(5,dvUrls.length)} (fail=${dvFail}) | PDF ${pdfOk}/${Math.min(5,pdfUrls.length)} (fail=${pdfFail})`);
  }
}

main();
