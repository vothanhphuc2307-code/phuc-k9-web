const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_DIR = path.join(__dirname, 'cache-tabs');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function sanitizeFilename(name) {
  return (name || '').replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9]/g, '_').slice(0, 80);
}

function execGsheets(args, timeoutMs = 25000) {
  try {
    return execSync(`gsheets ${args}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs
    });
  } catch (e) {
    return null;
  }
}

function getTabs(sheetId) {
  const jsonStr = execGsheets(`readonly list-sheets ${sheetId} --json`, 15000);
  if (!jsonStr) return [];
  try {
    const list = JSON.parse(jsonStr);
    return list.map(s => s.title || s.Title || s.properties?.title).filter(Boolean);
  } catch {
    return [];
  }
}

function readTab(sheetId, tabTitle, maxRows = 300) {
  const cacheKey = `${sheetId}_${sanitizeFilename(tabTitle)}`;
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch {}
  }

  const range = `'${tabTitle}'!A1:H${maxRows}`;
  const valsRaw = execGsheets(`readonly read ${sheetId} "${range}"`, 30000);
  const linksRaw = execGsheets(`readonly read-links ${sheetId} "${range}"`, 30000);

  if (!valsRaw && !linksRaw) return null;

  const data = {
    sheetId,
    tabTitle,
    vals: valsRaw ? valsRaw.split('\n').map(l => l.split('\t').map(c => c.trim())) : [],
    links: linksRaw ? linksRaw.split('\n').map(l => l.split('\t').map(c => c.trim())) : []
  };

  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
  return data;
}

function decodeVideo(url) {
  if (!url) return null;
  // StudyChill reverse
  const mSc = url.match(/id=([A-Za-z0-9_-]+)studychill/i);
  if (mSc) {
    const rev = mSc[1].split('').reverse().join('');
    return { kind: 'yt', id: rev, url: `https://www.youtube.com/watch?v=${rev}` };
  }
  // Direct YouTube
  const mYt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/))([a-zA-Z0-9_-]{11})/);
  if (mYt) {
    return { kind: 'yt', id: mYt[1], url: `https://www.youtube.com/watch?v=${mYt[1]}` };
  }
  // Drive video
  const mDv = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (mDv) {
    return { kind: 'dv', id: mDv[1], url: `https://drive.google.com/file/d/${mDv[1]}/preview` };
  }
  return null;
}

function cleanPdfUrl(url) {
  if (!url) return null;
  const mF = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (mF) return `https://drive.google.com/file/d/${mF[1]}/view`;
  const mDir = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (mDir) return `https://drive.google.com/drive/folders/${mDir[1]}`;
  return url.startsWith('http') ? url : null;
}

