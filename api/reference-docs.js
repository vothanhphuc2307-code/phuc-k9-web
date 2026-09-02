const FEED_URL = 'https://khoahocthanhphuc2306.blogspot.com/feeds/posts/default?alt=atom&max-results=500';

function stripHtml(input = '') {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeXml(value = '') {
  return String(value)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function firstTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? decodeXml(m[1]) : '';
}

function attr(tag, name) {
  const re = new RegExp(`${name}=["']([^"']+)["']`, 'i');
  const m = String(tag).match(re);
  return m ? decodeXml(m[1]) : '';
}

function classify(text) {
  const s = String(text || '').toLowerCase();
  let grade = '';
  if (/2k9|lớp\s*12|toán\s*12|vật\s*l[ií]\s*12|hóa\s*học\s*12|tiếng\s*anh\s*12/.test(s)) grade = '2K9';
  else if (/2k11|lớp\s*10|toán\s*10|vật\s*l[ií]\s*10|hóa\s*học\s*10|sinh\s*học\s*10|tiếng\s*anh\s*10/.test(s)) grade = '2K11';
  else if (/2k12|lớp\s*9|toán\s*9|vật\s*l[ií]\s*9|hóa\s*học\s*9|tiếng\s*anh\s*9/.test(s)) grade = '2K12';

  let subject = '';
  if (/toán/.test(s)) subject = `Toán ${grade === '2K9' ? '12' : grade === '2K11' ? '10' : grade === '2K12' ? '9' : ''}`.trim();
  else if (/vật\s*l[ií]|vật lý|vật li/.test(s)) subject = `Vật lí ${grade === '2K9' ? '12' : grade === '2K11' ? '10' : grade === '2K12' ? '9' : ''}`.trim();
  else if (/hóa\s*học|hoá\s*học/.test(s)) subject = `Hóa học ${grade === '2K9' ? '12' : grade === '2K11' ? '10' : grade === '2K12' ? '9' : ''}`.trim();
  else if (/sinh\s*học|sinh hoc/.test(s)) subject = `Sinh học ${grade === '2K11' ? '10' : grade === '2K12' ? '9' : grade === '2K9' ? '12' : ''}`.trim();
  else if (/tiếng\s*anh|tieng anh|english/.test(s)) subject = `Tiếng Anh ${grade === '2K9' ? '12' : grade === '2K11' ? '10' : grade === '2K12' ? '9' : ''}`.trim();
  return { grade: grade || 'Khác', subject: subject || 'Khác' };
}

function extractUrls(html = '') {
  const urls = [];
  const re = /<(?:a|iframe|embed|object)[^>]+(?:href|src|data)=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) urls.push(decodeXml(m[1]));
  const textUrls = html.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  urls.push(...textUrls.map(decodeXml));
  return [...new Set(urls)];
}

function normalizePdfUrl(raw) {
  if (!raw) return '';
  let url = raw.replace(/&amp;/g, '&').trim();
  if (/\.pdf(?:[?#]|$)/i.test(url)) return url;
  const drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([A-Za-z0-9_-]+)/i);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  return '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ ok: false, message: 'GET only' }));
  }
  try {
    const response = await fetch(FEED_URL, { headers: { accept: 'application/atom+xml,text/xml;q=0.9,*/*;q=0.8' } });
    if (!response.ok) throw new Error(`Nguồn tài liệu trả HTTP ${response.status}`);
    const xml = await response.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
    const docs = [];
    const seen = new Set();

    for (const entry of entries) {
      const title = stripHtml(firstTag(entry, 'title'));
      const published = firstTag(entry, 'published') || firstTag(entry, 'updated');
      const content = firstTag(entry, 'content');
      const summary = firstTag(entry, 'summary');
      const links = [...entry.matchAll(/<link([^>]+?)\/>/gi)].map(m => m[1]).map(attrs => attr(attrs, 'href')).filter(Boolean);
      const postUrl = links.find(u => /blogspot\.com\//i.test(u) && !/feeds\//i.test(u)) || '';
      const labels = [...entry.matchAll(/<category([^>]+?)\/>/gi)].map(m => attr(m[1], 'term')).filter(Boolean);
      const allText = `${title} ${summary} ${content} ${labels.join(' ')}`;
      const cls = classify(allText);
      const candidates = extractUrls(content).concat(extractUrls(summary));
      for (const candidate of candidates) {
        const pdfUrl = normalizePdfUrl(candidate);
        if (!pdfUrl || seen.has(pdfUrl)) continue;
        seen.add(pdfUrl);
        docs.push({
          grade: cls.grade,
          subject: cls.subject,
          title: title || 'Tài liệu FlashStudy/Thanh Phúc',
          kind: /đáp án|lời giải/i.test(allText) ? 'Đáp án / lời giải' : /đề|kiểm tra|thi/i.test(allText) ? 'Đề / bài tập' : 'Tài liệu PDF',
          source: 'Kho tổng hợp Thanh Phúc',
          url: pdfUrl,
          postUrl,
          published: published || '',
          labels
        });
      }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600');
    return res.end(JSON.stringify({ ok: true, source: FEED_URL, count: docs.length, docs }));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, message: err.message }));
  }
};
