/* ============================================================================
 * HỌC CÙNG PHÚC K9 — EXAM TOOLS SUITE
 * 1) Pure Safe Casio-style Scientific Calculator (Deg/Rad, no eval)
 * 2) Touch/Mouse Canvas Scratchpad Drawer (preserved per exam session)
 * 3) Branded 1200x675 Score Certificate Generator (.PNG)
 * ============================================================================ */
(function (window, document) {
  'use strict';

  const STATE = {
    calcOpen: false,
    calcExpr: '',
    calcDisplay: '0',
    calcAns: 0,
    calcDeg: true,
    calcHistory: [],
    padOpen: false,
    padExamId: 'default',
    padColor: '#0f172a',
    padSize: 2.5,
    padMode: 'pen', // 'pen' | 'highlight' | 'eraser'
    padSnapshots: new Map()
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function toast(msg, type) {
    if (typeof window.PK9_TOAST === 'function') window.PK9_TOAST(msg, type);
  }

  // --------------------------------------------------------------------------
  // 1. PURE MATHEMATICAL PARSER (NO eval / Function)
  // --------------------------------------------------------------------------
  const FUNCS = {
    sin: (x, deg) => Math.sin(deg ? (x * Math.PI) / 180 : x),
    cos: (x, deg) => Math.cos(deg ? (x * Math.PI) / 180 : x),
    tan: (x, deg) => Math.tan(deg ? (x * Math.PI) / 180 : x),
    asin: (x, deg) => {
      const r = Math.asin(x);
      return deg ? (r * 180) / Math.PI : r;
    },
    acos: (x, deg) => {
      const r = Math.acos(x);
      return deg ? (r * 180) / Math.PI : r;
    },
    atan: (x, deg) => {
      const r = Math.atan(x);
      return deg ? (r * 180) / Math.PI : r;
    },
    sqrt: x => Math.sqrt(x),
    cbrt: x => Math.cbrt(x),
    log: x => Math.log10(x),
    ln: x => Math.log(x),
    abs: x => Math.abs(x),
    exp: x => Math.exp(x)
  };

  function tokenizeMath(rawExpr, lastAns) {
    let s = String(rawExpr || '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/,/g, '.')
      .trim();
    const tokens = [];
    let i = 0;

    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }

      if (/[0-9.]/.test(ch)) {
        let numStr = '';
        let dots = 0;
        while (i < s.length && /[0-9.]/.test(s[i])) {
          if (s[i] === '.') dots++;
          if (dots > 1) throw new Error('Số thập phân không hợp lệ');
          numStr += s[i++];
        }
        // Scientific notation like 1.5e-3
        if (i < s.length && (s[i] === 'e' || s[i] === 'E') && /[0-9+-]/.test(s[i + 1] || '')) {
          numStr += s[i++];
          if (s[i] === '+' || s[i] === '-') numStr += s[i++];
          while (i < s.length && /[0-9]/.test(s[i])) numStr += s[i++];
        }
        const val = Number(numStr);
        if (!Number.isFinite(val)) throw new Error('Số không hợp lệ');
        tokens.push({ t: 'num', v: val });
        continue;
      }

      if (/[a-zA-Z]/.test(ch)) {
        let id = '';
        while (i < s.length && /[a-zA-Z0-9]/.test(s[i])) id += s[i++];
        const low = id.toLowerCase();
        if (low === 'pi') tokens.push({ t: 'num', v: Math.PI });
        else if (low === 'e') tokens.push({ t: 'num', v: Math.E });
        else if (low === 'ans') tokens.push({ t: 'num', v: Number(lastAns || 0) });
        else if (Object.prototype.hasOwnProperty.call(FUNCS, low)) tokens.push({ t: 'fn', v: low });
        else throw new Error(`Ký hiệu không hỗ trợ: ${id}`);
        continue;
      }

      if ('+-*/^()%!'.includes(ch)) {
        tokens.push({ t: ch === '(' ? 'lp' : ch === ')' ? 'rp' : 'op', v: ch });
        i++;
        continue;
      }

      throw new Error(`Ký tự không hợp lệ: ${ch}`);
    }

    // Insert implicit multiplication: num|rp|! followed by num|fn|lp
    const withImplicit = [];
    for (let k = 0; k < tokens.length; k++) {
      const cur = tokens[k];
      const prev = withImplicit[withImplicit.length - 1];
      const prevIsVal = prev && (prev.t === 'num' || prev.t === 'rp' || (prev.t === 'op' && (prev.v === '!' || prev.v === '%')));
      const curStartsVal = cur.t === 'num' || cur.t === 'fn' || cur.t === 'lp';
      if (prevIsVal && curStartsVal) {
        withImplicit.push({ t: 'op', v: '*' });
      }
      withImplicit.push(cur);
    }
    return withImplicit;
  }

  function factorial(n) {
    if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Giai thừa chỉ nhận số nguyên 0–170');
    let res = 1;
    for (let k = 2; k <= n; k++) res *= k;
    return res;
  }

  function evaluateMathExpr(expr, degMode = true, lastAns = 0) {
    const tokens = tokenizeMath(expr, lastAns);
    if (!tokens.length) return 0;
    let pos = 0;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    function parseExpr() {
      let left = parseTerm();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        const op = consume().v;
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      let left = parsePower();
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
        const op = consume().v;
        const right = parsePower();
        if (op === '/' && right === 0) throw new Error('Lỗi chia cho 0');
        left = op === '*' ? left * right : left / right;
      }
      return left;
    }

    function parsePower() {
      let base = parseUnary();
      if (peek() && peek().t === 'op' && peek().v === '^') {
        consume();
        const exp = parsePower(); // right-associative
        base = Math.pow(base, exp);
      }
      return base;
    }

    function parseUnary() {
      if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) {
        const op = consume().v;
        const val = parseUnary();
        return op === '-' ? -val : val;
      }
      return parsePostfix();
    }

    function parsePostfix() {
      let val = parsePrimary();
      while (peek() && peek().t === 'op' && (peek().v === '!' || peek().v === '%')) {
        const op = consume().v;
        val = op === '!' ? factorial(val) : val / 100;
      }
      return val;
    }

    function parsePrimary() {
      const tk = peek();
      if (!tk) throw new Error('Biểu thức thiếu toán hạng');
      if (tk.t === 'num') { consume(); return tk.v; }
      if (tk.t === 'lp') {
        consume();
        const v = parseExpr();
        if (!peek() || peek().t !== 'rp') throw new Error('Thiếu dấu ngoặc đóng )');
        consume();
        return v;
      }
      if (tk.t === 'fn') {
        const fnName = consume().v;
        let arg;
        if (peek() && peek().t === 'lp') {
          consume();
          arg = parseExpr();
          if (!peek() || peek().t !== 'rp') throw new Error('Thiếu dấu ngoặc đóng )');
          consume();
        } else {
          arg = parseUnary();
        }
        const out = FUNCS[fnName](arg, degMode);
        if (!Number.isFinite(out)) throw new Error('Kết quả vô định / ngoài miền');
        return out;
      }
      throw new Error('Cú pháp biểu thức không hợp lệ');
    }

    const result = parseExpr();
    if (pos < tokens.length) throw new Error('Thừa ký tự trong biểu thức');
    if (!Number.isFinite(result)) throw new Error('Kết quả ngoài giới hạn số');
    return Math.abs(result) < 1e-13 ? 0 : Number(result.toPrecision(12));
  }

  function formatNumberResult(n) {
    if (!Number.isFinite(n)) return 'Lỗi';
    if (Math.abs(n) >= 1e12 || (n !== 0 && Math.abs(n) < 1e-8)) return n.toExponential(6);
    return String(Number(n.toFixed(10)));
  }

  // --------------------------------------------------------------------------
  // 2. CASIO SCIENTIFIC CALCULATOR MODAL/DRAWER
  // --------------------------------------------------------------------------
  const CALC_KEYS = [
    [
      { label: 'DEG/RAD', act: 'deg', cls: 'fn' },
      { label: '(', val: '(', cls: 'fn' },
      { label: ')', val: ')', cls: 'fn' },
      { label: '⌫', act: 'back', cls: 'warn' },
      { label: 'AC', act: 'clear', cls: 'danger' }
    ],
    [
      { label: 'sin', val: 'sin(', cls: 'fn' },
      { label: 'cos', val: 'cos(', cls: 'fn' },
      { label: 'tan', val: 'tan(', cls: 'fn' },
      { label: '√', val: 'sqrt(', cls: 'fn' },
      { label: 'x²', val: '^2', cls: 'fn' }
    ],
    [
      { label: 'log', val: 'log(', cls: 'fn' },
      { label: 'ln', val: 'ln(', cls: 'fn' },
      { label: 'x^y', val: '^', cls: 'fn' },
      { label: 'π', val: 'π', cls: 'fn' },
      { label: '÷', val: '÷', cls: 'op' }
    ],
    [
      { label: '7', val: '7' },
      { label: '8', val: '8' },
      { label: '9', val: '9' },
      { label: 'n!', val: '!', cls: 'fn' },
      { label: '×', val: '×', cls: 'op' }
    ],
    [
      { label: '4', val: '4' },
      { label: '5', val: '5' },
      { label: '6', val: '6' },
      { label: '%', val: '%', cls: 'fn' },
      { label: '−', val: '-', cls: 'op' }
    ],
    [
      { label: '1', val: '1' },
      { label: '2', val: '2' },
      { label: '3', val: '3' },
      { label: 'Ans', val: 'Ans', cls: 'fn' },
      { label: '+', val: '+', cls: 'op' }
    ],
    [
      { label: '0', val: '0' },
      { label: '.', val: '.' },
      { label: 'e', val: 'e', cls: 'fn' },
      { label: '📋', act: 'copy', cls: 'fn', title: 'Chép kết quả' },
      { label: '=', act: 'eq', cls: 'eq' }
    ]
  ];

  function renderCalcPanel() {
    let el = document.getElementById('pk9-calc-widget');
    if (!STATE.calcOpen) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'pk9-calc-widget';
      el.className = 'pk9-tool-float-card pk9-calc-card';
      document.body.appendChild(el);
    }
    el.innerHTML = `
      <div class="pk9-tool-float-head">
        <span>🧮 Máy Tính Khoa Học K9 (${STATE.calcDeg ? 'DEG' : 'RAD'})</span>
        <button type="button" class="pk9-tool-close-btn" data-tool-close-calc="1" aria-label="Đóng máy tính">✕</button>
      </div>
      <div class="pk9-calc-screen">
        <div class="pk9-calc-hist">${STATE.calcHistory.slice(0, 2).map(h => `<div>${esc(h)}</div>`).join('')}</div>
        <input type="text" id="pk9-calc-input" class="pk9-calc-expr-input" value="${esc(STATE.calcExpr)}" placeholder="Nhập phép tính (VD: 2*sin(30)+sqrt(16))..." />
        <div class="pk9-calc-res" id="pk9-calc-res">${esc(STATE.calcDisplay)}</div>
      </div>
      <div class="pk9-calc-grid">
        ${CALC_KEYS.flat().map(k => `
          <button type="button"
            class="pk9-calc-key ${k.cls || ''}"
            ${k.val ? `data-calc-val="${esc(k.val)}"` : ''}
            ${k.act ? `data-calc-act="${esc(k.act)}"` : ''}
            ${k.title ? `title="${esc(k.title)}"` : ''}
          >${k.act === 'deg' ? (STATE.calcDeg ? 'DEG' : 'RAD') : esc(k.label)}</button>
        `).join('')}
      </div>
    `;
  }

  function runCalcEvaluate() {
    const inputEl = document.getElementById('pk9-calc-input');
    if (inputEl) STATE.calcExpr = inputEl.value;
    if (!STATE.calcExpr.trim()) {
      STATE.calcDisplay = '0';
      const rEl = document.getElementById('pk9-calc-res');
      if (rEl) rEl.textContent = '0';
      return;
    }
    try {
      const val = evaluateMathExpr(STATE.calcExpr, STATE.calcDeg, STATE.calcAns);
      STATE.calcAns = val;
      const formatted = formatNumberResult(val);
      STATE.calcDisplay = formatted;
      STATE.calcHistory.unshift(`${STATE.calcExpr} = ${formatted}`);
      STATE.calcHistory = STATE.calcHistory.slice(0, 8);
    } catch (err) {
      STATE.calcDisplay = err?.message || 'Lỗi cú pháp';
    }
    renderCalcPanel();
  }

  // --------------------------------------------------------------------------
  // 3. INTERACTIVE TOUCH / MOUSE CANVAS SCRATCHPAD
  // --------------------------------------------------------------------------
  function saveCurrentPadSnapshot() {
    const canvas = document.getElementById('pk9-scratchpad-canvas');
    if (!canvas || !canvas.width || !canvas.height) return;
    try {
      STATE.padSnapshots.set(STATE.padExamId, canvas.toDataURL('image/png'));
    } catch {}
  }

  function restorePadSnapshot(canvas) {
    if (!canvas) return;
    const savedUrl = STATE.padSnapshots.get(STATE.padExamId);
    if (!savedUrl) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      try { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); } catch {}
    };
    img.src = savedUrl;
  }

  function renderScratchpadPanel() {
    let el = document.getElementById('pk9-pad-widget');
    if (!STATE.padOpen) {
      saveCurrentPadSnapshot();
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'pk9-pad-widget';
      el.className = 'pk9-tool-float-card pk9-pad-card';
      document.body.appendChild(el);
    }
    const colors = [
      { hex: '#0f172a', label: 'Đen' },
      { hex: '#2563eb', label: 'Xanh' },
      { hex: '#dc2626', label: 'Đỏ' },
      { hex: '#f59e0b', label: 'Vàng bút nhớ' }
    ];
    el.innerHTML = `
      <div class="pk9-tool-float-head">
        <span>✏️ Bảng Nháp Vẽ Tay</span>
        <div style="display:flex;align-items:center;gap:0.35rem;">
          <button type="button" class="pk9-pad-mini-btn ${STATE.padMode === 'pen' ? 'active' : ''}" data-pad-mode="pen" title="Bút viết">🖊️ Bút</button>
          <button type="button" class="pk9-pad-mini-btn ${STATE.padMode === 'eraser' ? 'active' : ''}" data-pad-mode="eraser" title="Tẩy">🧽 Tẩy</button>
          <button type="button" class="pk9-pad-mini-btn" data-pad-clear="1" title="Xóa sạch nháp">🗑️</button>
          <button type="button" class="pk9-tool-close-btn" data-tool-close-pad="1" aria-label="Đóng bảng nháp">✕</button>
        </div>
      </div>
      <div class="pk9-pad-colors">
        ${colors.map(c => `
          <button type="button" class="pk9-pad-swatch ${STATE.padColor === c.hex && STATE.padMode === 'pen' ? 'active' : ''}"
            data-pad-color="${c.hex}"
            style="background:${c.hex};"
            title="${c.label}"
          ></button>
        `).join('')}
        <span style="font-size:0.72rem;color:#64748b;margin-left:auto;">Kéo chuột hoặc tay để nháp công thức</span>
      </div>
      <div class="pk9-pad-canvas-wrap">
        <canvas id="pk9-scratchpad-canvas"></canvas>
      </div>
    `;

    const canvas = document.getElementById('pk9-scratchpad-canvas');
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(300, Math.round(rect.width || 420));
      canvas.height = Math.max(240, Math.round(rect.height || 300));
      restorePadSnapshot(canvas);
      bindCanvasDrawing(canvas);
    }
  }

  function bindCanvasDrawing(canvas) {
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastPt = null;

    function getPt(ev) {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((ev.clientX - r.left) / Math.max(1, r.width)) * canvas.width,
        y: ((ev.clientY - r.top) / Math.max(1, r.height)) * canvas.height
      };
    }

    canvas.addEventListener('pointerdown', ev => {
      drawing = true;
      canvas.setPointerCapture?.(ev.pointerId);
      lastPt = getPt(ev);
      ev.preventDefault();
    });
    canvas.addEventListener('pointermove', ev => {
      if (!drawing || !lastPt) return;
      const pt = getPt(ev);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (STATE.padMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 18;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        const isYellow = STATE.padColor === '#f59e0b';
        ctx.globalAlpha = isYellow ? 0.45 : 0.96;
        ctx.lineWidth = isYellow ? 12 : STATE.padSize;
        ctx.strokeStyle = STATE.padColor;
      }
      ctx.beginPath();
      ctx.moveTo(lastPt.x, lastPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.restore();
      lastPt = pt;
      ev.preventDefault();
    });
    const finish = () => {
      if (drawing) {
        drawing = false;
        lastPt = null;
        saveCurrentPadSnapshot();
      }
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
  }

  // --------------------------------------------------------------------------
  // 4. BRANDED PNG SCORE CERTIFICATE GENERATOR (1200x675)
  // --------------------------------------------------------------------------
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines = 2) {
    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(next).width > maxWidth && cur) {
        lines.push(cur);
        cur = w;
        if (lines.length >= maxLines) break;
      } else {
        cur = next;
      }
    }
    if (cur && lines.length < maxLines) lines.push(cur);
    return lines;
  }

  function downloadExamCertificatePng(opts = {}) {
    const canvas = document.createElement('canvas');
    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Obsidian Gradient Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#040914');
    bg.addColorStop(0.55, '#0b1d3a');
    bg.addColorStop(1, '#092434');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial highlights
    const glow1 = ctx.createRadialGradient(220, 120, 10, 220, 120, 380);
    glow1.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
    glow1.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    const glow2 = ctx.createRadialGradient(980, 520, 10, 980, 520, 380);
    glow2.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
    glow2.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // Gold inner certificate frame
    drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 26);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.72)';
    ctx.lineWidth = 3;
    ctx.stroke();

    drawRoundedRect(ctx, 40, 40, W - 80, H - 80, 20);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const finishRender = (logoImg) => {
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(108, 104, 38, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, 70, 66, 76, 76);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(108, 104, 39, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      const textX = logoImg ? 166 : 72;
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 17px Segoe UI, Arial, sans-serif';
      ctx.fillText('HỆ SINH THÁI LUYỆN THI 9+ • HỌC CÙNG PHÚC K9', textX, 88);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 32px Segoe UI, Arial, sans-serif';
      ctx.fillText('PHIẾU CHỨNG NHẬN KẾT QUẢ THI THỬ', textX, 128);

      // Student & SBD Strip
      drawRoundedRect(ctx, 72, 166, 720, 128, 18);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px Segoe UI, Arial, sans-serif';
      ctx.fillText('THÍ SINH THỰC HIỆN:', 96, 198);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 28px Segoe UI, Arial, sans-serif';
      const studentName = String(opts.studentName || 'Học Viên Phúc K9').slice(0, 32);
      ctx.fillText(studentName, 96, 234);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 16px Segoe UI, Arial, sans-serif';
      const sbd = String(opts.sbd || 'K9-GUEST');
      const subj = String(opts.subject || 'Tổng hợp');
      ctx.fillText(`SBD: ${sbd}   •   Môn: ${subj}   •   Đúng: ${opts.correct || 0}/${opts.total || 0} câu`, 96, 268);

      // Exam Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px Segoe UI, Arial, sans-serif';
      ctx.fillText('ĐỀ THI ĐÃ HOÀN THÀNH:', 72, 330);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Segoe UI, Arial, sans-serif';
      const titleLines = wrapCanvasText(ctx, opts.examTitle || 'Đề luyện thi chuẩn GDPT 2018', 720, 2);
      titleLines.forEach((ln, idx) => ctx.fillText(ln, 72, 362 + idx * 30));

      // Topic Breakdown Bars (up to 4)
      const topics = Array.isArray(opts.topicStats) ? opts.topicStats.slice(0, 4) : [];
      if (topics.length) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px Segoe UI, Arial, sans-serif';
        ctx.fillText('CHẨN ĐOÁN THEO CHUYÊN ĐỀ:', 72, 434);
        topics.forEach((t, idx) => {
          const y = 458 + idx * 34;
          const pct = Math.max(0, Math.min(100, Number(t.accuracy ?? 0)));
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '600 15px Segoe UI, Arial, sans-serif';
          ctx.fillText(String(t.topic || '').slice(0, 28), 72, y);

          drawRoundedRect(ctx, 355, y - 13, 330, 14, 7);
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fill();

          drawRoundedRect(ctx, 355, y - 13, Math.max(12, Math.round((330 * pct) / 100)), 14, 7);
          ctx.fillStyle = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
          ctx.fill();

          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px Segoe UI, Arial, sans-serif';
          ctx.fillText(`${pct}%`, 698, y);
        });
      }

      // Big Score Card on Right
      drawRoundedRect(ctx, 830, 166, 298, 390, 24);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const scoreVal = Number(opts.score || 0);
      const rankLabel = scoreVal >= 9 ? 'XUẤT SẮC 9+' : scoreVal >= 8 ? 'GIỎI • BỨT PHÁ' : scoreVal >= 6.5 ? 'KHÁ TỐT' : 'CỐ GẮNG THÊM';
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 16px Segoe UI, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ĐIỂM SỐ THANG 10', 979, 214);

      // Score Ring
      ctx.beginPath();
      ctx.arc(979, 326, 86, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.strokeStyle = scoreVal >= 8 ? '#10b981' : '#38bdf8';
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 54px Segoe UI, Arial, sans-serif';
      ctx.fillText(scoreVal.toFixed(2), 979, 344);

      drawRoundedRect(ctx, 874, 440, 210, 38, 19);
      ctx.fillStyle = scoreVal >= 8 ? 'rgba(16, 185, 129, 0.24)' : 'rgba(56, 189, 248, 0.22)';
      ctx.fill();
      ctx.fillStyle = scoreVal >= 8 ? '#34d399' : '#38bdf8';
      ctx.font = 'bold 16px Segoe UI, Arial, sans-serif';
      ctx.fillText(rankLabel, 979, 465);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px Segoe UI, Arial, sans-serif';
      ctx.fillText(`Điểm thô: ${opts.rawScore ?? scoreVal}/${opts.maxScore ?? 10}`, 979, 514);
      ctx.fillText(new Date().toLocaleDateString('vi-VN'), 979, 538);

      // Footer Bar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748b';
      ctx.font = '600 14px Segoe UI, Arial, sans-serif';
      ctx.fillText('Xác thực chấm điểm tự động tại thanhphuc.vercel.app • HỌC CÙNG PHÚC K9', 72, 622);

      const safeSlug = String(opts.examId || 'ket-qua').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      const a = document.createElement('a');
      a.download = `Phieu_Diem_PHUC_K9_${safeSlug}.png`;
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('🏅 Đã tải Phiếu Chứng Nhận Kết Quả (.PNG)!', 'success');
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => finishRender(img);
    img.onerror = () => finishRender(null);
    img.src = '/assets/logo-phuc-k9.png';
  }

  // --------------------------------------------------------------------------
  // GLOBAL EVENT BINDINGS FOR TOOLS
  // --------------------------------------------------------------------------
  document.addEventListener('click', e => {
    if (e.target.closest('[data-tool-close-calc]')) {
      STATE.calcOpen = false;
      renderCalcPanel();
      return;
    }
    if (e.target.closest('[data-tool-close-pad]')) {
      STATE.padOpen = false;
      renderScratchpadPanel();
      return;
    }

    const calcVal = e.target.closest('[data-calc-val]');
    if (calcVal) {
      STATE.calcExpr += calcVal.getAttribute('data-calc-val') || '';
      renderCalcPanel();
      document.getElementById('pk9-calc-input')?.focus();
      return;
    }

    const calcAct = e.target.closest('[data-calc-act]');
    if (calcAct) {
      const act = calcAct.getAttribute('data-calc-act');
      if (act === 'clear') {
        STATE.calcExpr = '';
        STATE.calcDisplay = '0';
        renderCalcPanel();
      } else if (act === 'back') {
        STATE.calcExpr = STATE.calcExpr.slice(0, -1);
        renderCalcPanel();
      } else if (act === 'deg') {
        STATE.calcDeg = !STATE.calcDeg;
        renderCalcPanel();
      } else if (act === 'eq') {
        runCalcEvaluate();
      } else if (act === 'copy') {
        try {
          navigator.clipboard?.writeText(String(STATE.calcDisplay));
          toast(`📋 Đã chép kết quả: ${STATE.calcDisplay}`, 'info');
        } catch {}
      }
      return;
    }

    const padColorBtn = e.target.closest('[data-pad-color]');
    if (padColorBtn) {
      STATE.padColor = padColorBtn.getAttribute('data-pad-color') || '#0f172a';
      STATE.padMode = 'pen';
      saveCurrentPadSnapshot();
      renderScratchpadPanel();
      return;
    }

    const padModeBtn = e.target.closest('[data-pad-mode]');
    if (padModeBtn) {
      STATE.padMode = padModeBtn.getAttribute('data-pad-mode') || 'pen';
      saveCurrentPadSnapshot();
      renderScratchpadPanel();
      return;
    }

    if (e.target.closest('[data-pad-clear]')) {
      STATE.padSnapshots.delete(STATE.padExamId);
      const canvas = document.getElementById('pk9-scratchpad-canvas');
      if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'pk9-calc-input' && e.key === 'Enter') {
      e.preventDefault();
      runCalcEvaluate();
    }
  });

  document.addEventListener('input', e => {
    if (e.target && e.target.id === 'pk9-calc-input') {
      STATE.calcExpr = e.target.value;
    }
  });

  window.PK9_EXAM_TOOLS = {
    evaluateMathExpr,
    toggleCalc() {
      STATE.calcOpen = !STATE.calcOpen;
      renderCalcPanel();
    },
    closeCalc() {
      STATE.calcOpen = false;
      renderCalcPanel();
    },
    toggleScratchpad(examId = 'default') {
      if (STATE.padOpen && STATE.padExamId !== String(examId)) {
        saveCurrentPadSnapshot();
      }
      STATE.padExamId = String(examId || 'default');
      STATE.padOpen = !STATE.padOpen;
      renderScratchpadPanel();
    },
    closeScratchpad() {
      STATE.padOpen = false;
      renderScratchpadPanel();
    },
    downloadCertificate: downloadExamCertificatePng
  };
})(window, document);
