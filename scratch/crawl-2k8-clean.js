const fs = require('fs');
const path = require('path');

const SCRATCH_OUT = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch';

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function cleanUrl(href) {
  href = decodeEntities(href).trim();
  const qm = href.match(/google\.com\/url\?q=([^&]+)/);
  if (qm) {
    try { return decodeURIComponent(qm[1]); } catch { return qm[1]; }
  }
  return href;
}

function extractYoutubeId(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractDriveFileId(url) {
  const s = String(url || '');
  const m = s.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{15,})/);
  if (m) return m[1];
  const m2 = s.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]{15,})/);
  return m2 ? m2[1] : null;
}

function extractDriveFolderId(url) {
  const m = String(url || '').match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]{15,})/);
  return m ? m[1] : null;
}

function extractSheetId(url) {
  const m = String(url || '').match(/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]{15,})/);
  return m ? m[1] : null;
}

function extractDocId(url) {
  const m = String(url || '').match(/docs\.google\.com\/(?:document|presentation)\/d\/([A-Za-z0-9_-]{15,})/);
  return m ? m[1] : null;
}

async function fetchText(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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

async function fetchSpreadsheet(sheetId, maxTabs = 24) {
  const outer = await fetchText(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
  if (!outer || /accounts\.google\.com\/v3\/signin/i.test(outer)) {
    return { ok: false, title: '', tabs: [] };
  }
  const titleMatch = outer.match(/<title>([\s\S]*?)<\/title>/i);
  const title = decodeEntities((titleMatch ? titleMatch[1] : '').replace(/\s*-\s*Google (Drive|Sheets|Trang tính).*$/i, '').trim());
  let tabs = [...outer.matchAll(/items\.push\(\{name:\s*"([^"]+)"[^}]*gid:\s*"([^"]+)"/g)].map(m => ({
    name: decodeEntities(m[1].replace(/\\x26/g, '&').replace(/\\u0026/g, '&')),
    gid: m[2]
  }));
  if (!tabs.length) tabs = [{ name: 'Chính', gid: '0' }];

  const tabSlice = tabs.slice(0, maxTabs);
  const tabResults = [];
  for (let i = 0; i < tabSlice.length; i += 4) {
    const chunk = tabSlice.slice(i, i + 4);
    const fetched = await Promise.all(chunk.map(async tab => {
      const dataHtml = await fetchText(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview/sheet?headers=true&gid=${tab.gid}`);
      return { tabName: tab.name, gid: tab.gid, rows: parseSheetHtmlRows(dataHtml) };
    }));
    tabResults.push(...fetched);
  }
  return { ok: true, title, totalTabs: tabs.length, tabs: tabResults };
}

function isNoiseOrMetaCell(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return true;
  if (/^\d{1,4}$/.test(s)) return true;
  if (/^[-–—xX?.•*]+$/.test(s)) return true;
  // Dates & times & shifts
  if (/^\d{1,2}[\/.-]\d{1,2}([\/.-]\d{2,4})?$/.test(s)) return true;
  if (/^\d{1,2}\s*[hH:]\s*\d{0,2}(\s*[-–]\s*\d{1,2}\s*[hH:]\s*\d{0,2})?$/.test(s)) return true;
  if (/^(ca\s*\d+\s*[:：]?\s*)?[\[\(]?\d{1,2}\s*[hH:]\s*\d{0,2}[\]\)]?$/i.test(s)) return true;
  // Weekdays & generic status
  if (/^(thứ\s+)?(hai|ba|tư|năm|sáu|bảy|[2-7])$/i.test(s)) return true;
  if (/^(chủ\s+nhật|cn|t2|t3|t4|t5|t6|t7)$/i.test(s)) return true;
  if (/^(đã hoàn thành|đã xong|hoàn thành|chưa cập nhật|đang cập nhật|đang update|sắp có|chưa có|free|vip)$/i.test(s)) return true;
  // Format / generic CTA labels
  if (/^học\s*liv[e]?stream\s*cùng\s+/i.test(s)) return true;
  if (/^tự học theo hướng dẫn/i.test(s)) return true;
  if (/^(vào học|xem ngay|tại đây|click|nhấn vào|link tải|tải về|download|làm bài)$/i.test(s)) return true;
  if (/^(link|link đề|video|video\s*\d+|video chữa|bài giảng|bài giảng\s*\d+|record|full|tài liệu|file đề|đề|đáp án|bản viết tay|viết tay|btvn|giải btvn|lời giải|key|slide|pdf|bổ sung|ghi chú|link\s*(p\d+|phần\s*\d+))$/i.test(s)) return true;
  if (/^link\s*\(p\d+\)$/i.test(s)) return true;
  return false;
}

function isContinuationLabel(s) {
  return /^(bài giảng\s*\d+|video\s*\d+|video chữa\s*\d+|phần\s*\d+|p\d+|link\s*\(p\d+\)|ca\s*\d+|tiết\s*\d+|chữa\s*btvn(\s*p?\d+)?|đáp án(\s*p?\d+)?)$/i.test(String(s || '').trim());
}

function isTableHeaderRow(cells) {
  const texts = cells.map(c => c.text.trim()).filter(Boolean);
  if (!texts.length) return false;
  const joined = texts.join(' | ').toLowerCase();
  if (/khoahocmoi|khóa học mới|zalo|facebook|đồng hành cùng em|liên hệ|mua khóa/i.test(joined) && texts.length <= 2) return true;
  const headerKeywordHits = texts.filter(t =>
    /^(stt|tt|no|ngày|thời gian|buổi|ca học|thứ|chương|chủ đề|tên bài(\s*học)?|nội dung(\s*học)?|tài liệu(\s*in)?|bài giảng|video(\s*bài giảng)?|chữa\s*(bài tập|btvn)?|đáp án(\s*viết tay)?|bản viết tay.*|btvn|bổ sung|ghi chú|trạng thái|tiến độ|update|khóa học)$/i.test(t)
  ).length;
  if (headerKeywordHits >= 2) return true;
  if (texts.length >= 4 && headerKeywordHits >= 1 && /tên bài|nội dung|tài liệu|bài giảng|video|đáp án/i.test(joined)) return true;
  return false;
}

function pickSectionHeading(cells) {
  const texts = cells.map(c => c.text.trim()).filter(Boolean);
  if (!texts.length || isTableHeaderRow(cells)) return '';
  if (texts.some(t => /ĐÃ HOÀN THÀNH|ĐÃ XONG KHÓA|ZALO|FACEBOOK|LIÊN HỆ|KHOAHOCMOI|TỰ ĐỘNG CẬP NHẬT|LƯU Ý\s*:/i.test(t))) return '';

  // Single merged heading cell or 2 cells where 2nd is short subtitle/badge
  const firstMeaningful = texts.find(t => !isNoiseOrMetaCell(t));
  if (!firstMeaningful) return '';

  // Explicitly recognizable chapter / section patterns
  if (texts.length <= 2) {
    const combined = texts.join(' — ');
    if (combined.length >= 4 && combined.length <= 150) return combined;
  }

  // If 3+ cells without links, only accept if one cell clearly says Chương/Chủ đề/CĐ/Chuyên đề/Phần/Mục/Unit/Step
  // AND there are no table placeholders like '| x |' or '| - |' indicating an incomplete lesson row
  const hasPlaceholderCol = texts.some(t => /^(x|-|–|bài giảng|video|tài liệu|đáp án|phần này giống.*)$/i.test(t));
  if (!hasPlaceholderCol) {
    const chapCell = texts.find(t => /^(chương|chủ đề|cđ\s*\d|chuyên đề|phần|mục|giai đoạn|step|unit)\b/i.test(t));
    if (chapCell && chapCell.length <= 140) return chapCell;
  }
  return '';
}

function scoreTitleCandidate(text) {
  const s = text.trim();
  if (!s || /^https?:\/\//i.test(s) || isNoiseOrMetaCell(s)) return -100;
  let score = Math.min(s.length, 90);
  if (/^(chương|chủ đề|bài|buổi|đề|câu|phần|tiết|unit|dạng|tổng ôn|chữa|lý thuyết|thực chiến|kiểm tra|tx\d+|ta\d+|ya\d+|kha[io]\s*giảng|mở đầu)/i.test(s)) {
    score += 40;
  }
  if (/^[\[\(\{].*[\]\)\}]/.test(s)) score += 10;
  return score;
}

function pickBestTitle(cells, allLinks, lastMainTitle) {
  const nonLinkCandidates = cells
    .filter(c => c.links.length === 0)
    .map(c => c.text.trim())
    .map(t => ({ t, sc: scoreTitleCandidate(t) }))
    .filter(x => x.sc > 0)
    .sort((a, b) => b.sc - a.sc);

  if (nonLinkCandidates.length) {
    return { title: nonLinkCandidates[0].t, isContinuation: false };
  }

  // Check cells with links where the text itself IS descriptive (e.g. hyperlinked title)
  const linkedCandidates = cells
    .filter(c => c.links.length > 0)
    .map(c => c.text.trim())
    .map(t => ({ t, sc: scoreTitleCandidate(t) }))
    .filter(x => x.sc >= 12)
    .sort((a, b) => b.sc - a.sc);

  if (linkedCandidates.length) {
    return { title: linkedCandidates[0].t, isContinuation: false };
  }

  // Check if this is a continuation row like [BÀI GIẢNG 2] under the previous lesson
  const rawShort = cells.map(c => c.text.trim()).find(t => t && !/^\d+$/.test(t) && !/^[-x]+$/i.test(t))
    || (allLinks[0] && allLinks[0].label)
    || '';
  if (lastMainTitle && rawShort && isContinuationLabel(rawShort)) {
    return { title: `${lastMainTitle} — ${rawShort}`, isContinuation: true };
  }

  if (lastMainTitle && rawShort && rawShort.length <= 24) {
    return { title: `${lastMainTitle} — ${rawShort}`, isContinuation: true };
  }

  const fallback = cells.find(c => !/^\d+$/.test(c.text) && c.text.length > 2 && !/^https?:\/\//i.test(c.text))?.text
    || allLinks.find(l => l.label && l.label.length > 2)?.label
    || 'Bài giảng chuyên đề';
  return { title: fallback, isContinuation: false };
}

function classifyRows(rows, meta) {
  const lessons = [];
  const subSheets = [];
  const pdfRows = [];
  let currentSection = '';
  let lastMainTitle = '';

  for (const cells of rows) {
    const allLinks = cells.flatMap(c => c.links);
    if (!allLinks.length) {
      if (isTableHeaderRow(cells)) continue;
      const sec = pickSectionHeading(cells);
      if (sec) {
        currentSection = sec;
        lastMainTitle = '';
      }
      continue;
    }

    let ytId = null;
    let ytUrl = '';
    let driveVideoUrl = '';
    let scriptVideoUrl = '';
    const pdfCandidates = [];
    const seenUrls = new Set();

    for (const lk of allLinks) {
      const url = (lk.url || '').trim();
      if (!url || seenUrls.has(url)) continue;
      seenUrls.add(url);
      const lbl = (lk.label || '').toLowerCase();

      const yt = extractYoutubeId(url);
      if (yt) {
        if (!ytId) { ytId = yt; ytUrl = `https://www.youtube.com/watch?v=${yt}`; }
        continue;
      }

      const sid = extractSheetId(url);
      if (sid && sid !== meta.rootSheetId) {
        const subTitle = cells.map(c => c.text).filter(t => !isNoiseOrMetaCell(t)).join(' • ');
        subSheets.push({ id: sid, title: subTitle || lk.label, label: lk.label });
        continue;
      }

      if (/script\.google\.com\/macros\//i.test(url)) {
        if (!scriptVideoUrl) scriptVideoUrl = url;
        continue;
      }

      const dfid = extractDriveFileId(url);
      const dfol = extractDriveFolderId(url);
      const docid = extractDocId(url);

      if (dfid && dfid.length >= 40) {
        // Google Sheets ID linked via drive.google.com/file/d/
        subSheets.push({ id: dfid, title: lk.label || cells[0]?.text || '', label: lk.label });
        continue;
      }

      if (dfid || dfol || docid) {
        const isSol = /viết tay|đáp án|lời giải|key|hdg|chi tiết|sol|chữa/i.test(lbl);
        const isPdfWord = /tài liệu|đề|pdf|file|slide|lý thuyết|bài tập|sách|btvn|bản viết tay|đáp án|lời giải|key/i.test(lbl);
        const isVidWord = (/video|bài giảng|record|full|xem bài|chữa đề|xem video/i.test(lbl) || /^video\b/i.test(lbl)) && !isPdfWord;
        const isExplicitChuaVid = /^video\s*chữa/i.test(lbl);

        if ((isVidWord || isExplicitChuaVid) && !driveVideoUrl && (dfid || dfol)) {
          driveVideoUrl = url;
        } else {
          pdfCandidates.push({
            url,
            label: lk.label || (isSol ? 'Đáp án / Bản viết tay PDF' : (dfol ? 'Thư mục tài liệu PDF' : 'Tài liệu PDF')),
            isSol
          });
        }
      }
    }

    if (!ytId && !driveVideoUrl && !pdfCandidates.length) continue;

    const picked = pickBestTitle(cells, allLinks, lastMainTitle);
    const title = picked.title.replace(/\s+/g, ' ').trim();
    if (!picked.isContinuation && !isContinuationLabel(title)) {
      lastMainTitle = title;
    }

    if (ytId || driveVideoUrl) {
      const mainPdf = pdfCandidates.find(p => !p.isSol) || pdfCandidates[0] || null;
      const solPdf = pdfCandidates.find(p => p.isSol && p !== mainPdf) || (pdfCandidates.length > 1 ? pdfCandidates[1] : null);
      const extraPdfs = pdfCandidates
        .filter(p => p !== mainPdf && p !== solPdf)
        .map(p => ({ label: p.label, url: p.url }));

      lessons.push({
        chapterHint: meta.tabName || '',
        section: currentSection,
        title: title.slice(0, 160),
        videoId: ytId || null,
        videoUrl: ytUrl || driveVideoUrl,
        driveVideoUrl: driveVideoUrl || null,
        pdfUrl: mainPdf ? mainPdf.url : null,
        solutionPdfUrl: solPdf ? solPdf.url : null,
        extraPdfs: extraPdfs.length ? extraPdfs : undefined
      });
    } else if (pdfCandidates.length && title && title.length >= 4 && !/^(stt|note|no|link)\b/i.test(title)) {
      pdfRows.push({
        chapterHint: meta.tabName || '',
        section: currentSection,
        title: title.slice(0, 160),
        pdfs: pdfCandidates.map(p => ({ label: p.label, url: p.url }))
      });
    } else if (scriptVideoUrl && pdfCandidates.length) {
      pdfRows.push({
        chapterHint: meta.tabName || '',
        section: currentSection,
        title: title.slice(0, 160),
        pdfs: pdfCandidates.map(p => ({ label: p.label, url: p.url }))
      });
    }
  }
  return { lessons, subSheets, pdfRows };
}

function buildTeacherListFrom2k8Index() {
  const rows = JSON.parse(fs.readFileSync(path.join(SCRATCH_OUT, 'sheet-2k8.json'), 'utf8'));
  const list = [];
  let curSubj = 'Toán';
  for (const r of rows) {
    if (r.row < 13 || r.row > 77) continue;
    const texts = r.cells.map(c => c.text).filter(Boolean);
    const first = texts[0] || '';
    if (/^📐\s*Toán$/i.test(first)) curSubj = 'Toán';
    else if (/^[⚡🧲]?\s*Vật lý$/i.test(first)) curSubj = 'Vật Lí';
    else if (/^🧪\s*Hóa$/i.test(first)) curSubj = 'Hóa Học';
    else if (/^🧬\s*Sinh$/i.test(first)) curSubj = 'Sinh Học';
    else if (/^📘\s*ANH$/i.test(first)) curSubj = 'Tiếng Anh';
    else if (/^📖\s*Ngữ văn$/i.test(first)) curSubj = 'Ngữ Văn';
    else if (/^📜\s*Sử$/i.test(first)) curSubj = 'Lịch Sử';
    else if (/^🌍\s*Địa$/i.test(first)) curSubj = 'Địa Lí';
    else if (/ĐGNL ĐHQGHN HSA/i.test(first)) curSubj = 'ĐGNL HSA';
    else if (/ĐGNL ĐHQGHCM V\s*-\s*ACT/i.test(first)) curSubj = 'ĐGNL V-ACT';
    else if (/ĐGTD BK TSA/i.test(first)) curSubj = 'TSA Bách Khoa';
    else if (/ĐGNL SƯ PHẠM/i.test(first) || /KÌ THI BỘ CÔNG AN/i.test(first)) curSubj = 'SPT & BCA';

    const link = r.cells.flatMap(c => c.links.map(l => l.url)).find(u => u.includes('docs.google.com/spreadsheets/d/') || u.includes('drive.google.com/file/d/'));
    if (!link) continue;
    const sheetId = extractSheetId(link) || extractDriveFileId(link);
    if (!sheetId || sheetId.length < 40) continue;

    let rawLabel = texts.find(t =>
      !/^[📐⚡🧪🧬📘📖📜🌍🏛️🎯📊🧠\s]*(Toán|Vật lý|Hóa|Sinh|ANH|Ngữ văn|Sử|Địa|ĐGNL ĐHQGHN HSA|ĐGNL ĐHQGHCM V\s*-\s*ACT|ĐGTD BK TSA|ĐGNL SƯ PHẠM HÀ NỘI VÀ TP HCM, BỘ CÔNG AN)$/i.test(t)
      && !/ĐÃ HOÀN THÀNH/i.test(t)
    ) || texts[0];
    const displayName = rawLabel.replace(/^📚\s*Môn\s*/i, '').replace(/\s+/g, ' ').trim();

    list.push({ row: r.row, subject: curSubj, rawName: displayName, sheetId });
  }
  return list;
}

async function crawlOneTeacher(t) {
  const main = await fetchSpreadsheet(t.sheetId, 24);
  if (!main.ok) {
    return { ...t, ok: false, lessons: [], pdfRows: [], tabsCount: 0, subCount: 0 };
  }

  let allLessons = [];
  let allPdfRows = [];
  const subQueue = [];
  const seenSheetIds = new Set([t.sheetId]);

  for (const tab of main.tabs) {
    const res = classifyRows(tab.rows, { rootSheetId: t.sheetId, tabName: tab.tabName });
    allLessons.push(...res.lessons);
    allPdfRows.push(...res.pdfRows);
    for (const s of res.subSheets) {
      if (!seenSheetIds.has(s.id)) {
        seenSheetIds.add(s.id);
        subQueue.push({ ...s, depth: 1 });
      }
    }
  }

  const subsToFetch = subQueue.slice(0, 28);
  const depth2Queue = [];
  for (let i = 0; i < subsToFetch.length; i += 5) {
    const batch = subsToFetch.slice(i, i + 5);
    const results = await Promise.all(batch.map(async sub => {
      const d = await fetchSpreadsheet(sub.id, 15);
      return { sub, d };
    }));
    for (const { sub, d } of results) {
      if (!d.ok) continue;
      for (const tab of d.tabs) {
        const res = classifyRows(tab.rows, {
          rootSheetId: sub.id,
          tabName: d.tabs.length > 1 ? `${d.title || sub.label} — ${tab.tabName}` : (d.title || sub.title || tab.tabName)
        });
        allLessons.push(...res.lessons);
        allPdfRows.push(...res.pdfRows);
        for (const s2 of res.subSheets) {
          if (!seenSheetIds.has(s2.id) && depth2Queue.length < 16) {
            seenSheetIds.add(s2.id);
            depth2Queue.push(s2);
          }
        }
      }
    }
  }

  for (let i = 0; i < depth2Queue.length; i += 5) {
    const batch = depth2Queue.slice(i, i + 5);
    const results = await Promise.all(batch.map(async sub => {
      const d = await fetchSpreadsheet(sub.id, 12);
      return { sub, d };
    }));
    for (const { sub, d } of results) {
      if (!d.ok) continue;
      for (const tab of d.tabs) {
        const res = classifyRows(tab.rows, {
          rootSheetId: sub.id,
          tabName: d.tabs.length > 1 ? `${d.title || sub.label} — ${tab.tabName}` : (d.title || sub.title || tab.tabName)
        });
        allLessons.push(...res.lessons);
        allPdfRows.push(...res.pdfRows);
      }
    }
  }

  return {
    ...t,
    ok: true,
    sheetTitle: main.title,
    tabsCount: main.tabs.length,
    subCount: subsToFetch.length + depth2Queue.length,
    lessons: allLessons,
    pdfRows: allPdfRows
  };
}

async function main() {
  const teachers = buildTeacherListFrom2k8Index();
  console.log(`Crawling ${teachers.length} 2K8 teacher sheets with clean chapter & title parser...`);
  const out = [];
  for (let i = 0; i < teachers.length; i += 4) {
    const batch = teachers.slice(i, i + 4);
    const res = await Promise.all(batch.map(crawlOneTeacher));
    for (const r of res) {
      const pipeSecs = r.lessons.filter(l => (l.section || '').includes(' | ')).length;
      const generic = r.lessons.filter(l => isNoiseOrMetaCell(l.title)).length;
      console.log(`[${r.row}] ${r.subject} | ${(r.sheetTitle || r.rawName).slice(0, 40)} | ok:${r.ok} tabs:${r.tabsCount} subs:${r.subCount} | L:${r.lessons.length} PR:${r.pdfRows.length} | pipeSecs:${pipeSecs} noiseTitles:${generic}`);
      out.push(r);
    }
  }
  const dest = path.join(SCRATCH_OUT, '2k8-teachers-clean.json');
  fs.writeFileSync(dest, JSON.stringify(out));
  console.log(`\nSAVED ${dest}! Total lessons=${out.reduce((s, r) => s + r.lessons.length, 0)}, total pdfRows=${out.reduce((s, r) => s + r.pdfRows.length, 0)}`);
}

main();
