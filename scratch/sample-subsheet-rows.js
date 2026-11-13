const fs = require('fs');
const path = require('path');

function decodeEntities(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function cleanUrl(href) {
  href = decodeEntities(href);
  const qm = href.match(/google\.com\/url\?q=([^&]+)/);
  if (qm) { try { return decodeURIComponent(qm[1]); } catch { return qm[1]; } }
  return href;
}
function parseSheetHtmlRows(html) {
  if (!html) return [];
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(r =>
    [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => ({
      text: decodeEntities(c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()),
      links: [...c[1].matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(a => ({
        url: cleanUrl(a[1]), label: decodeEntities(a[2].replace(/<[^>]+>/g, '').trim())
      }))
    })).filter(c => c.text || c.links.length)
  ).filter(cells => cells.length);
}

async function dumpSubSheet(parentId, targetMatch, label) {
  const outer = await (await fetch(`https://docs.google.com/spreadsheets/d/${parentId}/htmlview`)).text();
  const gid = (outer.match(/items\.push\(\{name:[^}]*gid:\s*"([^"]+)"/) || [])[1] || '0';
  const rows = parseSheetHtmlRows(await (await fetch(`https://docs.google.com/spreadsheets/d/${parentId}/htmlview/sheet?headers=true&gid=${gid}`)).text());
  let subUrl = '';
  for (const cells of rows) {
    if (cells.some(c => c.text.includes(targetMatch))) {
      const lk = cells.flatMap(c => c.links).find(l => l.url.includes('spreadsheets/d/'));
      if (lk) { subUrl = lk.url; break; }
    }
  }
  const m = subUrl.match(/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if (!m) { console.log(label, 'NOT FOUND'); return; }
  const subOuter = await (await fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/htmlview`)).text();
  const tabs = [...subOuter.matchAll(/items\.push\(\{name:\s*"([^"]+)"[^}]*gid:\s*"([^"]+)"/g)].map(x => ({ name: x[1], gid: x[2] }));
  const t = tabs[0] || { name: 'Chính', gid: '0' };
  const sRows = parseSheetHtmlRows(await (await fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/htmlview/sheet?headers=true&gid=${t.gid}`)).text());
  console.log(`\n=== ${label} (tab="${t.name}", rows=${sRows.length}) ===`);
  sRows.slice(0, 22).forEach((cells, i) => {
    console.log(`  R${i}: ${cells.map(c => `[${c.text}]${c.links.length ? `(L:${c.links.map(l=>`${l.label}->${l.url.slice(0,32)}`).join(',')})` : ''}`).join(' | ')}`);
  });
}

async function main() {
  const raw = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-teachers-raw.json', 'utf8'));
  await dumpSubSheet(raw[37].sheetId, 'LUYỆN THI ĐẠI HỌC', 'Cô Sương Mai - Luyện thi ĐH');
  await dumpSubSheet(raw[15].sheetId, 'COMBO KHÓA I', 'Vũ Ngọc Anh - Khóa I');
  await dumpSubSheet(raw[0].sheetId, 'KHÓA T', 'Đỗ Văn Đức - Khóa T');
}

main();
