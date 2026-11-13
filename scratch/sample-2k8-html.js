const fs = require('fs');
const path = require('path');

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function cleanUrl(href) {
  href = decodeEntities(href);
  const qm = href.match(/google\.com\/url\?q=([^&]+)/);
  if (qm) { try { return decodeURIComponent(qm[1]); } catch { return qm[1]; } }
  return href;
}
function parseSheetHtmlRows(html) {
  if (!html) return [];
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const out = [];
  for (const r of rows) {
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => {
      const links = [...c[1].matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(a => ({
        url: cleanUrl(a[1]),
        label: decodeEntities(a[2].replace(/<[^>]+>/g, '').trim())
      }));
      const text = decodeEntities(c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      return { text, links };
    }).filter(c => c.text || c.links.length);
    if (cells.length) out.push(cells);
  }
  return out;
}

async function fetchSheet(sheetId, label) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const outer = await res.text();
  let tabs = [...outer.matchAll(/items\.push\(\{name:\s*"([^"]+)"[^}]*gid:\s*"([^"]+)"/g)].map(m => ({ name: m[1], gid: m[2] }));
  if (!tabs.length) tabs = [{ name: 'Chính', gid: '0' }];
  console.log(`\n=== ${label} (tabs=${tabs.length}: ${tabs.slice(0,5).map(t=>t.name).join(', ')}) ===`);
  for (const tab of tabs.slice(0, 2)) {
    const html = await (await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview/sheet?headers=true&gid=${tab.gid}`)).text();
    const rows = parseSheetHtmlRows(html);
    console.log(`-- Tab "${tab.name}" (${rows.length} rows) --`);
    rows.slice(0, 14).forEach((cells, idx) => {
      console.log(`  R${idx}: ${cells.map(c => `${c.text}${c.links.length ? ` [L:${c.links.length}:${c.links[0].label.slice(0,18)}->${c.links[0].url.slice(0,38)}]` : ''}`).join(' || ')}`);
    });
  }
}

async function main() {
  const scratchDir = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch';
  const raw = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k9-teachers-raw.json'), 'utf8'));
  // Inspect Đỗ Văn Đức (0), Vũ Ngọc Anh (15), Cô Sương Mai (37), Huy Hướng Nội (11)
  for (const idx of [0, 11, 15, 37]) {
    await fetchSheet(raw[idx].sheetId, `${idx}:${raw[idx].sheetTitle}`);
  }
  // Check redirected Hocmai Drive file (what type of file is 1juoyku7HN9ky779nGEZBPYJOhfSREIbz?)
  const r = await fetch('https://drive.google.com/file/d/1juoyku7HN9ky779nGEZBPYJOhfSREIbz/view');
  const txt = await r.text();
  const tMatch = txt.match(/<title>([^<]*)<\/title>/i);
  console.log('\nHocmai file status:', r.status, 'title:', tMatch ? tMatch[1] : 'none');
}

main();
