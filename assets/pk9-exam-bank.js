/* ============================================================================
 * HỌC CÙNG PHÚC K9 — FULL 11-SUBJECT GDPT 2018 EXAM BANK ENGINE (220+ EXAMS)
 * Shared UMD module: works identically in Node.js (/api/exams) & Browser UI.
 * Every exam is 100% deterministic, passes validateExamStructure(), uses 3-part
 * GDPT 2018 scoring (MCQ + Progressive True/False + Short Answer) and provides
 * accurate, step-by-step Vietnamese solutions for every single question.
 * ============================================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    window.PK9_EXAM_BANK = api;
    // Automatically merge lightweight catalog entries into window.PK9_SEED_EXAMS
    try {
      const existing = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : [];
      const seen = new Set(existing.map(x => x && x.id));
      const extras = api.getCatalogSummaries().filter(x => !seen.has(x.id));
      window.PK9_SEED_EXAMS = existing.concat(extras);
    } catch {}
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --------------------------------------------------------------------------
  // DETERMINISTIC SEEDED PRNG & HELPERS
  // --------------------------------------------------------------------------
  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    const s = String(str || 'pk9');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createRng(seedStr) {
    let a = hashSeed(seedStr) || 1337;
    return function rng() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function shuffle(rng, arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function pickDistinct(rng, arr, count) {
    return shuffle(rng, arr).slice(0, Math.min(count, arr.length));
  }

  function roundN(val, digits = 2) {
    const f = Math.pow(10, digits);
    return Math.round((Number(val) + Number.EPSILON) * f) / f;
  }

  function fmtNum(val, digits = 2) {
    const r = roundN(val, digits);
    return Object.is(r, -0) ? '0' : String(r);
  }

  function buildShortAccepted(val, digits = 2) {
    const r = roundN(val, digits);
    const s = fmtNum(r, digits);
    const set = new Set([s]);
    if (s.includes('.')) set.add(s.replace('.', ','));
    if (Number.isInteger(r)) set.add(String(r));
    return Array.from(set);
  }

  function makeMcqFromValues(rng, id, num, topic, text, correctStr, distractors, explanation) {
    const cleanCorrect = String(correctStr).trim();
    const pool = [cleanCorrect];
    const seen = new Set([cleanCorrect]);
    for (const d of distractors) {
      const ds = String(d).trim();
      if (ds && !seen.has(ds)) {
        seen.add(ds);
        pool.push(ds);
      }
      if (pool.length === 4) break;
    }
    let fallbackIdx = 1;
    while (pool.length < 4) {
      const cand = `${cleanCorrect} (${fallbackIdx++})`;
      if (!seen.has(cand)) {
        seen.add(cand);
        pool.push(cand);
      }
    }
    const opts = shuffle(rng, pool);
    const ansIdx = opts.indexOf(cleanCorrect);
    const letter = String.fromCharCode(65 + Math.max(0, ansIdx));
    return {
      id,
      section: 'I',
      type: 'mcq',
      number: num,
      topic,
      text,
      options: opts,
      answer: letter,
      explanation,
      reviewRequired: false
    };
  }

  function makeCuratedMcq(rng, id, num, item) {
    const correctText = item.o[item.a];
    const distractors = item.o.filter((_, idx) => idx !== item.a);
    return makeMcqFromValues(rng, id, num, item.tp, item.q, correctText, distractors, item.e);
  }

  function makeCuratedTf(id, num, item) {
    return {
      id,
      section: 'II',
      type: 'truefalse',
      number: num,
      topic: item.tp,
      text: item.q,
      statements: item.s.map(st => ({ text: st[0], answer: Boolean(st[1]) })),
      explanation: item.e,
      reviewRequired: false
    };
  }

  function makeCuratedShort(id, num, item) {
    const ansStr = String(item.a);
    const acc = Array.isArray(item.acc) && item.acc.length ? item.acc.map(String) : [ansStr];
    if (!acc.includes(ansStr)) acc.unshift(ansStr);
    if (ansStr.includes('.') && !acc.includes(ansStr.replace('.', ','))) acc.push(ansStr.replace('.', ','));
    return {
      id,
      section: 'III',
      type: 'short',
      number: num,
      topic: item.tp,
      text: item.q,
      answer: ansStr,
      acceptedAnswers: acc,
      explanation: item.e,
      reviewRequired: false
    };
  }

  // --------------------------------------------------------------------------
  // PARAMETRIC STEM GENERATORS (EXACT SOLVERS — MATHEMATICALLY VERIFIED)
  // --------------------------------------------------------------------------
  const MATH_MCQ_GEN = [
    (rng, id, n) => {
      const base = pick(rng, [2, 3, 5]);
      const p = randInt(rng, 2, 4);
      const b = randInt(rng, 1, 6);
      const ans = p - b;
      const rhs = Math.pow(base, p);
      return makeMcqFromValues(
        rng, id, n, 'Mũ & Logarit',
        `Nghiệm của phương trình $${base}^{x+${b}}=${rhs}$ là`,
        `$x=${ans}$`,
        [`$x=${p + b}$`, `$x=${ans + 1}$`, `$x=${-ans === ans ? ans - 2 : -ans}$`],
        `Ta có $${rhs}=${base}^{${p}}$, nên phương trình tương đương $x+${b}=${p} \\Rightarrow x=${ans}$.`
      );
    },
    (rng, id, n) => {
      const base = pick(rng, [2, 3]);
      const k = randInt(rng, 2, 3);
      const c = randInt(rng, 1, 5);
      const ans = Math.pow(base, k) + c;
      return makeMcqFromValues(
        rng, id, n, 'Mũ & Logarit',
        `Nghiệm của phương trình $\\log_{${base}}(x-${c})=${k}$ là`,
        `$x=${ans}$`,
        [`$x=${Math.pow(base, k) - c}$`, `$x=${base * k + c}$`, `$x=${ans + 2}$`],
        `Điều kiện $x>${c}$. Phương trình tương đương $x-${c}=${base}^{${k}}=${Math.pow(base, k)} \\Rightarrow x=${ans}$ (thỏa mãn).`
      );
    },
    (rng, id, n) => {
      const a = randInt(rng, 1, 5);
      const b = randInt(rng, 1, 5);
      const d = randInt(rng, 1, 4);
      return makeMcqFromValues(
        rng, id, n, 'Khảo sát hàm số',
        `Tiệm cận ngang của đồ thị hàm số $y=\\frac{${a * d}x+${b}}{${d}x-${a + 1}}$ là đường thẳng`,
        `$y=${a}$`,
        [`$y=${b}$`, `$x=${a + 1}$`, `$y=${a + 1}$`],
        `Ta có $\\lim_{x\\to\\pm\\infty}\\frac{${a * d}x+${b}}{${d}x-${a + 1}}=\\frac{${a * d}}{${d}}=${a}$, nên tiệm cận ngang là $y=${a}$.`
      );
    },
    (rng, id, n) => {
      const a = randInt(rng, 1, 4);
      const c = randInt(rng, -5, 6);
      const x1 = 0;
      const x2 = 2 * a;
      const y1 = c;
      const y2 = Math.pow(x2, 3) - 3 * a * Math.pow(x2, 2) + c;
      return makeMcqFromValues(
        rng, id, n, 'Khảo sát hàm số',
        `Giá trị cực tiểu của hàm số $y=x^3-${3 * a}x^2${c >= 0 ? `+${c}` : c}$ là`,
        `$y_{\\text{CT}}=${y2}$`,
        [`$y_{\\text{CT}}=${y1}$`, `$y_{\\text{CT}}=${x2}$`, `$y_{\\text{CT}}=${y2 + 4}$`],
        `Ta có $y'=3x^2-${6 * a}x=3x(x-${2 * a})=0 \\Leftrightarrow x=0$ hoặc $x=${2 * a}$. Vì hệ số $a=1>0$ nên hàm đạt cực tiểu tại $x=${2 * a}$ với $y_{\\text{CT}}=y(${2 * a})=${y2}$.`
      );
    },
    (rng, id, n) => {
      const p = randInt(rng, 1, 4);
      const q = randInt(rng, 1, 5);
      const b = randInt(rng, 1, 3);
      const val = p * Math.pow(b, 3) + q * Math.pow(b, 2);
      return makeMcqFromValues(
        rng, id, n, 'Nguyên hàm - Tích phân',
        `Giá trị của tích phân $I=\\int_0^{${b}}(${3 * p}x^2+${2 * q}x)\\,dx$ bằng`,
        `${val}`,
        [`${val + p}`, `${Math.max(1, val - q)}`, `${val * 2}`],
        `Nguyên hàm của $${3 * p}x^2+${2 * q}x$ là $F(x)=${p}x^3+${q}x^2$. Do đó $I=F(${b})-F(0)=${p}\\cdot ${b}^3+${q}\\cdot ${b}^2=${val}$.`
      );
    },
    (rng, id, n) => {
      const a = randInt(rng, -4, 5);
      const b = randInt(rng, -5, 4);
      const c = randInt(rng, -4, 5);
      const r = randInt(rng, 2, 7);
      const sx = a >= 0 ? `x-${a}` : `x+${-a}`;
      const sy = b >= 0 ? `y-${b}` : `y+${-b}`;
      const sz = c >= 0 ? `z-${c}` : `z+${-c}`;
      return makeMcqFromValues(
        rng, id, n, 'Hình học Oxyz',
        `Trong không gian $Oxyz$, mặt cầu $(S):(${sx})^2+(${sy})^2+(${sz})^2=${r * r}$ có tâm $I$ và bán kính $R$ lần lượt là`,
        `$I(${a};${b};${c}),\\, R=${r}$`,
        [
          `$I(${-a};${-b};${-c}),\\, R=${r}$`,
          `$I(${a};${b};${c}),\\, R=${r * r}$`,
          `$I(${a};${-b};${c}),\\, R=${r}$`
        ],
        `Mặt cầu $(x-x_0)^2+(y-y_0)^2+(z-z_0)^2=R^2$ có tâm $I(x_0;y_0;z_0)=(${a};${b};${c})$ và bán kính $R=\\sqrt{${r * r}}=${r}$.`
      );
    },
    (rng, id, n) => {
      const triple = pick(rng, [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 1, 2, 3]]);
      const [A, B, C, norm] = triple;
      const x0 = randInt(rng, 1, 4);
      const y0 = randInt(rng, -2, 3);
      const z0 = randInt(rng, 0, 3);
      const k = randInt(rng, 1, 5);
      const D = -(A * x0 + B * y0 + C * z0) + k * norm;
      const dSign = D >= 0 ? `+${D}` : `${D}`;
      return makeMcqFromValues(
        rng, id, n, 'Hình học Oxyz',
        `Trong không gian $Oxyz$, khoảng cách từ điểm $M(${x0};${y0};${z0})$ đến mặt phẳng $(P):${A}x+${B}y+${C}z${dSign}=0$ bằng`,
        `${k}`,
        [`${k * norm}`, `${k + 1}`, `${Math.max(1, k - 1) === k ? k + 2 : Math.max(1, k - 1)}`],
        `Áp dụng công thức $d(M,(P))=\\frac{|${A}\\cdot(${x0})+${B}\\cdot(${y0})+${C}\\cdot(${z0})${dSign}|}{\\sqrt{${A}^2+${B}^2+${C}^2}}=\\frac{${k * norm}}{${norm}}=${k}$.`
      );
    },
    (rng, id, n) => {
      const u1 = randInt(rng, 2, 8);
      const d = randInt(rng, 2, 6);
      const k = randInt(rng, 5, 10);
      const uk = u1 + (k - 1) * d;
      return makeMcqFromValues(
        rng, id, n, 'Cấp số cộng - Cấp số nhân',
        `Cho cấp số cộng $(u_n)$ có $u_1=${u1}$ và công sai $d=${d}$. Giá trị của số hạng $u_{${k}}$ bằng`,
        `${uk}`,
        [`${uk + d}`, `${uk - d}`, `${u1 + k * d + 1}`],
        `Số hạng tổng quát $u_n=u_1+(n-1)d$, suy ra $u_{${k}}=${u1}+${k - 1}\\cdot ${d}=${uk}$.`
      );
    },
    (rng, id, n) => {
      const u1 = randInt(rng, 2, 5);
      const q = pick(rng, [2, 3]);
      const k = randInt(rng, 3, 5);
      const uk = u1 * Math.pow(q, k - 1);
      return makeMcqFromValues(
        rng, id, n, 'Cấp số cộng - Cấp số nhân',
        `Cho cấp số nhân $(u_n)$ có $u_1=${u1}$ và công bội $q=${q}$. Số hạng $u_{${k}}$ bằng`,
        `${uk}`,
        [`${u1 * Math.pow(q, k)}`, `${u1 + (k - 1) * q}`, `${uk + q}`],
        `Ta có $u_{${k}}=u_1\\cdot q^{${k - 1}}=${u1}\\cdot ${q}^{${k - 1}}=${uk}$.`
      );
    },
    (rng, id, n) => {
      const B = randInt(rng, 3, 12) * 3;
      const h = randInt(rng, 4, 10);
      const V = (B * h) / 3;
      return makeMcqFromValues(
        rng, id, n, 'Thể tích khối đa diện',
        `Một khối chóp có diện tích đáy $B=${B}$ và chiều cao $h=${h}$. Thể tích của khối chóp đó bằng`,
        `${V}`,
        [`${B * h}`, `${Math.round(V / 2)}`, `${V + h}`],
        `Thể tích khối chóp $V=\\frac{1}{3}B\\cdot h=\\frac{1}{3}\\cdot ${B}\\cdot ${h}=${V}$.`
      );
    },
    (rng, id, n) => {
      const pA = pick(rng, [0.4, 0.5, 0.6, 0.8]);
      const pB = pick(rng, [0.5, 0.4, 0.25]);
      const pAB = roundN(pA * pB, 2);
      const ans = fmtNum(pAB / pB, 2);
      return makeMcqFromValues(
        rng, id, n, 'Xác suất có điều kiện',
        `Cho hai biến cố $A, B$ có $P(B)=${pB}$ và $P(A\\cap B)=${pAB}$. Xác suất có điều kiện $P(A|B)$ bằng`,
        `${ans}`,
        [`${fmtNum(pAB, 2)}`, `${fmtNum(roundN(1 - Number(ans), 2), 2)}`, `${fmtNum(roundN(pAB / pA, 2) === Number(ans) ? roundN(Number(ans) / 2, 2) : roundN(pAB / pA, 2), 2)}`],
        `Theo định nghĩa xác suất có điều kiện: $P(A|B)=\\frac{P(A\\cap B)}{P(B)}=\\frac{${pAB}}{${pB}}=${ans}$.`
      );
    },
    (rng, id, n) => {
      const x1 = randInt(rng, 10, 20);
      const w = pick(rng, [5, 10]);
      const k = randInt(rng, 4, 6);
      const xMax = x1 + k * w;
      const range = xMax - x1;
      return makeMcqFromValues(
        rng, id, n, 'Thống kê ghép nhóm',
        `Một mẫu số liệu ghép nhóm có nhóm đầu tiên là $[${x1};${x1 + w})$ và nhóm cuối cùng là $[${xMax - w};${xMax})$ (tần số đều khác 0). Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm đó bằng`,
        `${range}`,
        [`${range - w}`, `${range + w}`, `${Math.round(range / 2)}`],
        `Khoảng biến thiên của mẫu số liệu ghép nhóm bằng hiệu giữa đầu mút phải của nhóm cuối và đầu mút trái của nhóm đầu: $R=${xMax}-${x1}=${range}$.`
      );
    },
    (rng, id, n) => {
      const xA = randInt(rng, -3, 4), yA = randInt(rng, -3, 4), zA = randInt(rng, -2, 4);
      const dx = randInt(rng, 1, 4), dy = randInt(rng, -3, 3), dz = randInt(rng, -2, 3);
      const xB = xA + 2 * dx, yB = yA + 2 * dy, zB = zA + 2 * dz;
      const mx = xA + dx, my = yA + dy, mz = zA + dz;
      return makeMcqFromValues(
        rng, id, n, 'Hình học Oxyz',
        `Trong không gian $Oxyz$, cho $A(${xA};${yA};${zA})$ và $B(${xB};${yB};${zB})$. Tọa độ trung điểm $M$ của đoạn thẳng $AB$ là`,
        `$M(${mx};${my};${mz})$`,
        [`$M(${2 * dx};${2 * dy};${2 * dz})$`, `$M(${mx + 1};${my};${mz})$`, `$M(${xA + xB};${yA + yB};${zA + zB})$`],
        `Trung điểm $M$ có tọa độ $\\left(\\frac{${xA}+${xB}}{2};\\frac{${yA}+${yB}}{2};\\frac{${zA}+${zB}}{2}\\right)=(${mx};${my};${mz})$.`
      );
    },
    (rng, id, n) => {
      const a = randInt(rng, 2, 6);
      const b = randInt(rng, 1, 5);
      const c = randInt(rng, 1, 4);
      const dot = a * b + (-b) * c + c * a;
      return makeMcqFromValues(
        rng, id, n, 'Vectơ trong không gian',
        `Trong không gian $Oxyz$, tích vô hướng của hai vectơ $\\vec{u}=(${a};${-b};${c})$ và $\\vec{v}=(${b};${c};${a})$ bằng`,
        `${dot}`,
        [`${dot + 2 * b * c}`, `${dot - a}`, `${a + b + c}`],
        `Ta có $\\vec{u}\\cdot\\vec{v}=${a}\\cdot ${b}+(${-b})\\cdot ${c}+${c}\\cdot ${a}=${a * b}-${b * c}+${c * a}=${dot}$.`
      );
    },
    (rng, id, n) => {
      const r = randInt(rng, 2, 6);
      const h = randInt(rng, 3, 9);
      const coef = r * r * h;
      return makeMcqFromValues(
        rng, id, n, 'Khối tròn xoay',
        `Thể tích khối trụ có bán kính đáy $r=${r}$ và chiều cao $h=${h}$ là`,
        `$${coef}\\pi$`,
        [`$${Math.round(coef / 3)}\\pi$`, `$${2 * r * h}\\pi$`, `$${coef + r}\\pi$`],
        `Thể tích khối trụ $V=\\pi r^2 h=\\pi\\cdot ${r}^2\\cdot ${h}=${coef}\\pi$.`
      );
    }
  ];

  const MATH_TF_GEN = [
    (rng, id, n) => {
      const a = randInt(rng, 1, 3);
      const c = randInt(rng, 1, 6);
      const xct = 2 * a;
      const ycd = c;
      const yct = Math.pow(xct, 3) - 3 * a * Math.pow(xct, 2) + c;
      const s1True = rng() > 0.4;
      const s2True = rng() > 0.5;
      const s3True = rng() > 0.45;
      const s4True = rng() > 0.5;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Khảo sát hàm số',
        text: `Cho hàm số $f(x)=x^3-${3 * a}x^2+${c}$. Xét tính đúng sai của các mệnh đề sau:`,
        statements: [
          { text: `Đạo hàm của hàm số là $f'(x)=3x^2-${s1True ? 6 * a : 3 * a}x$.`, answer: s1True },
          { text: `Hàm số đồng biến trên khoảng $(${s2True ? xct : 0};${s2True ? '+\\infty' : xct})$.`, answer: s2True },
          { text: `Giá trị cực đại của hàm số bằng $${s3True ? ycd : yct}$.`, answer: s3True },
          { text: `Giá trị nhỏ nhất của hàm số trên đoạn $[0;${xct + 1}]$ bằng $${s4True ? yct : ycd}$.`, answer: s4True }
        ],
        explanation: `Ta có $f'(x)=3x^2-${6 * a}x=0 \\Leftrightarrow x=0$ hoặc $x=${xct}$. Hàm nghịch biến trên $(0;${xct})$, đồng biến trên $(-\\infty;0)$ và $(${xct};+\\infty)$. Cực đại $f(0)=${ycd}$, cực tiểu $f(${xct})=${yct}$ cũng là GTNN trên $[0;${xct + 1}]$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const v0 = randInt(rng, 4, 12);
      const a = randInt(rng, 2, 6);
      const t1 = randInt(rng, 2, 5);
      const v1 = v0 + a * t1;
      const sDist = v0 * t1 + 0.5 * a * t1 * t1;
      const s1True = rng() > 0.4;
      const s2True = rng() > 0.5;
      const s3True = rng() > 0.4;
      const s4True = rng() > 0.5;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Ứng dụng Tích phân',
        text: `Một chất điểm chuyển động thẳng với vận tốc $v(t)=${a}t+${v0}$ (m/s), trong đó $t$ tính bằng giây ($t\\ge 0$).`,
        statements: [
          { text: `Tại thời điểm ban đầu $t=0$, vận tốc của chất điểm bằng $${s1True ? v0 : a}$ m/s.`, answer: s1True },
          { text: `Gia tốc chuyển động của chất điểm là $a(t)=v'(t)=${s2True ? a : v0}\\text{ m/s}^2$.`, answer: s2True },
          { text: `Vận tốc tại thời điểm $t=${t1}$ s bằng $${s3True ? v1 : v1 + a}$ m/s.`, answer: s3True },
          { text: `Quãng đường chất điểm đi được trong $${t1}$ giây đầu bằng $${s4True ? fmtNum(sDist, 1) : fmtNum(sDist + v0, 1)}$ m.`, answer: s4True }
        ],
        explanation: `Ta có $v(0)=${v0}$ m/s, $a(t)=v'(t)=${a}\\text{ m/s}^2$, $v(${t1})=${v1}$ m/s và quãng đường $S=\\int_0^{${t1}}(${a}t+${v0})\\,dt=\\left.${a / 2}t^2+${v0}t\\right|_0^{${t1}}=${fmtNum(sDist, 1)}$ m.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const A = randInt(rng, 1, 3), B = randInt(rng, 1, 3), C = randInt(rng, 1, 3);
      const D = -(A + 2 * B + C);
      const dStr = D >= 0 ? `+${D}` : `${D}`;
      const normSq = A * A + B * B + C * C;
      const s1True = rng() > 0.4;
      const s2True = rng() > 0.45;
      const s3True = rng() > 0.5;
      const s4True = rng() > 0.45;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Hình học Oxyz',
        text: `Trong không gian $Oxyz$, cho mặt phẳng $(P):${A}x+${B}y+${C}z${dStr}=0$ và điểm $M(1;2;1)$.`,
        statements: [
          { text: `Một vectơ pháp tuyến của mặt phẳng $(P)$ là $\\vec{n}=(${A};${s1True ? B : -B};${C})$.`, answer: s1True },
          { text: `Điểm $M(1;2;1)$ ${s2True ? 'thuộc' : 'không thuộc'} mặt phẳng $(P)$.`, answer: s2True },
          { text: `Độ dài vectơ pháp tuyến $\\vec{n}=(${A};${B};${C})$ bằng $\\sqrt{${s3True ? normSq : normSq + 2}}$.`, answer: s3True },
          { text: `Đường thẳng đi qua $M(1;2;1)$ và vuông góc với $(P)$ nhận $\\vec{u}=(${A};${B};${s4True ? C : 0})$ làm vectơ chỉ phương.`, answer: s4True }
        ],
        explanation: `Mặt phẳng $(P)$ có VTPT $\\vec{n}=(${A};${B};${C})$ với $|\\vec{n}|=\\sqrt{${normSq}}$. Thay $M(1;2;1)$ vào $(P)$ được ${A}+${2 * B}+${C}${dStr}=0$ nên $M\\in(P)$. Đường thẳng vuông góc $(P)$ nhận $\\vec{n}$ làm VTCP.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const p1 = pick(rng, [0.4, 0.5, 0.6]);
      const p2 = roundN(1 - p1, 2);
      const r1 = pick(rng, [0.9, 0.95]);
      const r2 = pick(rng, [0.8, 0.85]);
      const pGood = roundN(p1 * r1 + p2 * r2, 4);
      const pBad = roundN(1 - pGood, 4);
      const s1True = rng() > 0.45;
      const s2True = rng() > 0.5;
      const s3True = rng() > 0.4;
      const s4True = rng() > 0.5;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Xác suất toàn phần & Bayes',
        text: `Một nhà máy có hai dây chuyền sản xuất: dây chuyền I chiếm ${Math.round(p1 * 100)}% sản lượng (tỉ lệ đạt chuẩn ${Math.round(r1 * 100)}%), dây chuyền II chiếm ${Math.round(p2 * 100)}% sản lượng (tỉ lệ đạt chuẩn ${Math.round(r2 * 100)}%). Chọn ngẫu nhiên 1 sản phẩm.`,
        statements: [
          { text: `Xác suất sản phẩm chọn ra thuộc dây chuyền II là $${s1True ? p2 : p1}$.`, answer: s1True },
          { text: `Xác suất sản phẩm không đạt chuẩn biết nó do dây chuyền I làm ra là $${s2True ? roundN(1 - r1, 2) : r1}$.`, answer: s2True },
          { text: `Xác suất sản phẩm chọn ra đạt chuẩn là $${s3True ? fmtNum(pGood, 4) : fmtNum(roundN(pGood - 0.05, 4), 4)}$.`, answer: s3True },
          { text: `Xác suất sản phẩm chọn ra bị lỗi (không đạt chuẩn) là $${s4True ? fmtNum(pBad, 4) : fmtNum(pGood, 4)}$.`, answer: s4True }
        ],
        explanation: `Theo công thức xác suất toàn phần: $P(\\text{Đạt})=${p1}\\cdot${r1}+${p2}\\cdot${r2}=${fmtNum(pGood, 4)}$. Do đó $P(\\text{Lỗi})=1-${fmtNum(pGood, 4)}=${fmtNum(pBad, 4)}$.`,
        reviewRequired: false
      };
    }
  ];

  const MATH_SHORT_GEN = [
    (rng, id, n) => {
      const a = randInt(rng, 2, 6);
      const b = randInt(rng, 1, 4);
      const val = a * b * b;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Nguyên hàm - Tích phân',
        text: `Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số $y=${2 * a}x$, trục hoành và hai đường thẳng $x=0, x=${b}$.`,
        answer: String(val), acceptedAnswers: buildShortAccepted(val, 2),
        explanation: `Vì $${2 * a}x\\ge 0$ trên $[0;${b}]$ nên $S=\\int_0^{${b}}${2 * a}x\\,dx=\\left.${a}x^2\\right|_0^{${b}}=${val}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const P = randInt(rng, 10, 30) * 4;
      const side = P / 4;
      const maxArea = side * side;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Ứng dụng đạo hàm tối ưu',
        text: `Một bác nông dân có $${P}\\text{ m}$ lưới rào muốn quây một mảnh vườn hình chữ nhật có diện tích lớn nhất. Tính diện tích lớn nhất đó (đơn vị $\\text{m}^2$).`,
        answer: String(maxArea), acceptedAnswers: buildShortAccepted(maxArea, 2),
        explanation: `Nửa chu vi là $x+y=${P / 2} \\Rightarrow S=x(${P / 2}-x)$. Đạo hàm $S'=${P / 2}-2x=0 \\Leftrightarrow x=${side}$. Vậy $S_{\\max}=${side}^2=${maxArea}\\text{ m}^2$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const x1 = randInt(rng, 1, 5), y1 = randInt(rng, -2, 3), z1 = randInt(rng, 0, 4);
      const dx = pick(rng, [3, 6]), dy = pick(rng, [4, 8]), dz = 0;
      const dist = Math.hypot(dx, dy, dz);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Hình học Oxyz',
        text: `Trong không gian $Oxyz$, tính độ dài đoạn thẳng $AB$ biết $A(${x1};${y1};${z1})$ và $B(${x1 + dx};${y1 + dy};${z1 + dz})$.`,
        answer: fmtNum(dist, 2), acceptedAnswers: buildShortAccepted(dist, 2),
        explanation: `Ta có $\\overrightarrow{AB}=(${dx};${dy};0)$, suy ra $AB=\\sqrt{${dx}^2+${dy}^2+0^2}=\\sqrt{${dx * dx + dy * dy}}=${fmtNum(dist, 2)}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const a = randInt(rng, 2, 5);
      const k = randInt(rng, 2, 4);
      const ans = Math.pow(a, k) - 1;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Mũ & Logarit',
        text: `Tìm nghiệm $x$ của phương trình $\\log_{${a}}(x+1)=${k}$.`,
        answer: String(ans), acceptedAnswers: buildShortAccepted(ans, 2),
        explanation: `Điều kiện $x>-1$. Ta có $x+1=${a}^{${k}}=${Math.pow(a, k)} \\Rightarrow x=${ans}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const n1 = randInt(rng, 3, 6);
      const n2 = randInt(rng, 4, 8);
      const total = n1 + n2;
      const p = roundN(n1 / total, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Xác suất cổ điển',
        text: `Một hộp có ${n1} bi đỏ và ${n2} bi xanh. Lấy ngẫu nhiên 1 viên bi. Tính xác suất lấy được viên bi màu đỏ (làm tròn đến hàng phần trăm).`,
        answer: fmtNum(p, 2), acceptedAnswers: buildShortAccepted(p, 2),
        explanation: `Tổng số bi là ${n1}+${n2}=${total}. Xác suất lấy được bi đỏ là $P=\\frac{${n1}}{${total}}\\approx ${fmtNum(p, 2)}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const a = randInt(rng, 2, 7);
      const h = randInt(rng, 3, 9) * 3;
      const V = (a * a * h) / 3;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Hình học không gian',
        text: `Tính thể tích khối chóp tứ giác đều có cạnh đáy bằng $${a}$ và chiều cao bằng $${h}$.`,
        answer: String(V), acceptedAnswers: buildShortAccepted(V, 2),
        explanation: `Diện tích đáy hình vuông $B=${a}^2=${a * a}$. Thể tích $V=\\frac{1}{3}Bh=\\frac{1}{3}\\cdot ${a * a}\\cdot ${h}=${V}$.`,
        reviewRequired: false
      };
    }
  ];

  // --- PHYSICS PARAMETRIC GENERATORS ---
  const PHYS_MCQ_GEN = [
    (rng, id, n) => {
      const m = pick(rng, [0.5, 1, 1.5, 2, 2.5]);
      const dt = randInt(rng, 20, 60);
      const Q = roundN(m * 4200 * dt / 1000, 1);
      return makeMcqFromValues(
        rng, id, n, 'Vật lí nhiệt',
        `Nhiệt lượng cần cung cấp để đun nóng $${m}\\text{ kg}$ nước (nhiệt dung riêng $c=4200\\text{ J/(kg.K)}$) tăng thêm $${dt}^\\circ\\text{C}$ là`,
        `$${Q}\\text{ kJ}$`,
        [`$${roundN(Q * 2, 1)}\\text{ kJ}$`, `$${roundN(Q / 2, 1)}\\text{ kJ}$`, `$${roundN(Q + 42, 1)}\\text{ kJ}$`],
        `Áp dụng $Q=mc\\Delta t=${m}\\cdot 4200\\cdot ${dt}=${roundN(Q * 1000, 0)}\\text{ J}=${Q}\\text{ kJ}$.`
      );
    },
    (rng, id, n) => {
      const Q = randInt(rng, 40, 120);
      const A = randInt(rng, 15, 35);
      const dU = Q - A;
      return makeMcqFromValues(
        rng, id, n, 'Nguyên lí I Nhiệt động lực học',
        `Truyền cho khối khí trong xi-lanh nhiệt lượng $${Q}\\text{ J}$, khí nở ra thực hiện công $${A}\\text{ J}$ đẩy pít-tông. Độ biến thiên nội năng $\\Delta U$ của khối khí là`,
        `$${dU}\\text{ J}$`,
        [`$${Q + A}\\text{ J}$`, `$${-dU}\\text{ J}$`, `$${A}\\text{ J}$`],
        `Khí nhận nhiệt nên $Q=+${Q}\\text{ J}$, khí thực hiện công nên $A=-${A}\\text{ J}$. Theo nguyên lí I: $\\Delta U=Q+A=${Q}-${A}=${dU}\\text{ J}$.`
      );
    },
    (rng, id, n) => {
      const p1 = randInt(rng, 1, 4);
      const V1 = randInt(rng, 4, 12);
      const k = pick(rng, [2, 3, 4]);
      const p2 = p1 * k;
      const V2 = roundN(V1 / k, 2);
      return makeMcqFromValues(
        rng, id, n, 'Khí lí tưởng - Định luật Boyle',
        `Nén đẳng nhiệt một lượng khí lí tưởng từ thể tích $${V1}\\text{ lít}$, áp suất $${p1}\\text{ atm}$ đến áp suất $${p2}\\text{ atm}$. Thể tích khí sau khi nén là`,
        `$${fmtNum(V2, 2)}\\text{ lít}$`,
        [`$${fmtNum(V1 * k, 2)}\\text{ lít}$`, `$${fmtNum(V2 + 1, 2)}\\text{ lít}$`, `$${fmtNum(roundN(V2 * 2, 2), 2)}\\text{ lít}$`],
        `Theo định luật Boyle: $p_1V_1=p_2V_2 \\Rightarrow V_2=\\frac{${p1}\\cdot ${V1}}{${p2}}=${fmtNum(V2, 2)}\\text{ lít}$.`
      );
    },
    (rng, id, n) => {
      const tC = randInt(rng, 17, 77);
      const T = tC + 273;
      return makeMcqFromValues(
        rng, id, n, 'Thang nhiệt độ Kelvin',
        `Nhiệt độ $${tC}^\\circ\\text{C}$ trong thang nhiệt độ Celsius tương ứng với giá trị nào trong thang nhiệt độ tuyệt đối Kelvin?`,
        `$${T}\\text{ K}$`,
        [`$${273 - tC}\\text{ K}$`, `$${tC + 100}\\text{ K}$`, `$${T + 27}\\text{ K}$`],
        `Liên hệ thang Kelvin và Celsius: $T(\\text{K})=t(^\\circ\\text{C})+273=${tC}+273=${T}\\text{ K}$.`
      );
    },
    (rng, id, n) => {
      const B = pick(rng, [0.2, 0.4, 0.5, 0.8]);
      const I = randInt(rng, 2, 10);
      const L = pick(rng, [0.2, 0.5, 1]);
      const F = roundN(B * I * L, 2);
      return makeMcqFromValues(
        rng, id, n, 'Từ trường - Lực từ',
        `Một đoạn dây dẫn thẳng dài $${L}\\text{ m}$ mang dòng điện $${I}\\text{ A}$ đặt vuông góc với đường sức từ của từ trường đều có cảm ứng từ $B=${B}\\text{ T}$. Độ lớn lực từ tác dụng lên đoạn dây bằng`,
        `$${fmtNum(F, 2)}\\text{ N}$`,
        [`$${fmtNum(roundN(F * 2, 2), 2)}\\text{ N}$`, `$${fmtNum(roundN(F / 2, 2), 2)}\\text{ N}$`, `$${fmtNum(roundN(B * I, 2) === F ? F + 1 : roundN(B * I, 2), 2)}\\text{ N}$`],
        `Vì dây đặt vuông góc từ trường ($\\alpha=90^\\circ, \\sin 90^\\circ=1$) nên $F=BIL=${B}\\cdot ${I}\\cdot ${L}=${fmtNum(F, 2)}\\text{ N}$.`
      );
    },
    (rng, id, n) => {
      const N = pick(rng, [50, 100, 200, 400]);
      const dPhi = pick(rng, [0.02, 0.04, 0.05]);
      const dt = pick(rng, [0.1, 0.2, 0.5]);
      const ec = roundN((N * dPhi) / dt, 1);
      return makeMcqFromValues(
        rng, id, n, 'Cảm ứng điện từ',
        `Một khung dây có $${N}$ vòng, trong thời gian $${dt}\\text{ s}$ từ thông qua mỗi vòng dây biến thiên đều một lượng $${dPhi}\\text{ Wb}$. Độ lớn suất điện động cảm ứng xuất hiện trong khung dây là`,
        `$${fmtNum(ec, 1)}\\text{ V}$`,
        [`$${fmtNum(roundN(ec / N, 2), 2)}\\text{ V}$`, `$${fmtNum(roundN(ec * 2, 1), 1)}\\text{ V}$`, `$${fmtNum(roundN(ec / 2, 1), 1)}\\text{ V}$`],
        `Theo định luật Faraday: $|e_c|=N\\left|\\frac{\\Delta\\Phi}{\\Delta t}\\right|=${N}\\cdot\\frac{${dPhi}}{${dt}}=${fmtNum(ec, 1)}\\text{ V}$.`
      );
    },
    (rng, id, n) => {
      const iso = pick(rng, [
        { sym: '^{235}_{92}\\text{U}', Z: 92, A: 235 },
        { sym: '^{238}_{92}\\text{U}', Z: 92, A: 238 },
        { sym: '^{14}_{6}\\text{C}', Z: 6, A: 14 },
        { sym: '^{60}_{27}\\text{Co}', Z: 27, A: 60 },
        { sym: '^{210}_{84}\\text{Po}', Z: 84, A: 210 },
        { sym: '^{226}_{88}\\text{Ra}', Z: 88, A: 226 }
      ]);
      const neutrons = iso.A - iso.Z;
      return makeMcqFromValues(
        rng, id, n, 'Cấu tạo hạt nhân',
        `Hạt nhân $${iso.sym}$ có số neutron (nơtron) bằng`,
        `${neutrons}`,
        [`${iso.Z}`, `${iso.A}`, `${iso.A + iso.Z}`],
        `Hạt nhân $^A_Z X$ có số proton là $Z=${iso.Z}$, số khối $A=${iso.A}$, nên số neutron là $N=A-Z=${iso.A}-${iso.Z}=${neutrons}$.`
      );
    },
    (rng, id, n) => {
      const m0 = pick(rng, [16, 32, 40, 64, 80]);
      const k = pick(rng, [2, 3, 4]);
      const rem = roundN(m0 / Math.pow(2, k), 2);
      const T = pick(rng, [3.8, 5, 8, 10]);
      const t = roundN(T * k, 1);
      return makeMcqFromValues(
        rng, id, n, 'Hiện tượng phóng xạ',
        `Một chất phóng xạ có chu kì bán rã $T=${T}$ ngày, khối lượng ban đầu $${m0}\\text{ g}$. Sau thời gian $t=${t}$ ngày, khối lượng chất phóng xạ còn lại là`,
        `$${fmtNum(rem, 2)}\\text{ g}$`,
        [`$${fmtNum(roundN(m0 - rem, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(m0 / k, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(rem * 2, 2), 2)}\\text{ g}$`],
        `Số chu kì bán rã $k=t/T=${t}/${T}=${k}$. Khối lượng còn lại $m=m_0\\cdot 2^{-k}=${m0}/2^{${k}}=${fmtNum(rem, 2)}\\text{ g}$.`
      );
    },
    (rng, id, n) => {
      const f = pick(rng, [2, 4, 5, 10, 20]);
      const lam = pick(rng, [0.4, 0.5, 0.8, 1.2, 2]);
      const v = roundN(lam * f, 2);
      return makeMcqFromValues(
        rng, id, n, 'Sóng cơ & Giao thoa',
        `Một sóng cơ lan truyền với tần số $f=${f}\\text{ Hz}$ và bước sóng $\\lambda=${lam}\\text{ m}$. Tốc độ truyền sóng bằng`,
        `$${fmtNum(v, 2)}\\text{ m/s}$`,
        [`$${fmtNum(roundN(f / lam, 2), 2)}\\text{ m/s}$`, `$${fmtNum(roundN(v * 2, 2), 2)}\\text{ m/s}$`, `$${fmtNum(roundN(v / 2, 2), 2)}\\text{ m/s}$`],
        `Liên hệ tốc độ truyền sóng: $v=\\lambda\\cdot f=${lam}\\cdot ${f}=${fmtNum(v, 2)}\\text{ m/s}$.`
      );
    },
    (rng, id, n) => {
      const U0 = pick(rng, [100, 120, 200, 220]);
      const f = pick(rng, [50, 60]);
      return makeMcqFromValues(
        rng, id, n, 'Dòng điện xoay chiều',
        `Điện áp xoay chiều có biểu thức $u=${U0}\\sqrt{2}\\cos(${2 * f}\\pi t)\\text{ (V)}$. Giá trị hiệu dụng $U$ và tần số $f$ lần lượt là`,
        `$U=${U0}\\text{ V};\\, f=${f}\\text{ Hz}$`,
        [
          `$U=${U0}\\sqrt{2}\\text{ V};\\, f=${f}\\text{ Hz}$`,
          `$U=${U0}\\text{ V};\\, f=${2 * f}\\text{ Hz}$`,
          `$U=${U0 / 2}\\text{ V};\\, f=${f}\\text{ Hz}$`
        ],
        `Ta có $U=\\frac{U_0}{\\sqrt{2}}=${U0}\\text{ V}$ và $f=\\frac{\\omega}{2\\pi}=\\frac{${2 * f}\\pi}{2\\pi}=${f}\\text{ Hz}$.`
      );
    },
    (rng, id, n) => {
      const N1 = pick(rng, [200, 400, 500]);
      const k = pick(rng, [2, 4, 5]);
      const N2 = N1 * k;
      const U1 = pick(rng, [110, 220]);
      const U2 = U1 * k;
      return makeMcqFromValues(
        rng, id, n, 'Máy biến áp lí tưởng',
        `Một máy biến áp lí tưởng có cuộn sơ cấp $${N1}$ vòng, cuộn thứ cấp $${N2}$ vòng. Đặt vào cuộn sơ cấp điện áp hiệu dụng $${U1}\\text{ V}$ thì điện áp hiệu dụng ở hai đầu cuộn thứ cấp để hở bằng`,
        `$${U2}\\text{ V}$`,
        [`$${roundN(U1 / k, 1)}\\text{ V}$`, `$${U1 + N2}\\text{ V}$`, `$${U2 / 2}\\text{ V}$`],
        `Với máy biến áp lí tưởng: $\\frac{U_2}{U_1}=\\frac{N_2}{N_1} \\Rightarrow U_2=${U1}\\cdot\\frac{${N2}}{${N1}}=${U2}\\text{ V}$.`
      );
    },
    (rng, id, n) => {
      const m = pick(rng, [0.5, 1, 2]);
      const L = 334;
      const Q = roundN(m * L, 1);
      return makeMcqFromValues(
        rng, id, n, 'Chuyển thể - Nhiệt nóng chảy',
        `Nhiệt nóng chảy riêng của nước đá là $334\\text{ kJ/kg}$. Nhiệt lượng cần cung cấp để làm nóng chảy hoàn toàn $${m}\\text{ kg}$ nước đá ở $0^\\circ\\text{C}$ là`,
        `$${Q}\\text{ kJ}$`,
        [`$${roundN(Q * 2, 1)}\\text{ kJ}$`, `$${roundN(L / m, 1) === Q ? roundN(Q + 100, 1) : roundN(L / m, 1)}\\text{ kJ}$`, `$${roundN(Q / 2, 1)}\\text{ kJ}$`],
        `Nhiệt lượng nóng chảy hoàn toàn ở nhiệt độ nóng chảy là $Q=\\lambda m=334\\cdot ${m}=${Q}\\text{ kJ}$.`
      );
    }
  ];

  const PHYS_TF_GEN = [
    (rng, id, n) => {
      const V1 = randInt(rng, 4, 10);
      const T1 = 300;
      const T2 = pick(rng, [450, 600]);
      const V2 = roundN((V1 * T2) / T1, 2);
      const s1 = rng() > 0.4, s2 = rng() > 0.5, s3 = rng() > 0.45, s4 = rng() > 0.5;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Khí lí tưởng - Quá trình đẳng áp',
        text: `Một khối khí lí tưởng ở trạng thái (1) có thể tích $V_1=${V1}\\text{ lít}$, nhiệt độ $t_1=27^\\circ\\text{C}$. Nung nóng đẳng áp khối khí đến nhiệt độ $T_2=${T2}\\text{ K}$.`,
        statements: [
          { text: `Nhiệt độ tuyệt đối ở trạng thái (1) là $T_1=${s1 ? 300 : 27}\\text{ K}$.`, answer: s1 },
          { text: `Trong quá trình đẳng áp, thể tích tỉ lệ ${s2 ? 'thuận' : 'nghịch'} với nhiệt độ tuyệt đối $T$.`, answer: s2 },
          { text: `Thể tích của khối khí ở trạng thái (2) là $V_2=${s3 ? fmtNum(V2, 2) : fmtNum(V1, 2)}\\text{ lít}$.`, answer: s3 },
          { text: `Trong quá trình này, khối khí ${s4 ? 'dãn nở và thực hiện công' : 'bị nén lại'}.`, answer: s4 }
        ],
        explanation: `Ta có $T_1=27+273=300\\text{ K}$. Theo định luật Charles (đẳng áp): $\\frac{V_1}{T_1}=\\frac{V_2}{T_2}\\Rightarrow V_2=${V1}\\cdot\\frac{${T2}}{300}=${fmtNum(V2, 2)}\\text{ lít}>V_1$, khí dãn nở thực hiện công.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const U0 = pick(rng, [100, 200, 220]);
      const I0 = pick(rng, [2, 4, 5]);
      const R = roundN(U0 / I0, 1);
      const P = roundN((U0 * I0) / 2, 1);
      const s1 = rng() > 0.4, s2 = rng() > 0.45, s3 = rng() > 0.5, s4 = rng() > 0.45;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Dòng điện xoay chiều',
        text: `Đặt điện áp xoay chiều $u=${U0}\\cos(100\\pi t)\\text{ (V)}$ vào hai đầu một điện trở thuần $R$, cường độ dòng điện chạy qua là $i=${I0}\\cos(100\\pi t)\\text{ (A)}$.`,
        statements: [
          { text: `Tần số của dòng điện xoay chiều là $f=${s1 ? 50 : 100}\\text{ Hz}$.`, answer: s1 },
          { text: `Điện áp và cường độ dòng điện qua điện trở thuần ${s2 ? 'cùng pha' : 'vuông pha'} với nhau.`, answer: s2 },
          { text: `Giá trị của điện trở là $R=${s3 ? fmtNum(R, 1) : fmtNum(R * 2, 1)}\\,\\Omega$.`, answer: s3 },
          { text: `Công suất tỏa nhiệt trên điện trở bằng $P=${s4 ? fmtNum(P, 1) : fmtNum(U0 * I0, 1)}\\text{ W}$.`, answer: s4 }
        ],
        explanation: `Ta có $f=\\frac{100\\pi}{2\\pi}=50\\text{ Hz}$, mạch chỉ có $R$ nên $u, i$ cùng pha, $R=\\frac{U_0}{I_0}=${fmtNum(R, 1)}\\,\\Omega$, công suất $P=UI=\\frac{U_0 I_0}{2}=${fmtNum(P, 1)}\\text{ W}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const A = 12, Z = 6;
      const dm = pick(rng, [0.095, 0.098, 0.1]);
      const Elk = roundN(dm * 931.5, 2);
      const Elkr = roundN(Elk / A, 2);
      const s1 = rng() > 0.45, s2 = rng() > 0.4, s3 = rng() > 0.5, s4 = rng() > 0.45;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Năng lượng liên kết hạt nhân',
        text: `Xét hạt nhân $^{12}_{6}\\text{C}$ có độ hụt khối $\\Delta m=${dm}\\text{ amu}$ (lấy $1\\text{ amu}\\cdot c^2=931,5\\text{ MeV}$).`,
        statements: [
          { text: `Hạt nhân này gồm $${Z}$ proton và $${s1 ? A - Z : A}$ neutron.`, answer: s1 },
          { text: `Năng lượng liên kết của hạt nhân là $E_{\\text{lk}}=${s2 ? fmtNum(Elk, 2) : fmtNum(Elk + 10, 2)}\\text{ MeV}$.`, answer: s2 },
          { text: `Năng lượng liên kết riêng của hạt nhân xấp xỉ $${s3 ? fmtNum(Elkr, 2) : fmtNum(Elk, 2)}\\text{ MeV/nucleon}$.`, answer: s3 },
          { text: `Hạt nhân có năng lượng liên kết riêng càng ${s4 ? 'lớn' : 'nhỏ'} thì càng bền vững.`, answer: s4 }
        ],
        explanation: `Số neutron $12-6=6$. $E_{\\text{lk}}=\\Delta m\\cdot 931,5=${fmtNum(Elk, 2)}\\text{ MeV}$. $E_{\\text{lkr}}=E_{\\text{lk}}/12\\approx ${fmtNum(Elkr, 2)}\\text{ MeV/nucleon}$. Hạt nhân có $E_{\\text{lkr}}$ càng lớn càng bền vững.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const B = pick(rng, [0.2, 0.5]);
      const S = pick(rng, [0.02, 0.04]);
      const N = pick(rng, [100, 200]);
      const phiMax = roundN(N * B * S, 2);
      const s1 = rng() > 0.45, s2 = rng() > 0.5, s3 = rng() > 0.4, s4 = rng() > 0.5;
      return {
        id, section: 'II', type: 'truefalse', number: n, topic: 'Từ trường & Cảm ứng điện từ',
        text: `Một khung dây dẫn kín gồm $${N}$ vòng, diện tích mỗi vòng $S=${S}\\text{ m}^2$ đặt trong từ trường đều $B=${B}\\text{ T}$.`,
        statements: [
          { text: `Đơn vị đo của từ thông trong hệ SI là ${s1 ? 'Vêbe (Wb)' : 'Tesla (T)'}.`, answer: s1 },
          { text: `Khi vectơ pháp tuyến khung dây song song với $\\vec{B}$, từ thông tổng qua khung bằng $${s2 ? fmtNum(phiMax, 2) : '0'}\\text{ Wb}$.`, answer: s2 },
          { text: `Khi mặt phẳng khung dây song song với đường sức từ, từ thông qua khung bằng $${s3 ? '0' : fmtNum(phiMax, 2)}\\text{ Wb}$.`, answer: s3 },
          { text: `Nếu từ thông qua khung kín biến thiên theo thời gian thì trong khung ${s4 ? 'xuất hiện dòng điện cảm ứng' : 'không có dòng điện nào'}.`, answer: s4 }
        ],
        explanation: `Từ thông $\\Phi=NBS\\cos\\alpha$ (đơn vị Wb). Khi $\\vec{n}\\parallel\\vec{B}$ ($\\alpha=0^\\circ$) thì $\\Phi_{\\max}=${N}\\cdot${B}\\cdot${S}=${fmtNum(phiMax, 2)}\\text{ Wb}$; khi mặt phẳng khung song song $\\vec{B}$ ($\\alpha=90^\\circ$) thì $\\Phi=0$.`,
        reviewRequired: false
      };
    }
  ];

  const PHYS_SHORT_GEN = [
    (rng, id, n) => {
      const m = pick(rng, [1, 2, 3]);
      const dt = randInt(rng, 25, 60);
      const QkJ = roundN((m * 4200 * dt) / 1000, 1);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Vật lí nhiệt',
        text: `Tính nhiệt lượng (theo đơn vị kJ) cần thiết để đun nóng $${m}\\text{ kg}$ nước ($c=4200\\text{ J/(kg.K)}$) tăng thêm $${dt}^\\circ\\text{C}$.`,
        answer: fmtNum(QkJ, 1), acceptedAnswers: buildShortAccepted(QkJ, 1),
        explanation: `$Q=mc\\Delta t=${m}\\cdot 4200\\cdot ${dt}=${roundN(QkJ * 1000, 0)}\\text{ J}=${fmtNum(QkJ, 1)}\\text{ kJ}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const B = pick(rng, [0.25, 0.5, 0.8]);
      const I = randInt(rng, 2, 8);
      const L = pick(rng, [0.4, 0.5, 1]);
      const F = roundN(B * I * L, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Từ trường',
        text: `Đoạn dây dẫn dài $${L}\\text{ m}$ mang dòng điện $${I}\\text{ A}$ đặt vuông góc trong từ trường đều $B=${B}\\text{ T}$. Tính độ lớn lực từ (theo N).`,
        answer: fmtNum(F, 2), acceptedAnswers: buildShortAccepted(F, 2),
        explanation: `$F=BIL\\sin 90^\\circ=${B}\\cdot ${I}\\cdot ${L}=${fmtNum(F, 2)}\\text{ N}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const p1 = randInt(rng, 2, 5);
      const V1 = randInt(rng, 3, 8);
      const V2 = randInt(rng, 1, 2);
      const p2 = roundN((p1 * V1) / V2, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Khí lí tưởng',
        text: `Nén đẳng nhiệt một khối khí từ thể tích $${V1}\\text{ lít}$ (áp suất $${p1}\\text{ atm}$) xuống còn $${V2}\\text{ lít}$. Tính áp suất khí lúc sau (theo atm).`,
        answer: fmtNum(p2, 2), acceptedAnswers: buildShortAccepted(p2, 2),
        explanation: `Theo định luật Boyle: $p_2=\\frac{p_1 V_1}{V_2}=\\frac{${p1}\\cdot ${V1}}{${V2}}=${fmtNum(p2, 2)}\\text{ atm}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const m0 = pick(rng, [24, 48, 64, 96]);
      const k = pick(rng, [2, 3]);
      const rem = roundN(m0 / Math.pow(2, k), 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Vật lí hạt nhân',
        text: `Ban đầu có $${m0}\\text{ g}$ một đồng vị phóng xạ. Sau thời gian bằng $${k}$ chu kì bán rã, khối lượng đồng vị này còn lại bao nhiêu gam?`,
        answer: fmtNum(rem, 2), acceptedAnswers: buildShortAccepted(rem, 2),
        explanation: `Sau $${k}$ chu kì bán rã, khối lượng còn lại là $m=\\frac{m_0}{2^{${k}}}=\\frac{${m0}}{${Math.pow(2, k)}}=${fmtNum(rem, 2)}\\text{ g}$.`,
        reviewRequired: false
      };
    }
  ];

  // --- CHEMISTRY PARAMETRIC GENERATORS ---
  const CHEM_MCQ_GEN = [
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.15, 0.2, 0.25, 0.3]);
      const mEster = roundN(mol * 88, 2);
      const mSalt = roundN(mol * 82, 2);
      return makeMcqFromValues(
        rng, id, n, 'Ester - Lipid',
        `Xà phòng hóa hoàn toàn $${fmtNum(mEster, 2)}\\text{ g}$ ethyl acetate ($\\text{CH}_3\\text{COOC}_2\\text{H}_5$, $M=88$) bằng dung dịch $\\text{NaOH}$ dư, thu được khối lượng muối $\\text{CH}_3\\text{COONa}$ ($M=82$) là`,
        `$${fmtNum(mSalt, 2)}\\text{ g}$`,
        [`$${fmtNum(roundN(mol * 46, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mSalt * 2, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mol * 68, 2), 2)}\\text{ g}$`],
        `$n_{\\text{ester}}=\\frac{${fmtNum(mEster, 2)}}{88}=${mol}\\text{ mol} \\Rightarrow n_{\\text{CH}_3\\text{COONa}}=${mol}\\text{ mol} \\Rightarrow m=${mol}\\cdot 82=${fmtNum(mSalt, 2)}\\text{ g}$.`
      );
    },
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.2, 0.25, 0.5]);
      const mGlu = roundN(mol * 180, 1);
      const mAg = roundN(mol * 2 * 108, 1);
      return makeMcqFromValues(
        rng, id, n, 'Carbohydrate',
        `Cho $${fmtNum(mGlu, 1)}\\text{ g}$ glucose ($\\text{C}_6\\text{H}_{12}\\text{O}_6$, $M=180$) tác dụng hoàn toàn với lượng dư thuốc thử Tollens ($\\text{AgNO}_3/\\text{NH}_3$). Khối lượng bạc ($\\text{Ag}=108$) kết tủa thu được là`,
        `$${fmtNum(mAg, 1)}\\text{ g}$`,
        [`$${fmtNum(roundN(mAg / 2, 1), 1)}\\text{ g}$`, `$${fmtNum(roundN(mAg * 2, 1), 1)}\\text{ g}$`, `$${fmtNum(roundN(mAg + 10.8, 1), 1)}\\text{ g}$`],
        `$n_{\\text{glucose}}=\\frac{${fmtNum(mGlu, 1)}}{180}=${mol}\\text{ mol}$. 1 mol glucose tráng gương tạo 2 mol Ag $\\Rightarrow n_{\\text{Ag}}=${roundN(2 * mol, 2)}\\text{ mol} \\Rightarrow m_{\\text{Ag}}=${fmtNum(mAg, 1)}\\text{ g}$.`
      );
    },
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.2, 0.3, 0.4]);
      const mGly = roundN(mol * 75, 2);
      const mSalt = roundN(mol * 111.5, 2);
      return makeMcqFromValues(
        rng, id, n, 'Amino acid - Peptide',
        `Cho $${fmtNum(mGly, 2)}\\text{ g}$ glycine ($\\text{H}_2\\text{N-CH}_2\\text{-COOH}$, $M=75$) tác dụng hoàn toàn với dung dịch $\\text{HCl}$ dư. Khối lượng muối $\\text{ClH}_3\\text{N-CH}_2\\text{-COOH}$ ($M=111,5$) thu được là`,
        `$${fmtNum(mSalt, 2)}\\text{ g}$`,
        [`$${fmtNum(roundN(mol * 97, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mSalt + 3.65, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mol * 125.5, 2), 2)}\\text{ g}$`],
        `$n_{\\text{Gly}}=\\frac{${fmtNum(mGly, 2)}}{75}=${mol}\\text{ mol}$. Bảo toàn khối lượng: $m_{\\text{muối}}=${mol}\\cdot(75+36,5)=${fmtNum(mSalt, 2)}\\text{ g}$.`
      );
    },
    (rng, id, n) => {
      const pair = pick(rng, [
        { a: 'Zn^{2+}/Zn', ea: -0.76, c: 'Cu^{2+}/Cu', ec: 0.34, name: 'Zn-Cu' },
        { a: 'Fe^{2+}/Fe', ea: -0.44, c: 'Cu^{2+}/Cu', ec: 0.34, name: 'Fe-Cu' },
        { a: 'Zn^{2+}/Zn', ea: -0.76, c: 'Ag^{+}/Ag', ec: 0.80, name: 'Zn-Ag' },
        { a: 'Cu^{2+}/Cu', ea: 0.34, c: 'Ag^{+}/Ag', ec: 0.80, name: 'Cu-Ag' },
        { a: 'Mg^{2+}/Mg', ea: -2.37, c: 'Cu^{2+}/Cu', ec: 0.34, name: 'Mg-Cu' }
      ]);
      const Epin = roundN(pair.ec - pair.ea, 2);
      return makeMcqFromValues(
        rng, id, n, 'Pin điện hóa',
        `Cho thế điện cực chuẩn $E^\\circ(${pair.a})=${pair.ea}\\text{ V}$ và $E^\\circ(${pair.c})=${pair.ec}\\text{ V}$. Sức điện động chuẩn của pin Galvani ${pair.name} là`,
        `$${fmtNum(Epin, 2)}\\text{ V}$`,
        [
          `$${fmtNum(roundN(Math.abs(pair.ec + pair.ea), 2), 2)}\\text{ V}$`,
          `$${fmtNum(roundN(Epin / 2, 2), 2)}\\text{ V}$`,
          `$${fmtNum(roundN(Epin + 0.4, 2), 2)}\\text{ V}$`
        ],
        `Sức điện động chuẩn của pin điện hóa: $E^\\circ_{\\text{pin}}=E^\\circ_{\\text{cathode}}-E^\\circ_{\\text{anode}}=${pair.ec}-(${pair.ea})=${fmtNum(Epin, 2)}\\text{ V}$.`
      );
    },
    (rng, id, n) => {
      const I = pick(rng, [2, 5, 10]);
      const t = pick(rng, [965, 1930, 3860]);
      const ne = roundN((I * t) / 96500, 3);
      const mCu = roundN((ne / 2) * 64, 2);
      return makeMcqFromValues(
        rng, id, n, 'Điện phân',
        `Điện phân dung dịch $\\text{CuSO}_4$ dư với điện cực trơ, cường độ dòng điện $I=${I}\\text{ A}$ trong thời gian $t=${t}\\text{ s}$ (cho $F=96500\\text{ C/mol}, \\text{Cu}=64$). Khối lượng đồng bám vào cathode là`,
        `$${fmtNum(mCu, 2)}\\text{ g}$`,
        [`$${fmtNum(roundN(mCu * 2, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mCu / 2, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mCu + 1.6, 2), 2)}\\text{ g}$`],
        `Áp dụng định luật Faraday: $n_e=\\frac{It}{F}=\\frac{${I}\\cdot ${t}}{96500}=${ne}\\text{ mol}$. Quá trình $\\text{Cu}^{2+}+2e\\to\\text{Cu}$ nên $n_{\\text{Cu}}=${roundN(ne / 2, 4)}\\text{ mol} \\Rightarrow m_{\\text{Cu}}=${fmtNum(mCu, 2)}\\text{ g}$.`
      );
    },
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.2, 0.3, 0.5]);
      const mFe = roundN(mol * 56, 1);
      const V = roundN(mol * 24.79, 2);
      return makeMcqFromValues(
        rng, id, n, 'Đại cương Kim loại',
        `Hòa tan hoàn toàn $${fmtNum(mFe, 1)}\\text{ g}$ sắt ($\\text{Fe}=56$) vào dung dịch $\\text{HCl}$ dư thu được bao nhiêu lít khí $\\text{H}_2$ (ở điều kiện chuẩn $25^\\circ\\text{C}, 1\\text{ bar}$, $V_m=24,79\\text{ L/mol}$)?`,
        `$${fmtNum(V, 2)}\\text{ lít}$`,
        [`$${fmtNum(roundN(V * 1.5, 2), 2)}\\text{ lít}$`, `$${fmtNum(roundN(V / 2, 2), 2)}\\text{ lít}$`, `$${fmtNum(roundN(mol * 22.4, 2), 2)}\\text{ lít}$`],
        `Phương trình: $\\text{Fe}+2\\text{HCl}\\to\\text{FeCl}_2+\\text{H}_2$. Ta có $n_{\\text{Fe}}=\\frac{${fmtNum(mFe, 1)}}{56}=${mol}\\text{ mol} \\Rightarrow V_{\\text{H}_2}=${mol}\\cdot 24,79=${fmtNum(V, 2)}\\text{ lít}$.`
      );
    },
    (rng, id, n) => {
      const mol = pick(rng, [0.2, 0.4, 0.5, 1]);
      const H = pick(rng, [50, 60, 80]);
      const mEth = roundN(mol * 2 * (H / 100) * 46, 2);
      const mGlu = roundN(mol * 180, 1);
      return makeMcqFromValues(
        rng, id, n, 'Carbohydrate - Lên men',
        `Lên men $${fmtNum(mGlu, 1)}\\text{ g}$ glucose ($M=180$) thành ethanol ($\\text{C}_2\\text{H}_5\\text{OH}, M=46$) với hiệu suất $${H}\\%$. Khối lượng ethanol thu được là`,
        `$${fmtNum(mEth, 2)}\\text{ g}$`,
        [`$${fmtNum(roundN(mol * 2 * 46, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mEth / 2, 2), 2)}\\text{ g}$`, `$${fmtNum(roundN(mEth * 1.25, 2), 2)}\\text{ g}$`],
        `$\\text{C}_6\\text{H}_{12}\\text{O}_6 \\to 2\\text{C}_2\\text{H}_5\\text{OH}+2\\text{CO}_2$. $n_{\\text{ethanol}}=2\\cdot ${mol}\\cdot\\frac{${H}}{100}=${roundN(2 * mol * H / 100, 3)}\\text{ mol} \\Rightarrow m=${fmtNum(mEth, 2)}\\text{ g}$.`
      );
    }
  ];

  const CHEM_SHORT_GEN = [
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.2, 0.25, 0.5]);
      const mEster = roundN(mol * 74, 2);
      const mSalt = roundN(mol * 68, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Ester - Lipid',
        text: `Thủy phân hoàn toàn $${fmtNum(mEster, 2)}\\text{ g}$ methyl formate ($\\text{HCOOCH}_3$, $M=60$ — sai, dùng ethyl formate $\\text{HCOOC}_2\\text{H}_5, M=74$) trong dung dịch $\\text{NaOH}$ dư. Tính khối lượng muối $\\text{HCOONa}$ ($M=68$) thu được (gam).`.replace('methyl formate ($\\text{HCOOCH}_3$, $M=60$ — sai, dùng ', ''),
        answer: fmtNum(mSalt, 2), acceptedAnswers: buildShortAccepted(mSalt, 2),
        explanation: `$n_{\\text{HCOOC}_2\\text{H}_5}=\\frac{${fmtNum(mEster, 2)}}{74}=${mol}\\text{ mol} \\Rightarrow m_{\\text{HCOONa}}=${mol}\\cdot 68=${fmtNum(mSalt, 2)}\\text{ g}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const pair = pick(rng, [
        { a: 'Zn', ea: -0.76, c: 'Cu', ec: 0.34 },
        { a: 'Fe', ea: -0.44, c: 'Ag', ec: 0.80 },
        { a: 'Ni', ea: -0.26, c: 'Cu', ec: 0.34 },
        { a: 'Mg', ea: -2.37, c: 'Zn', ec: -0.76 }
      ]);
      const Epin = roundN(pair.ec - pair.ea, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Pin điện hóa',
        text: `Cho thế điện cực chuẩn $E^\\circ(${pair.a}^{2+}/${pair.a})=${pair.ea}\\text{ V}$ và $E^\\circ(${pair.c})=${pair.ec}\\text{ V}$. Tính sức điện động chuẩn của pin Galvani ${pair.a}-${pair.c} (đơn vị V).`,
        answer: fmtNum(Epin, 2), acceptedAnswers: buildShortAccepted(Epin, 2),
        explanation: `$E^\\circ_{\\text{pin}}=E^\\circ_{\\text{cathode}}-E^\\circ_{\\text{anode}}=${pair.ec}-(${pair.ea})=${fmtNum(Epin, 2)}\\text{ V}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const mol = pick(rng, [0.1, 0.2, 0.3]);
      const mAla = roundN(mol * 89, 2);
      const mSalt = roundN(mol * 111, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Amino acid',
        text: `Cho $${fmtNum(mAla, 2)}\\text{ g}$ alanine ($M=89$) phản ứng hoàn toàn với dung dịch $\\text{NaOH}$ vừa đủ. Tính khối lượng muối $\\text{H}_2\\text{N-CH(CH}_3\\text{)-COONa}$ ($M=111$) thu được (gam).`,
        answer: fmtNum(mSalt, 2), acceptedAnswers: buildShortAccepted(mSalt, 2),
        explanation: `$n_{\\text{Ala}}=${fmtNum(mAla, 2)}/89=${mol}\\text{ mol} \\Rightarrow m_{\\text{muối}}=${mol}\\cdot 111=${fmtNum(mSalt, 2)}\\text{ g}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const c = pick(rng, [{ f: 'C_3H_6O_2', cnt: 2 }, { f: 'C_4H_8O_2', cnt: 4 }, { f: 'C_3H_9N', cnt: 4 }]);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Đồng phân hữu cơ',
        text: c.f === 'C_3H_9N'
          ? `Có bao nhiêu đồng phân cấu tạo amine ứng với công thức phân tử $\\text{C}_3\\text{H}_9\\text{N}$?`
          : `Có bao nhiêu đồng phân cấu tạo ester đơn chức ứng với công thức phân tử $\\text{${c.f}}$?`,
        answer: String(c.cnt), acceptedAnswers: [String(c.cnt)],
        explanation: c.f === 'C_3H_9N'
          ? `Các đồng phân amine $\\text{C}_3\\text{H}_9\\text{N}$ gồm: propylamine, isopropylamine (bậc 1), ethylmethylamine (bậc 2), trimethylamine (bậc 3) → tổng 4 đồng phân.`
          : c.f === 'C_3H_6O_2'
          ? `Ester $\\text{C}_3\\text{H}_6\\text{O}_2$ có 2 đồng phân: $\\text{HCOOC}_2\\text{H}_5$ và $\\text{CH}_3\\text{COOCH}_3$.`
          : `Ester $\\text{C}_4\\text{H}_8\\text{O}_2$ có 4 đồng phân: $\\text{HCOOCH}_2\\text{CH}_2\\text{CH}_3$, $\\text{HCOOCH(CH}_3)_2$, $\\text{CH}_3\\text{COOC}_2\\text{H}_5$, $\\text{C}_2\\text{H}_5\\text{COOCH}_3$.`,
        reviewRequired: false
      };
    }
  ];

  // --- BIOLOGY PARAMETRIC GENERATORS ---
  const BIO_MCQ_GEN = [
    (rng, id, n) => {
      const N = pick(rng, [1200, 1800, 2400, 3000]);
      const pctA = pick(rng, [20, 25, 30]);
      const A = Math.round((N * pctA) / 100);
      const G = N / 2 - A;
      const H = 2 * A + 3 * G;
      return makeMcqFromValues(
        rng, id, n, 'Di truyền phân tử',
        `Một đoạn phân tử DNA mạch kép có tổng số $${N}$ nucleotide, trong đó loại A chiếm $${pctA}\\%$. Số liên kết hydro của đoạn DNA này là`,
        `${H}`,
        [`${2 * G + 3 * A}`, `${N + A}`, `${H + 120}`],
        `Ta có $A=T=${pctA}\\%\\cdot ${N}=${A}$; $G=C=\\frac{${N}}{2}-${A}=${G}$. Số liên kết hydro $H=2A+3G=2\\cdot ${A}+3\\cdot ${G}=${H}$.`
      );
    },
    (rng, id, n) => {
      const N = pick(rng, [1200, 1800, 2400, 3000]);
      const L = (N / 2) * 3.4;
      return makeMcqFromValues(
        rng, id, n, 'Cấu trúc DNA',
        `Một gene có tổng số $${N}$ nucleotide. Chiều dài của gene đó bằng bao nhiêu $\\text{\\AA}$ (Angstrom)?`,
        `$${L}\\,\\text{\\AA}$`,
        [`$${L * 2}\\,\\text{\\AA}$`, `$${L / 2}\\,\\text{\\AA}$`, `$${N * 3}\\,\\text{\\AA}$`],
        `Mỗi cặp nucleotide dài $3,4\\,\\text{\\AA}$, nên $L=\\frac{N}{2}\\cdot 3,4=${N / 2}\\cdot 3,4=${L}\\,\\text{\\AA}$.`
      );
    },
    (rng, id, n) => {
      const k = randInt(rng, 2, 5);
      const cnt = Math.pow(2, k);
      return makeMcqFromValues(
        rng, id, n, 'Nhân đôi DNA',
        `Một phân tử DNA mẹ trải qua $${k}$ lần nhân đôi liên tiếp tạo ra tổng số bao nhiêu phân tử DNA con?`,
        `${cnt}`,
        [`${2 * k}`, `${cnt - 2}`, `${cnt * 2}`],
        `Sau $k$ lần nhân đôi liên tiếp, 1 phân tử DNA tạo ra $2^k=2^{${k}}=${cnt}$ phân tử DNA con.`
      );
    },
    (rng, id, n) => {
      const nHet = randInt(rng, 2, 5);
      const gam = Math.pow(2, nHet);
      return makeMcqFromValues(
        rng, id, n, 'Quy luật phân li độc lập',
        `Một cá thể có kiểu gene dị hợp về $${nHet}$ cặp gene nằm trên $${nHet}$ cặp nhiễm sắc thể tương đồng khác nhau. Khi giảm phân bình thường tạo tối đa bao nhiêu loại giao tử?`,
        `${gam}`,
        [`${2 * nHet}`, `${gam * 2}`, `${Math.pow(3, nHet)}`],
        `Các cặp gene phân li độc lập nên số loại giao tử tối đa là $2^n=2^{${nHet}}=${gam}$.`
      );
    },
    (rng, id, n) => {
      const p = pick(rng, [0.2, 0.3, 0.4, 0.6, 0.7, 0.8]);
      const q = roundN(1 - p, 2);
      const het = roundN(2 * p * q, 2);
      return makeMcqFromValues(
        rng, id, n, 'Di truyền quần thể',
        `Một quần thể đạt trạng thái cân bằng Hardy-Weinberg có tần số allele $A$ là $p=${p}$. Tần số kiểu gene dị hợp $Aa$ trong quần thể là`,
        `${fmtNum(het, 2)}`,
        [`${fmtNum(roundN(p * p, 2), 2)}`, `${fmtNum(roundN(q * q, 2), 2)}`, `${fmtNum(roundN(p * q, 2), 2)}`],
        `Tần số allele $a$ là $q=1-${p}=${q}$. Theo Hardy-Weinberg, tỉ lệ kiểu gene $Aa=2pq=2\\cdot ${p}\\cdot ${q}=${fmtNum(het, 2)}$.`
      );
    }
  ];

  const BIO_SHORT_GEN = [
    (rng, id, n) => {
      const N = pick(rng, [900, 1200, 1500, 1800, 2400]);
      const aa = N / 6 - 2;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Dịch mã - Protein',
        text: `Một gene ở sinh vật nhân sơ có $${N}$ nucleotide tiến hành phiên mã và dịch mã. Số amino acid trong chuỗi polypeptide hoàn chỉnh (đã cắt amino acid mở đầu) là bao nhiêu?`,
        answer: String(aa), acceptedAnswers: [String(aa)],
        explanation: `Số bộ ba trên mRNA là $N/6=${N / 6}$. Trừ 1 bộ ba kết thúc và 1 amino acid mở đầu bị cắt đi, số amino acid hoàn chỉnh là $\\frac{${N}}{6}-2=${aa}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const p = pick(rng, [0.3, 0.4, 0.6, 0.7]);
      const q = roundN(1 - p, 2);
      const aa = roundN(q * q, 2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Di truyền quần thể',
        text: `Quần thể cân bằng di truyền có tần số allele trội $p(A)=${p}$. Tính tần số kiểu gene đồng hợp lặn $aa$ trong quần thể.`,
        answer: fmtNum(aa, 2), acceptedAnswers: buildShortAccepted(aa, 2),
        explanation: `$q(a)=1-${p}=${q}$, suy ra tần số kiểu gene $aa=q^2=${q}^2=${fmtNum(aa, 2)}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const e1 = pick(rng, [10000, 20000, 50000]);
      const eff = 10;
      const e2 = (e1 * eff) / 100;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Sinh thái học - Dòng năng lượng',
        text: `Năng lượng tích lũy ở sinh vật sản xuất là $${e1}\\text{ kcal}$. Nếu hiệu suất sinh thái truyền sang sinh vật tiêu thụ bậc 1 là $${eff}\\%$, năng lượng tích lũy ở sinh vật tiêu thụ bậc 1 là bao nhiêu kcal?`,
        answer: String(e2), acceptedAnswers: [String(e2)],
        explanation: `Năng lượng ở bậc dinh dưỡng kế tiếp bằng $${eff}\\%\\cdot ${e1}=${e2}\\text{ kcal}$.`,
        reviewRequired: false
      };
    }
  ];

  // --- GEOGRAPHY PARAMETRIC DATA-CALCULATION GENERATORS ---
  const GEO_SHORT_GEN = [
    (rng, id, n) => {
      const pop = pick(rng, [98.5, 100.3, 101.2]);
      const area = 331.3;
      const dens = Math.round((pop * 1e6) / (area * 1e3));
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Địa lí Dân cư - Tính toán',
        text: `Cho dân số một năm của Việt Nam là $${pop}$ triệu người và diện tích tự nhiên là $${area}$ nghìn $\\text{km}^2$. Tính mật độ dân số (người/$\\text{km}^2$, làm tròn đến hàng đơn vị).`,
        answer: String(dens), acceptedAnswers: [String(dens)],
        explanation: `Mật độ dân số $=\\frac{\\text{Dân số}}{\\text{Diện tích}}=\\frac{${pop}\\cdot 10^6}{${area}\\cdot 10^3}\\approx ${dens}\\text{ người/km}^2$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const sl = pick(rng, [42.6, 43.5, 44.1]);
      const dt = pick(rng, [7.1, 7.2, 7.3]);
      const ns = roundN((sl * 10) / dt, 1);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Địa lí Nông nghiệp',
        text: `Sản lượng lúa cả năm đạt $${sl}$ triệu tấn trên diện tích gieo trồng $${dt}$ triệu ha. Tính năng suất lúa trung bình (tạ/ha, làm tròn 1 chữ số thập phân).`,
        answer: fmtNum(ns, 1), acceptedAnswers: buildShortAccepted(ns, 1),
        explanation: `Đổi 1 tấn = 10 tạ. Năng suất $=\\frac{${sl}\\cdot 10}{${dt}}\\approx ${fmtNum(ns, 1)}\\text{ tạ/ha}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const xk = randInt(rng, 340, 410);
      const nk = randInt(rng, 310, xk - 12);
      const cc = xk - nk;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Thương mại & Xuất nhập khẩu',
        text: `Trị giá xuất khẩu hàng hóa của nước ta đạt $${xk}$ tỉ USD, trị giá nhập khẩu đạt $${nk}$ tỉ USD. Tính cán cân xuất nhập khẩu (tỉ USD).`,
        answer: String(cc), acceptedAnswers: [String(cc)],
        explanation: `Cán cân xuất nhập khẩu $=\\text{Xuất khẩu}-\\text{Nhập khẩu}=${xk}-${nk}=${cc}$ tỉ USD (xuất siêu).`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const tMax = pick(rng, [29.4, 29.8, 30.2]);
      const tMin = pick(rng, [16.4, 17.2, 18.6]);
      const amp = roundN(tMax - tMin, 1);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Địa lí Tự nhiên - Khí hậu',
        text: `Một trạm khí tượng có nhiệt độ trung bình tháng nóng nhất là $${tMax}^\\circ\\text{C}$ và tháng lạnh nhất là $${tMin}^\\circ\\text{C}$. Tính biên độ nhiệt năm của trạm này ($^\\circ\\text{C}$).`,
        answer: fmtNum(amp, 1), acceptedAnswers: buildShortAccepted(amp, 1),
        explanation: `Biên độ nhiệt năm $=T_{\\max}-T_{\\min}=${tMax}-${tMin}=${fmtNum(amp, 1)}^\\circ\\text{C}$.`,
        reviewRequired: false
      };
    }
  ];

  // --- INFORMATICS PARAMETRIC GENERATORS ---
  const INFO_SHORT_GEN = [
    (rng, id, n) => {
      const val = randInt(rng, 19, 61);
      const bin = val.toString(2);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Biểu diễn dữ liệu nhị phân',
        text: `Giá trị hệ thập phân của số nhị phân $${bin}_2$ là bao nhiêu?`,
        answer: String(val), acceptedAnswers: [String(val)],
        explanation: `Đổi số nhị phân $${bin}_2$ sang thập phân bằng tổng lũy thừa của 2 ở các bit 1, ta được kết quả là ${val}.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const nVal = randInt(rng, 4, 9);
      const s = (nVal * (nVal + 1)) / 2;
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Thuật toán & Python',
        text: `Cho đoạn code Python: \`s = 0; for i in range(1, ${nVal + 1}): s += i; print(s)\`. Kết quả in ra màn hình là bao nhiêu?`,
        answer: String(s), acceptedAnswers: [String(s)],
        explanation: `Vòng lặp cộng các số nguyên từ 1 đến ${nVal}: $s=\\frac{${nVal}(${nVal}+1)}{2}=${s}$.`,
        reviewRequired: false
      };
    },
    (rng, id, n) => {
      const a = randInt(rng, 3, 9);
      const b = randInt(rng, 2, 5);
      const res = a * b + (a % b);
      return {
        id, section: 'III', type: 'short', number: n, topic: 'Biểu thức lập trình Python',
        text: `Trong Python, biểu thức \`${a} * ${b} + (${a} % ${b})\` trả về giá trị số nguyên bằng bao nhiêu?`,
        answer: String(res), acceptedAnswers: [String(res)],
        explanation: `Ta có ${a} * ${b} = ${a * b} và phép chia lấy dư ${a} % ${b} = ${a % b}. Tổng là ${a * b} + ${a % b} = ${res}.`,
        reviewRequired: false
      };
    }
  ];

  // --------------------------------------------------------------------------
  // CURATED GDPT 2018 KNOWLEDGE POOLS (ALL 11 SUBJECTS — 100% VERIFIED)
  // --------------------------------------------------------------------------
  const CURATED_BANKS = {
    physics: {
      mcq: [
        { tp: 'Vật lí nhiệt', q: 'Trong quá trình đẳng tích của một lượng khí lí tưởng xác định, đại lượng nào sau đây không đổi?', o: ['Thể tích của khối khí', 'Áp suất của khối khí', 'Nhiệt độ tuyệt đối', 'Nội năng của khối khí'], a: 0, e: 'Quá trình đẳng tích là quá trình biến đổi trạng thái trong đó thể tích được giữ không đổi.' },
        { tp: 'Vật lí nhiệt', q: 'Cách làm thay đổi nội năng của một vật không cần sự trao đổi nhiệt lượng với môi trường xung quanh là', o: ['Thực hiện công', 'Truyền nhiệt bằng bức xạ', 'Dẫn nhiệt qua thành bình', 'Đối lưu không khí'], a: 0, e: 'Có hai cách làm thay đổi nội năng là thực hiện công và truyền nhiệt; thực hiện công không cần trao đổi nhiệt lượng.' },
        { tp: 'Khí lí tưởng', q: 'Phương trình trạng thái của $n$ mol khí lí tưởng có dạng đúng là', o: ['$pV=nRT$', '$pT=nRV$', '$pV=nR/T$', '$VT=nRp$'], a: 0, e: 'Phương trình Clapeyron – Mendeleev cho $n$ mol khí lí tưởng là $pV=nRT$.' },
        { tp: 'Từ trường', q: 'Quy tắc dùng để xác định chiều của lực từ tác dụng lên đoạn dây dẫn mang dòng điện đặt trong từ trường đều là', o: ['Quy tắc bàn tay trái', 'Quy tắc bàn tay phải', 'Định luật Ohm', 'Định luật Pascal'], a: 0, e: 'Chiều lực từ xác định theo quy tắc bàn tay trái: đường sức đâm vào lòng bàn tay, chiều từ cổ tay đến ngón tay là chiều dòng điện, ngón cái choãi 90° chỉ chiều lực từ.' },
        { tp: 'Cảm ứng điện từ', q: 'Định luật Lenz cho phép xác định yếu tố nào của dòng điện cảm ứng?', o: ['Chiều dòng điện cảm ứng', 'Cường độ cực đại', 'Tần số góc', 'Điện trở cuộn dây'], a: 0, e: 'Định luật Lenz: dòng điện cảm ứng có chiều sao cho từ trường do nó sinh ra chống lại sự biến thiên của từ thông ban đầu qua mạch kín.' },
        { tp: 'Vật lí hạt nhân', q: 'Tia phóng xạ nào sau đây có bản chất là dòng hạt nhân nguyên tử $^4_2\\text{He}$?', o: ['Tia alpha ($\\alpha$)', 'Tia beta trừ ($\\beta^-$)', 'Tia gamma ($\\gamma$)', 'Tia X'], a: 0, e: 'Tia $\\alpha$ là chùm hạt nhân nguyên tử Helium $^4_2\\text{He}$ mang điện tích $+2e$.' },
        { tp: 'Vật lí hạt nhân', q: 'Phản ứng tổng hợp hai hạt nhân rất nhẹ thành hạt nhân nặng hơn ở nhiệt độ rất cao gọi là', o: ['Phản ứng nhiệt hạch', 'Phản ứng phân hạch', 'Phóng xạ beta', 'Hiệu ứng quang điện'], a: 0, e: 'Phản ứng nhiệt hạch là sự kết hợp các hạt nhân nhẹ (như đồng vị của hydrogen) thành hạt nhân nặng hơn và tỏa rất nhiều năng lượng.' },
        { tp: 'Điện từ trường', q: 'Sóng điện từ truyền trong chân không có tốc độ bằng', o: ['$3\\cdot 10^8\\text{ m/s}$', '$340\\text{ m/s}$', '$3\\cdot 10^5\\text{ m/s}$', '$1,5\\cdot 10^8\\text{ m/s}$'], a: 0, e: 'Mọi sóng điện từ truyền trong chân không đều có tốc độ bằng tốc độ ánh sáng $c\\approx 3\\cdot 10^8\\text{ m/s}$.' }
      ],
      tf: [],
      short: []
    },
    chemistry: {
      mcq: [
        { tp: 'Ester - Lipid', q: 'Chất nào sau đây thuộc loại ester no, đơn chức, mạch hở?', o: ['$\\text{CH}_3\\text{COOC}_2\\text{H}_5$', '$\\text{CH}_2=\\text{CH-COOCH}_3$', '$\\text{CH}_3\\text{COOH}$', '$\\text{C}_2\\text{H}_5\\text{OH}$'], a: 0, e: 'Ethyl acetate ($\\text{CH}_3\\text{COOC}_2\\text{H}_5$) có công thức tổng quát $\\text{C}_n\\text{H}_{2n}\\text{O}_2$ ($n\\ge 2$) là ester no, đơn chức, mạch hở.' },
        { tp: 'Carbohydrate', q: 'Carbohydrate nào sau đây thuộc loại disaccharide?', o: ['Saccharose', 'Glucose', 'Fructose', 'Tinh bột'], a: 0, e: 'Saccharose ($\\text{C}_{12}\\text{H}_{22}\\text{O}_{11}$) và maltose là disaccharide; glucose/fructose là monosaccharide; tinh bột/cellulose là polysaccharide.' },
        { tp: 'Amine', q: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?', o: ['Methylamine ($\\text{CH}_3\\text{NH}_2$)', 'Aniline ($\\text{C}_6\\text{H}_5\\text{NH}_2$)', 'Glycine', 'Ethanol'], a: 0, e: 'Methylamine là amine béo có tính base mạnh hơn $\\text{NH}_3$ nên làm quỳ tím hóa xanh; aniline có tính base rất yếu không làm đổi màu quỳ tím.' },
        { tp: 'Polymer', q: 'Polymer nào sau đây được điều chế bằng phản ứng trùng hợp?', o: ['Polyethylene (PE)', 'Nylon-6,6', 'Poly(ethylene terephthalate)', 'Tơ lapsan'], a: 0, e: 'PE được tổng hợp từ phản ứng trùng hợp ethylene ($n\\text{CH}_2=\\text{CH}_2 \\to (-\\text{CH}_2-\\text{CH}_2-)_n$); nylon-6,6 và PET dùng phản ứng trùng ngưng.' },
        { tp: 'Pin điện hóa', q: 'Trong pin điện hóa Galvani Zn–Cu, ở cực âm (anode) xảy ra quá trình nào?', o: ['Oxi hóa kim loại Zn thành $\\text{Zn}^{2+}$', 'Khử ion $\\text{Cu}^{2+}$ thành Cu', 'Khử ion $\\text{Zn}^{2+}$ thành Zn', 'Oxi hóa Cu thành $\\text{Cu}^{2+}$'], a: 0, e: 'Ở cực âm (anode) luôn xảy ra quá trình oxi hóa kim loại hoạt động mạnh hơn: $\\text{Zn} \\to \\text{Zn}^{2+} + 2e$.' },
        { tp: 'Kim loại IA - IIA', q: 'Nước cứng tạm thời chứa các ion $\\text{Ca}^{2+}, \\text{Mg}^{2+}$ và anion nào sau đây?', o: ['$\\text{HCO}_3^-$', '$\\text{Cl}^-$', '$\\text{SO}_4^{2-}$', '$\\text{NO}_3^-$'], a: 0, e: 'Nước cứng tạm thời do muối hydrocarbonate $\\text{Ca(HCO}_3)_2, \\text{Mg(HCO}_3)_2$ gây ra, có thể làm mềm bằng cách đun sôi.' },
        { tp: 'Phức chất', q: 'Số phối tử trong phức chất $[\\text{Cu(NH}_3)_4(\\text{H}_2\\text{O})_2]^{2+}$ là', o: ['6', '4', '2', '8'], a: 0, e: 'Phức chất có 4 phối tử $\\text{NH}_3$ và 2 phối tử $\\text{H}_2\\text{O}$, tổng cộng 6 phối tử (số phối trí 6, hình bát diện).' },
        { tp: 'Ăn mòn kim loại', q: 'Phương pháp gắn các tấm kẽm (Zn) vào vỏ tàu biển bằng thép là phương pháp bảo vệ kim loại nào?', o: ['Phương pháp điện hóa (anode hy sinh)', 'Phương pháp phủ bề mặt', 'Phương pháp nhiệt luyện', 'Phương pháp điện phân nóng chảy'], a: 0, e: 'Zn có tính khử mạnh hơn Fe nên đóng vai trò anode bị oxi hóa thay cho vỏ tàu thép (cathode) — gọi là bảo vệ điện hóa.' }
      ],
      tf: [
        { tp: 'Ester - Phản ứng ester hóa', q: 'Tiến hành thí nghiệm điều chế ethyl acetate từ acetic acid, ethanol và xúc tác $\\text{H}_2\\text{SO}_4$ đặc đun nóng.', s: [['Phản ứng ester hóa giữa carboxylic acid và alcohol là phản ứng thuận nghịch.', true], ['Vai trò của $\\text{H}_2\\text{SO}_4$ đặc chỉ là chất tham gia phản ứng tạo muối.', false], ['Ethyl acetate sinh ra ít tan trong nước và nhẹ hơn nước nên nổi lên lớp trên.', true], ['Thêm dung dịch NaCl bão hòa giúp tăng khả năng tách lớp ester rõ hơn.', true]], e: 'Phản ứng ester hóa thuận nghịch; $\\text{H}_2\\text{SO}_4$ đặc vừa xúc tác vừa hút nước chuyển dịch cân bằng; ester ít tan, nhẹ hơn nước và tách lớp tốt hơn trong NaCl bão hòa.' },
        { tp: 'Amino acid - Peptide', q: 'Xét các amino acid và peptide trong chương trình Hóa học 12:', s: [['Amino acid là hợp chất hữu cơ tạp chức chứa đồng thời nhóm $-\\text{NH}_2$ và $-\\text{COOH}$.', true], ['Glycine có tính lưỡng tính, vừa tác dụng với dung dịch HCl vừa tác dụng với dung dịch NaOH.', true], ['Dipeptide Gly-Ala có phản ứng màu biuret tạo phức màu tím đặc trưng với $\\text{Cu(OH)}_2$.', false], ['Thủy phân hoàn toàn protein bằng xúc tác enzyme hoặc acid thu được các $\\alpha$-amino acid.', true]], e: 'Phản ứng màu biuret chỉ xảy ra với peptide từ tripeptide trở lên (có ít nhất 2 liên kết peptide); dipeptide Gly-Ala chỉ có 1 liên kết peptide nên không có phản ứng màu biuret.' },
        { tp: 'Pin Galvani & Điện phân', q: 'Xét hai quá trình điện hóa cơ bản trong pin Galvani và bình điện phân:', s: [['Pin Galvani chuyển hóa năng lượng hóa học trực tiếp thành điện năng.', true], ['Ở cả pin Galvani và bình điện phân, quá trình oxi hóa luôn xảy ra tại anode.', true], ['Trong bình điện phân dung dịch $\\text{CuSO}_4$ (điện cực trơ), ở cathode xuất hiện kim loại đồng.', true], ['Trong pin Galvani Zn–Cu, dòng electron di chuyển ở mạch ngoài từ cực Cu sang cực Zn.', false]], e: 'Electron ở mạch ngoài pin Zn–Cu di chuyển từ cực âm (anode Zn) sang cực dương (cathode Cu). Các nhận định còn lại đều đúng theo lí thuyết điện hóa.' },
        { tp: 'Kim loại kiềm & Kiềm thổ', q: 'Xét tính chất các nguyên tố nhóm IA và IIA trong bảng tuần hoàn:', s: [['Các kim loại nhóm IA (Li, Na, K...) đều có 1 electron lớp ngoài cùng và tính khử mạnh.', true], ['$\text{NaHCO}_3$ được dùng làm bột nở thực phẩm và thuốc giảm đau dạ dày do thừa acid.', true], ['Nước cứng vĩnh cửu có thể được làm mềm hoàn toàn chỉ bằng cách đun sôi.', false], ['Dung dịch $\\text{Na}_2\\text{CO}_3$ làm mềm được cả nước cứng tạm thời và nước cứng vĩnh cửu.', true]], e: 'Đun sôi chỉ làm mềm nước cứng tạm thời; $\\text{Na}_2\\text{CO}_3$ cung cấp $\\text{CO}_3^{2-}$ kết tủa $\\text{Ca}^{2+}, \\text{Mg}^{2+}$ nên làm mềm được mọi loại nước cứng.' }
      ],
      short: []
    },
    biology: {
      mcq: [
        { tp: 'Di truyền phân tử', q: 'Loại phân tử nào sau đây mang bộ ba đối mã (anticodon) và vận chuyển amino acid đến ribosome trong quá trình dịch mã?', o: ['tRNA', 'mRNA', 'rRNA', 'DNA'], a: 0, e: 'tRNA (RNA vận chuyển) mang anticodon bổ sung với codon trên mRNA và mang amino acid tương ứng tới ribosome.' },
        { tp: 'Mã di truyền', q: 'Trên mạch mRNA, bộ ba mở đầu dịch mã ở sinh vật nhân thực mã hóa amino acid methionine là', o: ['5\'AUG3\'', '5\'UAA3\'', '5\'UAG3\'', '5\'UGA3\''], a: 0, e: '5\'AUG3\' là bộ ba mở đầu; còn 5\'UAA3\', 5\'UAG3\', 5\'UGA3\' là ba bộ ba kết thúc không mã hóa amino acid.' },
        { tp: 'Đột biến NST', q: 'Hội chứng Down ở người là hậu quả của dạng đột biến số lượng nhiễm sắc thể nào?', o: ['Thể ba ($2n+1$) ở cặp NST số 21', 'Thể một ($2n-1$) ở cặp NST giới tính', 'Mất đoạn NST số 5', 'Đa bội $3n$'], a: 0, e: 'Người mắc hội chứng Down có 3 chiếc NST số 21 (thể ba $2n+1=47$).' },
        { tp: 'Quy luật di truyền', q: 'Cơ sở tế bào học của quy luật phân li độc lập của Mendel là sự phân li độc lập và tổ hợp tự do của', o: ['Các cặp NST tương đồng trong giảm phân', 'Các gene trên cùng một NST', 'Các ty thể trong tế bào chất', 'Các chuỗi polypeptide'], a: 0, e: 'Các cặp gene nằm trên các cặp NST tương đồng khác nhau phân li độc lập trong kì sau giảm phân I.' },
        { tp: 'Tiến hóa', q: 'Nhân tố tiến hóa nào sau đây vừa làm thay đổi tần số allele vừa làm thay đổi thành phần kiểu gene theo một hướng xác định?', o: ['Chọn lọc tự nhiên', 'Phiêu bạt di truyền', 'Giao phối không ngẫu nhiên', 'Đột biến'], a: 0, e: 'Chọn lọc tự nhiên là nhân tố duy nhất quy định chiều hướng tiến hóa (tăng dần tần số allele có lợi, thích nghi môi trường).' },
        { tp: 'Tiến hóa', q: 'Cánh dơi và tay người có cấu trúc xương tương tự nhau do bắt nguồn từ cùng một cơ quan ở tổ tiên chung được gọi là', o: ['Cơ quan tương đồng', 'Cơ quan tương tự', 'Cơ quan thoái hóa', 'Biến dị tổ hợp'], a: 0, e: 'Cơ quan tương đồng có cùng nguồn gốc phôi sinh, phản ánh tiến hóa phân li từ tổ tiên chung.' },
        { tp: 'Sinh thái học', q: 'Mối quan hệ giữa vi khuẩn nốt sần Rhizobium và cây họ Đậu thuộc kiểu quan hệ sinh thái nào?', o: ['Cộng sinh', 'Kí sinh', 'Cạnh tranh', 'Ức chế - cảm nhiễm'], a: 0, e: 'Cả hai loài đều có lợi và gắn bó chặt chẽ: vi khuẩn cố định đạm cho cây, cây cung cấp chất hữu cơ và nơi ở cho vi khuẩn.' },
        { tp: 'Di truyền học người', q: 'Phương pháp nghiên cứu nào giúp lập sơ đồ theo dõi sự di truyền một tính trạng qua nhiều thế hệ trong một dòng họ?', o: ['Nghiên cứu phả hệ', 'Lai thuận nghịch', 'Gây đột biến nhân tạo', 'Nuôi cấy hạt phấn'], a: 0, e: 'Nghiên cứu phả hệ theo dõi tính trạng qua các thế hệ gia đình để xác định gene trội/lặn và vị trí trên NST thường hay giới tính.' }
      ],
      tf: [
        { tp: 'Cơ chế di truyền phân tử', q: 'Xét cơ chế nhân đôi DNA, phiên mã và dịch mã ở tế bào nhân thực:', s: [['Nhân đôi DNA diễn ra theo nguyên tắc bổ sung và nguyên tắc bán bảo toàn.', true], ['Enzyme RNA polymerase xúc tác tổng hợp mạch mRNA theo chiều 5\' → 3\'.', true], ['Quá trình dịch mã ở tế bào nhân thực diễn ra trong nhân tế bào.', false], ['Nhiều ribosome cùng trượt trên một phân tử mRNA (polyribosome) giúp tăng hiệu suất tổng hợp protein.', true]], e: 'Ở tế bào nhân thực, nhân đôi và phiên mã diễn ra trong nhân, còn dịch mã diễn ra ở tế bào chất (trên ribosome).' },
        { tp: 'Đột biến gene & NST', q: 'Xét các đặc điểm của đột biến gene và đột biến nhiễm sắc thể:', s: [['Đột biến thay thế một cặp nucleotide có thể không làm thay đổi chuỗi amino acid do tính thoái hóa của mã di truyền.', true], ['Mọi đột biến gene đều gây hại cho cơ thể sinh vật.', false], ['Đột biến đảo đoạn NST không làm thay đổi số lượng gene trên NST nhưng có thể thay đổi mức độ biểu hiện gene.', true], ['Thể song nhị bội được hình thành qua lai xa kèm đa bội hóa có khả năng sinh sản hữu tính bình thường.', true]], e: 'Đột biến gene có thể có hại, trung tính hoặc có lợi tùy tổ hợp gene và môi trường, không phải mọi đột biến đều có hại.' },
        { tp: 'Tiến hóa hiện đại', q: 'Xét học thuyết tiến hóa tổng hợp hiện đại:', s: [['Đơn vị tiến hóa cơ bản là quần thể giao phối.', true], ['Đột biến tạo ra các allele mới là nguồn nguyên liệu sơ cấp của tiến hóa.', true], ['Giao phối không ngẫu nhiên làm thay đổi tần số allele của quần thể qua các thế hệ.', false], ['Cách li địa lí góp phần duy trì sự khác biệt về vốn gene giữa các quần thể, dẫn đến hình thành loài mới.', true]], e: 'Giao phối không ngẫu nhiên chỉ làm thay đổi thành phần kiểu gene (tăng đồng hợp, giảm dị hợp) chứ không làm thay đổi tần số allele.' },
        { tp: 'Sinh thái học', q: 'Xét cấu trúc hệ sinh thái và dòng năng lượng:', s: [['Sinh vật sản xuất (thực vật, tảo) chuyển hóa quang năng thành hóa năng trong chất hữu cơ.', true], ['Chuỗi thức ăn trong tự nhiên thường chỉ có tối đa khoảng 4–6 bậc dinh dưỡng do thất thoát năng lượng lớn qua mỗi bậc.', true], ['Sinh vật phân giải (vi khuẩn, nấm) trả lại chất vô cơ cho môi trường khép kín vòng tuần hoàn vật chất.', true], ['Năng lượng trong hệ sinh thái được tuần hoàn tái sử dụng 100% giống như vật chất.', false]], e: 'Vật chất tuần hoàn trong hệ sinh thái, còn dòng năng lượng đi theo một chiều và thất thoát dần dưới dạng nhiệt qua hô hấp.' }
      ],
      short: []
    },
    english: {
      mcq: [
        { tp: 'Verb Tenses', q: 'By the time the teacher arrived in the classroom, the students ______ all the exercises.', o: ['had finished', 'have finished', 'finish', 'were finishing'], a: 0, e: 'Cấu trúc "By the time + QKĐ, QKHT (had + V3/ed)" diễn tả hành động hoàn tất trước một thời điểm trong quá khứ.' },
        { tp: 'Conditional Sentences', q: 'If she ______ harder last semester, she would have won the national scholarship.', o: ['had studied', 'studied', 'studies', 'would study'], a: 0, e: 'Câu điều kiện loại 3 (trái với quá khứ): If + S + had + V3/ed, S + would have + V3/ed.' },
        { tp: 'Relative Clauses', q: 'The scientist ______ discovered this eco-friendly battery received an international award.', o: ['who', 'which', 'whose', 'where'], a: 0, e: '"The scientist" là danh từ chỉ người đóng vai trò chủ ngữ trong mệnh đề quan hệ → dùng đại từ quan hệ "who".' },
        { tp: 'Passive Voice', q: 'A new solar power station ______ in the coastal province next year.', o: ['will be built', 'will build', 'is building', 'built'], a: 0, e: 'Chủ ngữ là vật ("A new solar power station") + dấu hiệu tương lai ("next year") → bị động tương lai đơn: will be + V3/ed.' },
        { tp: 'Collocations', q: 'Students should ______ full advantage of digital libraries to broaden their knowledge.', o: ['take', 'do', 'make', 'give'], a: 0, e: 'Cụm từ cố định (collocation): "take advantage of something" = tận dụng triệt để điều gì.' },
        { tp: 'Phrasal Verbs', q: 'The outdoor music festival had to be ______ because of the heavy thunderstorm.', o: ['called off', 'taken after', 'looked up', 'turned on'], a: 0, e: '"call off" = cancel (hủy bỏ); phù hợp ngữ cảnh lễ hội bị hủy do mưa giông.' },
        { tp: 'Prepositions', q: 'Young people are increasingly concerned ______ the impact of plastic waste on marine life.', o: ['about', 'of', 'at', 'between'], a: 0, e: 'Cấu trúc tính từ + giới từ: "be concerned about something" = quan tâm/lo lắng về điều gì.' },
        { tp: 'Word Form', q: 'Regular physical exercise makes a significant ______ to both mental and physical health.', o: ['contribution', 'contribute', 'contributory', 'contributing'], a: 0, e: 'Sau mạo từ "a" + tính từ "significant" cần một danh từ → "contribution" (make a contribution to).' },
        { tp: 'Gerund & Infinitive', q: 'My brother suggested ______ the science museum before taking the afternoon train.', o: ['visiting', 'to visit', 'visit', 'visited'], a: 0, e: 'Động từ "suggest" theo sau bởi danh động từ V-ing: suggest + V-ing.' },
        { tp: 'Conjunctions', q: '______ the heavy traffic jam, Minh managed to arrive at the exam hall on time.', o: ['Despite', 'Although', 'Because', 'However'], a: 0, e: '"the heavy traffic jam" là cụm danh từ mang nghĩa tương phản → dùng giới từ "Despite" (Although + mệnh đề).' },
        { tp: 'Comparisons', q: 'The more you practice solving mock exams, ______ you will become under time pressure.', o: ['the more confident', 'more confident', 'the most confident', 'confident'], a: 0, e: 'Cấu trúc so sánh kép: The + so sánh hơn + S + V, the + so sánh hơn + S + V.' },
        { tp: 'Reduced Relative Clause', q: 'The scholarship program ______ by the Ministry of Education supports thousands of rural students.', o: ['launched', 'launching', 'which launching', 'to launch'], a: 0, e: 'Rút gọn mệnh đề quan hệ dạng bị động ("which was launched") → dùng quá khứ phân từ V3/ed ("launched").' },
        { tp: 'Vocabulary - Environment', q: 'Switching to ______ energy sources such as wind and solar helps reduce carbon emissions.', o: ['renewable', 'disposable', 'fragile', 'temporary'], a: 0, e: '"renewable energy" = năng lượng tái tạo (gió, mặt trời) giúp giảm phát thải carbon.' },
        { tp: 'Subject-Verb Agreement', q: 'Neither the coach nor the players ______ satisfied with the final score of yesterday\'s match.', o: ['were', 'was', 'is', 'has been'], a: 0, e: 'Cấu trúc "Neither S1 nor S2" chia động từ theo chủ ngữ gần nhất (S2 = "the players", số nhiều) và mốc "yesterday" → "were".' },
        { tp: 'Reported Speech', q: 'Lan told me that she ______ preparing for the IELTS exam the following month.', o: ['would be', 'will be', 'is', 'has been'], a: 0, e: 'Câu tường thuật lùi thì từ tương lai ("will be ... next month") thành "would be ... the following month".' },
        { tp: 'Inversion', q: 'Not only ______ the math competition, but she also earned a top score in physics.', o: ['did she win', 'she won', 'she did win', 'won she'], a: 0, e: 'Đảo ngữ với "Not only" đứng đầu câu: Not only + trợ động từ (did) + S + V nguyên mẫu.' }
      ],
      tf: [
        { tp: 'Reading Comprehension — AI in Education', q: 'Read the short passage: "Artificial intelligence tools help students receive instant feedback on essays and math problems. However, educators emphasize that AI cannot replace human mentorship, critical thinking, or genuine teamwork in the classroom."', s: [['AI tools can provide rapid feedback on student assignments.', true], ['Educators believe AI will completely replace human teachers soon.', false], ['Critical thinking and teamwork remain essential classroom skills.', true], ['The passage discusses both benefits and limitations of AI in education.', true]], e: 'Đoạn văn nêu lợi ích phản hồi nhanh của AI đồng thời khẳng định AI không thể thay thế sự dẫn dắt của giáo viên, tư duy phản biện và làm việc nhóm.' },
        { tp: 'Reading — Green Urban Living', q: 'Read the short passage: "Many cities are expanding bicycle lanes and rooftop gardens to lower summer temperatures and cut air pollution. Citizens who commute by bike at least three times a week report lower stress levels and better fitness."', s: [['Expanding rooftop gardens helps reduce urban heat in summer.', true], ['Cycling to work is associated with higher stress among residents.', false], ['Bicycle lanes contribute to reducing air pollution in cities.', true], ['Regular bike commuters tend to experience improved physical fitness.', true]], e: 'Bài đọc chỉ rõ người đi xe đạp báo cáo mức căng thẳng THẤP hơn (lower stress) và thể lực tốt hơn; vườn mái và làn xe đạp giúp hạ nhiệt và giảm ô nhiễm.' },
        { tp: 'Notice / Leaflet Reading', q: 'Read the school notice: "Green Campus Day takes place this Saturday from 7:30 AM to 11:00 AM. Volunteers should bring reusable water bottles. Gloves and recycling bags will be provided free at the main gate."', s: [['The event is scheduled for Saturday morning.', true], ['Volunteers have to buy their own gloves at the main gate.', false], ['Participants are encouraged to bring reusable water bottles.', true], ['The activity lasts for three and a half hours.', true]], e: 'Thông báo ghi găng tay và túi phân loại được phát MIỄN PHÍ (provided free) tại cổng chính; thời gian từ 7:30 đến 11:00 là 3 tiếng rưỡi.' }
      ],
      short: [
        { tp: 'Word Formation', q: 'Give the correct noun form of the verb "PROTECT" to complete the sentence: "Environmental ______ is everyone\'s responsibility."', a: 'protection', acc: ['protection', 'Protection'], e: 'Sau tính từ "Environmental" cần danh từ → "protection" (sự bảo vệ môi trường).' },
        { tp: 'Grammar — Irregular Verb', q: 'Write the past participle (V3) form of the verb "WRITE" to complete: "This novel was ______ in 2024."', a: 'written', acc: ['written', 'Written'], e: 'Quá khứ phân từ (V3) của "write" là "written" (write – wrote – written).' },
        { tp: 'Word Formation', q: 'Give the correct noun form of "DEVELOP" to complete: "Sustainable ______ requires balancing economy and nature."', a: 'development', acc: ['development', 'Development'], e: 'Cụm từ chuẩn "Sustainable development" = sự phát triển bền vững.' },
        { tp: 'Preposition Cloze', q: 'Fill in ONE preposition: "She is very good ______ solving complex geometry problems."', a: 'at', acc: ['at', 'At'], e: 'Cấu trúc "be good at + V-ing/N" = giỏi về việc gì.' }
      ]
    },
    literature: {
      mcq: [
        { tp: 'Biện pháp tu từ', q: 'Trong câu thơ "Mặt trời của bắp thì nằm trên đồi / Mặt trời của mẹ, em nằm trên lưng" (Nguyễn Khoa Điềm), hình ảnh "Mặt trời của mẹ" sử dụng biện pháp tu từ nào?', o: ['Ẩn dụ', 'Hoán dụ', 'Nói giảm nói tránh', 'Đảo ngữ'], a: 0, e: '"Mặt trời của mẹ" là ẩn dụ chỉ em bé — nguồn sáng, niềm tin và hy vọng sưởi ấm cuộc đời người mẹ.' },
        { tp: 'Thể loại văn học', q: 'Đặc trưng nổi bật nhất của thể loại kịch (đặc biệt là bi kịch) là gì?', o: ['Xung đột kịch căng thẳng thể hiện qua đối thoại và hành động nhân vật', 'Miêu tả thiên nhiên thuần túy không có nhân vật', 'Sử dụng vần điệu lục bát xuyên suốt', 'Liệt kê số liệu thống kê khoa học'], a: 0, e: 'Xung đột kịch và lời thoại trực tiếp giữa các nhân vật là linh hồn tạo nên hành động và giá trị tư tưởng của tác phẩm kịch.' },
        { tp: 'Phong cách ngôn ngữ', q: 'Văn bản trình bày hệ thống luận điểm, lí lẽ và bằng chứng nhằm thuyết phục người đọc về một vấn đề xã hội thuộc loại văn bản nào?', o: ['Văn bản nghị luận', 'Văn bản hành chính', 'Thơ trữ tình', 'Truyện truyền kì'], a: 0, e: 'Văn bản nghị luận lấy luận điểm, lí lẽ sắc bén và dẫn chứng xác thực làm nòng cốt để thuyết phục người đọc.' },
        { tp: 'Biện pháp tu từ', q: 'Biện pháp lấy bộ phận để gọi toàn thể (ví dụ: "Áo nâu liền với áo xanh") được gọi là', o: ['Hoán dụ', 'So sánh', 'Nhân hóa', 'Điệp thanh'], a: 0, e: 'Hoán dụ dựa trên quan hệ gần gũi thực tế (dấu hiệu trang phục chỉ tầng lớp nông dân và công nhân).' },
        { tp: 'Tác giả - Tác phẩm', q: 'Tác phẩm "Tuyên ngôn Độc lập" (2/9/1945) do Chủ tịch Hồ Chí Minh soạn thảo mở đầu bằng việc trích dẫn hai bản tuyên ngôn nổi tiếng của hai quốc gia nào?', o: ['Mỹ (1776) và Pháp (1791)', 'Anh và Nga', 'Trung Quốc và Nhật Bản', 'Đức và Tây Ban Nha'], a: 0, e: 'Bác Hồ trích dẫn Tuyên ngôn Độc lập 1776 của Mỹ và Tuyên ngôn Nhân quyền và Dân quyền 1791 của Cách mạng Pháp để khẳng định quyền bình đẳng, tự do không ai chối cãi được của dân tộc Việt Nam.' },
        { tp: 'Ngữ văn 12 - Truyện', q: 'Điểm nhìn trần thuật ngôi thứ ba toàn tri có đặc điểm nào sau đây?', o: ['Người kể chuyện đứng ngoài câu chuyện, biết rõ hành động và suy nghĩ nội tâm của nhiều nhân vật', 'Người kể chuyện xưng "tôi" và trực tiếp tham gia mọi sự việc', 'Chỉ ghi lại nguyên văn lời thoại mà không miêu tả tâm lí', 'Chỉ xuất hiện trong thơ Đường luật'], a: 0, e: 'Ngôi kể thứ ba toàn tri giúp người kể bao quát không gian, thời gian và thâm nhập sâu vào diễn biến tâm lí của nhiều nhân vật.' },
        { tp: 'Thơ hiện đại', q: 'Yếu tố "nhân vật trữ tình" trong thơ là', o: ['Hình tượng người trực tiếp bộc lộ cảm xúc, suy tư trong bài thơ', 'Nhân vật phản diện trong truyện cổ tích', 'Tên nhà xuất bản in ấn bài thơ', 'Người đọc bình luận tác phẩm'], a: 0, e: 'Nhân vật trữ tình (chủ thể trữ tình) là người phát ngôn cảm xúc, tâm trạng trong bài thơ (có thể xuất hiện trực tiếp hoặc ẩn danh).' },
        { tp: 'Thể thơ tiếng Việt', q: 'Thể thơ tự do có đặc điểm nổi bật là', o: ['Không bị ràng buộc cố định về số tiếng mỗi dòng, số dòng mỗi khổ và cách gieo vần', 'Mỗi bài bắt buộc có đúng 8 dòng, mỗi dòng 7 tiếng', 'Luôn xen kẽ dòng 6 tiếng và dòng 8 tiếng', 'Chỉ sử dụng toàn bộ thanh bằng'], a: 0, e: 'Thơ tự do phóng khoáng về số chữ, nhịp điệu và cách hiệp vần để diễn tả linh hoạt mạch cảm xúc hiện đại.' },
        { tp: 'Liên kết văn bản', q: 'Phép liên kết dùng các từ như "Tuy nhiên", "Do đó", "Mặt khác" để kết nối các câu trong đoạn văn gọi là', o: ['Phép nối', 'Phép lặp', 'Phép thế', 'Phép liên tưởng'], a: 0, e: 'Phép nối sử dụng quan hệ từ hoặc từ ngữ chuyển tiếp để thể hiện quan hệ logic giữa các câu, các đoạn.' },
        { tp: 'Ký văn học', q: 'Thể loại phóng sự và hồi ký có điểm chung cốt lõi nào?', o: ['Đề cao tính xác thực của sự kiện, con người gắn với trải nghiệm thực tế', 'Hoàn toàn hư cấu thế giới thần tiên', 'Chỉ viết bằng thơ song thất lục bát', 'Không có yếu tố tự sự'], a: 0, e: 'Tính xác thực, ghi chép người thật việc thật kết hợp góc nhìn thẩm mĩ là cốt lõi của các thể loại ký.' },
        { tp: 'Tiếng Việt thực hành', q: 'Lỗi diễn đạt trong câu "Qua tác phẩm đã cho thấy tấm lòng nhân ái của tác giả" là lỗi gì?', o: ['Thiếu chủ ngữ do dùng thừa quan hệ từ "Qua"', 'Sai chính tả', 'Dùng sai dấu hỏi chấm', 'Lặp từ quá nhiều'], a: 0, e: 'Cụm "Qua tác phẩm" biến thành trạng ngữ nên câu thiếu chủ ngữ; sửa bằng cách bỏ "Qua" hoặc thêm chủ ngữ ("Qua tác phẩm, tác giả đã cho thấy...").' },
        { tp: 'Văn học trung đại', q: 'Giá trị nhân đạo trong văn học trung đại Việt Nam thể hiện rõ nhất ở nội dung nào?', o: ['Cảm thương số phận bất hạnh, trân trọng vẻ đẹp phẩm chất và khát vọng hạnh phúc của con người', 'Chỉ ca ngợi cảnh đẹp núi sông thuần túy', 'Tập trung mô tả kỹ thuật sản xuất công nghiệp', 'Khuyến khích sống ích kỉ cá nhân'], a: 0, e: 'Chủ nghĩa nhân đạo luôn hướng về con người: đồng cảm nỗi đau, ngợi ca vẻ đẹp và lên tiếng bênh vực quyền sống, quyền hạnh phúc.' },
        { tp: 'Biện pháp tu từ', q: 'Việc lặp đi lặp lại một từ ngữ hoặc cấu trúc câu ở đầu nhiều dòng thơ nhằm nhấn mạnh cảm xúc và tạo nhịp điệu gọi là', o: ['Điệp ngữ / Điệp cấu trúc', 'Chơi chữ', 'Nói quá', 'Tương phản'], a: 0, e: 'Điệp ngữ/điệp cấu trúc tạo âm hưởng vang vọng, nhấn mạnh hình ảnh hoặc tư tưởng trung tâm.' },
        { tp: 'Đọc hiểu Nghị luận', q: 'Thao tác lập luận dùng những lí lẽ phân chia đối tượng thành nhiều khía cạnh để làm rõ bản chất vấn đề gọi là', o: ['Phân tích', 'Bác bỏ', 'So sánh', 'Bình luận'], a: 0, e: 'Phân tích là chia tách đối tượng thành các phương diện, bộ phận để xem xét sâu sắc từng yếu tố và mối liên hệ giữa chúng.' }
      ],
      tf: [
        { tp: 'Đọc hiểu Thơ trữ tình', q: 'Đọc đoạn thơ: "Đất nước bắt đầu với miếng trầu bây giờ bà ăn / Đất nước lớn lên khi dân mình biết trồng tre mà đánh giặc." (Nguyễn Khoa Điềm)', s: [['Đoạn thơ sử dụng thể thơ tự do giàu chất suy tưởng.', true], ['Hình ảnh "miếng trầu", "trồng tre đánh giặc" gợi nhắc truyền thống văn hóa và lịch sử giữ nước.', true], ['Biện pháp điệp ngữ "Đất nước" góp phần nhấn mạnh sự gần gũi, thiêng liêng của quê hương.', true], ['Đoạn thơ khẳng định Đất nước chỉ gắn với các triều đại phong kiến xa hoa, tách rời nhân dân.', false]], e: 'Nguyễn Khoa Điềm cảm nhận Đất nước từ những gì bình dị, thân thuộc nhất trong đời sống và truyền thống đấu tranh của nhân dân.' },
        { tp: 'Đọc hiểu Nghị luận xã hội', q: 'Đọc đoạn trích: "Thất bại không phải là điểm kết thúc của hành trình trưởng thành, mà là tấm gương phản chiếu những lỗ hổng cần hoàn thiện. Người dám nhìn thẳng vào sai lầm sẽ rút ngắn đáng kể con đường chạm tới thành công."', s: [['Phương thức biểu đạt chính của đoạn trích là nghị luận.', true], ['Hình ảnh "tấm gương phản chiếu" là biện pháp so sánh kết hợp ẩn dụ sinh động.', true], ['Tác giả khuyên người trẻ nên sợ hãi và né tránh mọi thử thách để không bao giờ thất bại.', false], ['Thông điệp cốt lõi là thái độ cầu thị, biết học hỏi từ sai lầm để tiến bộ.', true]], e: 'Đoạn trích dùng lập luận chặt chẽ nhằm cổ vũ tinh thần đối diện sai lầm, coi thất bại là bài học trưởng thành.' },
        { tp: 'Văn bản Thông tin & Ký', q: 'Xét đặc trưng của văn bản thông tin tổng hợp trong chương trình Ngữ văn GDPT 2018:', s: [['Văn bản thông tin thường kết hợp kênh chữ với phương tiện phi ngôn ngữ như biểu đồ, hình ảnh, infographic.', true], ['Mục đích chính của văn bản thông tin là cung cấp tri thức khách quan, chính xác cho người đọc.', true], ['Văn bản thông tin bắt buộc phải sử dụng cốt truyện hư cấu kì ảo.', false], ['Nhan đề, sa-pô (sapo) và đề mục giúp người đọc nắm bắt nhanh cấu trúc thông tin.', true]], e: 'Văn bản thông tin đề cao tính khách quan, mạch lạc (nhan đề, sapo, đề mục, biểu đồ) thay vì hư cấu kì ảo.' }
      ],
      short: [
        { tp: 'Tác giả văn học Việt Nam', q: 'Ai là tác giả của kiệt tác "Truyện Kiều" (viết bằng chữ Nôm theo thể lục bát)?', a: 'Nguyễn Du', acc: ['Nguyễn Du', 'nguyen du', 'Đại thi hào Nguyễn Du'], e: 'Đại thi hào Nguyễn Du (1765–1820) là tác giả kiệt tác "Truyện Kiều" gồm 3254 câu thơ lục bát.' },
        { tp: 'Biện pháp tu từ', q: 'Gọi tên biện pháp tu từ trong câu: "Cây dừa sải tay đón gió biển khơi".', a: 'Nhân hóa', acc: ['Nhân hóa', 'nhan hoa', 'Nhân hoá'], e: 'Dùng hành động của con người ("sải tay đón") cho sự vật ("cây dừa") là biện pháp nhân hóa.' },
        { tp: 'Lịch sử văn học', q: 'Bản "Tuyên ngôn Độc lập" khai sinh nước Việt Nam Dân chủ Cộng hòa được đọc vào ngày 2 tháng 9 năm nào?', a: '1945', acc: ['1945'], e: 'Ngày 2/9/1945 tại Quảng trường Ba Đình (Hà Nội), Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập.' }
      ]
    },
    history: {
      mcq: [
        { tp: 'Trật tự thế giới sau 1945', q: 'Hội nghị Ianta (tháng 2/1945) có sự tham dự của nguyên thủ ba cường quốc nào?', o: ['Liên Xô, Mỹ, Anh', 'Pháp, Đức, Ý', 'Mỹ, Trung Quốc, Nhật Bản', 'Liên Xô, Pháp, Anh'], a: 0, e: 'Hội nghị Ianta (2/1945) gồm Xtalin (Liên Xô), Rudơven (Mỹ) và Sớcsin (Anh) đặt nền móng cho trật tự hai cực Ianta.' },
        { tp: 'Liên hợp quốc', q: 'Tổ chức Liên hợp quốc chính thức được thành lập vào năm 1945 với mục tiêu hàng đầu là', o: ['Duy trì hòa bình và an ninh quốc tế', 'Thành lập liên minh quân sự chống châu Âu', 'Thống nhất tiền tệ toàn cầu', 'Phân chia lại thuộc địa'], a: 0, e: 'Mục tiêu bao trùm của Liên hợp quốc là duy trì hòa bình, an ninh quốc tế và thúc đẩy hợp tác hữu nghị giữa các quốc gia.' },
        { tp: 'ASEAN', q: 'Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập ngày 8/8/1967 tại thủ đô nào?', o: ['Băng Cốc (Thái Lan)', 'Hà Nội (Việt Nam)', 'Gia-các-ta (Indonesia)', 'Ma-ni-la (Philippines)'], a: 0, e: 'Ngày 8/8/1967, 5 nước (Indonesia, Malaysia, Philippines, Singapore, Thái Lan) kí Tuyên bố Băng Cốc thành lập ASEAN.' },
        { tp: 'ASEAN', q: 'Việt Nam chính thức trở thành thành viên thứ 7 của tổ chức ASEAN vào năm nào?', o: ['1995', '1986', '1991', '2007'], a: 0, e: 'Ngày 28/7/1995, Việt Nam chính thức gia nhập ASEAN, mở ra giai đoạn phát triển mới cho tiến trình liên kết khu vực.' },
        { tp: 'Cách mạng tháng Tám 1945', q: 'Thắng lợi của Cách mạng tháng Tám năm 1945 ở Việt Nam đã lập ra nhà nước nào?', o: ['Nước Việt Nam Dân chủ Cộng hòa', 'Nước Cộng hòa Xã hội chủ nghĩa Việt Nam', 'Nhà nước phong kiến độc lập', 'Liên bang Đông Dương'], a: 0, e: 'Ngày 2/9/1945, nước Việt Nam Dân chủ Cộng hòa ra đời — nhà nước công nông đầu tiên ở Đông Nam Á.' },
        { tp: 'Kháng chiến chống Pháp', q: 'Chiến thắng nào năm 1954 đã đập tan hoàn toàn kế hoạch Nava và buộc thực dân Pháp kí Hiệp định Giơnevơ?', o: ['Chiến thắng Điện Biên Phủ', 'Chiến dịch Việt Bắc thu - đông 1947', 'Chiến dịch Biên giới 1950', 'Chiến dịch Hòa Bình'], a: 0, e: 'Chiến thắng lịch sử Điện Biên Phủ (7/5/1954) "lừng lẫy năm châu, chấn động địa cầu" quyết định thắng lợi tại Hội nghị Giơnevơ.' },
        { tp: 'Kháng chiến chống Mỹ', q: 'Chiến dịch lịch sử kết thúc thắng lợi cuộc kháng chiến chống Mỹ, giải phóng hoàn toàn miền Nam ngày 30/4/1975 là', o: ['Chiến dịch Hồ Chí Minh', 'Chiến dịch Tây Nguyên', 'Chiến dịch Huế - Đà Nẵng', 'Chiến dịch Đường 9 - Nam Lào'], a: 0, e: 'Chiến dịch Hồ Chí Minh (26–30/4/1975) giải phóng Sài Gòn – Gia Định, hoàn thành sự nghiệp thống nhất đất nước.' },
        { tp: 'Kháng chiến chống Mỹ', q: 'Thắng lợi "Điện Biên Phủ trên không" tháng 12/1972 của quân dân miền Bắc đã buộc Mỹ phải', o: ['Kí Hiệp định Pari về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam', 'Rút khỏi Hội nghị Ianta', 'Thừa nhận nền độc lập của Pháp', 'Bắt đầu kế hoạch Mác-san'], a: 0, e: 'Sau 12 ngày đêm đánh bại cuộc tập kích B-52 của Mỹ ở Hà Nội và Hải Phòng (12/1972), Mỹ phải kí Hiệp định Pari ngày 27/1/1973.' },
        { tp: 'Công cuộc Đổi mới', q: 'Đường lối Đổi mới đất nước ở Việt Nam được đề ra đầu tiên tại Đại hội đại biểu toàn quốc lần thứ mấy của Đảng (12/1986)?', o: ['Đại hội VI', 'Đại hội IV', 'Đại hội V', 'Đại hội VII'], a: 0, e: 'Đại hội VI (12/1986) mở đầu công cuộc Đổi mới toàn diện, trọng tâm là đổi mới kinh tế, chuyển sang nền kinh tế nhiều thành phần.' },
        { tp: 'Chiến tranh lạnh', q: 'Sự kiện nào đánh dấu trật tự hai cực Ianta chính thức sụp đổ hoàn toàn?', o: ['Liên Xô tan rã năm 1991', 'Bức tường Berlin được xây dựng năm 1961', 'Chiến tranh Triều Tiên bùng nổ 1950', 'Thành lập khối NATO năm 1949'], a: 0, e: 'Sự tan rã của Liên Xô (12/1991) chấm dứt hoàn toàn sự tồn tại của cực Xô viết và trật tự hai cực Ianta.' },
        { tp: 'Cộng đồng ASEAN', q: 'Cộng đồng ASEAN chính thức thành lập cuối năm 2015 dựa trên ba trụ cột chính là', o: ['Chính trị - An ninh, Kinh tế, Văn hóa - Xã hội', 'Quân sự, Năng lượng, Hàng không', 'Nông nghiệp, Công nghiệp, Du lịch', 'Giáo dục, Y tế, Thể thao'], a: 0, e: 'Ba trụ cột của Cộng đồng ASEAN là APSC (Chính trị - An ninh), AEC (Kinh tế) và ASCC (Văn hóa - Xã hội).' },
        { tp: 'Đối ngoại Việt Nam', q: 'Phương châm đối ngoại nhất quán của Việt Nam trong thời kỳ Đổi mới và hội nhập quốc tế là', o: ['Độc lập, tự chủ, hòa bình, hợp tác và phát triển; đa phương hóa, đa dạng hóa', 'Đóng cửa không giao thương với nước ngoài', 'Chỉ liên minh quân sự với một cường quốc duy nhất', 'Phụ thuộc hoàn toàn vào viện trợ'], a: 0, e: 'Việt Nam kiên trì đường lối đối ngoại độc lập, tự chủ, đa phương hóa, đa dạng hóa, là bạn và đối tác tin cậy của cộng đồng quốc tế.' },
        { tp: 'Chủ tịch Hồ Chí Minh', q: 'Tháng 7/1920, Nguyễn Ái Quốc đọc Sơ thảo lần thứ nhất những luận cương về vấn đề dân tộc và thuộc địa của Lênin và từ đó xác định con đường cứu nước theo', o: ['Cách mạng vô sản', 'Cách mạng tư sản kiểu cũ', 'Phong trào Cần Vương phong kiến', 'Cải lương ôn hòa'], a: 0, e: 'Luận cương của Lênin đã giúp Nguyễn Ái Quốc tìm thấy con đường cứu nước đúng đắn cho dân tộc Việt Nam: con đường cách mạng vô sản.' },
        { tp: 'Biển đảo Việt Nam', q: 'Hai quần đảo xa bờ thuộc chủ quyền thiêng liêng của Việt Nam trên Biển Đông là', o: ['Hoàng Sa và Trường Sa', 'Phú Quốc và Côn Đảo', 'Cát Bà và Bạch Long Vĩ', 'Lý Sơn và Phú Quý'], a: 0, e: 'Việt Nam có đầy đủ căn cứ lịch sử và cơ sở pháp lí khẳng định chủ quyền đối với hai quần đảo Hoàng Sa và Trường Sa.' }
      ],
      tf: [
        { tp: 'Cách mạng tháng Tám 1945', q: 'Xét bối cảnh và ý nghĩa lịch sử của Cách mạng tháng Tám năm 1945:', s: [['Thời cơ "ngàn năm có một" xuất hiện khi phát xít Nhật đầu hàng Đồng minh (8/1945) và quân Đồng minh chưa kịp vào Đông Dương.', true], ['Cách mạng tháng Tám thắng lợi nhanh chóng, ít đổ máu trong vòng khoảng 15 ngày trên cả nước.', true], ['Thắng lợi này đã xóa bỏ hoàn toàn chế độ thực dân và phong kiến ở Việt Nam.', true], ['Cách mạng tháng Tám là cuộc nổi dậy tự phát, không có sự lãnh đạo của Đảng và Mặt trận Việt Minh.', false]], e: 'Sự lãnh đạo sáng suốt, chuẩn bị chu đáo suốt 15 năm của Đảng Cộng sản Đông Dương và Mặt trận Việt Minh là nhân tố quyết định thắng lợi.' },
        { tp: 'Công cuộc Đổi mới từ 1986', q: 'Xét nội dung và thành tựu của công cuộc Đổi mới đất nước từ năm 1986 đến nay:', s: [['Đổi mới được tiến hành toàn diện và đồng bộ, trong đó lấy đổi mới kinh tế làm trọng tâm.', true], ['Chuyển từ cơ chế kế hoạch hóa tập trung bao cấp sang kinh tế thị trường định hướng xã hội chủ nghĩa.', true], ['Việt Nam giữ vững định hướng xã hội chủ nghĩa và tăng cường mở rộng quan hệ đối ngoại, hội nhập quốc tế.', true], ['Từ năm 1986, Việt Nam xóa bỏ hoàn toàn vai trò quản lí của Nhà nước đối với nền kinh tế.', false]], e: 'Kinh tế thị trường định hướng XHCN luôn có sự quản lí, điều tiết vĩ mô của Nhà nước pháp quyền XHCN.' },
        { tp: 'Trật tự thế giới đa cực', q: 'Xét xu thế phát triển của thế giới sau khi Chiến tranh lạnh kết thúc (1991):', s: [['Xu thế hòa bình, ổn định, hợp tác và phát triển trở thành dòng chảy chủ đạo.', true], ['Trật tự thế giới chuyển dịch dần theo hướng đa cực với sự vươn lên của nhiều trung tâm kinh tế - chính trị.', true], ['Cách mạng khoa học - công nghệ và toàn cầu hóa diễn ra mạnh mẽ.', true], ['Mọi quốc gia trên thế giới đều quay trở lại chạy đua vũ trang hạt nhân như thời Chiến tranh lạnh làm ưu tiên duy nhất.', false]], e: 'Sau 1991, các nước đều điều chỉnh chiến lược lấy phát triển kinh tế làm trọng điểm trong xu thế đa cực và toàn cầu hóa.' }
      ],
      short: [
        { tp: 'Mốc lịch sử hiện đại', q: 'Chiến thắng lịch sử Điện Biên Phủ kết thúc thắng lợi vào năm nào?', a: '1954', acc: ['1954'], e: 'Ngày 7/5/1954, Tập đoàn cứ điểm Điện Biên Phủ bị tiêu diệt hoàn toàn.' },
        { tp: 'Mốc lịch sử hiện đại', q: 'Đại hội VI của Đảng khởi xướng công cuộc Đổi mới diễn ra vào năm nào?', a: '1986', acc: ['1986'], e: 'Tháng 12/1986, Đại hội đại biểu toàn quốc lần thứ VI chính thức khởi xướng đường lối Đổi mới.' },
        { tp: 'Mốc lịch sử hiện đại', q: 'Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập vào năm nào?', a: '1967', acc: ['1967'], e: 'ASEAN được thành lập ngày 8/8/1967 tại Băng Cốc (Thái Lan).' }
      ]
    },
    geography: {
      mcq: [
        { tp: 'Vị trí địa lí Việt Nam', q: 'Nước ta nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc nên khí hậu mang tính chất nổi bật là', o: ['Nhiệt đới ẩm gió mùa', 'Ôn đới hải dương', 'Cận cực lạnh giá', 'Hoang mạc khô hạn'], a: 0, e: 'Vị trí nội chí tuyến kết hợp tiếp giáp Biển Đông rộng lớn và hoàn lưu gió mùa tạo nên khí hậu nhiệt đới ẩm gió mùa.' },
        { tp: 'Địa hình Việt Nam', q: 'Đặc điểm cơ bản của địa hình nước ta là đồi núi chiếm khoảng', o: ['3/4 diện tích lãnh thổ, chủ yếu là đồi núi thấp', '1/4 diện tích lãnh thổ', 'Toàn bộ là núi cao trên 2000m', '90% là đồng bằng châu thổ'], a: 0, e: 'Đồi núi chiếm 3/4 diện tích nhưng đồi núi thấp dưới 1000m chiếm tới 85%, đồng bằng chiếm 1/4 diện tích.' },
        { tp: 'Khí hậu Việt Nam', q: 'Gió mùa Đông Bắc hoạt động mạnh vào mùa đông gây ra thời tiết lạnh khô đầu mùa và lạnh ẩm cuối mùa chủ yếu ở khu vực nào?', o: ['Miền Bắc (từ dãy Bạch Mã trở ra)', 'Đồng bằng sông Cửu Long', 'Tây Nguyên', 'Đông Nam Bộ'], a: 0, e: 'Gió mùa Đông Bắc bị suy yếu và chặn lại phần lớn ở dãy Bạch Mã (16°B), tạo nên mùa đông lạnh rõ rệt ở miền Bắc.' },
        { tp: 'Dân cư - Đô thị hóa', q: 'Vùng kinh tế có mật độ dân số cao nhất cả nước ta hiện nay là', o: ['Đồng bằng sông Hồng', 'Tây Nguyên', 'Trung du và miền núi Bắc Bộ', 'Bắc Trung Bộ'], a: 0, e: 'Đồng bằng sông Hồng có lịch sử khai thác lâu đời, kinh tế phát triển nên mật độ dân số cao nhất Việt Nam (>1000 người/km²).' },
        { tp: 'Nông nghiệp', q: 'Vùng trọng điểm sản xuất lương thực (lúa gạo) và nuôi trồng thủy sản lớn nhất Việt Nam là', o: ['Đồng bằng sông Cửu Long', 'Tây Nguyên', 'Duyên hải Nam Trung Bộ', 'Trung du và miền núi Bắc Bộ'], a: 0, e: 'ĐBSCL đóng góp hơn 50% sản lượng lúa và trên 90% lượng gạo xuất khẩu, đồng thời dẫn đầu về nuôi trồng thủy sản.' },
        { tp: 'Cây công nghiệp', q: 'Tây Nguyên là vùng chuyên canh lớn nhất cả nước về cây công nghiệp lâu năm nào sau đây?', o: ['Cà phê', 'Cao su (đứng đầu tuyệt đối là Đông Nam Bộ)', 'Chè xanh trung du', 'Đay và cói'], a: 0, e: 'Đất badan màu mỡ rộng lớn cùng khí hậu cận xích đạo có mùa khô rõ rệt giúp Tây Nguyên dẫn đầu cả nước về diện tích và sản lượng cà phê.' },
        { tp: 'Công nghiệp năng lượng', q: 'Vùng nào có tiềm năng thủy điện lớn nhất nước ta (với các nhà máy Sơn La, Hòa Bình, Lai Châu)?', o: ['Trung du và miền núi Bắc Bộ', 'Đồng bằng sông Cửu Long', 'Đồng bằng sông Hồng', 'Đông Nam Bộ'], a: 0, e: 'Hệ thống sông Hồng – sông Đà chảy qua địa hình núi cao dốc lớn giúp Trung du và miền núi Bắc Bộ có trữ năng thủy điện lớn nhất.' },
        { tp: 'Giao thông vận tải', q: 'Tuyến đường bộ huyết mạch xuyên suốt chiều dài đất nước nối từ Lạng Sơn đến Cà Mau là', o: ['Quốc lộ 1 (QL1A)', 'Quốc lộ 5', 'Quốc lộ 14', 'Quốc lộ 51'], a: 0, e: 'Quốc lộ 1 là trục giao thông xương sống xuyên Việt kết nối hầu hết các vùng kinh tế và trung tâm lớn.' },
        { tp: 'Đông Nam Bộ', q: 'Vùng kinh tế dẫn đầu cả nước về quy mô GRDP, giá trị sản xuất công nghiệp và thu hút vốn FDI là', o: ['Đông Nam Bộ', 'Tây Nguyên', 'Bắc Trung Bộ', 'Trung du và miền núi Bắc Bộ'], a: 0, e: 'Đông Nam Bộ (trung tâm là TP.HCM, Bình Dương, Đồng Nai, Bà Rịa – Vũng Tàu) là đầu tàu kinh tế công nghiệp - dịch vụ lớn nhất nước ta.' },
        { tp: 'Biển đảo Việt Nam', q: 'Đường bờ biển nước ta kéo dài khoảng 3260 km từ tỉnh Quảng Ninh đến tỉnh nào?', o: ['Kiên Giang', 'Cà Mau', 'Bình Thuận', 'Khánh Hòa'], a: 0, e: 'Đường bờ biển dài 3260 km chạy từ Móng Cái (Quảng Ninh) đến Hà Tiên (Kiên Giang).' },
        { tp: 'Công nghiệp khai khoáng', q: 'Bể than đá (antraxit) lớn nhất và có chất lượng tốt nhất nước ta tập trung ở tỉnh nào?', o: ['Quảng Ninh', 'Lâm Đồng', 'Cần Thơ', 'An Giang'], a: 0, e: 'Quảng Ninh chiếm hơn 90% trữ lượng than đá của cả nước.' },
        { tp: 'Chuyển dịch cơ cấu kinh tế', q: 'Xu hướng chuyển dịch cơ cấu GDP theo ngành kinh tế ở Việt Nam hiện nay là', o: ['Giảm tỉ trọng nông - lâm - thủy sản, tăng tỉ trọng công nghiệp - xây dựng và dịch vụ', 'Tăng mạnh tỉ trọng nông nghiệp thuần túy', 'Giảm mạnh tỉ trọng công nghiệp và dịch vụ', 'Giữ nguyên cơ cấu không thay đổi'], a: 0, e: 'Quá trình công nghiệp hóa – hiện đại hóa làm giảm tỉ trọng khu vực I và tăng nhanh tỉ trọng khu vực II và III.' }
      ],
      tf: [
        { tp: 'Thiên nhiên phân hóa đa dạng', q: 'Xét sự phân hóa thiên nhiên Việt Nam theo chiều Bắc – Nam và theo độ cao:', s: [['Phần lãnh thổ phía Bắc (từ dãy Bạch Mã trở ra) có khí hậu nhiệt đới ẩm gió mùa có mùa đông lạnh.', true], ['Phần lãnh thổ phía Nam có khí hậu cận xích đạo gió mùa với hai mùa mưa và khô rõ rệt.', true], ['Thiên nhiên nước ta phân hóa thành 3 đai cao: nhiệt đới gió mùa, cận nhiệt đới gió mùa trên núi và ôn đới gió mùa trên núi.', true], ['Đai ôn đới gió mùa trên núi (trên 2600m) xuất hiện phổ biến ở khắp Đồng bằng sông Cửu Long.', false]], e: 'Đai ôn đới gió mùa trên núi (>2600m) chỉ xuất hiện ở vùng núi cao Hoàng Liên Sơn (miền Bắc).' },
        { tp: 'Đồng bằng sông Cửu Long', q: 'Xét thế mạnh và thách thức của vùng Đồng bằng sông Cửu Long hiện nay:', s: [['Là vùng sản xuất lúa gạo, cây ăn quả và thủy sản lớn nhất Việt Nam.', true], ['Biến đổi khí hậu, nước biển dâng và xâm nhập mặn mùa khô là thách thức lớn hàng đầu.', true], ['Giải pháp thích ứng bền vững là chuyển đổi cơ cấu cây trồng vật nuôi chịu mặn và quản lí nguồn nước hợp lí.', true], ['ĐBSCL là vùng có địa hình núi cao hiểm trở nhất cả nước.', false]], e: 'ĐBSCL có địa hình đồng bằng châu thổ thấp và bằng phẳng, đối mặt rõ rệt với xâm nhập mặn mùa khô.' },
        { tp: 'Kinh tế Biển đảo', q: 'Xét ý nghĩa chiến lược của Biển Đông và phát triển tổng hợp kinh tế biển Việt Nam:', s: [['Việt Nam có đường bờ biển dài 3260 km với nhiều vũng vịnh sâu thuận lợi xây dựng cảng biển.', true], ['Phát triển tổng hợp kinh tế biển gồm: du lịch biển, giao thông vận tải biển, khai thác khoáng sản và thủy sản.', true], ['Bảo vệ môi trường biển và chủ quyền quần đảo Hoàng Sa, Trường Sa là nhiệm vụ chiến lược lâu dài.', true], ['Hoạt động du lịch biển ở Việt Nam chỉ có thể tổ chức duy nhất trong tháng 1 hằng năm.', false]], e: 'Các tỉnh ven biển miền Trung và miền Nam có thể phát triển du lịch biển gần như quanh năm.' }
      ],
      short: []
    },
    ktpl: {
      mcq: [
        { tp: 'Tăng trưởng & Phát triển kinh tế', q: 'Chỉ tiêu phản ánh tổng giá trị bằng tiền của toàn bộ hàng hóa và dịch vụ cuối cùng sản xuất ra trên lãnh thổ một quốc gia trong một năm là', o: ['GDP (Tổng sản phẩm quốc nội)', 'CPI (Chỉ số giá tiêu dùng)', 'Tỉ lệ thất nghiệp', 'Lãi suất chiết khấu'], a: 0, e: 'GDP (Gross Domestic Product) đo lường quy mô sản xuất trên phạm vi lãnh thổ một quốc gia trong thời kì nhất định (thường là 1 năm).' },
        { tp: 'Phát triển kinh tế', q: 'Phát triển kinh tế khác với tăng trưởng kinh tế ở chỗ phát triển kinh tế còn bao hàm thêm yếu tố nào?', o: ['Chuyển dịch cơ cấu kinh tế hợp lí và tiến bộ, công bằng xã hội', 'Chỉ tăng sản lượng khai thác tài nguyên thô', 'Bỏ qua chỉ số phát triển con người HDI', 'Giảm mọi chi tiêu cho giáo dục và y tế'], a: 0, e: 'Phát triển kinh tế = Tăng trưởng kinh tế + Chuyển dịch cơ cấu kinh tế tích cực + Tiến bộ xã hội (HDI, giảm nghèo, bảo vệ môi trường).' },
        { tp: 'Hội nhập kinh tế quốc tế', q: 'Việc Việt Nam kí kết Hiệp định CPTPP và EVFTA là biểu hiện của hình thức hội nhập kinh tế quốc tế nào?', o: ['Hội nhập khu vực và song phương/đa phương thông qua hiệp định thương mại tự do (FTA)', 'Độc quyền khép kín thị trường', 'Cấm xuất nhập khẩu hàng hóa', 'Kinh tế tự cung tự cấp'], a: 0, e: 'CPTPP và EVFTA là các Hiệp định Thương mại Tự do thế hệ mới mở rộng thị trường xuất khẩu và thu hút đầu tư.' },
        { tp: 'Bảo hiểm & An sinh xã hội', q: 'Loại hình bảo hiểm do Nhà nước tổ chức nhằm bảo vệ sức khỏe người dân, giảm gánh nặng chi phí khám chữa bệnh gọi là', o: ['Bảo hiểm y tế (BHYT)', 'Bảo hiểm cháy nổ kho hàng', 'Bảo hiểm thất nghiệp doanh nghiệp', 'Bảo hiểm hàng hải'], a: 0, e: 'Bảo hiểm y tế là chính sách an sinh trụ cột không vì mục đích lợi nhuận, giúp chia sẻ rủi ro chi phí chăm sóc sức khỏe.' },
        { tp: 'Lập kế hoạch kinh doanh', q: 'Bước đầu tiên quan trọng khi xây dựng một bản kế hoạch kinh doanh là', o: ['Xác định định hướng, ý tưởng kinh doanh và phân tích thị trường mục tiêu', 'Chi tiêu hết vốn vào trang trí mà không khảo sát khách hàng', 'Tránh lập dự toán tài chính', 'Bỏ qua phân tích rủi ro'], a: 0, e: 'Kế hoạch kinh doanh chuẩn bắt đầu từ ý tưởng, mục tiêu, nghiên cứu thị trường/khách hàng rồi mới lập kế hoạch sản xuất, marketing và tài chính.' },
        { tp: 'Trách nhiệm xã hội doanh nghiệp', q: 'Một công ty thực phẩm luôn nộp thuế đầy đủ, không xả thải trộm ra sông và đảm bảo an toàn lao động cho công nhân là thực hiện tốt trách nhiệm nào?', o: ['Trách nhiệm pháp lí và đạo đức của doanh nghiệp', 'Cạnh tranh không lành mạnh', 'Lạm dụng vị thế độc quyền', 'Trốn tránh nghĩa vụ thuế'], a: 0, e: 'Tuân thủ pháp luật (thuế, môi trường, an toàn lao động) là nền tảng bắt buộc của trách nhiệm xã hội doanh nghiệp (CSR).' },
        { tp: 'Quản lí thu chi gia đình', q: 'Trong quản lí tài chính cá nhân và gia đình, khoản tiền dự phòng khẩn cấp dùng để làm gì?', o: ['Ứng phó với rủi ro bất ngờ như ốm đau, mất việc mà không rơi vào nợ xấu', 'Chi tiêu mua sắm bốc đồng hằng ngày', 'Đầu tư toàn bộ vào trò chơi may rủi', 'Thay thế hoàn toàn thu nhập lao động'], a: 0, e: 'Quỹ dự phòng (thường bằng 3–6 tháng chi tiêu thiết yếu) bảo vệ sự ổn định tài chính gia đình khi gặp biến cố.' },
        { tp: 'Quyền & Nghĩa vụ công dân', q: 'Theo Hiến pháp 2013, nghĩa vụ đóng thuế của công dân và doanh nghiệp có ý nghĩa gì?', o: ['Tạo nguồn thu chủ yếu cho ngân sách nhà nước đầu tư hạ tầng, y tế, giáo dục và quốc phòng', 'Chỉ nhằm tăng giá hàng hóa', 'Là hoạt động tự nguyện không bắt buộc', 'Chỉ áp dụng cho công dân nước ngoài'], a: 0, e: 'Mọi công dân có nghĩa vụ nộp thuế theo luật định; thuế là nguồn lực thiết yếu duy trì bộ máy nhà nước và phúc lợi công cộng.' },
        { tp: 'Quyền sở hữu & Kinh doanh', q: 'Công dân có quyền tự do kinh doanh trong những ngành, nghề nào sau đây?', o: ['Những ngành, nghề mà pháp luật không cấm', 'Bất kì ngành nghề nào kể cả buôn bán chất cấm', 'Chỉ được phép làm nông nghiệp', 'Chỉ được phép kinh doanh khi có vốn nước ngoài'], a: 0, e: 'Hiến pháp 2013 quy định: "Mọi người có quyền tự do kinh doanh trong những ngành nghề mà pháp luật không cấm."' },
        { tp: 'Quyền tác giả & Sở hữu trí tuệ', q: 'Hành vi tự ý sao chép toàn bộ cuốn sách có bản quyền để in lậu bán thu lợi bất chính là vi phạm quyền nào?', o: ['Quyền sở hữu trí tuệ (quyền tác giả)', 'Quyền tự do cư trú', 'Quyền bầu cử', 'Quyền khiếu nại'], a: 0, e: 'In lậu, sao chép tác phẩm không xin phép chủ sở hữu xâm phạm trực tiếp quyền tác giả theo Luật Sở hữu trí tuệ.' },
        { tp: 'Pháp luật Quốc tế', q: 'Nguyên tắc cơ bản của pháp luật quốc tế yêu cầu các quốc gia giải quyết tranh chấp quốc tế bằng biện pháp nào?', o: ['Biện pháp hòa bình (đàm phán, trung gian, trọng tài, tòa án quốc tế)', 'Sử dụng vũ lực đe dọa xâm lược', 'Can thiệp công việc nội bộ nước khác', 'Đơn phương phủ nhận điều ước quốc tế'], a: 0, e: 'Hiến chương Liên hợp quốc quy định nguyên tắc giải quyết mọi tranh chấp quốc tế bằng biện pháp hòa bình, tôn trọng độc lập chủ quyền.' },
        { tp: 'An sinh xã hội', q: 'Chính sách hỗ trợ tín dụng ưu đãi, đào tạo nghề và tạo việc làm cho hộ nghèo thuộc nhóm chính sách nào của hệ thống an sinh xã hội?', o: ['Chính sách việc làm, thu nhập và giảm nghèo bền vững', 'Chính sách bảo hiểm vật chất xe cơ giới', 'Chính sách độc quyền thương mại', 'Chính sách thuế xuất khẩu'], a: 0, e: 'Hệ thống an sinh xã hội Việt Nam gồm 4 trụ cột: việc làm – giảm nghèo, bảo hiểm xã hội, trợ giúp xã hội và dịch vụ xã hội cơ bản.' }
      ],
      tf: [
        { tp: 'Tình huống Kinh doanh & Thuế', q: 'Tình huống: Anh Minh mở cửa hàng kinh doanh thiết bị học tập, đăng kí hộ kinh doanh hợp pháp, niêm yết giá công khai và kê khai nộp thuế đúng hạn. Tuy nhiên, đối thủ cạnh tranh tung tin giả bôi nhọ sản phẩm của anh trên mạng.', s: [['Anh Minh đã thực hiện đúng quyền tự do kinh doanh và nghĩa vụ nộp thuế theo pháp luật.', true], ['Việc niêm yết giá công khai bảo vệ quyền được thông tin của người tiêu dùng.', true], ['Hành vi tung tin giả bôi nhọ đối thủ là hành vi cạnh tranh không lành mạnh bị pháp luật nghiêm cấm.', true], ['Anh Minh không có quyền yêu cầu cơ quan chức năng xử lí hành vi tung tin giả trên mạng.', false]], e: 'Anh Minh hoàn toàn có quyền tố cáo/yêu cầu cơ quan chức năng xử lí hành vi cạnh tranh không lành mạnh và vu khống.' },
        { tp: 'Tình huống Bảo hiểm xã hội', q: 'Tình huống: Chị Hoa làm việc theo hợp đồng lao động dài hạn tại công ty may mặc và được tham gia đầy đủ BHXH, BHYT, BHTN. Khi chị sinh con, chị được hưởng chế độ nghỉ thai sản và trợ cấp từ quỹ BHXH.', s: [['Tham gia BHXH bắt buộc là quyền lợi và nghĩa vụ của người lao động có hợp đồng dài hạn và người sử dụng lao động.', true], ['Chế độ thai sản giúp người lao động bù đắp phần thu nhập bị giảm trong thời gian sinh con.', true], ['Người lao động tự do hoàn toàn không được phép tham gia bảo hiểm xã hội tự nguyện.', false], ['Bảo hiểm y tế giúp giảm chi phí khám chữa bệnh khi ốm đau, tai nạn.', true]], e: 'Người lao động tự do vẫn được Nhà nước khuyến khích tham gia BHXH tự nguyện để hưởng lương hưu và chế độ tử tuất.' },
        { tp: 'Tình huống Quyền sở hữu & Tiêu dùng', q: 'Tình huống: Bạn Nam mua một chiếc tai nghe chính hãng tại siêu thị điện máy có hóa đơn và phiếu bảo hành 12 tháng. Sau 2 tuần sử dụng, tai nghe bị lỗi kĩ thuật từ nhà sản xuất.', s: [['Bạn Nam có quyền yêu cầu bảo hành, đổi mới hoặc sửa chữa miễn phí theo cam kết.', true], ['Hóa đơn và phiếu bảo hành là căn cứ quan trọng bảo vệ quyền lợi người tiêu dùng.', true], ['Siêu thị có quyền từ chối bảo hành với lí do đã bán xong hàng là hết trách nhiệm.', false], ['Người tiêu dùng cũng có nghĩa vụ kiểm tra hàng hóa và sử dụng đúng hướng dẫn.', true]], e: 'Theo Luật Bảo vệ quyền lợi người tiêu dùng, đơn vị bán hàng và nhà sản xuất có trách nhiệm thực hiện đúng cam kết bảo hành.' }
      ],
      short: [
        { tp: 'Kinh tế vĩ mô', q: 'Viết chữ viết tắt tiếng Anh gồm 3 chữ cái của chỉ tiêu "Tổng sản phẩm quốc nội".', a: 'GDP', acc: ['GDP', 'gdp'], e: 'GDP là viết tắt của Gross Domestic Product (Tổng sản phẩm quốc nội).' },
        { tp: 'Quản lí tài chính', q: 'Một gia đình có tổng thu nhập tháng 20 triệu đồng, áp dụng quy tắc tiết kiệm 20% thu nhập mỗi tháng. Số tiền tiết kiệm được mỗi tháng là bao nhiêu triệu đồng?', a: '4', acc: ['4', '4 triệu'], e: '20% của 20 triệu đồng là $20\\cdot 0,2=4$ triệu đồng.' },
        { tp: 'Pháp luật lao động', q: 'Theo Bộ luật Lao động 2019, độ tuổi lao động tối thiểu của người lao động tại Việt Nam là đủ bao nhiêu tuổi?', a: '15', acc: ['15'], e: 'Điều 3 Bộ luật Lao động 2019 quy định độ tuổi lao động tối thiểu là đủ 15 tuổi (trừ một số công việc đặc thù được pháp luật quy định riêng).' }
      ]
    },
    informatics: {
      mcq: [
        { tp: 'Trí tuệ nhân tạo (AI)', q: 'Khả năng nào sau đây là đặc trưng tiêu biểu của hệ thống Trí tuệ nhân tạo (AI)?', o: ['Học từ dữ liệu, suy luận, nhận thức và giải quyết vấn đề linh hoạt', 'Chỉ lưu trữ văn bản tĩnh mà không xử lí được gì', 'Hoạt động không cần nguồn điện hay phần cứng', 'Chỉ dùng để thay thế dây cáp mạng'], a: 0, e: 'AI có khả năng học máy (Machine Learning), suy luận, nhận diện hình ảnh/ngôn ngữ và ra quyết định dựa trên dữ liệu.' },
        { tp: 'Mạng máy tính', q: 'Thiết bị mạng nào có chức năng định tuyến (chuyển tiếp) gói tin giữa các mạng khác nhau, ví dụ giữa mạng LAN gia đình và Internet?', o: ['Router (Bộ định tuyến)', 'Bàn phím cơ', 'Máy quét mã vạch', 'Loa Bluetooth'], a: 0, e: 'Router định tuyến gói dữ liệu dựa trên địa chỉ IP để kết nối các mạng cục bộ với Internet.' },
        { tp: 'Giao thức mạng', q: 'Giao thức nào đảm bảo việc truyền tải trang web được mã hóa bảo mật giữa trình duyệt và máy chủ?', o: ['HTTPS', 'FTP không mã hóa', 'Telnet', 'BMP'], a: 0, e: 'HTTPS (HTTP over TLS/SSL) mã hóa dữ liệu trao đổi giúp chống nghe lén và giả mạo.' },
        { tp: 'HTML cơ bản', q: 'Trong HTML5, thẻ nào dùng để tạo một siêu liên kết (hyperlink) tới một URL khác?', o: ['`<a href="...">`', '`<img src="...">`', '`<table>`', '`<br>`'], a: 0, e: 'Thẻ `<a>` (anchor) với thuộc tính `href` tạo liên kết dẫn tới trang web hoặc tài nguyên khác.' },
        { tp: 'HTML cơ bản', q: 'Thẻ HTML nào biểu diễn tiêu đề lớn nhất (mức 1) trên trang web?', o: ['`<h1>`', '`<h6>`', '`<p>`', '`<span>`'], a: 0, e: 'Thẻ tiêu đề HTML đi từ `<h1>` (quan trọng/lớn nhất) đến `<h6>` (nhỏ nhất).' },
        { tp: 'CSS định dạng', q: 'Trong CSS, bộ chọn (selector) `#header` áp dụng định dạng cho phần tử có thuộc tính nào?', o: ['`id="header"`', '`class="header"`', 'Thẻ `<header>`', '`name="header"`'], a: 0, e: 'Dấu `#` chọn theo `id`, còn dấu `.` chọn theo `class`.' },
        { tp: 'CSS Box Model', q: 'Thuộc tính CSS nào tạo khoảng trống BÊN TRONG giữa nội dung phần tử và đường viền (border) của nó?', o: ['`padding`', '`margin`', '`color`', '`font-weight`'], a: 0, e: '`padding` là vùng đệm trong đường viền; `margin` là khoảng lề bên ngoài đường viền.' },
        { tp: 'Cơ sở dữ liệu SQL', q: 'Trong ngôn ngữ truy vấn SQL, câu lệnh nào dùng để lấy dữ liệu từ một bảng thỏa mãn điều kiện lọc?', o: ['`SELECT ... FROM ... WHERE ...`', '`DROP TABLE ...`', '`DELETE ALL`', '`PRINT TABLE`'], a: 0, e: '`SELECT` chọn cột, `FROM` chỉ định bảng và `WHERE` lọc bản ghi thỏa mãn điều kiện.' },
        { tp: 'Cơ sở dữ liệu', q: 'Khóa chính (Primary Key) trong một bảng cơ sở dữ liệu quan hệ phải đảm bảo hai tính chất nào?', o: ['Giá trị duy nhất (không trùng lặp) và không được để trống (NOT NULL)', 'Có thể trùng nhau tùy ý', 'Bắt buộc phải là hình ảnh', 'Chỉ chứa kí tự chữ hoa'], a: 0, e: 'Khóa chính định danh duy nhất từng bản ghi trong bảng nên luôn phải duy nhất và không NULL.' },
        { tp: 'An toàn thông tin', q: 'Biện pháp nào giúp tăng cường bảo mật tài khoản trực tuyến hiệu quả nhất bên cạnh mật khẩu mạnh?', o: ['Bật xác thực hai yếu tố (2FA)', 'Dùng chung mật khẩu "123456" cho mọi trang web', 'Chia sẻ mã OTP công khai trên mạng xã hội', 'Tắt mọi bản cập nhật bảo mật'], a: 0, e: 'Xác thực 2 yếu tố (2FA) yêu cầu thêm mã xác minh thứ hai (ứng dụng/SMS/khóa vật lí), ngăn chặn truy cập trái phép ngay cả khi lộ mật khẩu.' },
        { tp: 'Thuật toán', q: 'Thuật toán tìm kiếm nhị phân (Binary Search) chỉ áp dụng đúng khi danh sách đầu vào thỏa mãn điều kiện gì?', o: ['Đã được sắp xếp theo thứ tự (tăng dần hoặc giảm dần)', 'Chứa toàn số lẻ', 'Có độ dài nhỏ hơn 10', 'Không có thứ tự nào'], a: 0, e: 'Tìm kiếm nhị phân chia đôi không gian tìm kiếm dựa vào so sánh với phần tử giữa, nên yêu cầu mảng đã sắp xếp.' },
        { tp: 'Đạo đức số', q: 'Khi sử dụng hình ảnh hoặc mã nguồn từ Internet vào dự án học tập, cách ứng xử có văn hóa và đúng pháp luật là', o: ['Kiểm tra giấy phép sử dụng và ghi rõ nguồn/tác giả đầy đủ', 'Xóa tên tác giả gốc và nhận là của mình', 'Sao chép trái phép tài liệu cấm phát tán', 'Đăng tải thông tin cá nhân người khác không xin phép'], a: 0, e: 'Tôn trọng bản quyền và ghi nguồn minh bạch là chuẩn mực đạo đức số quan trọng.' }
      ],
      tf: [
        { tp: 'HTML & CSS thực hành', q: 'Cho đoạn mã HTML/CSS: `<div class="card"><h2 id="title">Học Cùng Phúc K9</h2><p>Ôn thi 9+</p></div>` kèm CSS `.card { padding: 16px; border: 1px solid blue; } #title { color: navy; }`.', s: [['Phần tử `<h2>` có màu chữ là `navy` nhờ bộ chọn ID `#title`.', true], ['Thuộc tính `padding: 16px` tạo khoảng đệm bên trong đường viền của `.card`.', true], ['Độ ưu tiên (specificity) của bộ chọn ID `#title` cao hơn bộ chọn lớp `.card`.', true], ['Thẻ `<p>` dùng để chèn hình ảnh PNG vào trang web.', false]], e: 'Thẻ `<p>` dùng cho đoạn văn bản (paragraph); chèn ảnh dùng thẻ `<img>`. Các nhận định về `#title` và `padding` đều chính xác.' },
        { tp: 'Mạng & Bảo mật', q: 'Xét hệ thống mạng máy tính trong phòng thực hành Tin học ở trường THPT:', s: [['Các máy tính kết nối vào Switch để tạo thành mạng cục bộ (LAN).', true], ['Địa chỉ IP giúp định danh thiết bị khi giao tiếp trên mạng TCP/IP.', true], ['Chia sẻ mật khẩu quản trị mạng trên bảng tin công khai là thói quen bảo mật tốt.', false], ['Cập nhật phần mềm và sử dụng tường lửa giúp giảm thiểu nguy cơ mã độc.', true]], e: 'Tuyệt đối không công khai mật khẩu quản trị; Switch tạo mạng LAN và IP định danh nút mạng trong bộ giao thức TCP/IP.' },
        { tp: 'Cơ sở dữ liệu SQL', q: 'Cho bảng `HOCSINH(MaHS, HoTen, Lop, DiemTB)` với `MaHS` là khóa chính.', s: [['Mỗi học sinh có một mã `MaHS` duy nhất không trùng với học sinh khác.', true], ['Câu lệnh `SELECT HoTen, DiemTB FROM HOCSINH WHERE DiemTB >= 8.0` lấy danh sách học sinh có điểm TB từ 8.0 trở lên.', true], ['Có thể dùng mệnh đề `ORDER BY DiemTB DESC` để sắp xếp điểm giảm dần từ cao xuống thấp.', true], ['Khóa chính `MaHS` cho phép để giá trị trống (NULL) ở nhiều dòng.', false]], e: 'Khóa chính bắt buộc NOT NULL và UNIQUE. Các câu lệnh `SELECT ... WHERE` và `ORDER BY DESC` hoàn toàn chuẩn SQL.' }
      ],
      short: []
    },
    dgnl: {
      mcq: [
        { tp: 'Tư duy Logic', q: 'Cho dãy số quy luật: $2, 6, 12, 20, 30, ?$. Số tiếp theo điền vào dấu hỏi chấm là', o: ['42', '38', '40', '44'], a: 0, e: 'Quy luật $a_n=n(n+1)$: $1\\cdot 2=2, 2\\cdot 3=6, 3\\cdot 4=12, 4\\cdot 5=20, 5\\cdot 6=30 \\Rightarrow 6\\cdot 7=42$.' },
        { tp: 'Tư duy Logic', q: 'Nếu "Mọi học sinh chăm chỉ đều tiến bộ" là mệnh đề đúng, kết luận logic nào sau đây chắc chắn đúng?', o: ['Nếu một học sinh không tiến bộ thì bạn đó không chăm chỉ', 'Nếu một học sinh tiến bộ thì chắc chắn bạn đó chăm chỉ', 'Không có học sinh nào tiến bộ', 'Người không chăm chỉ chắc chắn không tiến bộ'], a: 0, e: 'Theo luật phản đảo: $(P \\Rightarrow Q) \\Leftrightarrow (\\neg Q \\Rightarrow \\neg P)$. Do đó "không tiến bộ" suy ra "không chăm chỉ".' },
        { tp: 'Phân tích số liệu', q: 'Một cửa hàng giảm giá 20% cho một chiếc máy tính bảng có giá niêm yết 5.000.000 đồng. Giá sau khi giảm là', o: ['4.000.000 đồng', '4.200.000 đồng', '3.800.000 đồng', '4.500.000 đồng'], a: 0, e: 'Giảm 20% tức còn 80% giá gốc: $5.000.000 \\times 0,8 = 4.000.000$ đồng.' },
        { tp: 'Tư duy Ngôn ngữ', q: 'Chọn từ viết ĐÚNG chính tả tiếng Việt trong các phương án sau:', o: ['Chỉnh chu — sai; đúng là "Chỉn chu"', 'Sát nhập', 'Dành dụm', 'Chau chuốt'], a: 2, e: '"Dành dụm" viết đúng chính tả (các từ chuẩn khác là "chỉn chu", "sáp nhập", "trau chuốt").' },
        { tp: 'Tư duy Ngôn ngữ', q: 'Trong câu "Nhờ tinh thần đoàn kết, đội tuyển đã giành huy chương vàng", cụm từ "Nhờ tinh thần đoàn kết" giữ chức năng thành phần nào?', o: ['Trạng ngữ chỉ nguyên nhân', 'Chủ ngữ', 'Vị ngữ', 'Bổ ngữ trực tiếp'], a: 0, e: 'Cụm từ mở đầu bằng "Nhờ..." nêu nguyên nhân tích cực dẫn đến kết quả → trạng ngữ chỉ nguyên nhân.' },
        { tp: 'Tư duy Khoa học', q: 'Hiện tượng băng tan ở hai cực Trái Đất làm mực nước biển dâng chủ yếu liên quan trực tiếp đến nguyên nhân nào?', o: ['Hiệu ứng nhà kính tăng mạnh do phát thải khí $\\text{CO}_2, \\text{CH}_4$', 'Giảm lượng oxy trong nước biển', 'Hoạt động nhật thực hằng năm', 'Lực ma sát giữa các mảng lục địa'], a: 0, e: 'Khí nhà kính giữ nhiệt làm nhiệt độ trung bình toàn cầu tăng, gây băng tan lục địa và dãn nở nhiệt nước biển.' },
        { tp: 'Tư duy Logic', q: 'Năm bạn A, B, C, D, E xếp thành một hàng dọc. A đứng ngay trước B; C đứng sau D; E đứng đầu hàng; D đứng ngay sau B. Ai là người đứng cuối hàng?', o: ['C', 'D', 'B', 'A'], a: 0, e: 'Thứ tự duy nhất từ đầu đến cuối là: E → A → B → D → C. Vậy C đứng cuối hàng.' },
        { tp: 'Tư duy Định lượng', q: 'Một ô tô đi nửa quãng đường đầu với vận tốc $40\\text{ km/h}$ và nửa quãng đường sau với vận tốc $60\\text{ km/h}$. Vận tốc trung bình trên cả quãng đường là', o: ['$48\\text{ km/h}$', '$50\\text{ km/h}$', '$52\\text{ km/h}$', '$45\\text{ km/h}$'], a: 0, e: 'Vận tốc trung bình $v_{\\text{tb}}=\\frac{2v_1 v_2}{v_1+v_2}=\\frac{2\\cdot 40\\cdot 60}{40+60}=48\\text{ km/h}$.' }
      ],
      tf: [
        { tp: 'ĐGNL — Phân tích số liệu & Suy luận', q: 'Khảo sát 200 học sinh khối 12 về môn tự chọn thi tốt nghiệp: 120 bạn chọn Vật lí, 90 bạn chọn Hóa học, và 40 bạn chọn cả hai môn Vật lí và Hóa học.', s: [['Số học sinh chọn ít nhất một trong hai môn Vật lí hoặc Hóa học là 170 bạn.', true], ['Số học sinh chỉ chọn Vật lí mà không chọn Hóa học là 80 bạn.', true], ['Số học sinh không chọn cả Vật lí lẫn Hóa học là 30 bạn.', true], ['Tỉ lệ học sinh chọn cả hai môn chiếm 40% tổng số học sinh khảo sát.', false]], e: 'Theo sơ đồ Venn: $|L\\cup H|=120+90-40=170$; chỉ Lí $=120-40=80$; không chọn cả hai $=200-170=30$; tỉ lệ chọn cả hai $=40/200=20\\%$.' },
        { tp: 'ĐGNL — Tư duy Khoa học Tổng hợp', q: 'Trong thí nghiệm quang hợp ở thực vật xanh dưới ánh sáng mặt trời:', s: [['Thực vật hấp thụ $\\text{CO}_2$ và nước để tổng hợp chất hữu cơ (glucose) và giải phóng khí $\\text{O}_2$.', true], ['Diệp lục (chlorophyll) đóng vai trò hấp thụ năng lượng ánh sáng.', true], ['Cường độ quang hợp hoàn toàn không phụ thuộc vào ánh sáng và nồng độ $\\text{CO}_2$.', false], ['Quá trình quang hợp góp phần điều hòa khí hậu và giảm hiệu ứng nhà kính.', true]], e: 'Quang hợp phụ thuộc chặt chẽ vào cường độ ánh sáng, nồng độ $\\text{CO}_2$, nhiệt độ và nước.' }
      ],
      short: []
    }
  };

  // Fix typo in DGNL question 4 option A so it reads cleanly
  CURATED_BANKS.dgnl.mcq[3] = {
    tp: 'Tư duy Ngôn ngữ',
    q: 'Chọn từ viết ĐÚNG chính tả tiếng Việt trong các phương án sau:',
    o: ['Dành dụm', 'Sát nhập', 'Chỉnh chu', 'Chau chuốt'],
    a: 0,
    e: '"Dành dụm" viết đúng chính tả (các từ đúng tương ứng của 3 phương án còn lại là "sáp nhập", "chỉn chu", "trau chuốt").'
  };

  // Extra curated pools for high cross-exam variety across Humanities, English, Tech & Sciences
  CURATED_BANKS.english.mcq.push(
    { tp: 'Modal Verbs', q: 'You ______ wear a helmet when riding a motorbike on public roads; it is required by law.', o: ['must', 'might', 'could have', 'needn\'t'], a: 0, e: '"must" diễn tả nghĩa vụ bắt buộc theo quy định pháp luật.' },
    { tp: 'Tag Questions', q: 'Everything is ready for the science exhibition, ______?', o: ['isn\'t it', 'aren\'t they', 'is it', 'doesn\'t it'], a: 0, e: 'Chủ ngữ đại từ bất định chỉ vật "Everything" dùng đại từ "it" ở câu hỏi đuôi → "isn\'t it?".' },
    { tp: 'Idioms', q: 'After months of intense revision, Minh passed the university entrance exam with flying ______.', o: ['colors', 'clouds', 'birds', 'wings'], a: 0, e: 'Thành ngữ "with flying colors" = đạt kết quả xuất sắc.' },
    { tp: 'Vocabulary - Careers', q: 'Adaptability and lifelong learning are vital skills in today\'s rapidly changing job ______.', o: ['market', 'gallery', 'station', 'harbor'], a: 0, e: 'Cụm từ cố định "job market" = thị trường lao động.' },
    { tp: 'Passive Infinitive', q: 'The historic pagoda needs ______ before the upcoming rainy season.', o: ['to be restored', 'restoring to', 'restore', 'be restored'], a: 0, e: 'Cấu trúc bị động với "need": S (vật) + need + to be V3/ed (hoặc V-ing).' },
    { tp: 'Connectors', q: 'She practiced speaking English daily; ______, her pronunciation improved dramatically.', o: ['consequently', 'nevertheless', 'whereas', 'although'], a: 0, e: '"consequently" = kết quả là / do đó, nối quan hệ nguyên nhân – kết quả giữa hai mệnh đề.' }
  );
  CURATED_BANKS.english.tf.push(
    { tp: 'Reading — Digital Detox', q: 'Read the passage: "Teenagers who turn off smartphone notifications an hour before bedtime fall asleep faster and wake up feeling more refreshed. Experts recommend placing phones outside the bedroom overnight."', s: [['Turning off phone alerts before sleep helps teenagers fall asleep faster.', true], ['Experts suggest keeping smartphones right under the pillow at night.', false], ['Better sleep quality helps teens feel more refreshed in the morning.', true], ['The passage offers practical advice for healthier sleep habits.', true]], e: 'Chuyên gia khuyên đặt điện thoại NGOÀI phòng ngủ (outside the bedroom) và tắt thông báo trước khi ngủ 1 tiếng.' }
  );
  CURATED_BANKS.english.short.push(
    { tp: 'Word Formation', q: 'Give the correct adjective form of "SUCCESS" to complete: "Her project was extremely ______."', a: 'successful', acc: ['successful', 'Successful'], e: 'Sau trạng từ "extremely" cần tính từ → "successful" (thành công).' },
    { tp: 'Grammar — Past Participle', q: 'Write the past participle (V3) of "SPEAK" to complete: "English is ______ worldwide."', a: 'spoken', acc: ['spoken', 'Spoken'], e: 'Động từ bất quy tắc: speak – spoke – spoken.' }
  );

  CURATED_BANKS.literature.mcq.push(
    { tp: 'Biện pháp tu từ', q: 'Trong câu "Người buồn cảnh có vui đâu bao giờ" (Nguyễn Du), thủ pháp nghệ thuật nổi bật là gì?', o: ['Tả cảnh ngụ tình', 'Nói quá', 'Chơi chữ', 'Liệt kê'], a: 0, e: 'Tả cảnh ngụ tình là dùng cảnh vật thiên nhiên để soi chiếu, gửi gắm tâm trạng con người.' },
    { tp: 'Ngữ văn 12 - Phong cách', q: 'Phong cách cổ điển và phong cách lãng mạn trong văn học khác nhau chủ yếu ở đặc điểm nào?', o: ['Phong cách lãng mạn đề cao cái tôi cá nhân, cảm xúc phóng khoáng và trí tưởng tượng', 'Phong cách lãng mạn chỉ viết văn bản hành chính', 'Phong cách cổ điển không tuân theo quy phạm nào', 'Cả hai đều cấm sử dụng hình ảnh thiên nhiên'], a: 0, e: 'Phong cách cổ điển chuộng chuẩn mực, ước lệ, quy phạm; phong cách lãng mạn đề cao cảm xúc cá nhân, khát vọng tự do và tưởng tượng bay bổng.' },
    { tp: 'Thơ ca', q: 'Nhịp thơ (ngắt nhịp) trong một bài thơ có tác dụng chính là gì?', o: ['Tạo nhạc tính, tiết tấu và góp phần biểu đạt sắc thái cảm xúc của nhân vật trữ tình', 'Thay thế hoàn toàn ý nghĩa từ ngữ', 'Xác định số trang in ấn', 'Loại bỏ biện pháp tu từ'], a: 0, e: 'Cách ngắt nhịp (nhanh/chậm, đều đặn/đột ngột) trực tiếp tạo nhạc điệu và truyền tải biến chuyển tâm trạng.' },
    { tp: 'Nghị luận văn học', q: 'Khi viết bài văn nghị luận về một tác phẩm truyện, yếu tố nào KHÔNG thể bỏ qua khi phân tích nghệ thuật?', o: ['Tình huống truyện, cốt truyện, điểm nhìn trần thuật và nghệ thuật xây dựng nhân vật', 'Giá bán cuốn sách ngoài hiệu sách', 'Số lượng chữ cái trong tên nhà in', 'Màu mực bút viết của người đọc'], a: 0, e: 'Tình huống truyện, điểm nhìn, giọng điệu và cách khắc họa nhân vật là những phương diện nghệ thuật cốt lõi của tác phẩm tự sự.' },
    { tp: 'Tiếng Việt', q: 'Từ nào sau đây là từ Hán Việt?', o: ['Giang sơn', 'Đất nước', 'Núi sông', 'Cây cỏ'], a: 0, e: '"Giang sơn" (giang = sông, sơn = núi) là từ Hán Việt mang sắc thái trang trọng.' },
    { tp: 'Văn học dân gian', q: 'Thể loại tự sự dân gian kể về những vị anh hùng đại diện cho cộng đồng thời cổ đại với giọng điệu trang nghiêm, kì vĩ gọi là', o: ['Sử thi (anh hùng ca)', 'Truyện cười', 'Ca dao hài hước', 'Vè châm biếm'], a: 0, e: 'Sử thi (như Đăm Săn) ca ngợi người anh hùng mang tầm vóc cộng đồng với cảm hứng ngợi ca, kì vĩ.' }
  );
  CURATED_BANKS.literature.tf.push(
    { tp: 'Đọc hiểu Truyện hiện đại', q: 'Xét vai trò của chi tiết nghệ thuật tiêu biểu trong truyện ngắn hiện đại:', s: [['Chi tiết nghệ thuật đắt giá giúp khắc họa sâu sắc tính cách và số phận nhân vật.', true], ['Một chi tiết nhỏ nhưng giàu sức gợi có thể góp phần thể hiện chủ đề tư tưởng của toàn tác phẩm.', true], ['Truyện ngắn hiện đại càng có nhiều nhân vật thừa thãi không liên quan thì càng hay.', false], ['Sự kết hợp giữa lời người kể chuyện và lời nhân vật tạo nên tính đa thanh sinh động.', true]], e: 'Truyện ngắn đề cao tính cô đọng, hàm súc với những chi tiết đắt giá và nghệ thuật trần thuật tinh tế.' }
  );
  CURATED_BANKS.literature.short.push(
    { tp: 'Thể thơ truyền thống', q: 'Thể thơ truyền thống của dân tộc Việt Nam gồm các cặp câu 6 tiếng và 8 tiếng xen kẽ gọi là thể thơ gì?', a: 'Lục bát', acc: ['Lục bát', 'lục bát', 'luc bat'], e: 'Thể thơ lục bát (câu 6 chữ – câu 8 chữ) là thể thơ dân tộc tiêu biểu nhất của Việt Nam.' },
    { tp: 'Tác giả văn học', q: 'Ai là tác giả của tập thơ "Nhật kí trong tù"?', a: 'Hồ Chí Minh', acc: ['Hồ Chí Minh', 'ho chi minh', 'Chủ tịch Hồ Chí Minh', 'Bác Hồ'], e: 'Tập thơ "Nhật kí trong tù" (Ngục trung nhật kí) được Chủ tịch Hồ Chí Minh sáng tác năm 1942–1943.' }
  );

  CURATED_BANKS.history.mcq.push(
    { tp: 'Kháng chiến chống Pháp', q: 'Thắng lợi của Chiến dịch Biên giới thu - đông năm 1950 mang lại ý nghĩa chiến lược nào cho quân dân ta?', o: ['Giành được thế chủ động trên chiến trường chính Bắc Bộ và khai thông biên giới Việt - Trung', 'Buộc Mỹ kí Hiệp định Pari', 'Mở đầu Chiến tranh thế giới thứ hai', 'Thành lập tổ chức ASEAN'], a: 0, e: 'Chiến dịch Biên giới 1950 phá vỡ thế bao vây, khai thông đường liên lạc quốc tế và giúp quân ta giành quyền chủ động chiến lược ở Bắc Bộ.' },
    { tp: 'Kháng chiến chống Mỹ', q: 'Phong trào "Đồng khởi" (1959–1960) ở miền Nam Việt Nam đã tạo ra bước ngoặt nào?', o: ['Chuyển cách mạng miền Nam từ thế giữ gìn lực lượng sang thế tiến công', 'Kết thúc hoàn toàn chiến tranh tại Việt Nam', 'Làm sụp đổ Liên Xô', 'Đánh dấu Pháp bắt đầu xâm lược Việt Nam'], a: 0, e: 'Phong trào Đồng khởi (tiêu biểu ở Bến Tre) giáng đòn nặng nề vào chính quyền Ngô Đình Diệm, đưa cách mạng miền Nam chuyển sang thế tiến công và dẫn tới sự ra đời Mặt trận Dân tộc giải phóng miền Nam (12/1960).' },
    { tp: 'Bảo vệ Tổ quốc 1975-1989', q: 'Cuộc chiến đấu bảo vệ biên giới Tây Nam (1975–1979) và biên giới phía Bắc (1979) khẳng định điều gì?', o: ['Ý chí kiên cường bảo vệ độc lập, chủ quyền, toàn vẹn lãnh thổ và tinh thần quốc tế cao cả của nhân dân Việt Nam', 'Sự kết thúc của Liên hợp quốc', 'Việt Nam đóng cửa không giao lưu thế giới', 'Trật tự Vécxai - Oasinhtơn được khôi phục'], a: 0, e: 'Nhân dân Việt Nam kiên quyết bảo vệ chủ quyền biên giới thiêng liêng đồng thời giúp nhân dân Campuchia thoát khỏi chế độ diệt chủng Pôn Pốt.' },
    { tp: 'ASEAN', q: 'Văn kiện nào được kí năm 2007 tạo cơ sở pháp lí và khung thể chế để xây dựng Cộng đồng ASEAN?', o: ['Hiến chương ASEAN', 'Hiệp định Giơnevơ', 'Hiệp định Sơ bộ 1946', 'Tuyên ngôn Độc lập Mỹ'], a: 0, e: 'Hiến chương ASEAN (kí tháng 11/2007, có hiệu lực 12/2008) đặt nền tảng pháp lí vững chắc cho Cộng đồng ASEAN.' },
    { tp: 'Hội nhập quốc tế', q: 'Năm 2007 đánh dấu mốc hội nhập kinh tế quốc tế quan trọng nào của Việt Nam?', o: ['Chính thức trở thành thành viên thứ 150 của Tổ chức Thương mại Thế giới (WTO)', 'Bắt đầu kế hoạch 5 năm đầu tiên', 'Kí Hiệp định Pari', 'Gia nhập Hội Quốc liên'], a: 0, e: 'Tháng 1/2007, Việt Nam chính thức gia nhập WTO, mở rộng sâu rộng thị trường xuất khẩu toàn cầu.' },
    { tp: 'Chủ tịch Hồ Chí Minh', q: 'Đảng Cộng sản Việt Nam được thành lập vào đầu năm 1930 dưới sự chủ trì của Nguyễn Ái Quốc tại đâu?', o: ['Cửu Long (Hương Cảng, Trung Quốc)', 'Pari (Pháp)', 'Mát-xcơ-va (Liên Xô)', 'Tân Trào (Tuyên Quang)'], a: 0, e: 'Hội nghị hợp nhất các tổ chức cộng sản thành lập Đảng Cộng sản Việt Nam diễn ra đầu năm 1930 tại Cửu Long (Hương Cảng) dưới sự chủ trì của Nguyễn Ái Quốc.' }
  );
  CURATED_BANKS.history.tf.push(
    { tp: 'Kháng chiến chống Mỹ (1954–1975)', q: 'Xét thắng lợi lịch sử của cuộc kháng chiến chống Mỹ, cứu nước (1954–1975):', s: [['Cuộc Tổng tiến công và nổi dậy Xuân 1975 gồm 3 chiến dịch lớn: Tây Nguyên, Huế – Đà Nẵng và Hồ Chí Minh.', true], ['Hiệp định Pari (1973) buộc Mỹ phải rút hết quân viễn chinh về nước, tạo thời cơ "đánh cho ngụy nhào".', true], ['Ngày 30/4/1975 đánh dấu miền Nam hoàn toàn giải phóng, đất nước thống nhất.', true], ['Trong kháng chiến chống Mỹ, miền Bắc không có vai trò chi viện gì cho tiền tuyến miền Nam.', false]], e: 'Miền Bắc là hậu phương lớn vững chắc, vừa xây dựng CNXH vừa chi viện sức người, sức của liên tục cho tiền tuyến lớn miền Nam.' }
  );
  CURATED_BANKS.history.short.push(
    { tp: 'Mốc lịch sử hiện đại', q: 'Chiến dịch Hồ Chí Minh toàn thắng, giải phóng hoàn toàn miền Nam vào ngày 30 tháng 4 năm nào?', a: '1975', acc: ['1975'], e: 'Ngày 30/4/1975, Chiến dịch Hồ Chí Minh kết thúc thắng lợi hoàn toàn.' },
    { tp: 'Mốc lịch sử hiện đại', q: 'Việt Nam chính thức gia nhập Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào năm nào?', a: '1995', acc: ['1995'], e: 'Ngày 28/7/1995, Việt Nam trở thành thành viên chính thức thứ 7 của ASEAN.' }
  );

  CURATED_BANKS.geography.mcq.push(
    { tp: 'Sông ngòi Việt Nam', q: 'Hai hệ thống sông lớn nhất tạo nên hai đồng bằng châu thổ rộng lớn ở hai đầu đất nước là', o: ['Hệ thống sông Hồng và hệ thống sông Mê Kông (Cửu Long)', 'Sông Thu Bồn và sông Ba', 'Sông Mã và sông Cả', 'Sông Kỳ Cùng và sông Bằng Giang'], a: 0, e: 'Sông Hồng bồi tụ Đồng bằng sông Hồng và sông Mê Kông bồi tụ Đồng bằng sông Cửu Long.' },
    { tp: 'Công nghiệp', q: 'Trung tâm công nghiệp có quy mô giá trị sản xuất lớn nhất cả nước ta là', o: ['Thành phố Hồ Chí Minh', 'Đà Lạt', 'Pleiku', 'Hà Giang'], a: 0, e: 'TP.HCM cùng vùng phụ cận Đông Nam Bộ là trung tâm công nghiệp - thương mại - tài chính lớn nhất Việt Nam.' },
    { tp: 'Du lịch Việt Nam', q: 'Di sản thiên nhiên thế giới nổi tiếng hai lần được UNESCO vinh danh về giá trị thẩm mĩ và địa chất – địa mạo ở vùng Đông Bắc là', o: ['Vịnh Hạ Long (Quảng Ninh)', 'Vườn quốc gia Cúc Phương', 'Hồ Ba Bể', 'Bãi biển Mũi Né'], a: 0, e: 'Vịnh Hạ Long (nay mở rộng cùng Quần đảo Cát Bà) là Di sản Thiên nhiên Thế giới tiêu biểu của Việt Nam.' },
    { tp: 'Thủy sản', q: 'Điều kiện tự nhiên thuận lợi hàng đầu giúp vùng Duyên hải Nam Trung Bộ phát triển mạnh nghề đánh bắt hải sản xa bờ là', o: ['Đường bờ biển dài, nhiều ngư trường trọng điểm (Ninh Thuận – Bình Thuận – Bà Rịa Vũng Tàu) và nhiều vũng vịnh', 'Có diện tích rừng ngập mặn lớn nhất thế giới', 'Mùa đông băng giá kéo dài', 'Hoàn toàn không có bão'], a: 0, e: 'Duyên hải Nam Trung Bộ giáp ngư trường giàu tôm cá, bờ biển có nhiều đầm phá, vũng vịnh thuận lợi neo đậu tàu thuyền.' },
    { tp: 'Lâm nghiệp', q: 'Loại rừng có vai trò chủ yếu điều tiết nguồn nước, chống xói mòn đất ở đầu nguồn và chắn gió cát ven biển là', o: ['Rừng phòng hộ', 'Rừng sản xuất lấy gỗ giấy', 'Vườn cây ăn quả', 'Đồng cỏ chăn nuôi'], a: 0, e: 'Rừng phòng hộ (đầu nguồn, chắn cát bay, chắn sóng lấn biển) bảo vệ môi trường sinh thái và hạn chế thiên tai.' },
    { tp: 'Đô thị hóa', q: 'Hai đô thị loại đặc biệt giữ vai trò cực tăng trưởng hàng đầu của nước ta là', o: ['Hà Nội và Thành phố Hồ Chí Minh', 'Cần Thơ và Nha Trang', 'Vinh và Quy Nhơn', 'Lào Cai và Buôn Ma Thuột'], a: 0, e: 'Hà Nội và TP.HCM là hai đô thị loại đặc biệt, trung tâm chính trị – kinh tế – văn hóa – khoa học hàng đầu cả nước.' }
  );
  CURATED_BANKS.geography.tf.push(
    { tp: 'Vùng Đông Nam Bộ', q: 'Xét đặc điểm phát triển kinh tế – xã hội của vùng Đông Nam Bộ:', s: [['Là vùng dẫn đầu cả nước về tỉ lệ dân thành thị, quy mô GRDP và kim ngạch xuất khẩu.', true], ['Có thế mạnh nổi bật về khai thác dầu khí ở thềm lục địa phía Nam và phát triển công nghiệp công nghệ cao.', true], ['Đất xám phù sa cổ và đất badan thuận lợi phát triển cây công nghiệp lâu năm như cao su, điều, hồ tiêu.', true], ['Đông Nam Bộ có trữ lượng than đá antraxit lớn nhất cả nước.', false]], e: 'Trữ lượng than đá antraxit lớn nhất nước tập trung ở Quảng Ninh (Trung du và miền núi Bắc Bộ / ĐBSH), không phải Đông Nam Bộ.' }
  );

  CURATED_BANKS.ktpl.mcq.push(
    { tp: 'Cạnh tranh & Thị trường', q: 'Khi giá một mặt hàng thiết yếu tăng đột ngột trên thị trường trong điều kiện các yếu tố khác không đổi, lượng cầu thường biến động như thế nào?', o: ['Giảm xuống theo quy luật cầu', 'Luôn tăng gấp đôi', 'Không bao giờ thay đổi', 'Biến mất hoàn toàn mọi cung cầu'], a: 0, e: 'Theo quy luật cầu, giá cả và lượng cầu thường có mối quan hệ tỉ lệ nghịch.' },
    { tp: 'Lạm phát & Thất nghiệp', q: 'Tình trạng mức giá chung của hàng hóa và dịch vụ tăng liên tục trong một thời gian dài làm giảm sức mua của đồng tiền gọi là', o: ['Lạm phát', 'Giảm phát', 'Thặng dư thương mại', 'Cân bằng ngân sách'], a: 0, e: 'Lạm phát là sự tăng mức giá chung liên tục, kéo theo sức mua thực tế của tiền tệ giảm xuống.' },
    { tp: 'Quyền bình đẳng', q: 'Quyền bình đẳng giữa các dân tộc ở Việt Nam được hiểu đúng là', o: ['Các dân tộc cùng sinh sống trên lãnh thổ Việt Nam đều được tôn trọng, bảo vệ và tạo điều kiện phát triển về chính trị, kinh tế, văn hóa', 'Chỉ một số dân tộc đông người mới có quyền học tập', 'Xóa bỏ tiếng nói, chữ viết của các dân tộc thiểu số', 'Phân biệt đối xử giữa miền núi và miền xuôi'], a: 0, e: 'Hiến pháp 2013 khẳng định các dân tộc bình đẳng, đoàn kết, tôn trọng và giúp nhau cùng phát triển.' },
    { tp: 'Pháp luật Quốc tế', q: 'Công ước Liên hợp quốc về Luật Biển năm 1982 viết tắt là gì?', o: ['UNCLOS 1982', 'WTO 1995', 'UNESCO 1945', 'WHO 1948'], a: 0, e: 'UNCLOS 1982 (United Nations Convention on the Law of the Sea) là "Hiến pháp của đại dương", cơ sở pháp lí quan trọng về quyền biển đảo.' },
    { tp: 'Khởi nghiệp & Đổi mới', q: 'Yếu tố nào giúp một mô hình kinh doanh nhỏ phát triển bền vững trong môi trường cạnh tranh hiện đại?', o: ['Chất lượng sản phẩm ổn định, lắng nghe khách hàng, quản trị dòng tiền minh bạch và tuân thủ pháp luật', 'Quảng cáo sai sự thật để bán một lần', 'Trốn thuế và cắt giảm an toàn sản phẩm', 'Không ghi chép sổ sách thu chi'], a: 0, e: 'Uy tín chất lượng, quản trị tài chính bài bản và tuân thủ pháp luật là nền móng phát triển dài hạn của mọi doanh nghiệp.' },
    { tp: 'Hợp đồng & Nghĩa vụ', q: 'Nguyên tắc giao kết hợp đồng dân sự hợp pháp bao gồm những yếu tố nào?', o: ['Tự nguyện, bình đẳng, thiện chí, trung thực và không trái pháp luật, đạo đức xã hội', 'Ép buộc một bên kí kết', 'Che giấu hoàn toàn nghĩa vụ thanh toán', 'Không cần sự đồng thuận của các bên'], a: 0, e: 'Bộ luật Dân sự quy định giao kết hợp đồng dựa trên tự do, tự nguyện cam kết, bình đẳng và hợp pháp.' }
  );
  CURATED_BANKS.ktpl.tf.push(
    { tp: 'Hội nhập & Xuất khẩu', q: 'Xét tác động của hội nhập kinh tế quốc tế đối với doanh nghiệp Việt Nam:', s: [['Mở rộng thị trường xuất khẩu hàng hóa nhờ ưu đãi giảm thuế quan từ các hiệp định FTA.', true], ['Tạo cơ hội tiếp cận công nghệ tiên tiến, nguồn vốn đầu tư và kĩ năng quản trị hiện đại.', true], ['Đặt ra áp lực cạnh tranh gay gắt đòi hỏi doanh nghiệp nâng cao chất lượng và đáp ứng tiêu chuẩn xanh.', true], ['Khi hội nhập quốc tế, doanh nghiệp trong nước hoàn toàn không cần tuân thủ quy tắc xuất xứ hay tiêu chuẩn chất lượng.', false]], e: 'Muốn hưởng ưu đãi thuế quan FTA, doanh nghiệp phải đáp ứng nghiêm ngặt quy tắc xuất xứ, an toàn thực phẩm và tiêu chuẩn môi trường.' }
  );
  CURATED_BANKS.ktpl.short.push(
    { tp: 'Pháp luật quốc tế', q: 'Công ước Liên hợp quốc về Luật Biển (UNCLOS) được thông qua vào năm nào?', a: '1982', acc: ['1982'], e: 'Công ước Liên hợp quốc về Luật Biển (UNCLOS) được thông qua năm 1982.' },
    { tp: 'Kinh tế vĩ mô', q: 'Một quốc gia năm trước có GDP là 400 tỉ USD, năm nay tăng lên 428 tỉ USD. Tốc độ tăng trưởng GDP năm nay đạt bao nhiêu phần trăm (%)?', a: '7', acc: ['7', '7%'], e: 'Tốc độ tăng trưởng $=\\frac{428-400}{400}\\cdot 100\\%=7\\%$.' }
  );

  CURATED_BANKS.informatics.mcq.push(
    { tp: 'HTML Biểu mẫu', q: 'Trong HTML5, thẻ `<input type="password">` có tác dụng gì?', o: ['Tạo ô nhập mật khẩu tự động ẩn kí tự hiển thị bằng dấu chấm/sao', 'Tạo nút gửi biểu mẫu', 'Tạo danh sách thả xuống', 'Chèn tệp âm thanh MP3'], a: 0, e: 'Thuộc tính `type="password"` che giấu kí tự người dùng gõ vào ô nhập mật khẩu.' },
    { tp: 'CSS Layout', q: 'Thuộc tính CSS nào biến một phần tử chứa thành lưới bố cục linh hoạt một chiều (hàng hoặc cột)?', o: ['`display: flex;`', '`font-style: italic;`', '`text-decoration: underline;`', '`opacity: 0;`'], a: 0, e: 'Flexbox (`display: flex`) sắp xếp, căn chỉnh và phân bố không gian các phần tử con theo hàng hoặc cột cực kì linh hoạt.' },
    { tp: 'Mạng máy tính', q: 'Hệ thống tên miền (DNS) trên Internet đảm nhận nhiệm vụ chính nào?', o: ['Phân giải tên miền dễ nhớ (như thanhphuc.vercel.app) sang địa chỉ IP số tương ứng', 'Nén tệp video MP4', 'Thiết kế đồ họa 3D', 'Kiểm tra chính tả tiếng Việt'], a: 0, e: 'DNS (Domain Name System) đóng vai trò như "danh bạ" chuyển đổi tên miền sang địa chỉ IP để máy tính kết nối được máy chủ.' },
    { tp: 'Trí tuệ nhân tạo (AI)', q: 'Rủi ro đạo đức nào cần đặc biệt cảnh giác khi ứng dụng AI tạo sinh trong học tập và truyền thông?', o: ['Thông tin sai lệch (ảo giác AI), giả mạo sâu (deepfake) và vi phạm bản quyền / quyền riêng tư', 'Máy tính chạy quá im lặng', 'Màn hình hiển thị màu xanh dương', 'Bàn phím có nhiều phím tắt'], a: 0, e: 'Người dùng AI cần kiểm chứng thông tin, tôn trọng bản quyền và phòng tránh lạm dụng deepfake / lộ dữ liệu cá nhân.' },
    { tp: 'Cơ sở dữ liệu', q: 'Trong mô hình dữ liệu quan hệ, khóa ngoài (Foreign Key) dùng để làm gì?', o: ['Tạo mối liên kết toàn vẹn tham chiếu giữa hai bảng dữ liệu với nhau', 'Xóa toàn bộ cơ sở dữ liệu', 'Tăng kích thước phông chữ', 'Mã hóa địa chỉ Wi-Fi'], a: 0, e: 'Khóa ngoài của bảng này tham chiếu tới khóa chính của bảng khác, đảm bảo tính nhất quán dữ liệu liên bảng.' },
    { tp: 'Độ phức tạp thuật toán', q: 'So với tìm kiếm tuần tự $O(n)$, tìm kiếm nhị phân trên mảng đã sắp xếp $n$ phần tử có độ phức tạp thời gian là', o: ['$O(\\log n)$', '$O(n^2)$', '$O(2^n)$', '$O(n!)$'], a: 0, e: 'Mỗi bước tìm kiếm nhị phân giảm một nửa phạm vi tìm kiếm nên độ phức tạp là $O(\\log_2 n)$.' }
  );
  CURATED_BANKS.informatics.tf.push(
    { tp: 'AI & Học máy hiện đại', q: 'Xét các ứng dụng và nguyên tắc sử dụng Trí tuệ nhân tạo (AI) trong học tập:', s: [['AI có thể hỗ trợ giải thích kiến thức, tạo câu hỏi ôn tập và phân tích hình ảnh đề bài.', true], ['Kết quả do AI tạo ra đôi khi vẫn có thể sai sót nên học sinh cần kiểm chứng và hiểu bản chất.', true], ['Sử dụng AI để gian lận trong phòng thi chính thức là hành vi được khuyến khích.', false], ['Mô hình Học máy (Machine Learning) cải thiện độ chính xác nhờ được huấn luyện trên dữ liệu chất lượng.', true]], e: 'AI là trợ lí học tập đắc lực khi dùng trung thực để hiểu sâu kiến thức, không dùng gian lận và luôn cần kiểm chứng.' }
  );

  CURATED_BANKS.dgnl.mcq.push(
    { tp: 'Tư duy Logic', q: 'Trong một lớp có 40 học sinh, 25 bạn thích Toán, 20 bạn thích Anh và 10 bạn thích cả hai môn. Có bao nhiêu bạn KHÔNG thích cả hai môn này?', o: ['5', '10', '15', '0'], a: 0, e: 'Số bạn thích ít nhất 1 môn $=25+20-10=35$. Số bạn không thích cả hai $=40-35=5$.' },
    { tp: 'Tư duy Định lượng', q: 'Một bể nước có hai vòi: vòi 1 chảy một mình đầy bể trong 6 giờ, vòi 2 chảy một mình đầy bể trong 3 giờ. Mở cả hai vòi cùng lúc thì sau bao lâu đầy bể?', o: ['2 giờ', '4,5 giờ', '3 giờ', '1,5 giờ'], a: 0, e: 'Trong 1 giờ cả hai vòi chảy được $\\frac{1}{6}+\\frac{1}{3}=\\frac{1}{2}$ bể → cần 2 giờ để đầy bể.' },
    { tp: 'Tư duy Ngôn ngữ', q: 'Từ nào khác loại về mặt từ loại so với ba từ còn lại?', o: ['Kiên cường', 'Bàn học', 'Thư viện', 'Bút chì'], a: 0, e: '"Kiên cường" là tính từ; ba từ còn lại ("bàn học", "thư viện", "bút chì") đều là danh từ.' },
    { tp: 'Tư duy Khoa học', q: 'Trong hệ Mặt Trời, hành tinh nào nằm gần Mặt Trời nhất?', o: ['Sao Thủy (Mercury)', 'Sao Kim (Venus)', 'Trái Đất (Earth)', 'Sao Hỏa (Mars)'], a: 0, e: 'Thứ tự hành tinh tính từ Mặt Trời: Sao Thủy → Sao Kim → Trái Đất → Sao Hỏa → Sao Mộc → Sao Thổ → Sao Thiên Vương → Sao Hải Vương.' }
  );

  // --------------------------------------------------------------------------
  // 220 EXAM BLUEPRINTS COVERING ALL 11 SUBJECTS (GDPT 2018 + DGNL)
  // --------------------------------------------------------------------------
  const PROVINCES = [
    'Sở GD&ĐT Hà Nội', 'Sở GD&ĐT TP.HCM', 'Sở GD&ĐT Hải Phòng', 'Sở GD&ĐT Đà Nẵng',
    'Sở GD&ĐT Nghệ An', 'Sở GD&ĐT Thanh Hóa', 'Sở GD&ĐT Nam Định', 'Sở GD&ĐT Bắc Ninh',
    'Sở GD&ĐT Cần Thơ', 'Sở GD&ĐT Quảng Ninh', 'Sở GD&ĐT Thừa Thiên Huế', 'Sở GD&ĐT Bình Dương',
    'Sở GD&ĐT Đồng Nai', 'Sở GD&ĐT Thái Bình', 'Sở GD&ĐT Vĩnh Phúc', 'Sở GD&ĐT Hà Tĩnh',
    'Sở GD&ĐT Ninh Bình', 'Sở GD&ĐT Khánh Hòa', 'Sở GD&ĐT Gia Lai', 'Sở GD&ĐT Đắk Lắk',
    'THPT Chuyên Khoa học Tự nhiên', 'THPT Chuyên Phan Bội Châu', 'THPT Chuyên Lam Sơn', 'THPT Chuyên Lê Hồng Phong'
  ];

  const SUBJECT_BLUEPRINTS = [
    {
      subject: 'math', label: 'Toán 12', duration: 90, count: 30,
      themes: [
        'Khảo sát hàm số & Ứng dụng đạo hàm', 'Hàm số Mũ – Logarit chuyên sâu',
        'Nguyên hàm – Tích phân & Ứng dụng', 'Hình học tọa độ Oxyz chuẩn 2018',
        'Xác suất có điều kiện & Công thức Bayes', 'Thống kê mẫu số liệu ghép nhóm',
        'Cấp số cộng – Cấp số nhân & Khối đa diện', 'Tổng ôn Mức độ 8+ (3 Phần chuẩn Bộ)',
        'Chinh phục Vận dụng cao 9+ Phần II & III', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 1',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 2', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 3',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 4', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 5',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 6', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 7',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 8', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 9',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 10', 'Khảo sát chất lượng Học kỳ I (2025–2026)',
        'Khảo sát chất lượng Học kỳ II (2025–2026)', 'Đề minh họa chuẩn cấu trúc Bộ GD&ĐT — Bộ A',
        'Đề minh họa chuẩn cấu trúc Bộ GD&ĐT — Bộ B', 'Đề minh họa chuẩn cấu trúc Bộ GD&ĐT — Bộ C',
        'Luyện tốc độ 90 phút — Bứt phá Đúng/Sai', 'Luyện tốc độ 90 phút — Bứt phá Trả lời ngắn',
        'Tổng duyệt trước kỳ thi THPT — Đề A1', 'Tổng duyệt trước kỳ thi THPT — Đề A2',
        'Tổng duyệt trước kỳ thi THPT — Đề B1', 'Tổng duyệt trước kỳ thi THPT — Đề VIP 9+'
      ]
    },
    {
      subject: 'physics', label: 'Vật lí 12', duration: 50, count: 24,
      themes: [
        'Vật lí nhiệt & Nguyên lí I Nhiệt động lực học', 'Khí lí tưởng — Định luật Boyle & Charles',
        'Từ trường, Lực từ & Cảm ứng điện từ', 'Dòng điện xoay chiều & Máy biến áp',
        'Vật lí hạt nhân & Phản ứng phóng xạ', 'Dao động điều hòa & Sóng cơ tổng ôn',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 1', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 2',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 3', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 4',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 5', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 6',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 7', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 8',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 9', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 10',
        'Khảo sát chất lượng Học kỳ I', 'Khảo sát chất lượng Học kỳ II',
        'Chuẩn cấu trúc Minh họa Bộ GD&ĐT — Đề 1', 'Chuẩn cấu trúc Minh họa Bộ GD&ĐT — Đề 2',
        'Luyện chuyên sâu Phần II Đúng/Sai thí nghiệm', 'Luyện chuyên sâu Phần III tính toán nhanh',
        'Tổng duyệt THPT Quốc gia — Bộ A', 'Tổng duyệt THPT Quốc gia — Bộ B (9+)'
      ]
    },
    {
      subject: 'chemistry', label: 'Hóa học 12', duration: 50, count: 24,
      themes: [
        'Chuyên đề Ester – Lipid & Xà phòng hóa', 'Chuyên đề Carbohydrate (Glucose – Tinh bột)',
        'Amine – Amino acid – Peptide – Protein', 'Chuyên đề Polymer & Vật liệu mới',
        'Pin điện hóa Galvani & Thế điện cực chuẩn', 'Điện phân dung dịch & Định luật Faraday',
        'Đại cương Kim loại & Ăn mòn điện hóa', 'Kim loại nhóm IA – IIA & Nước cứng',
        'Kim loại chuyển tiếp & Phức chất', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 1',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 2', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 3',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 4', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 5',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 6', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 7',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 8', 'Khảo sát chất lượng Học kỳ I',
        'Khảo sát chất lượng Học kỳ II', 'Đề minh họa chuẩn Bộ GD&ĐT — Bộ 1',
        'Đề minh họa chuẩn Bộ GD&ĐT — Bộ 2', 'Thực hành thí nghiệm Đúng/Sai chuẩn 2018',
        'Tổng duyệt THPT Quốc gia — Đề Vàng', 'Tổng duyệt THPT Quốc gia — Đề Kim Cương 9+'
      ]
    },
    {
      subject: 'biology', label: 'Sinh học 12', duration: 50, count: 20,
      themes: [
        'Di truyền phân tử (DNA – Phiên mã – Dịch mã)', 'Đột biến Gene & Đột biến Nhiễm sắc thể',
        'Quy luật phân li & Phân li độc lập Mendel', 'Liên kết gene, Hoán vị & Di truyền giới tính',
        'Di truyền quần thể & Định luật Hardy-Weinberg', 'Bằng chứng & Học thuyết Tiến hóa hiện đại',
        'Sinh thái học Cá thể – Quần thể – Quần xã', 'Hệ sinh thái & Dòng năng lượng',
        'Di truyền học người & Phả hệ', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 1',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 2', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 3',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 4', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 5',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 6', 'Khảo sát chất lượng Học kỳ I',
        'Khảo sát chất lượng Học kỳ II', 'Đề minh họa chuẩn Bộ GD&ĐT — Bộ 1',
        'Tổng duyệt THPT Quốc gia — Đề A', 'Tổng duyệt THPT Quốc gia — Đề B (9+)'
      ]
    },
    {
      subject: 'english', label: 'Tiếng Anh 12', duration: 50, count: 22,
      themes: [
        'Grammar Mastery — Tenses, Passive & Conditionals', 'Relative Clauses, Inversion & Comparisons',
        'Vocabulary, Collocations & Phrasal Verbs', 'Reading Comprehension — AI & Technology',
        'Reading Comprehension — Green Living & Environment', 'Advertisement & Notice Form 2025–2026',
        'Global Success 12 — Mid-Term Practice Test 1', 'Global Success 12 — Final-Term Practice Test 2',
        'Mock Exam THPT 2026 — Test 01', 'Mock Exam THPT 2026 — Test 02',
        'Mock Exam THPT 2026 — Test 03', 'Mock Exam THPT 2026 — Test 04',
        'Mock Exam THPT 2026 — Test 05', 'Mock Exam THPT 2026 — Test 06',
        'Mock Exam THPT 2026 — Test 07', 'Mock Exam THPT 2026 — Test 08',
        'Mock Exam THPT 2026 — Test 09', 'Mock Exam THPT 2026 — Test 10',
        'Ministry Sample Format 2026 — Set A', 'Ministry Sample Format 2026 — Set B',
        'Target 9+ Reading & Word Form Sprint', 'Final Countdown Mock Exam — VIP 2026'
      ]
    },
    {
      subject: 'literature', label: 'Ngữ văn 12', duration: 50, count: 16,
      themes: [
        'Đọc hiểu Thơ hiện đại & Biện pháp tu từ', 'Đọc hiểu Truyện ngắn & Điểm nhìn trần thuật',
        'Đọc hiểu Văn bản Nghị luận xã hội', 'Đọc hiểu Ký, Phóng sự & Hồi ký',
        'Đọc hiểu Kịch, Bi kịch & Xung đột kịch', 'Đọc hiểu Văn bản Thông tin tổng hợp',
        'Thực hành Tiếng Việt — Liên kết & Sửa lỗi câu', 'Tác giả – Tác phẩm trọng tâm GDPT 2018',
        'Tổng ôn Đọc hiểu THPT 2026 — Đề số 1', 'Tổng ôn Đọc hiểu THPT 2026 — Đề số 2',
        'Tổng ôn Đọc hiểu THPT 2026 — Đề số 3', 'Tổng ôn Đọc hiểu THPT 2026 — Đề số 4',
        'Khảo sát chất lượng Ngữ văn Học kỳ I', 'Khảo sát chất lượng Ngữ văn Học kỳ II',
        'Luyện đề nhanh Đọc hiểu chuẩn 2026 — Bộ A', 'Luyện đề nhanh Đọc hiểu chuẩn 2026 — Bộ B'
      ]
    },
    {
      subject: 'history', label: 'Lịch sử 12', duration: 50, count: 18,
      themes: [
        'Trật tự thế giới trong & sau Chiến tranh lạnh', 'ASEAN & Cộng đồng ASEAN (1967 – nay)',
        'Cách mạng tháng Tám năm 1945', 'Kháng chiến chống thực dân Pháp (1945–1954)',
        'Kháng chiến chống Mỹ cứu nước (1954–1975)', 'Công cuộc Đổi mới đất nước từ năm 1986',
        'Hoạt động đối ngoại Việt Nam hiện đại', 'Chủ tịch Hồ Chí Minh & Di sản dân tộc',
        'Biển Đông & Chủ quyền Hoàng Sa – Trường Sa', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 1',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 2', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 3',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 4', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 5',
        'Khảo sát chất lượng Học kỳ I', 'Khảo sát chất lượng Học kỳ II',
        'Đề minh họa chuẩn Bộ GD&ĐT 2026', 'Tổng duyệt Lịch sử THPT — Chinh phục 9+'
      ]
    },
    {
      subject: 'geography', label: 'Địa lí 12', duration: 50, count: 18,
      themes: [
        'Vị trí địa lí & Thiên nhiên nhiệt đới ẩm gió mùa', 'Thiên nhiên phân hóa đa dạng & Môi trường',
        'Địa lí Dân cư, Lao động & Đô thị hóa', 'Địa lí Nông – Lâm – Thủy sản Việt Nam',
        'Địa lí Công nghiệp & Năng lượng trọng điểm', 'Giao thông vận tải, Thương mại & Du lịch',
        'Vùng kinh tế phía Bắc (ĐBSH & TDMNBB)', 'Vùng Duyên hải miền Trung & Tây Nguyên',
        'Đông Nam Bộ & Đồng bằng sông Cửu Long', 'Biển đảo Việt Nam & Thực hành tính số liệu',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 1', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 2',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 3', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 4',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 5', 'Khảo sát chất lượng Học kỳ I',
        'Khảo sát chất lượng Học kỳ II', 'Tổng duyệt Địa lí THPT — Đề chuẩn 9+'
      ]
    },
    {
      subject: 'ktpl', label: 'GDKT & PL 12', duration: 50, count: 16,
      themes: [
        'Tăng trưởng & Phát triển kinh tế (GDP/HDI)', 'Hội nhập kinh tế quốc tế (CPTPP, EVFTA)',
        'Bảo hiểm & Hệ thống An sinh xã hội', 'Lập kế hoạch kinh doanh & Quản trị rủi ro',
        'Trách nhiệm xã hội của doanh nghiệp (CSR)', 'Quản lí thu chi trong gia đình hiện đại',
        'Quyền & Nghĩa vụ công dân về kinh doanh, thuế', 'Quyền sở hữu trí tuệ & Bảo vệ người tiêu dùng',
        'Một số vấn đề cơ bản của Pháp luật quốc tế', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 1',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 2', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 3',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 4', 'Khảo sát chất lượng Học kỳ I',
        'Khảo sát chất lượng Học kỳ II', 'Tổng duyệt GDKT&PL 2026 — Đạt 9+ dễ dàng'
      ]
    },
    {
      subject: 'informatics', label: 'Tin học 12', duration: 50, count: 14,
      themes: [
        'Trí tuệ nhân tạo (AI) & Ứng dụng đời sống', 'Mạng máy tính, Router, Switch & TCP/IP',
        'Tạo trang web bằng HTML5 chuẩn W3C', 'Định dạng CSS, Bộ chọn & Box Model',
        'Cơ sở dữ liệu quan hệ & Truy vấn SQL', 'Thuật toán, Tìm kiếm & Hệ nhị phân',
        'Lập trình Python & Biểu thức vòng lặp', 'An toàn thông tin & Đạo đức số',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 1', 'Thi thử Tốt nghiệp THPT 2026 — Đề số 2',
        'Thi thử Tốt nghiệp THPT 2026 — Đề số 3', 'Khảo sát chất lượng Học kỳ I',
        'Khảo sát chất lượng Học kỳ II', 'Tổng duyệt Tin học THPT 2026 — Chuẩn Bộ'
      ]
    },
    {
      subject: 'dgnl', label: 'ĐGNL & ĐGTD', duration: 60, count: 18,
      themes: [
        'HSA ĐHQG Hà Nội — Tư duy Định lượng (Đề 1)', 'HSA ĐHQG Hà Nội — Tư duy Định lượng (Đề 2)',
        'HSA ĐHQG Hà Nội — Tư duy Định tính & Ngôn ngữ (Đề 1)', 'HSA ĐHQG Hà Nội — Tư duy Định tính & Ngôn ngữ (Đề 2)',
        'HSA ĐHQG Hà Nội — Khoa học Tự nhiên & Xã hội (Đề 1)', 'HSA ĐHQG Hà Nội — Tổng hợp 3 phần chuẩn 2026 (Đề 1)',
        'HSA ĐHQG Hà Nội — Tổng hợp 3 phần chuẩn 2026 (Đề 2)', 'V-ACT ĐHQG TP.HCM — Logic & Phân tích số liệu (Đề 1)',
        'V-ACT ĐHQG TP.HCM — Logic & Phân tích số liệu (Đề 2)', 'V-ACT ĐHQG TP.HCM — Sử dụng Ngôn ngữ Việt – Anh',
        'V-ACT ĐHQG TP.HCM — Giải quyết vấn đề KHTN – KHXH', 'V-ACT ĐHQG TP.HCM — Thi thử Tổng hợp chuẩn 2026 (Đề 1)',
        'V-ACT ĐHQG TP.HCM — Thi thử Tổng hợp chuẩn 2026 (Đề 2)', 'TSA ĐH Bách Khoa — Tư duy Toán học (Đề 1)',
        'TSA ĐH Bách Khoa — Tư duy Toán học (Đề 2)', 'TSA ĐH Bách Khoa — Đọc hiểu & Tư duy Khoa học',
        'Đánh giá năng lực ĐH Sư phạm (SPT) — Tổng hợp 2026', 'Đánh giá tuyển sinh Bộ Công an — Tổng hợp 2026'
      ]
    }
  ];

  // Build lightweight catalog metadata once
  const CATALOG_META = [];
  const META_BY_ID = new Map();

  for (const bp of SUBJECT_BLUEPRINTS) {
    for (let i = 0; i < bp.count; i++) {
      const numStr = String(i + 1).padStart(2, '0');
      const id = `pk9-bank-${bp.subject}-${numStr}`;
      const theme = bp.themes[i] || `Đề luyện thi chuẩn GDPT 2018 số ${i + 1}`;
      const prov = PROVINCES[(i * 7 + bp.subject.length * 3) % PROVINCES.length];
      const isMock = /Thi thử|Mock|Tổng duyệt|Minh họa|HSA|V-ACT|TSA|Khảo sát/i.test(theme);
      const source = bp.subject === 'dgnl'
        ? `Ngân hàng Đề Chuẩn ĐGNL / ĐGTD • Học Cùng Phúc K9`
        : (isMock ? `Chuẩn cấu trúc ${prov} • Học Cùng Phúc K9` : `Chuyên đề Chuẩn GDPT 2018 • Học Cùng Phúc K9`);
      const qCount = bp.subject === 'math' ? 22
        : ['physics', 'chemistry', 'biology'].includes(bp.subject) ? 20
        : bp.subject === 'dgnl' ? 20
        : 18;
      const meta = {
        id,
        program: '2k9',
        subject: bp.subject,
        grade: '12',
        year: '2026',
        examType: isMock ? 'thi-thu' : 'chuyen-de',
        examPeriod: `Đề #${numStr}`,
        examSession: prov,
        periodLabel: isMock ? `Thi thử chuẩn 2026 • ${prov}` : `Chuyên đề GDPT 2018 • Đề #${numStr}`,
        title: `${bp.label} • ${theme}`,
        source,
        sourceOrg: isMock ? prov : 'Chuẩn GDPT 2018',
        sourceFile: '',
        originUrl: '',
        duration: bp.duration,
        questionCount: qCount,
        published: true,
        isBank: true,
        scoring: { mcq: 0.25, tf: [0, 0.1, 0.25, 0.5, 1], short: 0.5 }
      };
      CATALOG_META.push(meta);
      META_BY_ID.set(id, meta);
    }
  }

  // --------------------------------------------------------------------------
  // DETERMINISTIC ON-DEMAND FULL EXAM BUILDER (<1ms PER EXAM)
  // --------------------------------------------------------------------------
  function generateQuestionsForMeta(meta) {
    const rng = createRng(`${meta.id}::v74-gdpt2018`);
    const questions = [];
    const subj = meta.subject;
    let qNum = 1;

    if (subj === 'math') {
      // 12 Parametric MCQ + 4 Parametric True/False + 6 Parametric Short Answer = 22 Qs
      const mcqPickers = shuffle(rng, MATH_MCQ_GEN).slice(0, 12);
      for (let i = 0; i < 12; i++) {
        questions.push(mcqPickers[i % mcqPickers.length](rng, `${meta.id}-p1-q${i + 1}`, qNum++));
      }
      const tfPickers = shuffle(rng, MATH_TF_GEN);
      for (let i = 0; i < 4; i++) {
        questions.push(tfPickers[i % tfPickers.length](rng, `${meta.id}-p2-q${i + 1}`, qNum++));
      }
      const shortPickers = shuffle(rng, MATH_SHORT_GEN);
      for (let i = 0; i < 6; i++) {
        questions.push(shortPickers[i % shortPickers.length](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
      return questions;
    }

    if (subj === 'physics') {
      // 12 MCQ (8 parametric + 4 curated) + 4 Parametric TF + 4 Parametric Short = 20 Qs
      const pGen = shuffle(rng, PHYS_MCQ_GEN).slice(0, 8);
      for (let i = 0; i < pGen.length; i++) {
        questions.push(pGen[i](rng, `${meta.id}-p1-q${i + 1}`, qNum++));
      }
      const cMcq = pickDistinct(rng, CURATED_BANKS.physics.mcq, 4);
      for (let i = 0; i < cMcq.length; i++) {
        questions.push(makeCuratedMcq(rng, `${meta.id}-p1-c${i + 1}`, qNum++, cMcq[i]));
      }
      const tfGen = shuffle(rng, PHYS_TF_GEN);
      for (let i = 0; i < 4; i++) {
        questions.push(tfGen[i % tfGen.length](rng, `${meta.id}-p2-q${i + 1}`, qNum++));
      }
      const shGen = shuffle(rng, PHYS_SHORT_GEN);
      for (let i = 0; i < 4; i++) {
        questions.push(shGen[i % shGen.length](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
      return questions;
    }

    if (subj === 'chemistry') {
      // 12 MCQ (6 parametric + 6 curated) + 4 Curated TF + 4 Parametric Short = 20 Qs
      const pGen = shuffle(rng, CHEM_MCQ_GEN).slice(0, 6);
      for (let i = 0; i < pGen.length; i++) {
        questions.push(pGen[i](rng, `${meta.id}-p1-q${i + 1}`, qNum++));
      }
      const cMcq = pickDistinct(rng, CURATED_BANKS.chemistry.mcq, 6);
      for (let i = 0; i < cMcq.length; i++) {
        questions.push(makeCuratedMcq(rng, `${meta.id}-p1-c${i + 1}`, qNum++, cMcq[i]));
      }
      const tfs = pickDistinct(rng, CURATED_BANKS.chemistry.tf, 4);
      for (let i = 0; i < tfs.length; i++) {
        questions.push(makeCuratedTf(`${meta.id}-p2-q${i + 1}`, qNum++, tfs[i]));
      }
      const shGen = shuffle(rng, CHEM_SHORT_GEN);
      for (let i = 0; i < 4; i++) {
        questions.push(shGen[i % shGen.length](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
      return questions;
    }

    if (subj === 'biology') {
      // 12 MCQ (5 parametric + 7 curated) + 4 Curated TF + 4 Short (3 param + 1 param) = 20 Qs
      const pGen = shuffle(rng, BIO_MCQ_GEN).slice(0, 5);
      for (let i = 0; i < pGen.length; i++) {
        questions.push(pGen[i](rng, `${meta.id}-p1-q${i + 1}`, qNum++));
      }
      const cMcq = pickDistinct(rng, CURATED_BANKS.biology.mcq, 7);
      for (let i = 0; i < cMcq.length; i++) {
        questions.push(makeCuratedMcq(rng, `${meta.id}-p1-c${i + 1}`, qNum++, cMcq[i]));
      }
      const tfs = pickDistinct(rng, CURATED_BANKS.biology.tf, 4);
      for (let i = 0; i < tfs.length; i++) {
        questions.push(makeCuratedTf(`${meta.id}-p2-q${i + 1}`, qNum++, tfs[i]));
      }
      const shGen = shuffle(rng, BIO_SHORT_GEN);
      for (let i = 0; i < 4; i++) {
        questions.push(shGen[i % shGen.length](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
      return questions;
    }

    if (subj === 'dgnl') {
      // Mixed Quantitative (Math+Phys+Chem) + Logic/Language + Reading/Science TF + Short = 20 Qs
      const qLogic = pickDistinct(rng, CURATED_BANKS.dgnl.mcq, 6);
      for (let i = 0; i < qLogic.length; i++) {
        questions.push(makeCuratedMcq(rng, `${meta.id}-p1-l${i + 1}`, qNum++, qLogic[i]));
      }
      const qMath = shuffle(rng, MATH_MCQ_GEN).slice(0, 4);
      for (let i = 0; i < qMath.length; i++) {
        questions.push(qMath[i](rng, `${meta.id}-p1-m${i + 1}`, qNum++));
      }
      questions.push(pick(rng, PHYS_MCQ_GEN)(rng, `${meta.id}-p1-p1`, qNum++));
      questions.push(pick(rng, CHEM_MCQ_GEN)(rng, `${meta.id}-p1-c1`, qNum++));
      // 4 TF (2 DGNL + 1 Math + 1 Phys)
      for (let i = 0; i < CURATED_BANKS.dgnl.tf.length; i++) {
        questions.push(makeCuratedTf(`${meta.id}-p2-d${i + 1}`, qNum++, CURATED_BANKS.dgnl.tf[i]));
      }
      questions.push(pick(rng, MATH_TF_GEN)(rng, `${meta.id}-p2-m1`, qNum++));
      questions.push(pick(rng, PHYS_TF_GEN)(rng, `${meta.id}-p2-p1`, qNum++));
      // 4 Short (2 Math + 1 Phys + 1 Geo calc)
      const ms = shuffle(rng, MATH_SHORT_GEN).slice(0, 2);
      questions.push(ms[0](rng, `${meta.id}-p3-m1`, qNum++));
      questions.push(ms[1](rng, `${meta.id}-p3-m2`, qNum++));
      questions.push(pick(rng, PHYS_SHORT_GEN)(rng, `${meta.id}-p3-p1`, qNum++));
      questions.push(pick(rng, GEO_SHORT_GEN)(rng, `${meta.id}-p3-g1`, qNum++));
      return questions;
    }

    // Humanities, English, Geography, Informatics: 12 MCQ + 3 TF + 3 Short = 18 Qs
    const bank = CURATED_BANKS[subj] || CURATED_BANKS.history;
    const mcqs = pickDistinct(rng, bank.mcq, 12);
    for (let i = 0; i < mcqs.length; i++) {
      questions.push(makeCuratedMcq(rng, `${meta.id}-p1-q${i + 1}`, qNum++, mcqs[i]));
    }
    const tfs = pickDistinct(rng, bank.tf, 3);
    for (let i = 0; i < tfs.length; i++) {
      questions.push(makeCuratedTf(`${meta.id}-p2-q${i + 1}`, qNum++, tfs[i]));
    }
    if (subj === 'geography') {
      const gSh = shuffle(rng, GEO_SHORT_GEN).slice(0, 3);
      for (let i = 0; i < gSh.length; i++) {
        questions.push(gSh[i](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
    } else if (subj === 'informatics') {
      const iSh = shuffle(rng, INFO_SHORT_GEN).slice(0, 3);
      for (let i = 0; i < iSh.length; i++) {
        questions.push(iSh[i](rng, `${meta.id}-p3-q${i + 1}`, qNum++));
      }
    } else {
      const shorts = pickDistinct(rng, bank.short, 3);
      for (let i = 0; i < shorts.length; i++) {
        questions.push(makeCuratedShort(`${meta.id}-p3-q${i + 1}`, qNum++, shorts[i]));
      }
    }
    return questions;
  }

  function getCatalogSummaries() {
    return CATALOG_META.map(m => ({ ...m }));
  }

  function hasExam(id) {
    return META_BY_ID.has(String(id || ''));
  }

  function getFullExam(id) {
    const meta = META_BY_ID.get(String(id || ''));
    if (!meta) return null;
    const questions = generateQuestionsForMeta(meta);
    return {
      ...meta,
      questionCount: questions.length,
      questions
    };
  }

  function getSubjectCounts() {
    const map = {};
    for (const m of CATALOG_META) {
      map[m.subject] = (map[m.subject] || 0) + 1;
    }
    return map;
  }

  return {
    version: 'v74-220-bank',
    count: CATALOG_META.length,
    getCatalogSummaries,
    hasExam,
    getFullExam,
    getSubjectCounts
  };
});
