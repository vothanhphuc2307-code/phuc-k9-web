const OpenAI = require('openai');
const { sendJson } = require('../lib/auth');

let client;
function getOpenAI() {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('Thiếu OPENAI_API_KEY trên Vercel.');
    err.code = 'OPENAI_NOT_CONFIGURED';
    throw err;
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, message: 'AI Tutor chỉ nhận POST.' });
    }
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const message = String(body.message || '').trim();
    if (!message) return sendJson(res, 422, { ok: false, message: 'Nội dung câu hỏi đang trống.' });
    if (message.length > 2000) return sendJson(res, 422, { ok: false, message: 'Câu hỏi tối đa 2000 ký tự.' });

    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
    const context = body.context || {};
    const system = `Bạn là PHÚC K9 AI TUTOR cho học sinh THPT Việt Nam. Trả lời bằng tiếng Việt, dễ hiểu, ưu tiên hướng dẫn từng bước và không bịa dữ kiện. Khi người học hỏi bài toán, hãy trình bày phép biến đổi rõ ràng. Khi chưa đủ dữ kiện, hỏi lại đúng phần còn thiếu. Context bài học: ${String(context.title || '').slice(0, 300)}. Mô tả: ${String(context.description || '').slice(0, 1000)}.`;

    const response = await getOpenAI().responses.create({
      model,
      input: [
        { role: 'developer', content: system },
        { role: 'user', content: message }
      ]
    });

    return sendJson(res, 200, { ok: true, answer: response.output_text || 'Mình chưa tạo được câu trả lời.' });
  } catch (err) {
    console.error('ai-api', err);
    if (err?.code === 'OPENAI_NOT_CONFIGURED') return sendJson(res, 503, { ok: false, message: err.message });
    if (err?.status === 401) return sendJson(res, 502, { ok: false, message: 'OPENAI_API_KEY không hợp lệ hoặc đã hết quyền.' });
    if (err?.status === 429) return sendJson(res, 429, { ok: false, message: 'OpenAI đang giới hạn lượt gọi. Thử lại sau ít giây.' });
    return sendJson(res, 500, { ok: false, message: 'AI Tutor gặp lỗi máy chủ. Kiểm tra OPENAI_API_KEY và OPENAI_MODEL.' });
  }
};