function parseTabToChapters(tabData) {
  if (!tabData || !tabData.vals || tabData.vals.length === 0) return [];
  const vals = tabData.vals;
  const links = tabData.links || [];

  // Identify column mapping from header
  let headerIdx = -1;
  let colMap = { title: 1, video: -1, pdf: -1, solPdf: -1, note: -1 };

  const keywords = ['BÀI HỌC', 'TÊN BÀI', 'NỘI DUNG', 'TÀI LIỆU', 'BÀI GIẢNG', 'VIDEO', 'VIẾT TAY', 'ĐÁP ÁN', 'GHI CHÚ', 'TRẠNG THÁI', 'GIẢI BTVN', 'NOTE', 'VIEW'];

  for (let i = 0; i < Math.min(vals.length, 10); i++) {
    const row = vals[i] || [];
    const cellsWithText = row.filter(c => c && c.trim().length > 0);
    if (cellsWithText.length < 3) continue;

    const rVals = row.join(' ').toUpperCase();
    if (rVals.includes('FIX LỖI') || rVals.includes('RIÊNG TƯ')) continue;

    const matchCount = keywords.filter(w => rVals.includes(w)).length;
    if (matchCount >= 2) {
      headerIdx = i;
      row.forEach((c, idx) => {
        const cu = c.toUpperCase();
        if (cu.includes('TÊN BÀI') || cu.includes('BÀI HỌC') || cu.includes('NỘI DUNG') || cu.includes('CHỦ ĐỀ')) colMap.title = idx;
        else if (cu.includes('BÀI GIẢNG') || cu.includes('VIDEO') || cu === 'VIEW') colMap.video = idx;
        else if (cu.includes('TÀI LIỆU') || cu.includes('ĐỀ BÀI') || cu.includes('FILE')) colMap.pdf = idx;
        else if (cu.includes('VIẾT TAY') || cu.includes('ĐÁP ÁN') || cu.includes('LỜI GIẢI') || cu.includes('GIẢI BTVN')) colMap.solPdf = idx;
        else if (cu.includes('GHI CHÚ') || cu.includes('NOTE') || cu.includes('LƯU Ý')) colMap.note = idx;
      });
      break;
    }
  }

  // Fallbacks if not detected
  if (colMap.title === -1) colMap.title = 1;
  if (colMap.video === -1) colMap.video = 3;
  if (colMap.pdf === -1) colMap.pdf = 2;

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;
  const chapters = [];
  let currentChapter = {
    title: tabData.tabTitle.trim(),
    topics: []
  };

  let currentParentLesson = '';
  let currentParentPdf = null;
  let currentParentSolPdf = null;

  for (let i = startRow; i < vals.length; i++) {
    const vRow = vals[i] || [];
    const lRow = links[i] || [];
    if (vRow.length === 0 || vRow.every(c => !c)) continue;

    const rowText = vRow.join(' ').trim();
    if (!rowText || rowText === '-') continue;

    // Check if section header
    const col0Val = vRow[0] || '';
    const col1Val = vRow[1] || '';
    const hasAnyVideo = lRow.some(l => l && (l.includes('youtu') || l.includes('studychill') || (l.includes('drive.google.com/file') && !l.includes('.pdf'))));
    const hasAnyPdf = lRow.some(l => l && (l.includes('drive.google.com') || l.endsWith('.pdf')));

    const isSectionHeader = (
      (col0Val.match(/^(CHƯƠNG|LỘ TRÌNH|ĐỢT|PHẦN|GIAI ĐOẠN|TỔNG ÔN|BỔ TRỢ|KHẢO SÁT|KIỂM TRA|📖|📘|MỤC LỤC|COMBO|HƯỚNG DẪN|PART|CHAPTER)/i) ||
       col1Val.match(/^(CHƯƠNG|LỘ TRÌNH|ĐỢT|PHẦN|GIAI ĐOẠN|TỔNG ÔN|BỔ TRỢ|KHẢO SÁT|KIỂM TRA|📖|📘|MỤC LỤC|COMBO|HƯỚNG DẪN|PART|CHAPTER)/i) ||
       (vRow.filter(c => c && !c.startsWith('http')).length === 1 && !hasAnyVideo && !hasAnyPdf)) &&
      !hasAnyVideo
    );

    if (isSectionHeader) {
      const headerTitle = (col0Val.length > col1Val.length ? col0Val : (col1Val || col0Val)).replace(/^[0-9.\-\s]+/, '').trim();
      if (headerTitle && headerTitle.length > 2 && !headerTitle.toUpperCase().includes('TRẠNG THÁI')) {
        if (currentChapter.topics.length > 0) {
          chapters.push(currentChapter);
        }
        currentChapter = {
          title: headerTitle,
          topics: []
        };
        currentParentLesson = '';
        currentParentPdf = null;
        currentParentSolPdf = null;
        continue;
      }
    }

    // Identify Video Link:
    let vidInfo = decodeVideo(lRow[colMap.video]);
    if (!vidInfo) {
      for (let c = 0; c < lRow.length; c++) {
        const l = lRow[c];
        if (l && (l.includes('youtu') || l.includes('studychill'))) {
          vidInfo = decodeVideo(l);
          if (vidInfo) break;
        }
      }
    }
    if (!vidInfo && lRow[colMap.video] && lRow[colMap.video].includes('drive.google.com/file')) {
      vidInfo = decodeVideo(lRow[colMap.video]);
    }

    // Identify PDF links:
    let rowPdf = null;
    let rowSolPdf = null;

    for (let c = 0; c < lRow.length; c++) {
      const l = lRow[c];
      const v = vRow[c] || '';
      if (!l || !l.startsWith('http')) continue;
      if (vidInfo && (l === vidInfo.url || l.includes(vidInfo.id))) continue;

      if (v.toUpperCase().includes('ĐÁP ÁN') || v.toUpperCase().includes('VIẾT TAY') || v.toUpperCase().includes('GIẢI')) {
        rowSolPdf = cleanPdfUrl(l);
      } else if (l.includes('drive.google.com') && !rowPdf) {
        rowPdf = cleanPdfUrl(l);
      }
    }

    const titleVal = vRow[colMap.title] || '';
    const noteVal = vRow[colMap.note] || '';
    const videoVal = vRow[colMap.video] || '';

    if (titleVal && !titleVal.toUpperCase().startsWith('VIDEO') && !titleVal.toUpperCase().startsWith('[VIDEO')) {
      currentParentLesson = titleVal;
      if (rowPdf) currentParentPdf = rowPdf;
      if (rowSolPdf) currentParentSolPdf = rowSolPdf;
    } else {
      if (rowPdf) currentParentPdf = rowPdf;
      if (rowSolPdf) currentParentSolPdf = rowSolPdf;
    }

    const finalPdf = rowPdf || currentParentPdf;
    const finalSolPdf = rowSolPdf || currentParentSolPdf;

    let topicTitle = '';
    if (videoVal && videoVal.length > 3 && !videoVal.startsWith('http') && !videoVal.toUpperCase().startsWith('XEM') && !videoVal.toUpperCase().startsWith('BÀI GIẢNG')) {
      if (currentParentLesson && !videoVal.includes(currentParentLesson)) {
        topicTitle = `${currentParentLesson} — ${videoVal}`;
      } else {
        topicTitle = videoVal;
      }
    } else if (titleVal) {
      topicTitle = titleVal;
      if (noteVal && !noteVal.startsWith('http') && !topicTitle.includes(noteVal)) {
        topicTitle = `${topicTitle} (${noteVal})`;
      }
    } else if (noteVal && !noteVal.startsWith('http')) {
      topicTitle = currentParentLesson ? `${currentParentLesson} — ${noteVal}` : noteVal;
    } else if (currentParentLesson) {
      topicTitle = `${currentParentLesson} (Phần ${currentChapter.topics.length + 1})`;
    }

    topicTitle = topicTitle
      .replace(/\.(mp4|pdf|mov|avi)$/i, '')
      .replace(/^\[[0-9A-Za-z_]+\]\s*/i, '')
      .replace(/^Video_\d+\.\s*/i, '')
      .trim();

    if (!topicTitle && !vidInfo && !finalPdf) continue;

    if (!topicTitle) {
      topicTitle = `Bài học ${currentChapter.topics.length + 1}`;
    }

    currentChapter.topics.push({
      title: topicTitle,
      vidInfo,
      pdfUrl: finalPdf,
      solPdfUrl: finalSolPdf,
      subSection: currentParentLesson || undefined,
      note: noteVal || undefined
    });
  }

  if (currentChapter.topics.length > 0) {
    chapters.push(currentChapter);
  }

  return chapters;
}

module.exports = {
  getTabs,
  readTab,
  parseTabToChapters
};
