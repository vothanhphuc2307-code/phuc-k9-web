const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function decodeVideoUrl(rawUrl) {
  if (!rawUrl) return { kind: 'none' };
  
  // 1. Google Apps Script studychill reverse obfuscation
  const studychillMatch = rawUrl.match(/id=([A-Za-z0-9_-]+)studychill/i);
  if (studychillMatch) {
    const reversed = studychillMatch[1].split('').reverse().join('');
    return { kind: 'youtube', videoId: reversed, videoUrl: `https://www.youtube.com/watch?v=${reversed}` };
  }
  
  // 2. Direct YouTube URL
  const ytMatch = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/))([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { kind: 'youtube', videoId: ytMatch[1], videoUrl: `https://www.youtube.com/watch?v=${ytMatch[1]}` };
  }

  // 3. Google Drive file
  const driveMatch = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { kind: 'drive', driveId: driveMatch[1], driveVideoUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  return { kind: 'other', rawUrl };
}

function cleanPdfUrl(rawUrl) {
  if (!rawUrl) return null;
  const fileMatch = rawUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/view`;
  }
  const folderMatch = rawUrl.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    return `https://drive.google.com/drive/folders/${folderMatch[1]}`;
  }
  return rawUrl.startsWith('http') ? rawUrl : null;
}

