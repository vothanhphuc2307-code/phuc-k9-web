const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 25000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ status: res.statusCode, loc, ok: res.statusCode >= 200 && res.statusCode < 400 && !blocked, body });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false, err: e.message }));
    req.setTimeout(7000, () => { req.destroy(); resolve({ status: 0, ok: false, err: 'timeout' }); });
  });
}

async function main() {
  const scratchDir = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch';
  const appDir = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
  const dgnl = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));

  for (const idx of [0, 1, 9, 12]) {
    const r = dgnl[idx];
    const ytId = r.lessons.find(l => l.videoId)?.videoId;
    if (!ytId) continue;
    const emb = await fetchUrl(`https://www.youtube.com/embed/${ytId}`);
    const noc = await fetchUrl(`https://www.youtube-nocookie.com/embed/${ytId}`);
    const unavail = /Video unavailable|UNPLAYABLE|Playback on other websites has been disabled|LOGIN_REQUIRED|This video is private|không có sẵn|riêng tư/i.test(emb.body || '');
    const playabilityMatch = (emb.body || '').match(/"playabilityStatus":\{[^}]{0,250}/);
    console.log(`YT embed [${r.teacher}] (${ytId}): embStatus=${emb.status} nocStatus=${noc.status} len=${(emb.body||'').length} unavail=${unavail} statusSnippet=${playabilityMatch ? playabilityMatch[0] : 'none'}`);
  }

  // Test ALL URLs in Anh Giao Kid 2K9 and Bo Tro TSA-HSA 2K9
  const toan2k9 = JSON.parse(fs.readFileSync(path.join(appDir, 'assets/2k9-teachers/toan.json'), 'utf8'));
  const dgnl2k9 = JSON.parse(fs.readFileSync(path.join(appDir, 'assets/2k9-teachers/dgnl.json'), 'utf8'));

  for (const [label, chs] of [
    ['2k9-toan-toan-anh-giao-kid', toan2k9['2k9-toan-toan-anh-giao-kid'] || []],
    ['2k9-dgnl-bo-tro-tsa-hsa', dgnl2k9['2k9-dgnl-bo-tro-tsa-hsa'] || []],
  ]) {
    const urls = new Set();
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        for (const u of [t.dv, t.p, t.sp, ...(t.ep || []).map(x => x.url)]) {
          if (u) urls.add(u);
        }
      }
    }
    const arr = [...urls];
    let ok = 0, fail = 0;
    const failSamples = [];
    for (let i = 0; i < arr.length; i += 15) {
      const batch = arr.slice(i, i + 15);
      await Promise.all(batch.map(async u => {
        const m = u.match(/\/folders\/([A-Za-z0-9_-]+)/);
        const tu = m ? `https://drive.google.com/embeddedfolderview?id=${m[1]}#list` : u;
        const r = await fetchUrl(tu);
        if (r.ok) ok++; else { fail++; if (failSamples.length < 5) failSamples.push({ status: r.status, u }); }
      }));
    }
    console.log(`${label}: uniqueDriveUrls=${arr.length} ok=${ok} fail=${fail}`, failSamples);
  }
}

main();
