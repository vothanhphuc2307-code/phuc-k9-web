const https = require('https');
const fs = require('fs');
const path = require('path');

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 15000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 404 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access') || body.includes('Không tìm thấy trang');
        const rateLimited = res.statusCode === 429;
        resolve({ status: res.statusCode, ok: (res.statusCode >= 200 && res.statusCode < 400 && !blocked), rateLimited, loc: loc.slice(0, 60) });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false, err: e.message }));
    req.setTimeout(7000, () => { req.destroy(); resolve({ status: 0, ok: false, err: 'timeout' }); });
  });
}

function toCheckUrl(u) {
  const fm = u.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
  if (fm) return `https://drive.google.com/embeddedfolderview?id=${fm[1]}#list`;
  const gm = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (gm) return `https://drive.google.com/file/d/${gm[1]}/preview`;
  return u;
}

async function auditCourse(c, chs) {
  const ytSamples = [];
  const driveSamples = [];
  for (const ch of chs) {
    for (const t of ch.topics || []) {
      const yid = t.v || t.videoId;
      if (yid && ytSamples.length < 4 && !ytSamples.includes(yid)) ytSamples.push(yid);
      for (const u of [t.dv, t.driveVideoUrl, t.p, t.pdfUrl, t.sp, t.solutionPdfUrl, ...(t.ep || t.pdfs || []).map(x => x.url)]) {
        if (u && driveSamples.length < 6 && !driveSamples.includes(u)) driveSamples.push(u);
      }
    }
  }

  let ytOk = 0, ytFail = 0, drvOk = 0, drvFail = 0, drv429 = 0;
  const failUrls = [];
  await Promise.all([
    ...ytSamples.map(async yid => {
      const r = await checkHttp(`https://www.youtube.com/embed/${yid}`);
      if (r.ok && r.status === 200) ytOk++; else { ytFail++; failUrls.push(`YT:${yid}(${r.status})`); }
    }),
    ...driveSamples.map(async u => {
      const cu = toCheckUrl(u);
      let r = await checkHttp(cu);
      if (r.rateLimited) {
        await new Promise(res => setTimeout(res, 600));
        r = await checkHttp(cu);
      }
      if (r.rateLimited) drv429++;
      else if (r.ok) drvOk++;
      else { drvFail++; failUrls.push(`${cu.slice(0,55)}(${r.status})`); }
    })
  ]);
  return { id: c.id, subject: c.subject || c.grade, teacher: c.teacher || c.shortName, ytOk, ytTot: ytSamples.length, drvOk, drvTot: driveSamples.length, ytFail, drvFail, drv429, failUrls };
}

async function main() {
  const appDir = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
  var window = {};
  eval(fs.readFileSync(path.join(appDir, 'assets/pk9-2k9-manifest.js'), 'utf8'));
  eval(fs.readFileSync(path.join(appDir, 'assets/pk9-2k8-curated.js'), 'utf8'));
  eval(fs.readFileSync(path.join(appDir, 'assets/pk9-2k8-dgnl.js'), 'utf8'));

  const cache = {};
  const tasks = [];
  for (const c of window.PK9_CATALOG || []) {
    if (c.grade === '2K9' && c.dataFile) {
      const fn = path.basename(c.dataFile);
      if (!cache[fn]) cache[fn] = JSON.parse(fs.readFileSync(path.join(appDir, 'assets/2k9-teachers', fn), 'utf8'));
      tasks.push({ c, chs: cache[fn][c.id] || [] });
    } else if (c.grade === '2K8' || c.grade === 'DGNL') {
      tasks.push({ c, chs: c.chapters || [] });
    }
  }

  console.log(`Auditing ${tasks.length} courses (2K9 + 2K8 + DGNL) with concurrent checks...`);
  const anyFail = [];
  for (let i = 0; i < tasks.length; i += 4) {
    const batch = tasks.slice(i, i + 4);
    const res = await Promise.all(batch.map(x => auditCourse(x.c, x.chs)));
    for (const r of res) {
      const flag = (r.ytFail > 0 || r.drvFail > 0) ? '⚠️ FAIL' : '✅ OK';
      console.log(`${flag} [${r.id}] YT ${r.ytOk}/${r.ytTot} | DRV ${r.drvOk}/${r.drvTot} (fail=${r.drvFail},429=${r.drv429})${r.failUrls.length ? ' -> ' + r.failUrls.join(', ') : ''}`);
      if (r.ytFail > 0 || r.drvFail > 0) anyFail.push(r);
    }
  }
  console.log('\nTotal courses with failures:', anyFail.length);
  if (anyFail.length) console.log(JSON.stringify(anyFail, null, 2));
}

main();
