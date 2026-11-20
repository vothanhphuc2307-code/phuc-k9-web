'use strict';

const assert = require('assert');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Minimal RFC 6455 client for local Chrome DevTools Protocol (zero dependencies)
class MiniCdp {
  constructor(wsUrl) {
    this.wsUrl = new URL(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.buf = Buffer.alloc(0);
  }
  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      const sock = net.createConnection({ host: this.wsUrl.hostname, port: Number(this.wsUrl.port) }, () => {
        sock.write(
          `GET ${this.wsUrl.pathname}${this.wsUrl.search} HTTP/1.1\r\n` +
          `Host: ${this.wsUrl.host}\r\n` +
          `Upgrade: websocket\r\n` +
          `Connection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${key}\r\n` +
          `Sec-WebSocket-Version: 13\r\n\r\n`
        );
      });
      this.sock = sock;
      let upgraded = false;
      sock.on('data', chunk => {
        this.buf = Buffer.concat([this.buf, chunk]);
        if (!upgraded) {
          const idx = this.buf.indexOf('\r\n\r\n');
          if (idx === -1) return;
          upgraded = true;
          this.buf = this.buf.slice(idx + 4);
          resolve();
        }
        this._drainFrames();
      });
      sock.on('error', reject);
    });
  }
  _drainFrames() {
    while (this.buf.length >= 2) {
      const b0 = this.buf[0];
      const b1 = this.buf[1];
      const opcode = b0 & 0x0f;
      let len = b1 & 0x7f;
      let off = 2;
      if (len === 126) {
        if (this.buf.length < 4) return;
        len = this.buf.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (this.buf.length < 10) return;
        len = Number(this.buf.readBigUInt64BE(2));
        off = 10;
      }
      if (this.buf.length < off + len) return;
      const payload = this.buf.slice(off, off + len);
      this.buf = this.buf.slice(off + len);
      if (opcode === 1) {
        const msg = JSON.parse(payload.toString('utf8'));
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        } else if (msg.method) {
          this.events.push(msg);
        }
      }
    }
  }
  send(method, params = {}) {
    const id = this.nextId++;
    const data = Buffer.from(JSON.stringify({ id, method, params }), 'utf8');
    const mask = crypto.randomBytes(4);
    let header;
    if (data.length < 126) {
      header = Buffer.alloc(6);
      header[0] = 0x81;
      header[1] = 0x80 | data.length;
      mask.copy(header, 2);
    } else if (data.length < 65536) {
      header = Buffer.alloc(8);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(data.length, 2);
      mask.copy(header, 4);
    } else {
      header = Buffer.alloc(14);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(data.length), 2);
      mask.copy(header, 10);
    }
    const masked = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
    this.sock.write(Buffer.concat([header, masked]));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
  }
  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(`JS Exception: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }
  close() {
    try { this.sock.destroy(); } catch {}
  }
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let s = '';
      res.on('data', d => (s += d));
      res.on('end', () => {
        try { resolve(JSON.parse(s)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  delete globalThis.__PK9_MEMORY_REDIS__;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const server = require('../server');
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`🌐 Live server: ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9229;
  const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'pk9-cdp-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tmpProfile}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let cdp = null;
  try {
    let targets = null;
    for (let i = 0; i < 40; i++) {
      try {
        targets = await httpGetJson(`http://127.0.0.1:${cdpPort}/json`);
        if (Array.isArray(targets) && targets.find(t => t.type === 'page')) break;
      } catch {}
      await wait(150);
    }
    const pageTarget = targets.find(t => t.type === 'page');
    assert(pageTarget && pageTarget.webSocketDebuggerUrl, 'Chrome page target available');

    cdp = new MiniCdp(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });

    // 1. Navigate to home page & wait for full app boot (poll up to 10s for scripts/CDN)
    await cdp.send('Page.navigate', { url: `${baseUrl}/` });
    let bootCheck = null;
    for (let i = 0; i < 40; i++) {
      await wait(250);
      bootCheck = await cdp.eval(`(() => ({
        readyState: document.readyState,
        hasApp: typeof window.switchTab === 'function',
        hasRpg: typeof window.PK9_RPG === 'object',
        hasBxh: typeof window.PK9_BXH_ECOSYSTEM === 'object',
        hasExamCenter: typeof window.PK9_EXAM_CENTER === 'object',
        title: document.title
      }))()`);
      if (bootCheck.hasApp && bootCheck.hasRpg && bootCheck.hasBxh && bootCheck.hasExamCenter) break;
    }
    const bootEx = cdp.events.filter(ev => ev.method === 'Runtime.exceptionThrown');
    if (bootEx.length) console.error('Boot exceptions:', JSON.stringify(bootEx, null, 2));
    console.log('  ✅ Boot check:', JSON.stringify(bootCheck));
    assert.strictEqual(bootCheck.hasApp, true);
    assert.strictEqual(bootCheck.hasRpg, true);
    assert.strictEqual(bootCheck.hasBxh, true);
    assert.strictEqual(bootCheck.hasExamCenter, true);

    // 2. Register Student A in browser context via fetch & reload auth
    const regResult = await cdp.eval(`(async () => {
      const me = await fetch('/api/auth?action=me', { credentials: 'include' }).then(r => r.json());
      const r1 = await fetch('/api/auth?action=register', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': me.csrf || '' },
        body: JSON.stringify({ username: 'browser_a', display_name: 'Phạm Bảo Anh', password: 'Password123', preferred_grade: '2K9', school: 'THPT Chuyên Hà Nội - Amsterdam' })
      }).then(r => r.json());
      // Complete 5 valid 25p Co-Study Pomodoros (125m <= 150m daily cap) -> 100 ĐXH & legitimately unlocks Badge #23 ("Bạn Đồng Hành 9+") for real R3 Drag-and-Drop!
      let totalDxh = 0;
      for (let k = 1; k <= 5; k++) {
        const pk = await fetch('/api/dashboard?action=rpg-pomodoro-complete', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': r1.csrf || '' },
          body: JSON.stringify({ duration_min: 25, co_study: true, checkin_note: 'Đã luyện xong trọn vẹn phiên học #' + k + ' chuyên đề Tích phân & Oxyz 9+!' })
        }).then(r => r.json());
        totalDxh += Number(pk.dxh_earned || 0);
      }
      await window.PK9_REFRESH_AUTH_AND_LEADERBOARD();
      await window.PK9_RPG.loadMeta('2K9');
      return { ok: r1.ok, sbd: r1.user?.rpg?.sbd, dxh: totalDxh };
    })()`);
    console.log('  ✅ Browser Register + 5x Co-Study Pomodoro (Unlocks Badge #23):', JSON.stringify(regResult));
    assert.strictEqual(regResult.ok, true);
    assert.strictEqual(regResult.dxh, 100);

    // 3. Switch to Leaderboard tab & inspect R1 UI + Search Focus Preservation!
    const lbUi = await cdp.eval(`(async () => {
      window.switchTab('leaderboard', { force: true });
      await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true });
      window.PK9_BXH_ECOSYSTEM.renderLeaderboardTab();
      const root = document.getElementById('tab-leaderboard');
      const chestsGrid = root.querySelector('.pk9-bxh-chests-grid');
      const gridStyle = chestsGrid ? getComputedStyle(chestsGrid).display : '';
      const chestBoxes = root.querySelectorAll('.pk9-bxh-chest-box').length;
      const gradeBtns = root.querySelectorAll('[data-bxh-set-grade]').length;
      const divBtns = root.querySelectorAll('[data-bxh-set-division]').length;

      // Test search input does NOT lose focus on typing!
      const searchInput = document.getElementById('pk9-lb-search-input');
      searchInput.focus();
      searchInput.value = 'Bảo Anh';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      const keptFocus = document.activeElement === searchInput;

      // Open Quick Inspect Drawer by clicking own row & poll deterministically for 4-tier profile render
      const row = root.querySelector('[data-inspect-profile]');
      row.click();
      let has4Tiers = false;
      for (let t = 0; t < 40; t++) {
        await new Promise(r => setTimeout(r, 100));
        if (document.getElementById('pk9-scanned-card-modal')?.textContent?.includes('TẦNG 4 • BẢNG 8 CHỈ SỐ')) {
          has4Tiers = true;
          break;
        }
      }
      const drawerOpen = Boolean(document.getElementById('pk9-scanned-card-modal'));
      // Close with Escape key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const closedByEsc = !document.getElementById('pk9-scanned-card-modal');

      return { gridStyle, chestBoxes, gradeBtns, divBtns, keptFocus, drawerOpen, has4Tiers, closedByEsc };
    })()`);
    console.log('  ✅ R1 BXH + Search Focus + R2 Quick Inspect Drawer:', JSON.stringify(lbUi));
    assert.strictEqual(lbUi.gridStyle, 'grid', '4-Chest Grid uses CSS display:grid');
    assert.strictEqual(lbUi.chestBoxes, 4);
    assert.strictEqual(lbUi.gradeBtns, 5);
    assert.strictEqual(lbUi.divBtns, 6);
    assert.strictEqual(lbUi.keptFocus, true, 'Search input keeps focus when typing');
    assert.strictEqual(lbUi.drawerOpen, true);
    assert.strictEqual(lbUi.has4Tiers, true);
    assert.strictEqual(lbUi.closedByEsc, true, 'Escape key closes R2 Quick Inspect Drawer');

    // 4. Switch to ID Card / R3 Showcase Tab, test Drag-and-Drop, Privacy Settings (incl. Pomodoro CoStudy), & Canvas PNG generation (9:16 & 16:9)
    const r3Ui = await cdp.eval(`(async () => {
      window.switchTab('idcard', { force: true });
      await new Promise(r => setTimeout(r, 200));
      const root = document.getElementById('tab-idcard');
      const badgeItems = root.querySelectorAll('.pk9-r3-badge-item').length;
      const presetBtns = root.querySelectorAll('[data-r3-apply-preset]').length;
      const hasPomoPriv = Boolean(document.getElementById('pk9-r2-priv-pomo'));
      const hasExport916 = Boolean(root.querySelector('[data-r3-export-png="9:16"]'));
      const hasExport169 = Boolean(root.querySelector('[data-r3-export-png="16:9"]'));

      // Verify Desktop Drag-and-Drop .drag-over visual state & drop assignment
      const unlockedItem = root.querySelector('.pk9-r3-badge-item.is-unlocked');
      const heroDropZone = root.querySelector('[data-r3-drop-zone="hero"]');
      let dragOverApplied = false;
      let droppedHero = false;
      if (unlockedItem && heroDropZone) {
        const dt = new DataTransfer();
        const bid = unlockedItem.getAttribute('data-r3-drag-badge') || '';
        dt.setData('text/plain', bid);
        unlockedItem.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
        heroDropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
        dragOverApplied = heroDropZone.classList.contains('drag-over');
        heroDropZone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
        await new Promise(r => setTimeout(r, 400));
        droppedHero = !heroDropZone.classList.contains('drag-over');
      }

      // Trigger PNG generation & deterministically await both Promises!
      let exportedFiles = [];
      const origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { if (this.download) exportedFiles.push(this.download); };
      const p916 = await window.PK9_BXH_ECOSYSTEM.exportNextGenStudentCardPng('9:16');
      const p169 = await window.PK9_BXH_ECOSYSTEM.exportNextGenStudentCardPng('16:9');
      HTMLAnchorElement.prototype.click = origClick;
      return {
        badgeItems, presetBtns, hasPomoPriv, hasExport916, hasExport169,
        dragOverApplied, droppedHero, exportedFiles,
        w916: p916?.width, h916: p916?.height, hasPng916: Boolean(p916?.dataUrl?.startsWith('data:image/png;base64,')),
        w169: p169?.width, h169: p169?.height, hasPng169: Boolean(p169?.dataUrl?.startsWith('data:image/png;base64,')),
        png916: ${process.env.PK9_DUMP_PNG_DIR ? 'p916?.dataUrl || ""' : '""'},
        png169: ${process.env.PK9_DUMP_PNG_DIR ? 'p169?.dataUrl || ""' : '""'}
      };
    })()`);
    if (process.env.PK9_DUMP_PNG_DIR && r3Ui.png916 && r3Ui.png169) {
      fs.mkdirSync(process.env.PK9_DUMP_PNG_DIR, { recursive: true });
      fs.writeFileSync(path.join(process.env.PK9_DUMP_PNG_DIR, 'card-9x16.png'), Buffer.from(r3Ui.png916.split(',')[1], 'base64'));
      fs.writeFileSync(path.join(process.env.PK9_DUMP_PNG_DIR, 'card-16x9.png'), Buffer.from(r3Ui.png169.split(',')[1], 'base64'));
    }
    const { png916: _omit1, png169: _omit2, ...r3Summary } = r3Ui;
    console.log('  ✅ R3 Tủ Kính Thành Tựu + Drag&Drop + 24 Badges + .PNG 9:16 & 16:9:', JSON.stringify(r3Summary));
    assert.strictEqual(r3Ui.badgeItems, 24);
    assert.strictEqual(r3Ui.presetBtns, 4);
    assert.strictEqual(r3Ui.hasPomoPriv, true);
    assert.strictEqual(r3Ui.hasExport916, true);
    assert.strictEqual(r3Ui.hasExport169, true);
    assert.strictEqual(r3Ui.dragOverApplied, true, 'Desktop Drag-and-Drop toggles .drag-over highlight');
    assert.strictEqual(r3Ui.exportedFiles.length, 2, 'Both 9:16 and 16:9 PNGs rendered & generated cleanly');
    assert.strictEqual(r3Ui.w916, 720);
    assert.strictEqual(r3Ui.h916, 1280);
    assert.strictEqual(r3Ui.w169, 1280);
    assert.strictEqual(r3Ui.h169, 720);
    assert.strictEqual(r3Ui.hasPng916, true);
    assert.strictEqual(r3Ui.hasPng169, true);

    // 5. Switch to Planner (Pomodoro Cộng Hưởng), AI (Dynamic 2 Câu Biến Thể + Reroll), & Docs (PDF Pro +10 ĐXH note box) tabs
    const r4Ui = await cdp.eval(`(async () => {
      window.switchTab('planner', { force: true });
      await new Promise(r => setTimeout(r, 150));
      const hasPomoPanel = Boolean(document.getElementById('pk9-r4-pomodoro-costudy-panel'));
      const hasPomoNote = Boolean(document.getElementById('pk9-r4-pomo-note'));

      window.switchTab('ai', { force: true });
      await new Promise(r => setTimeout(r, 150));
      const hasAiPanel = Boolean(document.getElementById('pk9-r4-ai-variant-panel'));
      document.querySelector('[data-r4-ai-verify-trigger]')?.click();
      await new Promise(r => setTimeout(r, 80));
      const pair1Ids = (window.PK9_BXH_ECOSYSTEM.UI.aiCurrentPair || []).map(x => x.id).join(',');
      document.querySelector('[data-r4-ai-reroll]')?.click();
      await new Promise(r => setTimeout(r, 80));
      const pair2Ids = (window.PK9_BXH_ECOSYSTEM.UI.aiCurrentPair || []).map(x => x.id).join(',');

      window.switchTab('docs', { force: true });
      await new Promise(r => setTimeout(r, 150));
      const hasPdfNoteBtn = Boolean(document.querySelector('[data-pdf-toggle-note]'));

      return { hasPomoPanel, hasPomoNote, hasAiPanel, pair1Ids, pair2Ids, hasPdfNoteBtn };
    })()`);
    console.log('  ✅ R4 Pomodoro Co-Study, Dynamic AI Variants & PDF Pro Note UI:', JSON.stringify(r4Ui));
    assert.strictEqual(r4Ui.hasPomoPanel, true);
    assert.strictEqual(r4Ui.hasPomoNote, true);
    assert.strictEqual(r4Ui.hasAiPanel, true);
    assert(r4Ui.pair1Ids.length > 0 && r4Ui.pair2Ids.length > 0, 'Dynamic AI variant pool picks 2 questions');
    assert.strictEqual(r4Ui.hasPdfNoteBtn, true, 'PDF Pro tab exposes note check-in button for +10 ĐXH');

    // 6. Test direct navigation to /u/[SBD] public alias route!
    await cdp.send('Page.navigate', { url: `${baseUrl}/u/${encodeURIComponent(regResult.sbd)}` });
    let aliasCheck = null;
    for (let i = 0; i < 40; i++) {
      await wait(200);
      aliasCheck = await cdp.eval(`(() => ({
        modalOpen: Boolean(document.getElementById('pk9-scanned-card-modal')),
        textHasSbd: Boolean(document.getElementById('pk9-scanned-card-modal')?.textContent?.includes(${JSON.stringify(regResult.sbd)})),
        refSaved: localStorage.getItem('pk9_qr_referral_sbd')
      }))()`);
      if (aliasCheck.modalOpen && aliasCheck.textHasSbd) break;
    }
    console.log('  ✅ Direct /u/[SBD] Public Profile Route & Referral Capture:', JSON.stringify(aliasCheck));
    assert.strictEqual(aliasCheck.modalOpen, true);
    assert.strictEqual(aliasCheck.textHasSbd, true);
    assert.strictEqual(aliasCheck.refSaved, regResult.sbd);

    // 7. Mobile Viewport (390x844) Bottom Sheet Layout & Touch Swipe-Down Close + URL Cleanup!
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await wait(150);
    const mobileCheck = await cdp.eval(`(async () => {
      window.PK9_BXH_ECOSYSTEM.closePublicProfileModal();
      window.history.replaceState({}, '', '/u/${regResult.sbd}');
      window.PK9_BXH_ECOSYSTEM.openPublicProfileInspector({ sbd: '${regResult.sbd}', mode: 'drawer' });
      let ready = false;
      for (let t = 0; t < 40; t++) {
        await new Promise(r => setTimeout(r, 100));
        if (document.getElementById('pk9-scanned-card-modal')?.textContent?.includes('TẦNG 4 • BẢNG 8 CHỈ SỐ')) {
          ready = true;
          break;
        }
      }
      if (ready) await new Promise(r => setTimeout(r, 280)); // let 220ms pk9SheetSlideUp finish
      const modal = document.getElementById('pk9-scanned-card-modal');
      const dialog = modal?.querySelector('.pk9-scanned-card-dialog');
      const handle = modal?.querySelector('.pk9-mobile-sheet-handle');
      const rect = dialog ? dialog.getBoundingClientRect() : null;
      const handleDisplay = handle ? getComputedStyle(handle).display : 'none';

      // Simulate touch swipe-down gesture (>95px downward drag from top of sheet)
      if (dialog) {
        const mkTouch = y => (typeof Touch === 'function' ? new Touch({ identifier: 1, target: dialog, clientX: 195, clientY: y }) : { clientY: y });
        const tsEv = new Event('touchstart', { bubbles: true });
        Object.defineProperty(tsEv, 'touches', { value: [mkTouch(220)] });
        dialog.dispatchEvent(tsEv);
        const teEv = new Event('touchend', { bubbles: true });
        Object.defineProperty(teEv, 'changedTouches', { value: [mkTouch(420)] });
        dialog.dispatchEvent(teEv);
      }
      const closedBySwipe = !document.getElementById('pk9-scanned-card-modal');
      const cleanedPath = window.location.pathname;
      return {
        ready,
        handleDisplay,
        bottom: rect ? Math.round(rect.bottom) : 0,
        height: rect ? Math.round(rect.height) : 0,
        closedBySwipe,
        cleanedPath
      };
    })()`);
    console.log('  ✅ Mobile 390x844 Bottom Sheet + Swipe-Down + URL Cleanup:', JSON.stringify(mobileCheck));
    assert.strictEqual(mobileCheck.ready, true);
    assert.notStrictEqual(mobileCheck.handleDisplay, 'none', 'Mobile Bottom Sheet displays grab handle');
    assert(Math.abs(mobileCheck.bottom - 844) <= 2, `Bottom Sheet docks flush to bottom of 844px viewport (got bottom=${mobileCheck.bottom})`);
    assert(mobileCheck.height > 200 && mobileCheck.height <= 740, `Bottom Sheet height fits <= 84vh (got ${mobileCheck.height})`);
    assert.strictEqual(mobileCheck.closedBySwipe, true, 'Swipe-down gesture closes Mobile Bottom Sheet');
    assert.strictEqual(mobileCheck.cleanedPath, '/', 'Swipe-down cleans /u/:sbd URL back to /');

    // 8. Check for any uncaught runtime exceptions during entire browser session (Desktop + Mobile)
    const exceptions = cdp.events.filter(ev => ev.method === 'Runtime.exceptionThrown');
    assert.strictEqual(exceptions.length, 0, `Uncaught browser exceptions: ${JSON.stringify(exceptions)}`);
    console.log('  ✅ Zero uncaught browser runtime exceptions across Desktop + Mobile E2E flows!');
    console.log('\n🎉 ALL HEADLESS CHROME BROWSER E2E TESTS PASSED!');
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGKILL'); } catch {}
    await new Promise(r => server.close(r));
    try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch {}
  }
})().catch(err => {
  console.error('❌ BROWSER TEST FAILED:', err);
  process.exit(1);
});
