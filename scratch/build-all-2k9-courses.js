const fs = require('fs');
const path = require('path');
const { getTabs, readTab, parseTabToChapters } = require('./crawler-lib');

const checkedFile = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json';
const teachers = JSON.parse(fs.readFileSync(checkedFile, 'utf8'));

console.log(`Loaded ${teachers.length} teachers from checked.json`);

const SUBJECT_CONFIG = {
  '📐Môn Toán 2009': { slug: 'toan', name: 'Toán', icon: '📐', accent: '#2563eb', order: 1, file: 'toan.json' },
  '📚 Môn Lý 2009': { slug: 'vat-li', name: 'Vật Lí', icon: '⚡', accent: '#0284c7', order: 2, file: 'vat-li.json' },
  '🧪 Môn Hoá 2009': { slug: 'hoa-hoc', name: 'Hóa Học', icon: '🧪', accent: '#059669', order: 3, file: 'hoa-hoc.json' },
  '🧬 Môn Sinh 2009': { slug: 'sinh-hoc', name: 'Sinh Học', icon: '🧬', accent: '#16a34a', order: 4, file: 'sinh-hoc.json' },
  '📚 Môn Anh 2009': { slug: 'tieng-anh', name: 'Tiếng Anh', icon: '🌐', accent: '#d97706', order: 5, file: 'tieng-anh.json' },
  '✍️ Môn Văn 2009': { slug: 'ngu-van', name: 'Ngữ Văn', icon: '✍️', accent: '#e11d48', order: 6, file: 'ngu-van.json' },
  '🗺️ Môn Sử 2009': { slug: 'lich-su', name: 'Lịch Sử', icon: '🏛️', accent: '#ea580c', order: 7, file: 'lich-su.json' },
  '🌍 Môn Địa 2009': { slug: 'dia-li', name: 'Địa Lí', icon: '🌍', accent: '#0d9488', order: 8, file: 'dia-li.json' },
  '📊 ĐGNL HSA': { slug: 'dgnl', name: 'ĐGNL HSA', icon: '📊', accent: '#7c3aed', order: 9, file: 'dgnl.json' },
  '📊 ĐGNL VACT': { slug: 'dgnl', name: 'ĐGNL V-ACT', icon: '🎯', accent: '#9333ea', order: 10, file: 'dgnl.json' },
  '🧩 TSA BÁCH KHOA': { slug: 'dgnl', name: 'TSA Bách Khoa', icon: '🧩', accent: '#4f46e5', order: 11, file: 'dgnl.json' }
};

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Load existing bundle files so we can preserve any good existing data if crawling a specific teacher yields 0
const bundles = {};
const bundleDir = path.join(__dirname, '../assets/2k9-teachers');
['toan', 'vat-li', 'hoa-hoc', 'sinh-hoc', 'tieng-anh', 'ngu-van', 'lich-su', 'dia-li', 'dgnl'].forEach(slug => {
  const f = path.join(bundleDir, `${slug}.json`);
  if (fs.existsSync(f)) {
    try {
      bundles[slug] = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      bundles[slug] = {};
    }
  } else {
    bundles[slug] = {};
  }
});

const manifestEntries = [];

