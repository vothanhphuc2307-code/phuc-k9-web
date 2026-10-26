(function () {
  'use strict';
  if (window.__phucExamCenterV1) return;
  window.__phucExamCenterV1 = true;

  const API = '/api/exams';
  const $ = (id, root = document) => root.getElementById ? root.getElementById(id) : root.querySelector('#' + id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function tableMarkup(table) {
    if (!Array.isArray(table) || !table.length) return '';
    const rows = table.slice(0, 30).map(row => Array.isArray(row)
      ? '<tr>' + row.slice(0, 12).map(cell => '<td>' + esc(cell) + '</td>').join('') + '</tr>'
      : '').join('');
    return rows ? '<div class="pec-question-table-wrap"><table class="pec-question-table"><tbody>' + rows + '</tbody></table></div>' : '';
  }
  function typesetMath(root) {
    if (!root) return;
    let retries = 0;
    const run = () => {
      if (window.MathJax?.typesetPromise) { window.MathJax.typesetPromise([root]).catch(() => {}); return; }
      if (retries++ < 12) window.setTimeout(run, 250);
    };
    run();
  }
  const getAccount = () => window.phucAccount || {};
  const getUserKey = () => String(getAccount().user?.username || 'guest').toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  const activeKey = () => 'phuc_exam_active_v1:' + getUserKey();
  const snapshotKey = id => 'phuc_exam_snapshot_v1:' + String(id || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const csrfHeaders = () => ({'Content-Type':'application/json','Accept':'application/json','X-CSRF-Token':String(getAccount().csrf || '')});
  let panel, searchBox, exams = [], active = null, timer = null, saveTimer = null, loading = false;

  async function request(url, options = {}) {
    const response = await fetch(url, {credentials:'same-origin', cache:'no-store', ...options});
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { throw new Error('Máy chủ trả về dữ liệu không phải JSON.'); }
    if (!response.ok || data?.ok === false) throw new Error(data?.message || ('HTTP ' + response.status));
    return data;
  }
  function toast(message) { try { window.phucToast?.(message); } catch {} }
  function authenticated() { return !!getAccount().authenticated; }
  function showLogin() { if (typeof window.openAuthModal === 'function') window.openAuthModal('login'); else toast('Hãy đăng nhập trước khi bắt đầu thi.'); }
  function isAdmin() { const a=getAccount(); return !!(a.isAdmin || a.is_admin || window.__phucIsAdmin); }
  function localRead(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
  function localWrite(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
  function setStatus(text, kind='info') {
    const el = $('pec-save-status');
    if (!el) return;
    el.textContent = text;
    el.className = 'pec-save-status' + (kind === 'error' ? ' pec-no' : kind === 'ok' ? ' pec-ok' : '');
  }

  function mountStudentPanel() {
    const tab = $('tab-exam-bank');
    const oldList = $('exam-bank-list');
    if (!tab || !oldList || $('phuc-server-exam-bank')) return;
    panel = document.createElement('section');
    panel.id = 'phuc-server-exam-bank';
    panel.innerHTML = `
      <div class="pec-head"><div><div class="pec-eyebrow">SERVER EXAM CENTER</div><h3 class="pec-title">Ngân hàng đề quản lý</h3><p class="pec-sub">Đề được lưu ở backend, chấm bằng dữ liệu phía máy chủ và có thể khôi phục lượt thi khi tải lại trang. Đề còn câu chưa được rà soát sẽ không hiển thị ở đây.</p></div><div class="pec-card-actions"><button type="button" class="pec-btn" data-pec-history><i class="fa-solid fa-clock-rotate-left"></i> Lịch sử thi</button><button type="button" class="pec-btn" data-pec-resume hidden><i class="fa-solid fa-arrow-rotate-right"></i> Tiếp tục bài đang làm</button><button type="button" class="pec-btn" data-pec-refresh><i class="fa-solid fa-rotate"></i> Tải lại</button></div></div>
      <div class="pec-toolbar"><input id="pec-exam-search" class="pec-search" type="search" placeholder="Tìm theo tên đề, môn học hoặc năm…" aria-label="Tìm kiếm đề"><span class="pec-tags" style="align-items:center">Đề hợp lệ mới xuất hiện sau khi Admin rà soát</span></div>
      <div id="pec-bank-message" class="pec-notice">Đang tải danh sách đề…</div>
      <div id="pec-exam-grid" class="pec-grid" aria-live="polite"></div>
      <div id="pec-player-host" style="margin-top:12px"></div>`;
    oldList.parentElement?.insertBefore(panel, oldList);
    searchBox = $('pec-exam-search');
    searchBox?.addEventListener('input', () => renderExamCards());
    panel.querySelector('[data-pec-refresh]')?.addEventListener('click', loadExams);
    panel.querySelector('[data-pec-history]')?.addEventListener('click', loadHistory);
    panel.querySelector('[data-pec-resume]')?.addEventListener('click', resumeLast);
    panel.addEventListener('click', onStudentClick);
    loadExams();
    resumeLast(true);
  }

  async function loadExams() {
    if (!panel || loading) return;
    loading = true;
    const message = $('pec-bank-message');
    if (message) { message.hidden = false; message.className='pec-notice'; message.textContent='Đang tải danh sách đề…'; }
    try {
      const data = await request(API + '?action=list');
      exams = Array.isArray(data.exams) ? data.exams : [];
      renderExamCards();
      if (message) {
        message.hidden = exams.length > 0;
        message.textContent = exams.length ? '' : 'Chưa có đề đủ điều kiện công khai. Admin cần kiểm tra đáp án, hình minh họa và lời giải rồi mới xuất bản.';
      }
    } catch (error) {
      if (message) { message.hidden=false; message.className='pec-error'; message.textContent='Không tải được ngân hàng đề: ' + error.message; }
    } finally { loading = false; }
  }

  function renderExamCards() {
    const grid = $('pec-exam-grid'); if (!grid) return;
    const term = String(searchBox?.value || '').trim().toLowerCase();
    const rows = exams.filter(e => [e.title,e.subject,e.grade,e.year,e.examType,e.source,e.periodLabel].some(v => String(v||'').toLowerCase().includes(term)));
    if (!rows.length) { grid.innerHTML = exams.length ? '<div class="pec-empty" style="grid-column:1/-1">Không có đề khớp từ khóa.</div>' : ''; return; }
    grid.innerHTML = rows.map(e => {
      const count = Array.isArray(e.questions) ? e.questions.length : Number(e.questionCount || 0);
      const subject = ({math:'Toán',biology:'Sinh học',chemistry:'Hóa học',physics:'Vật lý',english:'Tiếng Anh'}[String(e.subject||'').toLowerCase()] || e.subject || 'Môn học');
      return `<article class="pec-card"><div class="pec-tags"><span class="pec-tag">${esc(subject)}</span><span class="pec-tag">Lớp ${esc(e.grade||'—')}</span><span class="pec-tag">${esc(e.year||'—')}</span></div><h4>${esc(e.title||'Đề chưa đặt tên')}</h4><p class="pec-sub">${esc(e.periodLabel||e.source||'Đề luyện tập')}</p><div class="pec-tags"><span><i class="fa-regular fa-clock"></i> ${esc(e.duration||60)} phút</span><span><i class="fa-solid fa-list-ol"></i> ${count} câu</span></div><div class="pec-card-actions"><button type="button" class="pec-btn primary" data-pec-start="${esc(e.id)}"><i class="fa-solid fa-play"></i> Bắt đầu</button></div></article>`;
    }).join('');
  }

  function onStudentClick(event) {
    const start = event.target.closest('[data-pec-start]');
    if (start) startExam(start.dataset.pecStart);
    const nav = event.target.closest('[data-pec-qnav]');
    if (nav && active) { active.index = Math.max(0,Math.min(active.exam.questions.length-1,Number(nav.dataset.pecQnav))); renderPlayer(); }
    const flag = event.target.closest('[data-pec-flag]');
    if (flag && active) { const id=active.exam.questions[active.index].id; active.marked[id]=!active.marked[id]; saveLocal(); renderPlayer(); }
    const opt = event.target.closest('[data-pec-answer]');
    if (opt && active) { const q=active.exam.questions[active.index]; active.answers[q.id]=opt.dataset.pecAnswer; answerChanged(); renderPlayer(); }
    const tf = event.target.closest('[data-pec-tf]');
    if (tf && active) { const q=active.exam.questions[active.index]; const arr=Array.isArray(active.answers[q.id])?active.answers[q.id].slice():[]; const i=Number(tf.dataset.index); while(arr.length<q.statements.length)arr.push(null); const next=tf.dataset.pecTf==='true'; arr[i]=arr[i]===next?null:next; active.answers[q.id]=arr; answerChanged(); renderPlayer(); }
    const navPrev = event.target.closest('[data-pec-prev]'); if (navPrev && active) { active.index=Math.max(0,active.index-1);renderPlayer(); }
    const navNext = event.target.closest('[data-pec-next]'); if (navNext && active) { active.index=Math.min(active.exam.questions.length-1,active.index+1);renderPlayer(); }
    const submit = event.target.closest('[data-pec-submit]'); if (submit && active) submitExam(false);
    const exit = event.target.closest('[data-pec-exit]'); if (exit && active) { if (confirm('Thoát màn hình thi? Bài đã lưu vẫn có thể tiếp tục trước khi hết giờ.')) { stopTimer(); active=null; renderListHost(); } }
    const prevResult = event.target.closest('[data-pec-result-back]'); if(prevResult){active=null;renderListHost();}
  }

  async function startExam(id) {
    if (!authenticated()) { showLogin(); return; }
    if (active && !active.submitted) { toast('Bạn đang có một lượt thi mở. Hãy tiếp tục hoặc nộp lượt đó trước.'); return; }
    const button = panel?.querySelector(`[data-pec-start="${CSS.escape(String(id))}"]`);
    if (button) {button.disabled=true;button.textContent='Đang mở đề…';}
    try {
      const data = await request(API+'?action=start',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({id})});
      active={attemptId:data.attemptId,exam:data.exam,answers:{},marked:{},index:0,startedAt:data.startedAt,expiresAt:data.expiresAt,submitted:false,submitting:false};
      localWrite(activeKey(),{attemptId:active.attemptId,examId:id}); saveLocal(); renderPlayer(); startTimer(); scheduleSave(0);
    } catch (error) { toast('Không mở được đề: '+error.message); }
    finally { if(button){button.disabled=false;button.innerHTML='<i class="fa-solid fa-play"></i> Bắt đầu';} }
  }

  function saveLocal() { if (!active) return; localWrite(snapshotKey(active.attemptId),{answers:active.answers,marked:active.marked,index:active.index,updatedAt:Date.now()}); localWrite(activeKey(),{attemptId:active.attemptId,examId:active.exam.id}); }
  function answerChanged() { saveLocal(); setStatus('Đã lưu trên thiết bị · đang đồng bộ máy chủ…'); scheduleSave(650); }
  function scheduleSave(delay=650) { clearTimeout(saveTimer); saveTimer=setTimeout(saveDraft,delay); }
  async function saveDraft() {
    if (!active || active.submitted || active.submitting) return;
    try { await request(API+'?action=save',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({attemptId:active.attemptId,answers:active.answers})}); setStatus('✓ Đã đồng bộ bài làm lên máy chủ','ok'); }
    catch (error) { setStatus('Chưa đồng bộ được: '+error.message+' · bản nháp trên thiết bị vẫn còn','error'); }
  }

  async function resumeLast(silent=false) {
    if (!authenticated() || !panel) return;
    const memo=localRead(activeKey()); if(!memo?.attemptId) { const b=panel.querySelector('[data-pec-resume]'); if(b)b.hidden=true; return; }
    try {
      const data=await request(API+'?action=resume&attempt='+encodeURIComponent(memo.attemptId));
      if(data.submitted){localStorage.removeItem(activeKey()); if(data.result) renderResult(data.result,data.exam,{submittedAt:data.submittedAt}); return;}
      const snap=localRead(snapshotKey(data.attemptId))||{};
      active={attemptId:data.attemptId,exam:data.exam,answers:{...(data.savedAnswers||{}),...(snap.answers||{})},marked:snap.marked||{},index:Number(snap.index||0),startedAt:data.startedAt,expiresAt:data.expiresAt,submitted:false,submitting:false};
      const b=panel.querySelector('[data-pec-resume]');if(b)b.hidden=false;
      saveLocal();renderPlayer();
      if(Number(active.expiresAt)<=Date.now()) submitExam(true); else {startTimer();scheduleSave(0);}
    } catch (error) {
      localStorage.removeItem(activeKey());
      const b=panel.querySelector('[data-pec-resume]');if(b)b.hidden=true;
      if(!silent)toast('Không khôi phục được lượt thi: '+error.message);
    }
  }

  function stopTimer(){if(timer){clearInterval(timer);timer=null;}clearTimeout(saveTimer);}
  function startTimer(){stopTimer();if(!active||active.submitted)return;const tick=()=>{if(!active)return;const n=Math.max(0,Number(active.expiresAt)-Date.now());const clock=$('pec-clock');if(clock){const seconds=Math.ceil(n/1000);clock.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');clock.style.color=n<60000?'#fca5a5':'';}if(n<=0){stopTimer();setStatus('Đã hết giờ — đang nộp phần trả lời đã đồng bộ…');submitExam(true);}};tick();timer=setInterval(tick,1000);}

  function isAnswered(q){const a=active?.answers?.[q.id];if(q.type==='truefalse')return Array.isArray(a)&&a.some(v=>v===true||v===false);return String(a??'').trim()!=='';}
  function renderPlayer(){
    const host=$('pec-player-host');if(!host||!active)return;
    const exam=active.exam,q=exam.questions[active.index];if(!q){host.innerHTML='<div class="pec-error">Đề chưa có câu hỏi hợp lệ.</div>';return;}
    const typeLabel=q.type==='mcq'?'Trắc nghiệm':q.type==='truefalse'?'Đúng / Sai':'Trả lời ngắn';
    let input='';
    if(q.type==='mcq'){
      const letters='ABCDEFGH';input=(q.options||[]).map((option,i)=>`<button type="button" class="pec-option ${active.answers[q.id]===letters[i]?'selected':''}" data-pec-answer="${letters[i]}"><b>${letters[i]}</b><span>${esc(option)}</span></button>`).join('');
    }else if(q.type==='truefalse'){
      const arr=Array.isArray(active.answers[q.id])?active.answers[q.id]:[];
      input=(q.statements||[]).map((st,i)=>`<div class="pec-statement"><div><b>Ý ${i+1}.</b> ${esc(st.text)}</div><div class="pec-tf-actions"><button type="button" class="pec-tf ${arr[i]===true?'selected':''}" data-pec-tf="true" data-index="${i}">Đúng</button><button type="button" class="pec-tf ${arr[i]===false?'selected':''}" data-pec-tf="false" data-index="${i}">Sai</button></div></div>`).join('');
    }else if(q.type==='short') input=`<label class="pec-label" for="pec-short-answer">Câu trả lời</label><input id="pec-short-answer" class="pec-short" type="text" maxlength="200" value="${esc(active.answers[q.id]||'')}" placeholder="Nhập đáp án ngắn…">`;
    const nav=(exam.questions||[]).map((item,i)=>`<button type="button" class="pec-nav-btn ${i===active.index?'current':''} ${isAnswered(item)?'answered':''} ${active.marked[item.id]?'marked':''}" data-pec-qnav="${i}" title="Câu ${i+1}${active.marked[item.id]?' · cần xem lại':''}">${i+1}</button>`).join('');
    const questionTable=tableMarkup(q.table);
    const questionImage=q.imageUrl?`<figure class="pec-question-image-wrap"><img class="pec-question-image" src="${esc(q.imageUrl)}" alt="${esc(q.imageAlt||('Hình minh họa câu '+(active.index+1)))}" loading="lazy" decoding="async"><figcaption>${esc(q.imageAlt||'Hình minh họa')}</figcaption></figure>`:'';
    host.innerHTML=`<section class="pec-player"><div class="pec-player-head"><div><div style="font-size:9px;font-weight:900;opacity:.7;letter-spacing:.1em">PHÒNG LUYỆN ĐỀ</div><h3>${esc(exam.title)}</h3><div style="font-size:10px;color:#cbd5e1;margin-top:4px">${(exam.questions||[]).length} câu · ${esc(exam.duration||'—')} phút · ${esc(exam.subject||'')}</div></div><div id="pec-clock" class="pec-clock">--:--</div></div><div class="pec-player-body"><div class="pec-question"><div class="pec-qmeta">Câu ${active.index+1}/${exam.questions.length} · ${esc(q.section||'')} · ${typeLabel}</div><div class="pec-qtext">${esc(q.text)}</div>${questionImage}${questionTable}${input}<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:12px"><button type="button" class="pec-btn" data-pec-flag><i class="fa-regular fa-bookmark"></i> ${active.marked[q.id]?'Bỏ đánh dấu':'Đánh dấu xem lại'}</button></div></div><aside class="pec-nav"><div class="pec-nav-title">Điều hướng câu hỏi</div><div class="pec-nav-grid">${nav}</div><div class="pec-tags" style="margin-top:10px"><span>Viền xanh: đã trả lời</span><span>Viền vàng: xem lại</span></div></aside></div><div class="pec-player-foot"><div><div id="pec-save-status" class="pec-save-status">Bản nháp được lưu trên thiết bị</div><button type="button" class="pec-btn" data-pec-exit>Thu gọn phòng thi</button></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button type="button" class="pec-btn" data-pec-prev ${active.index===0?'disabled':''}>← Câu trước</button><button type="button" class="pec-btn" data-pec-next ${active.index===exam.questions.length-1?'disabled':''}>Câu tiếp →</button><button type="button" class="pec-btn primary" data-pec-submit>Nộp bài</button></div></div></section>`;
    $('pec-clock') && ( $('pec-clock').textContent = formatClock(active.expiresAt-Date.now()) );
    typesetMath(host);
    const short=$('pec-short-answer');short?.addEventListener('input',()=>{active.answers[q.id]=short.value;answerChanged();});
  }
  function formatClock(ms){const sec=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}

  async function submitExam(auto) {
    if(!active||active.submitted||active.submitting)return;
    if(!auto&&!confirm('Xác nhận nộp bài? Sau khi nộp sẽ không thể chỉnh sửa lượt thi này.'))return;
    active.submitting=true;clearTimeout(saveTimer);if(timer){clearInterval(timer);timer=null;}
    setStatus(auto?'Đang tự động nộp bài…':'Đang chấm bài…');
    const submitButton=panel?.querySelector('[data-pec-submit]');if(submitButton)submitButton.disabled=true;
    try{
      const payload=auto?{attemptId:active.attemptId}:{attemptId:active.attemptId,answers:active.answers};
      const data=await request(API+'?action=submit',{method:'POST',headers:csrfHeaders(),body:JSON.stringify(payload)});
      active.submitted=true;const result=data.result;const exam=active.exam;const submittedAt=Date.now();
      // XP and leaderboard data are recorded only after dashboard verifies the submitted server attempt.
      let rewardMeta={};
      try {
        const reward=await request('/api/dashboard?action=record-exam',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({attempt_id:active.attemptId})});
        rewardMeta={xpEarned:Number(reward.xp_earned||0),xpTotal:Number(reward.xp_total||0),level:Number(reward.level||1)};
      } catch (rewardError) { rewardMeta={xpError:rewardError.message}; }
      localStorage.removeItem(activeKey());localStorage.removeItem(snapshotKey(active.attemptId));
      renderResult(result,exam,{submittedAt,expired:!!data.expired,...rewardMeta});active=null;await loadHistory(false);
    }catch(error){active.submitting=false;if(submitButton)submitButton.disabled=false;setStatus('Chưa xác nhận được kết quả: '+error.message+' · hãy thử nộp lại, đừng đóng tab.','error');toast('Chưa xác nhận nộp bài. Hãy thử lại.');if(auto){const host=$('pec-player-host');if(host&&!host.querySelector('[data-pec-retry-submit]')){const b=document.createElement('button');b.type='button';b.dataset.pecRetrySubmit='1';b.className='pec-btn primary';b.textContent='Thử nộp lại';b.addEventListener('click',()=>submitExam(true));host.querySelector('.pec-player-foot')?.appendChild(b);}}}
  }

  function renderResult(result,exam,meta={}){
    const host=$('pec-player-host');if(!host)return;
    const review=Array.isArray(result?.review)?result.review:[];
    const details=review.map((item,i)=>{
      let correct='';
      if(item.type==='mcq')correct='Đáp án: '+String(item.correctAnswer||'—');
      else if(item.type==='short')correct='Đáp án chấp nhận: '+(Array.isArray(item.correctAnswer)?item.correctAnswer.join(' / '):String(item.correctAnswer??'—'));
      else if(item.type==='truefalse')correct='Đáp án Đúng/Sai: '+(Array.isArray(item.correctAnswer)?item.correctAnswer.map(v=>v?'Đúng':'Sai').join(' · '):'—');
      const statementStatus=item.type==='truefalse'&&Array.isArray(item.statements)?'<div class="pec-tags" style="margin-top:5px">'+item.statements.map((s,j)=>`<span class="pec-tag ${s.correct?'pec-ok':'pec-no'}">Ý ${j+1}: ${s.correct?'đúng':'sai'}</span>`).join('')+'</div>':'';
      return `<article class="pec-review-item"><h4>${item.correct?'✅':'📝'} Câu ${esc(item.number||i+1)} · ${esc(item.section||'')} · ${esc(item.points)} điểm</h4><div>${esc(correct)}</div>${statementStatus}<div style="margin-top:7px;color:#475569"><b>Lời giải:</b> ${esc(item.explanation||'Chưa có lời giải được nhập.')}</div></article>`;
    }).join('');
    stopTimer();
    const xpNotice=meta.xpError?`<div class="pec-notice">Bài đã được chấm và lưu, nhưng chưa cập nhật được XP/BXH: ${esc(meta.xpError)}</div>`:(Number.isFinite(meta.xpEarned)?`<div class="pec-notice">Đã xác minh kết quả trên máy chủ · +${esc(meta.xpEarned)} XP · cấp ${esc(meta.level||1)}</div>`:'');
    host.innerHTML=`<section class="pec-result"><div class="pec-eyebrow">KẾT QUẢ ĐÃ ĐƯỢC MÁY CHỦ CHẤM</div><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:10px 0 16px"><div><div class="pec-result-score">${esc(Number(result?.score||0).toFixed(2))}<span style="font-size:15px;color:#64748b">/10</span></div><div class="pec-sub">Điểm quy đổi theo thang 10</div></div><div class="pec-tags"><span class="pec-tag">Đúng trọn câu: ${esc(result?.correct||0)}/${esc(result?.total||0)}</span><span class="pec-tag">Chưa trả lời: ${esc(result?.unanswered||0)}</span><span class="pec-tag">Điểm thô: ${esc(result?.rawScore??0)}/${esc(result?.maxScore??0)}</span></div></div>${meta.expired?'<div class="pec-notice">Đã hết giờ. Máy chủ chấm theo câu trả lời được lưu trước thời hạn.</div>':''}${xpNotice}<div class="pec-admin-actions"><button type="button" class="pec-btn primary" data-pec-result-back>Quay lại kho đề</button></div><h4 style="font-size:13px;font-weight:950;margin-top:16px">Chữa bài từng câu</h4>${details||'<div class="pec-empty">Không có dữ liệu chữa bài.</div>'}</section>`;
    typesetMath(host);
    if(panel){const msg=$('pec-bank-message');if(msg){msg.hidden=false;msg.className='pec-notice';msg.textContent='Kết quả vừa nộp được lưu trong Lịch sử thi.';}}
  }
  function renderListHost(){const host=$('pec-player-host');if(host)host.innerHTML='';const b=panel?.querySelector('[data-pec-resume]');if(b)b.hidden=!localRead(activeKey())?.attemptId;}

  async function loadHistory(show=true) {
    if(!authenticated()){showLogin();return;}
    try{
      const data=await request(API+'?action=history');const rows=Array.isArray(data.history)?data.history:[];
      let box=$('pec-history-box');if(!box){box=document.createElement('div');box.id='pec-history-box';panel?.appendChild(box)}
      box.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:14px 0 8px"><h4 style="font-size:12px;font-weight:950">Lịch sử thi gần đây</h4><button type="button" class="pec-btn" data-pec-history-close>Đóng</button></div>`+(rows.length?rows.slice(0,20).map((r,i)=>`<div class="pec-card" style="margin:7px 0"><h4>${esc(r.title||r.examId||'Lượt thi')}</h4><div class="pec-tags"><span class="pec-tag">Điểm ${esc(Number(r.score||0).toFixed(2))}/10</span><span class="pec-tag">Đúng ${esc(r.correct||0)}/${esc(r.total||0)}</span><span class="pec-tag">${esc(r.submittedAt?new Date(r.submittedAt).toLocaleString('vi-VN'):'—')}</span>${r.expired?'<span class="pec-tag">Hết giờ</span>':''}</div><div class="pec-card-actions"><button type="button" class="pec-btn" data-pec-result="${esc(r.attemptId)}">Xem chữa bài</button></div></div>`).join(''):'<div class="pec-empty">Chưa có lượt thi được lưu ở tài khoản này.</div>');
      box.querySelector('[data-pec-history-close]')?.addEventListener('click',()=>box.remove());box.querySelectorAll('[data-pec-result]').forEach(b=>b.addEventListener('click',()=>loadResult(b.dataset.pecResult)));
      if(show)box.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
    }catch(error){toast('Không tải được lịch sử thi: '+error.message);}
  }
  async function loadResult(attemptId){try{const data=await request(API+'?action=result&attempt='+encodeURIComponent(attemptId));renderResult(data.result,data.exam,{submittedAt:data.submittedAt});}catch(e){toast('Không mở được kết quả: '+e.message);}}

  // Admin panel is injected only for an account flagged Admin by the account API.
  function mountAdminEntry(){
    if(!isAdmin())return;
    const root=$('phuc-admin-panel');const grid=root?.querySelector('.admin-grid');if(!grid||grid.querySelector('[data-pec-admin-open]'))return;
    const card=document.createElement('article');card.className='phuc-dash-card';card.innerHTML='<div class="phuc-dash-card-head"><span>Ngân hàng đề máy chủ</span><i class="fa-solid fa-file-circle-check"></i></div><p class="text-[10px] text-slate-500 leading-relaxed">Nhập JSON, kiểm tra đáp án, lưu nháp, xem trước và xuất bản đề sau khi rà soát.</p><button type="button" class="phuc-dash-btn primary mt-3" data-pec-admin-open><i class="fa-solid fa-sliders"></i> Quản lý ngân hàng đề</button>';
    grid.appendChild(card);card.querySelector('[data-pec-admin-open]')?.addEventListener('click',openAdminModal);
  }

  function mountAdminModal(){if($('phuc-exam-admin-modal'))return;const modal=document.createElement('div');modal.id='phuc-exam-admin-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Quản lý ngân hàng đề');modal.innerHTML=`<section class="pec-admin-card"><header class="pec-admin-head"><div><div class="pec-eyebrow">ADMIN · EXAM MANAGEMENT</div><h3 style="font-size:16px;font-weight:950;margin-top:3px">Quản lý ngân hàng đề</h3><p class="pec-sub">Đề lưu trước ở trạng thái nháp. Máy chủ sẽ từ chối xuất bản nếu câu hỏi thiếu đáp án hoặc cần rà soát.</p></div><button type="button" class="pec-btn" data-pec-admin-close aria-label="Đóng">✕</button></header><div class="pec-admin-body"><section class="pec-admin-pane"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px"><b style="font-size:12px">Đề trong hệ thống</b><button type="button" class="pec-btn" data-pec-admin-refresh>Tải lại</button></div><div id="pec-admin-list" class="pec-admin-list"><div class="pec-empty">Đang tải danh sách…</div></div></section><section class="pec-admin-pane"><b style="font-size:12px">Trình soạn đề JSON</b><label class="pec-label" for="pec-admin-json-file">Nhập file JSON (chỉ đọc, chưa gửi lên máy chủ)</label><input id="pec-admin-json-file" class="pec-file" type="file" accept="application/json,.json"><div class="pec-admin-actions"><button type="button" class="pec-btn" data-pec-template>Tải mẫu</button><button type="button" class="pec-btn" data-pec-new>Tạo bản nháp mới</button><button type="button" class="pec-btn" data-pec-preview>Kiểm tra / xem trước</button><button type="button" class="pec-btn" data-pec-download>Xuất JSON</button></div><textarea id="pec-admin-json" class="pec-json" spellcheck="false" aria-label="Nội dung đề JSON" placeholder="Dán JSON của đề vào đây…"></textarea><div id="pec-admin-preview" class="pec-admin-status">Chưa kiểm tra JSON.</div><div class="pec-admin-actions"><button type="button" class="pec-btn primary" data-pec-save><i class="fa-solid fa-floppy-disk"></i> Lưu nháp</button><button type="button" class="pec-btn primary" data-pec-publish><i class="fa-solid fa-paper-plane"></i> Xuất bản</button></div><div id="pec-admin-status" class="pec-admin-status" aria-live="polite">Không gửi file hoặc dữ liệu nào cho đến khi bấm Lưu nháp / Xuất bản.</div><div class="pec-admin-status">Quan trọng: đối chiếu đáp án và lời giải với nguồn gốc. Hình câu hỏi dùng imageUrl trỏ tới file cùng website trong /assets/ hoặc /exam-sources/ (chức năng upload ảnh riêng từng câu chưa được bật trong bản này). JSON hợp lệ không chứng minh nội dung học thuật đúng.</div></section></div></section>`;document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-pec-admin-close]'))modal.classList.remove('open');const a=e.target.closest('[data-pec-admin-action]');if(a)adminAction(a.dataset.pecAdminAction,a.dataset.id);});
    modal.querySelector('[data-pec-admin-refresh]')?.addEventListener('click',loadAdminList);
    modal.querySelector('[data-pec-template]')?.addEventListener('click',loadTemplate);
    modal.querySelector('[data-pec-new]')?.addEventListener('click',newDraft);
    modal.querySelector('[data-pec-preview]')?.addEventListener('click',previewJson);
    modal.querySelector('[data-pec-save]')?.addEventListener('click',saveExam);
    modal.querySelector('[data-pec-publish]')?.addEventListener('click',publishExam);
    modal.querySelector('[data-pec-download]')?.addEventListener('click',downloadJson);
    modal.querySelector('#pec-admin-json-file')?.addEventListener('change',loadJsonFile);
    modal.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('open');});
  }
  function adminStatus(text,kind='info'){const el=$('pec-admin-status');if(!el)return;el.textContent=text;el.style.background=kind==='error'?'#fef2f2':kind==='ok'?'#ecfdf5':'#f1f5f9';el.style.color=kind==='error'?'#991b1b':kind==='ok'?'#065f46':'#475569';}
  async function openAdminModal(){if(!isAdmin()){toast('Giao diện Admin không có quyền.');return;}mountAdminModal();$('phuc-exam-admin-modal')?.classList.add('open');await loadAdminList();}
  async function loadAdminList(){const box=$('pec-admin-list');if(!box)return;box.innerHTML='<div class="pec-empty">Đang tải danh sách…</div>';try{const data=await request(API+'?action=admin-list');const rows=Array.isArray(data.exams)?data.exams:[];box.innerHTML=rows.length?rows.map(e=>`<article class="pec-admin-row"><h4>${esc(e.title||e.id)}</h4><div class="pec-admin-meta">${esc(e.id)}<br>${esc(e.subject||'—')} · lớp ${esc(e.grade||'—')} · ${esc(e.questionCount||0)} câu<br>Trạng thái: ${e.reviewCount?'<b style="color:#b45309">Cần rà soát ('+esc(e.reviewCount)+')</b>':e.published?'<b style="color:#047857">Đã xuất bản</b>':'Nháp'} </div><div class="pec-card-actions"><button type="button" class="pec-btn" data-pec-admin-action="edit" data-id="${esc(e.id)}">Sửa / rà soát</button><button type="button" class="pec-btn" data-pec-admin-action="clone" data-id="${esc(e.id)}">Nhân bản</button>${e.published?`<button type="button" class="pec-btn" data-pec-admin-action="unpublish" data-id="${esc(e.id)}">Ẩn khỏi học viên</button>`:''}</div></article>`).join(''):'<div class="pec-empty">Chưa có đề. Tạo mới hoặc nhập JSON ở bên phải.</div>';}catch(e){box.innerHTML='<div class="pec-error">Không tải được danh sách: '+esc(e.message)+'</div>';}}
  async function adminAction(action,id){
    if(action==='unpublish'){
      if(!confirm('Ẩn đề này khỏi kho học viên? Dữ liệu đề và lịch sử thi sẽ được giữ nguyên.'))return;
      try{const data=await request(API+'?action=unpublish',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({id})});adminStatus(data.message||'Đã ẩn đề.','ok');await loadAdminList();await loadExams();}catch(e){adminStatus('Không ẩn được đề: '+e.message,'error');}return;
    }
    try{const data=await request(API+'?action=admin-get&id='+encodeURIComponent(id));const textarea=$('pec-admin-json');if(!textarea)return;textarea.value=JSON.stringify(data.exam,null,2);if(action==='clone'){const e=JSON.parse(textarea.value);e.id='clone-'+Date.now();e.title=(e.title||'Đề chưa đặt tên')+' — Bản sao';e.published=false;delete e.publishedAt;textarea.value=JSON.stringify(e,null,2);adminStatus('Đã tạo bản sao trong trình soạn. Bản sao chưa được lưu cho đến khi bấm Lưu nháp.','ok');}else{adminStatus('Đã nạp đề vào trình soạn. Khi bấm Lưu nháp, đề sẽ chuyển về trạng thái nháp.','ok');}previewJson();$('pec-admin-json')?.scrollIntoView({behavior:'auto',block:'nearest'});}catch(e){adminStatus('Không mở được đề: '+e.message,'error');}}
  async function loadTemplate(){try{const r=await request('/exam-template.json');$('pec-admin-json').value=JSON.stringify(r,null,2);previewJson();adminStatus('Đã nạp mẫu JSON. Hãy đổi mã đề và thay nội dung ví dụ trước khi lưu.','ok');}catch(e){adminStatus('Không tải được mẫu: '+e.message,'error');}}
  async function newDraft(){await loadTemplate();try{const e=JSON.parse($('pec-admin-json').value);e.id='draft-'+Date.now();e.title='Đề mới — cần chỉnh sửa';e.published=false;$('pec-admin-json').value=JSON.stringify(e,null,2);previewJson();adminStatus('Đã tạo bộ khung nháp mới.','ok');}catch{}}
  function loadJsonFile(event){const f=event.target.files?.[0];if(!f)return;if(f.size>3*1024*1024){adminStatus('File JSON vượt quá 3 MB.','error');event.target.value='';return;}const reader=new FileReader();reader.onload=()=>{$('pec-admin-json').value=String(reader.result||'');previewJson();adminStatus('Đã đọc file JSON vào trình soạn; chưa upload lên máy chủ.','ok');};reader.onerror=()=>adminStatus('Không đọc được file.','error');reader.readAsText(f);}
  function previewJson(){const box=$('pec-admin-preview');if(!box)return;try{const e=JSON.parse($('pec-admin-json').value||'{}');const qs=Array.isArray(e.questions)?e.questions:[];const missing=qs.filter(q=>{if(!q||q.reviewRequired)return true;if(q.type==='mcq')return q.answer==null||!Array.isArray(q.options)||String(q.answer).charCodeAt(0)-65<0||String(q.answer).charCodeAt(0)-65>=q.options.length;if(q.type==='truefalse')return !Array.isArray(q.statements)||q.statements.length===0||q.statements.some(s=>typeof s?.answer!=='boolean');if(q.type==='short')return !(Array.isArray(q.acceptedAnswers)&&q.acceptedAnswers.length||String(q.answer??'').trim());return true;});box.textContent=`Mã: ${e.id||'(thiếu)'} · Tên: ${e.title||'(thiếu)'}\n${qs.length} câu · ${e.duration||60} phút · ${missing.length} câu có thể cần rà soát.\n${qs.slice(0,8).map((q,i)=>`${i+1}. [${q.type||'chưa rõ'}] ${String(q.text||'').slice(0,120)}`).join('\n')}${qs.length>8?'\n…':''}`;box.style.background=missing.length?'#fffbeb':'#ecfdf5';box.style.color=missing.length?'#92400e':'#065f46';return e;}catch(e){box.textContent='JSON chưa hợp lệ: '+e.message;box.style.background='#fef2f2';box.style.color='#991b1b';return null;}}
  async function saveExam(){const e=previewJson();if(!e)return;try{const data=await request(API+'?action=admin-import',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({exam:e})});$('pec-admin-json').value=JSON.stringify(data.exam,null,2);adminStatus(data.message||'Đã lưu nháp.','ok');await loadAdminList();await loadExams();}catch(error){adminStatus('Không lưu được nháp: '+error.message,'error');}}
  async function publishExam(){const e=previewJson();if(!e?.id){adminStatus('Thiếu mã đề.','error');return;}if(!confirm('Xuất bản đề này cho học viên? Chỉ tiếp tục sau khi đã đối chiếu toàn bộ đáp án, hình và lời giải với nguồn đáng tin cậy.'))return;try{const data=await request(API+'?action=publish',{method:'POST',headers:csrfHeaders(),body:JSON.stringify({id:e.id})});$('pec-admin-json').value=JSON.stringify(data.exam,null,2);adminStatus('Đã xuất bản đề.','ok');await loadAdminList();await loadExams();}catch(error){adminStatus('Chưa xuất bản: '+error.message,'error');}}
  function downloadJson(){const raw=$('pec-admin-json')?.value||'';try{JSON.parse(raw);}catch(e){adminStatus('Không xuất được vì JSON lỗi: '+e.message,'error');return;}const blob=new Blob([raw],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hoc-cung-phuc-k9-exam.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  function boot(){mountStudentPanel();mountAdminEntry();mountAdminModal();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  // Auth state is populated asynchronously by the existing auth module; poll only this lightweight boolean.
  // Keep checking at a low frequency because an admin may sign in after initial page load.
  // This performs only a small DOM lookup and avoids a stale Admin menu after the first 30 seconds.
  setInterval(mountAdminEntry, 4000);
  const oldSwitch=window.switchTab;
  if(typeof oldSwitch==='function'&&!oldSwitch.__pecWrapped){const wrapped=function(tab){const v=oldSwitch.apply(this,arguments);if(tab==='exam-bank')loadExams();return v;};wrapped.__pecWrapped=true;window.switchTab=wrapped;}
  // Ctrl/Cmd+Enter submits answer or saves JSON only in the relevant focused panel; no surprise automatic changes.
  document.addEventListener('keydown',e=>{const modal=$('phuc-exam-admin-modal');if(modal?.classList.contains('open')&&(e.ctrlKey||e.metaKey)&&e.key==='Enter'&&e.target?.id==='pec-admin-json'){e.preventDefault();previewJson();}});
})();
