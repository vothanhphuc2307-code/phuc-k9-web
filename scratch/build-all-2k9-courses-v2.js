const fs = require('fs');
const path = require('path');
const { getTabs, readTab, parseTabToChapters } = require('./crawler-lib');

const checkedFile = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch/2k9-tang-khoahocmoi-checked.json';
const teachers = JSON.parse(fs.readFileSync(checkedFile, 'utf8'));

console.log(`Loaded ${teachers.length} teachers from checked.json`);

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const bundles = {
  'toan': {},
  'vat-li': {},
  'hoa-hoc': {},
  'sinh-hoc': {},
  'tieng-anh': {},
  'ngu-van': {},
  'lich-su': {},
  'dia-li': {},
  'dgnl': {}
};

const bundleDir = path.join(__dirname, '../assets/2k9-teachers');
Object.keys(bundles).forEach(slug => {
  const f = path.join(bundleDir, `${slug}.json`);
  if (fs.existsSync(f)) {
    try {
      bundles[slug] = JSON.parse(fs.readFileSync(f, 'utf8'));
    } catch {
      bundles[slug] = {};
    }
  }
});

const manifestEntries = [];
const seenTeacherIds = new Set();

for (const t of teachers) {
  let subjSlug = '';
  let subjName = '';
  let subjIcon = '';
  let subjAccent = '';
  let subjOrder = 1;
  let subjFile = '';

  const rawSubj = t.subject || '';
  const rawName = t.name || '';

  if (rawSubj.includes('Toán')) {
    subjSlug = 'toan'; subjName = 'Toán'; subjIcon = '📐'; subjAccent = '#2563eb'; subjOrder = 1; subjFile = 'toan.json';
  } else if (rawSubj.includes('Lý')) {
    subjSlug = 'vat-li'; subjName = 'Vật Lí'; subjIcon = '⚡'; subjAccent = '#0284c7'; subjOrder = 2; subjFile = 'vat-li.json';
  } else if (rawSubj.includes('Hoá') || rawSubj.includes('Hóa')) {
    subjSlug = 'hoa-hoc'; subjName = 'Hóa Học'; subjIcon = '🧪'; subjAccent = '#059669'; subjOrder = 3; subjFile = 'hoa-hoc.json';
  } else if (rawSubj.includes('Sinh')) {
    subjSlug = 'sinh-hoc'; subjName = 'Sinh Học'; subjIcon = '🧬'; subjAccent = '#16a34a'; subjOrder = 4; subjFile = 'sinh-hoc.json';
  } else if (rawSubj.includes('Anh')) {
    subjSlug = 'tieng-anh'; subjName = 'Tiếng Anh'; subjIcon = '🌐'; subjAccent = '#d97706'; subjOrder = 5; subjFile = 'tieng-anh.json';
  } else if (rawSubj.includes('Văn')) {
    // Check if Lịch Sử or Địa Lí was grouped under Văn
    if (rawName.toUpperCase().includes('LỊCH SỬ') || rawName.includes('Cô Sen') || rawName.includes('Lan Hương')) {
      subjSlug = 'lich-su'; subjName = 'Lịch Sử'; subjIcon = '🏛️'; subjAccent = '#ea580c'; subjOrder = 7; subjFile = 'lich-su.json';
    } else if (rawName.toUpperCase().includes('ĐỊA LÝ') || rawName.toUpperCase().includes('ĐỊA LÍ') || rawName.includes('Thanh Tùng') || rawName.includes('Mai Anh') || rawName.includes('Thầy Tài')) {
      subjSlug = 'dia-li'; subjName = 'Địa Lí'; subjIcon = '🌍'; subjAccent = '#0d9488'; subjOrder = 8; subjFile = 'dia-li.json';
    } else {
      subjSlug = 'ngu-van'; subjName = 'Ngữ Văn'; subjIcon = '✍️'; subjAccent = '#e11d48'; subjOrder = 6; subjFile = 'ngu-van.json';
    }
  } else if (rawSubj.includes('HSA')) {
    subjSlug = 'dgnl'; subjName = 'ĐGNL HSA'; subjIcon = '📊'; subjAccent = '#7c3aed'; subjOrder = 9; subjFile = 'dgnl.json';
  } else if (rawSubj.includes('VACT')) {
    subjSlug = 'dgnl'; subjName = 'ĐGNL V-ACT'; subjIcon = '🎯'; subjAccent = '#9333ea'; subjOrder = 10; subjFile = 'dgnl.json';
  } else if (rawSubj.includes('TSA')) {
    subjSlug = 'dgnl'; subjName = 'TSA Bách Khoa'; subjIcon = '🧩'; subjAccent = '#4f46e5'; subjOrder = 11; subjFile = 'dgnl.json';
  } else {
    continue; // Skip unrecognized/supplementary
  }

  // Teacher name clean-up
  let cleanName = rawName;
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    if (subjSlug === 'dgnl') {
      cleanName = `${parts[0].trim()} (${parts[1] ? parts[1].trim() : ''})`;
    } else {
      cleanName = parts[0].trim();
    }
  } else if (cleanName.includes('(')) {
    if (subjSlug !== 'dgnl') {
      cleanName = cleanName.split('(')[0].trim();
    }
  }

  // Clean teacher ID to avoid collisions
  let teacherKey = `2k9-${subjSlug}-${slugify(cleanName)}`;
  if (seenTeacherIds.has(teacherKey)) {
    teacherKey = `${teacherKey}-${slugify(rawName.slice(0, 20))}`;
  }
  seenTeacherIds.add(teacherKey);

  console.log(`\n========================================`);
  console.log(`[${subjName}] ${cleanName} -> ID: ${teacherKey}`);

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
      const vals = tabData.vals || [];
      const links = tabData.links || [];
      const subSheetsFound = [];
      for (let r = 0; r < vals.length; r++) {
        const vRow = vals[r] || [];
        const lRow = links[r] || [];
        for (let c = 0; c < lRow.length; c++) {
          const l = lRow[c] || '';
          const m = l.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
          if (m && m[1] !== target.sheetId && !subSheetsFound.some(s => s.sheetId === m[1])) {
            const courseName = vRow[1] || vRow[0] || `Khóa học ${subSheetsFound.length + 1}`;
            subSheetsFound.push({ sheetId: m[1], name: courseName });
            break;
          }
        }
      }
      console.log(`     Found ${subSheetsFound.length} sub-sheets from index tab`);
      for (const sub of subSheetsFound.slice(0, 3)) {
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
        if (top.solPdfUrl && !top.solPdfUrl.includes('youtube') && !top.solPdfUrl.includes('youtu.be')) {
          compactTop.sp = top.solPdfUrl;
        }
        if (top.subSection && top.subSection !== top.title) compactTop.s = top.subSection;
        return compactTop;
      })
    })).filter(ch => ch.topics.length > 0);
  }

  // Fallback to existing bundle data if crawling this teacher returned 0
  if (compactChapters.length > 0) {
    bundles[subjSlug][teacherKey] = compactChapters;
  } else if (bundles[subjSlug][teacherKey] && bundles[subjSlug][teacherKey].length > 0) {
    compactChapters = bundles[subjSlug][teacherKey];
  } else {
    // If no data exists anywhere for this teacher, skip from manifest
    console.log(`  -> Skipping ${cleanName} (no topics found)`);
    continue;
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

  const courseTitle = `${subjName} 12 — ${cleanName}`;
  const courseTag = rawName.includes('(') ? rawName.replace(/^.*?\((.*?)\).*$/, '$1').trim() : 'Trọn bộ lộ trình 2027';

  manifestEntries.push({
    id: teacherKey,
    grade: '2K9',
    subject: subjName,
    subjectSlug: subjSlug,
    subjectOrder: subjOrder,
    icon: subjIcon,
    accent: subjAccent,
    teacher: cleanName,
    courseTag: courseTag,
    name: courseTitle,
    shortName: cleanName,
    desc: `${rawName}. Đầy đủ ${totalVideos} video bài giảng & ${totalPdfs} file PDF (đề + đáp án chi tiết) theo chương trình mới 2027.`,
    topicCount: totalTopics,
    videoCount: totalVideos,
    pdfFileCount: totalPdfs,
    chapterCount: compactChapters.length,
    dataFile: `/assets/2k9-teachers/${subjFile}`,
    chapters: []
  });

  console.log(`  -> ADDED TO MANIFEST: ${totalTopics} topics, ${totalVideos} videos, ${totalPdfs} PDFs, ${compactChapters.length} chs`);
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