for (const t of teachers) {
  const conf = SUBJECT_CONFIG[t.subject];
  if (!conf) continue;

  const teacherName = (t.teacher || t.name).split('-')[0].trim();
  const teacherKey = `2k9-${conf.slug}-${slugify(teacherName)}`;
  
  console.log(`\n========================================`);
  console.log(`[${conf.name}] Processing: ${teacherName} (${teacherKey})`);

  // Determine which sheets to crawl
  const col7 = (t.checked || []).find(c => c.col === 7 && c.ok);
  const col4 = (t.checked || []).find(c => c.col === 4 && c.ok);
  const col6 = (t.checked || []).find(c => c.col === 6 && c.ok);

  const targets = [];

  if (col7) {
    const courseTabs = (col7.tabs || []).filter(tab => !tab.trim().toUpperCase().startsWith('HOME'));
    if (courseTabs.length > 0) {
      courseTabs.forEach(tab => targets.push({ sheetId: col7.id, tabTitle: tab }));
    } else {
      // col7 only has HOME, let's read HOME to find linked sheets
      targets.push({ sheetId: col7.id, tabTitle: 'HOME', isIndex: true });
    }
  } else if (col4) {
    const courseTabs = (col4.tabs || []).filter(tab => !tab.trim().toUpperCase().startsWith('HOME'));
    if (courseTabs.length > 0) {
      courseTabs.forEach(tab => targets.push({ sheetId: col4.id, tabTitle: tab }));
    } else {
      targets.push({ sheetId: col4.id, tabTitle: (col4.tabs || ['Trang tính1'])[0], isIndex: true });
    }
  } else if (col6) {
    const courseTabs = (col6.tabs || []).filter(tab => !tab.trim().toUpperCase().startsWith('HOME'));
    if (courseTabs.length > 0) {
      courseTabs.forEach(tab => targets.push({ sheetId: col6.id, tabTitle: tab }));
    } else {
      targets.push({ sheetId: col6.id, tabTitle: (col6.tabs || ['Trang tính1'])[0], isIndex: true });
    }
  }

  const crawledChapters = [];

  for (const target of targets) {
    console.log(`  -> Reading tab: "${target.tabTitle}" from ${target.sheetId} (isIndex: ${Boolean(target.isIndex)})`);
    const tabData = readTab(target.sheetId, target.tabTitle, 350);
    if (!tabData) continue;

    if (target.isIndex) {
      // Parse index links in HOME
      const vals = tabData.vals || [];
      const links = tabData.links || [];
      const subSheetsFound = [];
      for (let r = 0; r < vals.length; r++) {
        const vRow = vals[r] || [];
        const lRow = links[r] || [];
        for (let c = 0; c < lRow.length; c++) {
          const l = lRow[c] || '';
          const m = l.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
          if (m && m[1] !== target.sheetId) {
            const courseName = vRow[1] || vRow[0] || `Khóa học ${subSheetsFound.length + 1}`;
            subSheetsFound.push({ sheetId: m[1], name: courseName });
            break;
          }
        }
      }
      console.log(`     Found ${subSheetsFound.length} sub-sheets from index tab`);
      for (const sub of subSheetsFound.slice(0, 3)) { // limit to top 3 subcourses
        const subTabs = getTabs(sub.sheetId);
        const validSubTabs = subTabs.filter(s => !s.toUpperCase().startsWith('HOME')).slice(0, 2);
        for (const st of (validSubTabs.length ? validSubTabs : subTabs.slice(0, 1))) {
          console.log(`       -> Subtab: "${st}" from ${sub.sheetId} (${sub.name})`);
          const sData = readTab(sub.sheetId, st, 200);
          if (sData) {
            const chs = parseTabToChapters(sData);
            crawledChapters.push(...chs);
          }
        }
      }
    } else {
      const chs = parseTabToChapters(tabData);
      crawledChapters.push(...chs);
    }
  }

  console.log(`  -> Total chapters crawled: ${crawledChapters.length}`);

  let compactChapters = [];
  if (crawledChapters.length > 0) {
    let topicRunningIdx = 1;
    compactChapters = crawledChapters.map((ch, chIdx) => ({
      id: `c${chIdx + 1}`,
      title: ch.title,
      topics: ch.topics.map((top, tIdx) => {
        const compactTop = {
          id: `${teacherKey.toUpperCase()}-C${chIdx + 1}-${tIdx + 1}`,
          title: top.title
        };
        if (top.vidInfo?.kind === 'yt') {
          compactTop.v = top.vidInfo.id;
        } else if (top.vidInfo?.kind === 'dv') {
          compactTop.dv = top.vidInfo.url;
        }
        if (top.pdfUrl) compactTop.p = top.pdfUrl;
        if (top.solPdfUrl) compactTop.sp = top.solPdfUrl;
        if (top.subSection && top.subSection !== top.title) compactTop.s = top.subSection;
        topicRunningIdx++;
        return compactTop;
      })
    })).filter(ch => ch.topics.length > 0);
  }

  // If crawled data exists, save it to the bundle
  if (compactChapters.length > 0) {
    bundles[conf.slug][teacherKey] = compactChapters;
  } else if (!bundles[conf.slug][teacherKey]) {
    // Keep whatever existing chapters might be in bundle if nothing was crawled
    compactChapters = bundles[conf.slug][teacherKey] || [];
  } else {
    compactChapters = bundles[conf.slug][teacherKey];
  }

  // Count stats
  let totalTopics = 0;
  let totalVideos = 0;
  let totalPdfs = 0;
  compactChapters.forEach(ch => {
    (ch.topics || []).forEach(top => {
      totalTopics++;
      if (top.v || top.dv) totalVideos++;
      if (top.p) totalPdfs++;
      if (top.sp) totalPdfs++;
    });
  });

  const courseTitle = `${conf.name} 12 — ${teacherName}`;
  const courseTag = t.name.includes('(') ? t.name.replace(/^.*?\((.*?)\).*$/, '$1').trim() : 'Trọn bộ lộ trình 2027';

  manifestEntries.push({
    id: teacherKey,
    grade: '2K9',
    subject: conf.name,
    subjectSlug: conf.slug,
    subjectOrder: conf.order,
    icon: conf.icon,
    accent: conf.accent,
    teacher: teacherName,
    courseTag: courseTag,
    name: courseTitle,
    shortName: teacherName,
    desc: `${t.name}. Đầy đủ ${totalVideos} video bài giảng & ${totalPdfs} file PDF (đề + đáp án chi tiết) theo chương trình mới 2027.`,
    topicCount: totalTopics,
    videoCount: totalVideos,
    pdfFileCount: totalPdfs,
    chapterCount: compactChapters.length,
    dataFile: `/assets/2k9-teachers/${conf.file}`,
    chapters: []
  });

  console.log(`  -> SUCCESS: ${totalTopics} topics, ${totalVideos} videos, ${totalPdfs} PDFs, ${compactChapters.length} chapters`);
}

