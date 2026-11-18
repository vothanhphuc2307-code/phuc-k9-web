const { sendJson, getSession, rejectIfBanned, getClientIp, getRequestVisitorId } = require('../lib/auth');
const { getRedis } = require('../lib/redis');

const PROVIDER_ORDER = ['gemini', 'groq', 'mistral', 'nvidia', 'openrouter', 'openai'];

const PROVIDERS = {
  gemini: {
    id: 'gemini',
    label: 'Google Gemini (Free AI Studio)',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    envKey: 'GEMINI_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Miễn phí không cần thẻ Visa tại aistudio.google.com (~500 req/ngày, hỗ trợ Camera Vision cực chuẩn).',
    getModels: hasImage => {
      const envM = String(process.env.GEMINI_MODEL || '').trim();
      const defaults = ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];
      void hasImage;
      return envM ? [envM, ...defaults.filter(m => m !== envM)] : defaults;
    }
  },
  groq: {
    id: 'groq',
    label: 'Groq LPU Cloud (Free)',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    envKey: 'GROQ_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Miễn phí tại console.groq.com (~1.000 - 14.400 req/ngày, tốc độ siêu nhanh, Vision Llama 4 Scout).',
    getModels: hasImage => hasImage
      ? ['meta-llama/llama-4-scout-17b-16e-instruct']
      : [String(process.env.GROQ_MODEL || '').trim() || 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral Experiment (Free)',
    url: 'https://api.mistral.ai/v1/chat/completions',
    envKey: 'MISTRAL_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Gói Experiment miễn phí 1 tỷ token/tháng tại console.mistral.ai (cần xác minh SĐT).',
    getModels: hasImage => hasImage ? ['pixtral-12b-2409'] : ['mistral-small-latest']
  },
  nvidia: {
    id: 'nvidia',
    label: 'NVIDIA NIM Sandbox (Free)',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    envKey: 'NVIDIA_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Miễn phí thử nghiệm ~40 RPM tại build.nvidia.com.',
    getModels: hasImage => hasImage ? ['meta/llama-3.2-90b-vision-instruct'] : ['meta/llama-3.3-70b-instruct']
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter Free',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Miễn phí tại openrouter.ai (50 req/ngày mặc định, 1.000 req/ngày nếu từng nạp $10).',
    getModels: () => [String(process.env.OPENROUTER_MODEL || '').trim() || 'openrouter/free']
  },
  openai: {
    id: 'openai',
    label: 'OpenAI API',
    url: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
    supportsVision: true,
    freeQuotaNote: 'Cần tài khoản có credit trả phí tại platform.openai.com.',
    getModels: () => [String(process.env.OPENAI_MODEL || '').trim() || 'gpt-4o-mini']
  }
};

function sanitizeImageDataUrl(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.length > 3600000) return '';
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(s)) return '';
  return s;
}

async function getConfiguredServerProviders(redis) {
  let storedKeys = {};
  if (redis) {
    try {
      const raw = await redis.get('phuc:system:ai-keys');
      storedKeys = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? raw : {});
    } catch {
      storedKeys = {};
    }
  }
  return PROVIDER_ORDER
    .map(id => {
      const envVal = String(process.env[PROVIDERS[id].envKey] || '').trim();
      const dbVal = String(storedKeys?.[id] || '').trim();
      return { def: PROVIDERS[id], key: envVal || dbVal };
    })
    .filter(x => x.key.length > 8);
}

