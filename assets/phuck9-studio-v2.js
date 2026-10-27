/* PHÚC K9 STUDIO UI v2 — presentation layer only; does not change learning data. */
(function(){
 'use strict';
 const root=document.documentElement;
 if(root.dataset.pk9StudioBoot==='1')return;
 root.dataset.pk9StudioBoot='1';root.classList.add('pk9-studio');
 const reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function visibleTab(){return [...document.querySelectorAll('.tab-content')].find(el=>!el.classList.contains('hidden'))||document.getElementById('tab-home')}
 function syncNav(tabId){
  const id=tabId||visibleTab()?.id?.replace(/^tab-/,'')||'home';
  document.querySelectorAll('#phuck9-sidebar .side-btn[data-tab]').forEach(b=>{const on=b.dataset.tab===id;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  let quick=id;if(['english','physics','chemistry','grade10','dashboard','review-hub','special-exams','exam'].includes(id))quick='courses';if(id==='docs')quick='student-library';
  document.querySelectorAll('#phuc-mobile-quickbar [data-quick]').forEach(b=>{const on=b.dataset.quick===quick;b.classList.toggle('is-active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 }
 function reveal(){
  if(reduced||!('IntersectionObserver'in window))return;
  const scope=visibleTab()||document;const items=scope.querySelectorAll('.rev-section,.rev-action,.rev-chapter,.rev-course-showcase,.rev-progress-card,.pec-card,.special-card');
  if(!window.__pk9StudioObserver)window.__pk9StudioObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('pk9-studio-visible');window.__pk9StudioObserver.unobserve(e.target)}}),{threshold:.035,rootMargin:'0px 0px -24px 0px'});
  items.forEach((el,i)=>{if(el.dataset.pk9StudioReveal)return;el.dataset.pk9StudioReveal='1';el.classList.add('pk9-studio-reveal');if(el.classList.contains('rev-action')||el.classList.contains('rev-chapter'))el.style.setProperty('--pk9-delay',(i%4)*28+'ms');window.__pk9StudioObserver.observe(el)});
 }
 function animateTab(id){
  const tab=id?document.getElementById('tab-'+id):visibleTab();if(tab&&!reduced){tab.classList.remove('pk9-studio-enter');void tab.offsetWidth;tab.classList.add('pk9-studio-enter');window.setTimeout(()=>tab.classList.remove('pk9-studio-enter'),340)}
  syncNav(id);window.setTimeout(reveal,80);
 }
 const wrapSwitch=()=>{if(typeof window.switchTab!=='function'||window.switchTab.__pk9StudioWrapped)return;const base=window.switchTab;const next=function(id){const result=base.apply(this,arguments);animateTab(String(id||'home'));return result};next.__pk9StudioWrapped=true;window.switchTab=next};
 wrapSwitch();
 // Some legacy modules wrap switchTab after this file is parsed; refresh once after boot.
 window.addEventListener('load',()=>{wrapSwitch();syncNav();reveal()},{once:true});
 document.addEventListener('click',e=>{const nav=e.target.closest?.('#phuck9-sidebar .side-btn[data-tab],#phuc-mobile-quickbar [data-quick]');if(!nav)return;const id=nav.dataset.tab||nav.dataset.quick;window.setTimeout(()=>animateTab(id),70)},{passive:true});
 document.addEventListener('phuck9:auth-sync',()=>window.setTimeout(reveal,120));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{syncNav();reveal()},{once:true});else{syncNav();reveal()}
})();
