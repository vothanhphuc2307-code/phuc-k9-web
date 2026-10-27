/* PK9 source-backed hub: hide synthetic exam players and expose only real source PDFs. */
(function () {
  'use strict';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1kV4ZfZv5ZgtEwuWBgh-k8fxs5OvhvzlrF7807aJCF_U/htmlview?gid=1707769956&pru=AAABoSFK4bg*ygBfbcBedkRw0mozUDIcUA#gid=662446747';
  const LEGACY_EXAM_ROUTES = new Set(['exam', 'review-hub', 'special-exams']);
  const $ = (id) => document.getElementById(id);
  let activeSubject = 'all';

  function notify(message) {
    if (typeof window.phucToast === 'function') window.phucToast(message);
    else if (typeof window.showToast === 'function') window.showToast(message);
    else console.info('[Phúc K9]', message);
  }

  function renderSourceBank() {
    const grid = $('pk9-sourcebank-grid');
    if (!grid) return;
    const search = ($('pk9-sourcebank-search')?.value || '').trim().toLocaleLowerCase('vi-VN');
    let visible = 0;
    grid.querySelectorAll('[data-source-subject]').forEach((card) => {
      const subjectMatch = activeSubject === 'all' || card.dataset.sourceSubject === activeSubject;
      const haystack = (card.dataset.sourceSearch || card.textContent || '').toLocaleLowerCase('vi-VN');
      const searchMatch = !search || haystack.includes(search);
      const show = subjectMatch && searchMatch;
      card.hidden = !show;
      if (show) visible++;
    });
    const empty = $('pk9-sourcebank-empty');
    if (empty) empty.classList.toggle('hidden', visible > 0);
    document.querySelectorAll('[data-source-filter]').forEach((button) => {
      const selected = button.dataset.sourceFilter === activeSubject;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function toggle2k8Preview() {
    const wrap = $('pk9-2k8-frame-wrap');
    const frame = $('pk9-2k8-frame');
    const button = $('pk9-2k8-toggle');
    if (!wrap || !frame || !button) return;
    const opening = wrap.classList.contains('hidden');
    wrap.classList.toggle('hidden', !opening);
    button.setAttribute('aria-expanded', String(opening));
    button.textContent = opening ? 'Ẩn khung xem' : 'Xem trong website';
    if (opening) {
      if (!frame.dataset.loaded) {
        frame.src = SHEET_URL;
        frame.dataset.loaded = '1';
      }
      wrap.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  const previousSwitch = window.switchTab;
  window.switchTab = function (route, ...args) {
    const safeRoute = LEGACY_EXAM_ROUTES.has(route) ? 'exam-bank' : route;
    const result = typeof previousSwitch === 'function' ? previousSwitch.call(this, safeRoute, ...args) : undefined;
    if (safeRoute === 'exam-bank') renderSourceBank();
    return result;
  };

  // Replace global exam-bank entry points so no synthetic questions can be launched accidentally.
  window.renderExamBank = renderSourceBank;
  window.initExamBank = renderSourceBank;
  window.startExamBank = function () {
    window.switchTab('exam-bank');
    notify('Kho hiện chỉ có PDF nguồn; chưa bật chấm điểm tự động cho các PDF này.');
  };
  window.startExam = window.startExamBank;
  window.loadExamCategory = window.startExamBank;
  window.startExamCategoryDirect = window.startExamBank;
  window.renderReviewHubDisplayArea = function () { window.switchTab('exam-bank'); };
  window.openSpecificReview = function () { window.switchTab('exam-bank'); };
  window.togglePhucKhoChuiDrive = toggle2k8Preview;
  window.pk9Toggle2k8Preview = toggle2k8Preview;

  function init() {
    $('pk9-sourcebank-search')?.addEventListener('input', renderSourceBank);
    document.querySelectorAll('[data-source-filter]').forEach((button) => {
      button.addEventListener('click', () => { activeSubject = button.dataset.sourceFilter || 'all'; renderSourceBank(); });
    });
    $('pk9-2k8-toggle')?.addEventListener('click', toggle2k8Preview);
    renderSourceBank();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