async function callOpenAiCompat({ providerDef, apiKey, model, systemPrompt, userPrompt, imageDataUrl }) {
  const userContent = imageDataUrl
    ? [
        { type: 'text', text: userPrompt || 'Hãy đọc đề bài trong ảnh và giải chi tiết từng bước bằng tiếng Việt, dùng công thức LaTeX $...$ rõ ràng.' },
        { type: 'image_url', image_url: { url: imageDataUrl } }
      ]
    : userPrompt;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  if (providerDef.id === 'openrouter') {
    headers['HTTP-Referer'] = String(process.env.APP_ORIGIN || 'https://thanhphuc.vercel.app');
    headers['X-Title'] = 'Hoc Cung Phuc K9';
  }

  const resp = await fetch(providerDef.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    }),
    signal: AbortSignal.timeout ? AbortSignal.timeout(22000) : undefined
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const errMsg = data?.error?.message || data?.message || `HTTP ${resp.status}`;
    const err = new Error(errMsg);
    err.status = resp.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map(p => (typeof p === 'string' ? p : p?.text || '')).join('\n').trim()
    : String(content || '').trim();
  if (!text) {
    const err = new Error('Model trả về nội dung rỗng.');
    err.status = 502;
    throw err;
  }
  return text;
}

module.exports = async function handler(req, res) {
  try {
    const redis = getRedis();
    const session = await getSession(req);
    const aiBan = await rejectIfBanned(redis, req, res, session?.username || '');
    if (aiBan) {
      return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: aiBan.reason, error: 'Tài khoản đã bị khóa vĩnh viễn.' });
    }

    if (req.method === 'GET') {
      const configuredList = (await getConfiguredServerProviders(redis)).map(x => ({
        id: x.def.id,
        label: x.def.label,
        vision: x.def.supportsVision
      }));
      return sendJson(res, 200, {
        ok: true,
        configured: configuredList.length > 0,
        vision_ready: configuredList.some(p => p.vision),
        active_providers: configuredList,
        recommended_free: [
          { id: 'gemini', label: PROVIDERS.gemini.label, signup_url: 'https://aistudio.google.com/apikey', env: 'GEMINI_API_KEY', note: PROVIDERS.gemini.freeQuotaNote },
          { id: 'groq', label: PROVIDERS.groq.label, signup_url: 'https://console.groq.com/keys', env: 'GROQ_API_KEY', note: PROVIDERS.groq.freeQuotaNote },
          { id: 'mistral', label: PROVIDERS.mistral.label, signup_url: 'https://console.mistral.ai/api-keys', env: 'MISTRAL_API_KEY', note: PROVIDERS.mistral.freeQuotaNote }
        ]
      });
    }

    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, message: 'AI Tutor nhận GET (status) hoặc POST (hỏi đáp/giải ảnh).' });
    }

    // Light rate limit per visitor to protect free AI quotas
    const vis = getRequestVisitorId(req) || getClientIp(req) || 'anon';
    try {
      const rlKey = `phuc:ai:rl:${vis}`;
      const hits = Number(await redis.incr(rlKey)) || 1;
      if (hits === 1) await redis.expire(rlKey, 60);
      if (hits > 15) {
        return sendJson(res, 429, { ok: false, message: 'Bạn hỏi hơi nhanh — chờ khoảng 30 giây rồi gửi câu tiếp theo nhé!' });
      }
    } catch {}

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }

    const rawImage = body.image_data || body.image || '';
    const imageDataUrl = sanitizeImageDataUrl(rawImage);
    if (rawImage && !imageDataUrl) {
      return sendJson(res, 422, { ok: false, message: 'Ảnh tải lên không hợp lệ hoặc vượt quá dung lượng cho phép (tối đa ~2.5MB, JPG/PNG/WEBP).' });
    }

    const message = String(body.message || body.prompt || '').trim();
    if (!message && !imageDataUrl) {
      return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập câu hỏi hoặc chụp/chọn ảnh bài tập cần giải.' });
    }
    if (message.length > 2500) {
      return sendJson(res, 422, { ok: false, message: 'Câu hỏi tối đa 2500 ký tự.' });
    }

    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const ctxGrade = String(context.grade || '').slice(0, 20);
    const ctxSubject = String(body.subject_hint || context.subject || '').slice(0, 40);
    const ctxTitle = String(context.title || '').slice(0, 300);
    const ctxDesc = String(context.description || '').slice(0, 600);

    const systemPrompt = [
      'Bạn là GIA SƯ AI HỌC CÙNG PHÚC K9 dành cho học sinh THCS/THPT Việt Nam (2K8–2K12, ĐGNL).',
      'Trả lời bằng tiếng Việt súc tích, dễ hiểu, giải chi tiết từng bước. Dùng LaTeX $...$ cho công thức inline và $$...$$ cho công thức quan trọng.',
      imageDataUrl
        ? 'Khi học sinh gửi ảnh đề bài: (1) Đọc/chép lại chính xác đề bài trong ảnh (nếu ảnh mờ ở chỗ nào hãy nói rõ phần chưa rõ chứ không tự bịa số liệu); (2) Nêu hướng làm ngắn gọn; (3) Trình bày lời giải từng bước và chốt đáp án cuối cùng.'
        : 'Nếu học sinh làm sai hướng, chỉ ra chỗ dễ mắc bẫy rồi hướng dẫn sửa.',
      ctxGrade ? `Khối lớp ưu tiên: ${ctxGrade}.` : '',
      ctxSubject ? `Môn học đang chọn: ${ctxSubject}.` : '',
      ctxTitle ? `Ngữ cảnh bài đang học: ${ctxTitle}.` : '',
      ctxDesc ? `Mô tả thêm: ${ctxDesc}.` : ''
    ].filter(Boolean).join(' ');

    const candidateQueue = [];
    const clientProvId = String(body.client_provider || 'gemini').trim().toLowerCase();
    const clientKey = String(body.client_key || '').trim();
    if (clientKey.length >= 10 && clientKey.length <= 260 && PROVIDERS[clientProvId]) {
      candidateQueue.push({ def: PROVIDERS[clientProvId], key: clientKey, isClientKey: true });
    }
    for (const entry of await getConfiguredServerProviders(redis)) {
      if (!candidateQueue.some(c => c.def.id === entry.def.id && c.key === entry.key)) {
        candidateQueue.push({ def: entry.def, key: entry.key, isClientKey: false });
      }
    }

    if (!candidateQueue.length) {
      return sendJson(res, 503, {
        ok: false,
        unconfigured: true,
        message: 'Hệ thống Gia Sư AI chưa được Admin gắn API Key trên máy chủ.'
      });
    }

    let lastStatus = 500;
    let lastErrorMsg = '';
    for (const cand of candidateQueue) {
      const models = cand.def.getModels(Boolean(imageDataUrl));
      for (const model of models) {
        try {
          const answer = await callOpenAiCompat({
            providerDef: cand.def,
            apiKey: cand.key,
            model,
            systemPrompt,
            userPrompt: message || 'Hãy đọc đề bài trong ảnh và giải chi tiết từng bước bằng tiếng Việt.',
            imageDataUrl
          });
          return sendJson(res, 200, {
            ok: true,
            answer,
            reply: answer,
            model,
            provider: cand.def.label,
            provider_id: cand.def.id,
            used_vision: Boolean(imageDataUrl)
          });
        } catch (err) {
          lastStatus = Number(err?.status || 500);
          lastErrorMsg = String(err?.message || 'Lỗi kết nối AI');
          // Retry next model/provider on rate-limit, quota, or model unavailability
          if ([400, 401, 402, 403, 404, 429, 500, 502, 503, 504].includes(lastStatus)) {
            continue;
          }
        }
      }
    }

    if (lastStatus === 401 || lastStatus === 403) {
      return sendJson(res, 502, { ok: false, message: `API Key AI chưa hợp lệ hoặc hết quyền (${lastErrorMsg}). Hãy kiểm tra lại GEMINI_API_KEY / GROQ_API_KEY.` });
    }
    if (lastStatus === 429) {
      return sendJson(res, 429, { ok: false, message: 'Các nguồn AI miễn phí đang tạm chạm giới hạn lượt gọi/phút. Thử lại sau 15–30 giây nhé!' });
    }
    return sendJson(res, 502, { ok: false, message: `Không thể gọi AI Tutor (${lastErrorMsg || 'Timeout'}). Thử lại sau giây lát!` });
  } catch (err) {
    console.error('ai-api', err);
    return sendJson(res, 500, { ok: false, message: 'AI Tutor gặp lỗi xử lý trên máy chủ.' });
  }
};
