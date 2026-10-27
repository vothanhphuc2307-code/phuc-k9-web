/* Study Atelier frontend shell. It replaces the old navigation and homepage, but keeps existing course/exam APIs and global workflows. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const routes=[
 {group:'BÀN HỌC',items:[['home','⌂','Tổng quan'],['courses','∑','Bài giảng & dạng bài'],['english','Aa','Tiếng Anh'],['physics','⚛','Vật lí 12'],['chemistry','⚗','Hóa học 12']]},
 {group:'LUYỆN TẬP',items:[['exam-bank','✎','Kho luyện đề'],['exam','◷','Thi trực tuyến'],['review-hub','▤','Ôn tập & kiểm tra'],['special-exams','✦','Kỳ thi chuyên biệt']]},
 {group:'TÀI LIỆU',items:[['phuc-pdf-pro','▧','Kho PDF'],['docs','▤','Thư mục Drive'],['student-library','↗','Góc chia sẻ']]},
 {group:'KHÁC',items:[['grade10','10','Ôn thi vào 10'],['courses-2k11','11','Lớp 10 · 2K11'],['reference-courses','⌕','Khóa tham khảo'],['dashboard','◎','Tài khoản & tiến độ']]}
];
const titleByRoute=Object.fromEntries(routes.flatMap(g=>g.items.map(([id,icon,label])=>[id,label])));
function setActive(route){document.querySelectorAll('[data-sa-route]').forEach(b=>{const active=b.dataset.saRoute===route;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')});const label=titleByRoute[route]||'Góc học tập';const crumb=$('sa-top-route');if(crumb)crumb.textContent=label;}
function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function createShell(){
 const top=$('sa-topbar'),side=$('sa-sidebar'),mobile=$('sa-mobile-nav');if(!top||!side||!mobile)return;
 const oldHeader=document.querySelector('body>header');const actions=$('sa-top-actions');
 ['phuc-theme-toggle','phuc-premium-trigger','phuc-donate-trigger','user-info','btn-login-modal'].forEach(id=>{const node=$(id);if(node&&actions&&!actions.contains(node))actions.appendChild(node)});
 if(oldHeader)oldHeader.setAttribute('aria-hidden','true');
 const handler=event=>{const button=event.target.closest?.('[data-sa-route]');if(!button)return;event.preventDefault();navigate(button.dataset.saRoute)};
 function navigate(route){try{window.switchTab?.(route)}catch(err){console.error('[Study Atelier navigation]',err)}setActive(route)}
 side.addEventListener('click',handler);mobile.addEventListener('click',handler);
 if(typeof window.switchTab==='function'&&!window.switchTab.__studyAtelier){const base=window.switchTab;function wrapped(tab){const result=base.apply(this,arguments);setActive(tab);return result}wrapped.__studyAtelier=true;window.switchTab=wrapped}
 const main=$('main-content');if(main&&'MutationObserver'in window){let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;const current=main.querySelector('.tab-content:not(.hidden)');if(current?.id?.startsWith('tab-'))setActive(current.id.slice(4))})});observer.observe(main,{subtree:true,attributes:true,attributeFilter:['class']})}
 const current=[...document.querySelectorAll('.tab-content')].find(el=>!el.classList.contains('hidden'));setActive(current?.id?.startsWith('tab-')?current.id.slice(4):'home');
}
function wireSearchableMissions(){
 document.querySelectorAll('[data-sa-search-route]').forEach(el=>el.addEventListener('click',()=>window.switchTab?.(el.dataset.saSearchRoute)));
 const search=$('sa-route-search');if(!search)return;
 const aliases={courses:'toán toán học math',english:'anh tiếng anh english',physics:'lý lý học vật lí vật lý physics',chemistry:'hóa hóa học chemistry',exam:'thi trực tuyến đồng hồ','exam-bank':'đề đề thi luyện đề kho đề','phuc-pdf-pro':'pdf tài liệu sách'};
 search.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const q=search.value.trim().toLocaleLowerCase('vi');if(!q)return;const all=routes.flatMap(g=>g.items);const match=all.find(([id,icon,label])=>(label+' '+id+' '+(aliases[id]||'')).toLocaleLowerCase('vi').includes(q));if(match){window.switchTab?.(match[0]);search.value='';search.blur()}else{search.setCustomValidity('Chưa tìm thấy mục phù hợp. Thử “Toán”, “PDF” hoặc “luyện đề”.');search.reportValidity();search.addEventListener('input',()=>search.setCustomValidity(''),{once:true})}});
}
function wireDailyChallenge(){
 const items=[
  ['TOÁN HỌC','Với hàm số bậc hai f(x)=ax²+bx+c (a ≠ 0), hoành độ đỉnh bằng công thức nào?','x = −b/(2a). Đây là hoành độ đỉnh của parabol; tung độ đỉnh là f(−b/(2a)).'],
  ['VẬT LÍ','Một vật chuyển động đều với tốc độ 12 m/s trong 5 s. Vật đi được quãng đường bao nhiêu?','s = vt = 12 × 5 = 60 m.'],
  ['HÓA HỌC','Trong phản ứng oxi hóa – khử, chất oxi hóa là chất nhường hay nhận electron?','Chất oxi hóa nhận electron và bị khử. Chất khử nhường electron và bị oxi hóa.'],
  ['TIẾNG ANH','Chọn dạng đúng: “She ___ to school every day.” (go)','Goes. Ở thì hiện tại đơn, chủ ngữ ngôi thứ ba số ít đi với động từ thêm -s/-es.'],
  ['TOÁN HỌC','Nếu P(A)=0,2 thì xác suất biến cố đối của A là bao nhiêu?','P(Ā)=1−P(A)=0,8.'],
  ['VẬT LÍ','Viết định luật II Newton trong trường hợp khối lượng không đổi.','Hợp lực bằng khối lượng nhân gia tốc: F = ma.'],
  ['HÓA HỌC','Công thức phân tử của glucose là gì?','C₆H₁₂O₆.'],
  ['TIẾNG ANH','“However” thường diễn tả quan hệ ý nghĩa nào trong câu?','Sự tương phản hoặc đối lập giữa hai ý.']
 ];
 const q=$('sa-challenge-question'),a=$('sa-challenge-answer'),s=$('sa-challenge-subject'),d=$('sa-challenge-index'),reveal=$('sa-challenge-reveal'),next=$('sa-challenge-next');if(!q||!a||!reveal||!next)return;
 let index=Math.floor(Date.now()/86400000)%items.length;function draw(){const row=items[index];s.textContent=row[0];q.textContent=row[1];a.textContent=row[2];a.hidden=true;reveal.textContent='Xem lời giải';d.textContent=String(index+1).padStart(2,'0')}
 reveal.addEventListener('click',()=>{a.hidden=!a.hidden;reveal.textContent=a.hidden?'Xem lời giải':'Ẩn lời giải'});next.addEventListener('click',()=>{index=(index+1)%items.length;draw()});draw();
}
function safeJSON(key,fallback){try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}}
function renderChapters(){const box=$('rev-chapters');if(!box)return;const data=Array.isArray(window.courseData)?window.courseData:[];if(!data.length){box.innerHTML='<div class="sa-card"><div class="sa-card-inner" style="font-size:12px;color:var(--sa-muted)">Danh sách chương đang tải. Ông có thể mở mục Bài giảng để xem tất cả nội dung.</div></div>';return}const done=safeJSON('phuc_done_2026',{});const marks=['∑','f(x)','∫','△','⚛','⚗'];box.innerHTML=data.slice(0,6).map((chapter,index)=>{const topics=Array.isArray(chapter.topics)?chapter.topics:[];let completed=0;topics.forEach((_,i)=>{if(done[`${index}:${i}`])completed++});const pct=topics.length?Math.round(completed/topics.length*100):0;const title=chapter.chapterTitle||chapter.title||`Chương ${index+1}`;return `<button class="rev-chapter" type="button" onclick="window.selectChapterAndPlay?.(${index},0)"><div class="rev-chapter-cover"><span style="font:600 26px Georgia,serif;color:#46674d">${marks[index%marks.length]}</span></div><div class="rev-chapter-body"><span class="rev-chapter-pill">${safeText(chapter.chapterNumber||`CHƯƠNG ${index+1}`)}</span><b>${safeText(title)}</b><p>${topics.length} bài học · học theo dạng và tổng ôn</p><div class="rev-chapter-foot"><span>${completed}/${topics.length} bài · ${pct}%</span><span>↗</span></div></div></button>`}).join('')}
function updatePersonal(){try{const user=(window.phucAccount||window.state||{}).user||null;const done=safeJSON('phuc_done_2026',{});const data=Array.isArray(window.courseData)?window.courseData:[];const total=data.reduce((n,chapter)=>n+(Array.isArray(chapter.topics)?chapter.topics.length:0),0);const completed=Object.values(done||{}).filter(Boolean).length;const pct=total?Math.min(100,Math.round(completed/total*100)):0;const streak=Number(user?.streak||$('user-streak-value')?.textContent||0);const set=(id,value)=>{const e=$(id);if(e)e.textContent=String(value)};
 [['sa-stat-lessons',total||'—'],['home-v2-stat-lessons',total||'—'],['rev-stat-lessons',total||'—'],['sa-stat-streak',streak],['home-v2-stat-streak',streak],['rev-stat-streak',streak],['sa-stat-subjects',4],['rev-progress-big',pct+'%'],['rev-ring-label',pct+'%'],['rev-stat-progress',pct],['rev-streak-mini',streak+' ngày'],['home-v2-profile-streak',streak],['home-v2-profile-progress',pct+'%'],['phuc-resume-title',safeJSON('phuc_resume_2026',null)?.title||'Bắt đầu bài học đầu tiên'],['phuc-resume-meta',safeJSON('phuc_resume_2026',null)?.title?'Bạn đã có bài học để tiếp tục.':'Mở một bài giảng để lưu vị trí học gần nhất.'],['phuc-progress-label',pct+'%']].forEach(([id,v])=>set(id,v));const p=$('sa-progress-fill');if(p)p.style.width=pct+'%';const p2=$('phuc-progress-fill');if(p2)p2.style.width=pct+'%';const p3=$('pk9-progress-fill');if(p3)p3.style.width=pct+'%';const p4=$('pk9-focus-meter-fill');if(p4)p4.style.width=pct+'%';const ring=$('p6-progress-ring');if(ring)ring.style.setProperty('--p6-progress',pct+'%');}catch(e){console.warn('[Study Atelier]',e)}}
function init(){createShell();wireSearchableMissions();wireDailyChallenge();const date=$('sa-today-date');if(date)date.textContent=new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'short'}).format(new Date()).toLocaleUpperCase('vi-VN');const main=$('main-content');document.addEventListener('phuck9:auth-sync',updatePersonal);window.addEventListener('phuck9:course-data-ready',()=>{renderChapters();updatePersonal()});renderChapters();updatePersonal();setTimeout(()=>{renderChapters();updatePersonal()},900);document.querySelectorAll('img').forEach(image=>{if(!image.hasAttribute('decoding'))image.decoding='async';if(!image.hasAttribute('loading'))image.loading='lazy'});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
// Other legacy scripts write a few inline styles at load. Keep this clean design system last in cascade.
window.addEventListener('load',()=>{const link=document.querySelector('link[href*="phuck9-study-atelier.css"]');if(link&&link.parentElement!==document.body)document.body.appendChild(link);},{once:true});
})();