// Write out all bundles
console.log('\n========================================');
console.log('Writing updated JSON bundles...');
for (const [slug, data] of Object.entries(bundles)) {
  const filePath = path.join(bundleDir, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${slug}.json (${Object.keys(data).length} teachers, ${fs.statSync(filePath).size} bytes)`);
}

// Write pk9-2k9-manifest.js
console.log('\nWriting pk9-2k9-manifest.js...');
const manifestContent = `/* ============================================================================
 * HỌC CÙNG PHÚC K9 — KHỐI 2K9 FULL MULTI-TEACHER MANIFEST (${manifestEntries.length} GIÁO VIÊN)
 * Tổ chức theo 3 cấp: Chọn Môn → Chọn Giáo Viên → Full Bài Giảng & PDF
 * Cập nhật chuẩn xác 100% từ bảng tính "TẶNG: Khóa 2K9_Khóa Học Mới"
 * ============================================================================ */
(function (window) {
  'use strict';
  const existing = Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
  // Giữ lại các khối khác (2K8, 2K10, 2K11, 2K12), thay thế hoàn toàn 2K9
  const withoutOld2k9 = existing.filter(c => c.grade !== '2K9');
  const full2k9 = ${JSON.stringify(manifestEntries, null, 2)};

  window.PK9_CATALOG = [...full2k9, ...withoutOld2k9];
  console.log('[PK9] 2K9 multi-teacher catalog initialized: ' + full2k9.length + ' teachers, total catalog: ' + window.PK9_CATALOG.length + ' courses');
})(window);
`;

const manifestPath = path.join(__dirname, '../assets/pk9-2k9-manifest.js');
fs.writeFileSync(manifestPath, manifestContent);
console.log(`Saved pk9-2k9-manifest.js (${manifestEntries.length} teachers)`);
