/* PHÚC K9 effects controller — small, event-driven, no recurring DOM scans. */
(function () {
  'use strict';
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const loader = $('pk9-site-loader');
  let loaderDone = false;
  const startedAt = performance.now();
  function hideLoader(force) {
    if (loaderDone) return;
    const finish = () => {
      if (loaderDone) return;
      loaderDone = true;
      const node = $('pk9-site-loader');
      if (node) {
        node.classList.add('is-hidden');
        window.setTimeout(() => node.remove(), 430);
      }
      document.documentElement.classList.add('pk9-effects-ready');
    };
    const delay = force ? 0 : Math.max(0, 420 - (performance.now() - startedAt));
    window.setTimeout(finish, delay);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hideLoader(false), { once: true });
  else hideLoader(false);
  window.setTimeout(() => hideLoader(true), 1650);
  window.addEventListener('pageshow', (event) => { if (event.persisted) hideLoader(true); });

  function animateActiveTab() {
    if (reduced) return;
    const active = document.querySelector('.tab-content:not(.hidden)');
    if (!active) return;
    active.classList.remove('pk9-route-enter');
    // Reflow only on explicit route change, never from a MutationObserver.
    void active.offsetWidth;
    active.classList.add('pk9-route-enter');
    active.addEventListener('animationend', () => active.classList.remove('pk9-route-enter'), { once: true });
  }
  const baseSwitchTab = window.switchTab;
  if (typeof baseSwitchTab === 'function' && !baseSwitchTab.__pk9EffectsWrapped) {
    const wrapped = function () {
      const out = baseSwitchTab.apply(this, arguments);
      window.requestAnimationFrame(() => window.requestAnimationFrame(animateActiveTab));
      return out;
    };
    wrapped.__pk9EffectsWrapped = true;
    window.switchTab = wrapped;
  }

  // Lazy-load YouTube frames on the pages that exist now, including restored lesson pages.
  document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach((frame) => {
    if (!frame.hasAttribute('loading')) frame.setAttribute('loading', 'lazy');
    if (!frame.hasAttribute('referrerpolicy')) frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    if (!frame.hasAttribute('title')) frame.setAttribute('title', 'Video bài giảng');
  });
})();
