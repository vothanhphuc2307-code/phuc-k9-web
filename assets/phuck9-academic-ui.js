/* HỌC CÙNG PHÚC K9 — Academic Notebook UI interactions */
(function () {
  'use strict';
  if (window.__phucK9AcademicUI) return;
  window.__phucK9AcademicUI = true;
  const root = document.documentElement;
  root.classList.add('pk9-academic-ui');
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const liteByPreference = (() => { try { return localStorage.getItem('phuc_mobile_lite') === '1'; } catch { return false; } })();

  function activeTab() {
    return Array.from(document.querySelectorAll('.tab-content')).find(el => !el.classList.contains('hidden')) || document.getElementById('tab-home');
  }
  function syncNavigation(tabId) {
    const tab = tabId || activeTab()?.id?.replace(/^tab-/, '') || 'home';
    document.querySelectorAll('#phuck9-sidebar .side-btn[data-tab]').forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'page'); else btn.removeAttribute('aria-current');
    });
    let quick = tab;
    if (['english','physics','chemistry','grade10','dashboard','review-hub','special-exams','exam'].includes(tab)) quick = 'courses';
    if (tab === 'docs') quick = 'student-library';
    document.querySelectorAll('#phuc-mobile-quickbar [data-quick]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.quick === quick);
      if (btn.dataset.quick === quick) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
    });
  }
  function targetTab(tabId) {
    if (!tabId) return null;
    return document.getElementById('tab-' + tabId) || activeTab();
  }
  function pageTransition(tabId) {
    const tab = targetTab(tabId);
    if (tab && !reduced) {
      tab.classList.remove('pk9-page-enter');
      // Restart only this short one-shot transition; no timers or loops remain active.
      void tab.offsetWidth;
      tab.classList.add('pk9-page-enter');
      window.setTimeout(() => tab.classList.remove('pk9-page-enter'), 380);
    }
    syncNavigation(tabId);
    window.setTimeout(setupReveals, 90);
  }

  function setupReveals() {
    const scope = activeTab() || document;
    const nodes = scope.querySelectorAll('.rev-section, .rev-action, .rev-course-showcase, .rev-progress-card, .rev-chapter, .pec-card, .special-card');
    if (reduced || liteByPreference || !('IntersectionObserver' in window)) return;
    if (!window.__phucK9RevealObserver) {
      window.__phucK9RevealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pk9-in-view');
            window.__phucK9RevealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.04, rootMargin: '0px 0px -3% 0px' });
    }
    nodes.forEach((node, index) => {
      if (node.dataset.pk9Reveal === '1') return;
      node.dataset.pk9Reveal = '1';
      node.classList.add('pk9-reveal');
      // Tiny stagger on the first row only, capped to keep cards snappy.
      node.style.transitionDelay = (index < 4 ? index * 28 : 0) + 'ms';
      window.__phucK9RevealObserver.observe(node);
    });
  }

  // Wrap the final tab switcher once, after the project's legacy wrappers have loaded.
  if (typeof window.switchTab === 'function' && !window.switchTab.__pk9AcademicWrapped) {
    const base = window.switchTab;
    const wrapped = function (tabId) {
      const result = base.apply(this, arguments);
      pageTransition(String(tabId || 'home'));
      return result;
    };
    wrapped.__pk9AcademicWrapped = true;
    window.switchTab = wrapped;
  }

  // Keep the mobile quick dock accurate even when older navigation handlers are used.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#phuc-mobile-quickbar [data-quick], #phuck9-sidebar .side-btn[data-tab]');
    if (!button) return;
    const tab = button.dataset.quick || button.dataset.tab;
    window.setTimeout(() => pageTransition(tab), 50);
  }, { passive: true });

  // Remove any old local maintenance overlay/class left by cached markup or a previous bundle.
  function restoreExamBank() {
    const bank = document.getElementById('tab-exam-bank');
    if (!bank) return;
    bank.classList.remove('is-maintenance');
    bank.querySelectorAll(':scope > .phuck9-exam-maintenance').forEach(el => el.remove());
  }
  function boot() {
    restoreExamBank();
    syncNavigation();
    setupReveals();
    // Add keyboard skip target label only when a main landmark exists.
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  // A short recheck handles dashboard/legacy components that mount after DOMContentLoaded.
  window.setTimeout(() => { restoreExamBank(); setupReveals(); }, 600);
})();
