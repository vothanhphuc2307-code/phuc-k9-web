'use strict';

const DEFAULT_SCORING = Object.freeze({
  mcq: 0.25,
  tf: Object.freeze([0, 0.1, 0.25, 0.5, 1]),
  short: 0.25
});

function numberInRange(value, min = 0, max = 10) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

function normalizeScoring(exam) {
  const raw = exam && exam.scoring && typeof exam.scoring === 'object' ? exam.scoring : {};
  const mcq = numberInRange(raw.mcq) ? Number(raw.mcq) : DEFAULT_SCORING.mcq;
  const short = numberInRange(raw.short) ? Number(raw.short) : DEFAULT_SCORING.short;
  const tf = Array.isArray(raw.tf) && raw.tf.length >= 2 && raw.tf.length <= 11 &&
    raw.tf.every(v => numberInRange(v))
      ? raw.tf.map(Number)
      : [...DEFAULT_SCORING.tf];
  return { mcq, tf, short };
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function safeQuestionImageUrl(value) {
  const url = String(value || '').trim();
  return /^\/(?:assets|exam-sources)\/[A-Za-z0-9._/-]{1,500}$/.test(url) && !url.includes('..') && !url.includes('//') && !url.includes('\\');
}

function questionNeedsReview(q) {
  if (!q || q.reviewRequired) return true;
  if (!hasValue(q.text)) return true;

  if (q.type === 'mcq') {
    const options = Array.isArray(q.options) ? q.options : [];
    const answer = String(q.answer ?? '').trim().toUpperCase();
    const index = answer.charCodeAt(0) - 65;
    return options.length < 2 || !options.every(hasValue) ||
      !/^[A-Z]$/.test(answer) || index < 0 || index >= options.length;
  }

  if (q.type === 'truefalse') {
    const statements = Array.isArray(q.statements) ? q.statements : [];
    return statements.length === 0 || statements.some(s =>
      !s || !hasValue(s.text) || typeof s.answer !== 'boolean'
    );
  }

  if (q.type === 'short') {
    const candidates = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length
      ? q.acceptedAnswers
      : [q.answer];
    return !candidates.some(hasValue);
  }

  return true;
}

function validateExamStructure(exam) {
  if (!exam || typeof exam !== 'object' || Array.isArray(exam)) return 'Dữ liệu đề phải là một object JSON.';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{1,119}$/.test(String(exam.id || '').trim())) {
    return 'Mã đề chỉ được gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang (2–120 ký tự).';
  }
  if (typeof exam.title !== 'string' || exam.title.trim().length < 2 || exam.title.trim().length > 300) {
    return 'Tên đề phải có từ 2 đến 300 ký tự.';
  }
  if (!Array.isArray(exam.questions) || exam.questions.length < 1 || exam.questions.length > 300) {
    return 'Đề phải có từ 1 đến 300 câu hỏi.';
  }
  if (exam.duration !== undefined && (!Number.isInteger(Number(exam.duration)) || Number(exam.duration) < 1 || Number(exam.duration) > 360)) {
    return 'Thời gian làm bài phải từ 1 đến 360 phút.';
  }

  const ids = new Set();
  for (let i = 0; i < exam.questions.length; i++) {
    const q = exam.questions[i];
    const label = `Câu ${i + 1}`;
    if (!q || typeof q !== 'object' || Array.isArray(q)) return `${label}: cấu trúc câu hỏi không hợp lệ.`;
    const id = String(q.id || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(id)) return `${label}: mã câu hỏi không hợp lệ.`;
    if (ids.has(id)) return `${label}: mã câu hỏi bị trùng (${id}).`;
    ids.add(id);
    if (!hasValue(q.section)) return `${label}: thiếu section.`;
    if (typeof q.text !== 'string' || !q.text.trim() || q.text.length > 20000) return `${label}: thiếu nội dung hoặc nội dung quá dài.`;
    if (q.imageUrl !== undefined && q.imageUrl !== null && q.imageUrl !== '' && !safeQuestionImageUrl(q.imageUrl)) return `${label}: imageUrl phải trỏ tới file ảnh cùng website trong /assets/ hoặc /exam-sources/.`;
    if (q.imageAlt !== undefined && (typeof q.imageAlt !== 'string' || q.imageAlt.length > 300)) return `${label}: imageAlt tối đa 300 ký tự.`;
    if (q.table !== undefined && q.table !== null) {
      if (!Array.isArray(q.table) || q.table.length > 30 || q.table.some(row => !Array.isArray(row) || row.length > 12 || row.some(cell => !['string','number'].includes(typeof cell) || String(cell).length > 500))) return `${label}: bảng dữ liệu tối đa 30 hàng × 12 cột; mỗi ô chỉ là văn bản hoặc số tối đa 500 ký tự.`;
    }

    if (q.type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8 || !q.options.every(v => typeof v === 'string' && v.trim() && v.length <= 4000)) {
        return `${label}: trắc nghiệm một đáp án cần từ 2 đến 8 lựa chọn văn bản.`;
      }
      if (q.answer !== undefined && q.answer !== null && q.answer !== '') {
        const answer = String(q.answer).trim().toUpperCase();
        if (!/^[A-Z]$/.test(answer) || answer.charCodeAt(0) - 65 >= q.options.length) return `${label}: đáp án phải là chữ cái tương ứng với một lựa chọn.`;
      }
    } else if (q.type === 'truefalse') {
      if (!Array.isArray(q.statements) || q.statements.length < 1 || q.statements.length > 16) return `${label}: dạng đúng/sai cần từ 1 đến 16 ý.`;
      for (let j = 0; j < q.statements.length; j++) {
        const st = q.statements[j];
        if (!st || typeof st.text !== 'string' || !st.text.trim() || st.text.length > 6000) return `${label}, ý ${j + 1}: nội dung không hợp lệ.`;
        if (st.answer !== undefined && st.answer !== null && typeof st.answer !== 'boolean') return `${label}, ý ${j + 1}: đáp án phải là true, false hoặc để trống khi đang soạn nháp.`;
      }
    } else if (q.type === 'short') {
      if (q.answer !== undefined && q.answer !== null && !['string', 'number'].includes(typeof q.answer)) return `${label}: đáp án ngắn phải là chuỗi hoặc số.`;
      if (q.acceptedAnswers !== undefined && (!Array.isArray(q.acceptedAnswers) || q.acceptedAnswers.length > 20 || q.acceptedAnswers.some(v => !['string', 'number'].includes(typeof v)))) {
        return `${label}: acceptedAnswers phải là danh sách tối đa 20 chuỗi hoặc số.`;
      }
    } else {
      return `${label}: dạng câu hỏi chưa được hỗ trợ (${String(q.type || 'trống')}).`;
    }
  }

  if (exam.scoring !== undefined) {
    if (!exam.scoring || typeof exam.scoring !== 'object' || Array.isArray(exam.scoring)) return 'scoring phải là object.';
    for (const field of ['mcq', 'short']) {
      if (exam.scoring[field] !== undefined && !numberInRange(exam.scoring[field])) return `Điểm ${field} phải là số từ 0 đến 10.`;
    }
    if (exam.scoring.tf !== undefined) {
      const tf = exam.scoring.tf;
      if (!Array.isArray(tf) || tf.length < 2 || tf.length > 11 || !tf.every(v => numberInRange(v))) return 'scoring.tf phải là danh sách từ 2 đến 11 mức điểm hợp lệ.';
      for (let i = 1; i < tf.length; i++) if (Number(tf[i]) < Number(tf[i - 1])) return 'Các mức điểm scoring.tf phải không giảm.';
    }
  }
  return null;
}

module.exports = { DEFAULT_SCORING, normalizeScoring, questionNeedsReview, validateExamStructure, safeQuestionImageUrl };