function parseTabTsv(tsvText, tabName) {
  const lines = tsvText.split('\n').map(l => l.split('\t').map(c => c.trim()));
  if (lines.length === 0) return [];

  // Find header row (usually contains BÀI HỌC or TÊN BÀI or VIDEO or BÀI GIẢNG)
  let headerIdx = -1;
  let colMap = { title: -1, video: -1, pdf: -1, solPdf: -1, note: -1 };

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const row = lines[i];
    const rowStr = row.join(' ').toUpperCase();
    if (rowStr.includes('BÀI HỌC') || rowStr.includes('BÀI GIẢNG') || rowStr.includes('TÀI LIỆU') || rowStr.includes('VIDEO')) {
      headerIdx = i;
      row.forEach((col, idx) => {
        const c = col.toUpperCase();
        if (c.includes('TÊN BÀI') || c.includes('BÀI HỌC') || c.includes('NỘI DUNG')) colMap.title = idx;
        else if (c.includes('BÀI GIẢNG') || c.includes('VIDEO') || c === 'VIEW') colMap.video = idx;
        else if (c.includes('TÀI LIỆU') || c.includes('ĐỀ BÀI') || c.includes('FILE')) colMap.pdf = idx;
        else if (c.includes('VIẾT TAY') || c.includes('ĐÁP ÁN') || c.includes('LỜI GIẢI')) colMap.solPdf = idx;
        else if (c.includes('GHI CHÚ') || c.includes('NOTE') || c.includes('LƯU Ý')) colMap.note = idx;
      });
      break;
    }
  }

  // Fallbacks if not detected
  if (colMap.title === -1) colMap.title = 1;
  if (colMap.video === -1) colMap.video = 3;
  if (colMap.pdf === -1) colMap.pdf = 2;
  if (colMap.solPdf === -1) colMap.solPdf = 4;
  if (colMap.note === -1) colMap.note = 5;

  console.log(`Tab: ${tabName} | Header row: ${headerIdx} | ColMap:`, JSON.stringify(colMap));

  const chapters = [];
  let currentChapter = {
    title: tabName.trim(),
    topics: []
  };

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;
  let lastTopicTitle = '';

  for (let i = startRow; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || row.every(c => !c)) continue;

    const rowText = row.join(' ').trim();
    if (!rowText || rowText === '-') continue;

    // Detect section/chapter header row:
    // Usually has text in col 0 or 1, and no video link
    const col0 = row[0] || '';
    const col1 = row[1] || '';
    const colVideo = row[colMap.video] || '';
    const colPdf = row[colMap.pdf] || '';
    const colSolPdf = row[colMap.solPdf] || '';
    const colNote = row[colMap.note] || '';

    const isHeaderRow = (
      (col0.match(/^(CHƯƠNG|LỘ TRÌNH|ĐỢT|PHẦN|GIAI ĐOẠN|TỔNG ÔN|BỔ TRỢ|KHẢO SÁT|KIỂM TRA|📖|📘|MỤC LỤC|COMBO|HƯỚNG DẪN)/i) ||
       col1.match(/^(CHƯƠNG|LỘ TRÌNH|ĐỢT|PHẦN|GIAI ĐOẠN|TỔNG ÔN|BỔ TRỢ|KHẢO SÁT|KIỂM TRA|📖|📘|MỤC LỤC|COMBO|HƯỚNG DẪN)/i) ||
       (row.filter(c => c && !c.startsWith('http')).length === 1 && !colVideo.startsWith('http') && !colPdf.startsWith('http'))) &&
      !colVideo.match(/(?:youtube|youtu\.be|script\.google|drive\.google)/i)
    );

    if (isHeaderRow) {
      const headerTitle = (col0.length > col1.length ? col0 : (col1 || col0)).replace(/^[0-9.\-\s]+/, '').trim();
      if (headerTitle && headerTitle.length > 2 && !headerTitle.toUpperCase().includes('TRẠNG THÁI')) {
        if (currentChapter.topics.length > 0) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: headerTitle,
          topics: []
        };
        continue;
      }
    }

    // Now check if row has a video or PDF or lesson content
    const videoInfo = decodeVideoUrl(colVideo);
    const pdfUrl = cleanPdfUrl(colPdf);
    const solPdfUrl = cleanPdfUrl(colSolPdf);

    let title = row[colMap.title] || '';
    if (!title && colNote && !colNote.startsWith('http')) {
      title = colNote;
    } else if (!title && lastTopicTitle) {
      title = colNote ? `${lastTopicTitle} — ${colNote}` : `${lastTopicTitle} (Tiếp theo)`;
    }

    if (!title && !videoInfo.videoId && !videoInfo.driveId && !pdfUrl) {
      continue; // Skip empty row
    }

    if (!title) {
      title = `Bài học ${currentChapter.topics.length + 1}`;
    }

    lastTopicTitle = title.replace(/\s*—\s*.*$/, '');

    currentChapter.topics.push({
      title: title.trim(),
      videoType: videoInfo.kind,
      videoId: videoInfo.videoId || undefined,
      videoUrl: videoInfo.videoUrl || undefined,
      driveVideoUrl: videoInfo.driveVideoUrl || undefined,
      pdfUrl: pdfUrl || undefined,
      solutionPdfUrl: solPdfUrl || undefined,
      note: colNote || undefined
    });
  }

  if (currentChapter.topics.length > 0) {
    chapters.push(currentChapter);
  }

  return chapters;
}

// Test with Do Van Duc KHÓA T1 + T2
const sheetId = '139ewewSIBllZW9AZTm0jxj9B4RF0nQwPBD3mbjZQIjA';
const tabName = 'KHÓA T1 + T2';
const raw = execSync(`gsheets readonly read-links ${sheetId} "'${tabName}'!A1:G150"`, { encoding: 'utf8' });
const chapters = parseTabTsv(raw, tabName);

console.log('\n=== PARSED CHAPTERS SUMMARY ===');
console.log('Total chapters:', chapters.length);
chapters.forEach((ch, idx) => {
  console.log(`\nChapter ${idx + 1}: "${ch.title}" (${ch.topics.length} topics)`);
  ch.topics.slice(0, 3).forEach((top, tIdx) => {
    console.log(`  [${tIdx + 1}] ${top.title} | vid: ${top.videoId || top.driveVideoUrl || 'none'} | pdf: ${Boolean(top.pdfUrl)} | solPdf: ${Boolean(top.solutionPdfUrl)}`);
  });
});
