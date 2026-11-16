/* ============================================================================
 * HỌC CÙNG PHÚC K9 — 3D HERO MODELS, ANIME AURAS & FRAMES VECTOR ENGINE (V58)
 * Pure vector SVG + GPU CSS 3D stage (works offline in PWA, 60fps smooth)
 * ============================================================================ */
(function () {
  'use strict';

  let _uid = 0;
  function nextId(prefix) {
    _uid += 1;
    return `pk9m_${prefix}_${_uid}`;
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- 1. AURA VISUAL DEFINITIONS ----------
  const AURA_PALETTES = {
    'aura-none': { key: 'spark', c1: '#38bdf8', c2: '#0ea5e9', c3: '#bae6fd', label: 'Khí Tức Lam' },
    'pk9-aura-spark': { key: 'spark', c1: '#38bdf8', c2: '#0ea5e9', c3: '#bae6fd', label: 'Khí Tức Lam' },
    'aura-water-breath': { key: 'water', c1: '#06b6d4', c2: '#2563eb', c3: '#e0f2fe', label: 'Thủy Lưu' },
    'pk9-aura-water': { key: 'water', c1: '#06b6d4', c2: '#2563eb', c3: '#e0f2fe', label: 'Thủy Lưu' },
    'aura-saiyan-gold': { key: 'saiyan', c1: '#facc15', c2: '#f97316', c3: '#fef9c3', label: 'Siêu Ki Vàng' },
    'pk9-aura-saiyan': { key: 'saiyan', c1: '#facc15', c2: '#f97316', c3: '#fef9c3', label: 'Siêu Ki Vàng' },
    'aura-mystic-mandala': { key: 'mandala', c1: '#fb923c', c2: '#ea580c', c3: '#fed7aa', label: 'Ma Trận Cổ Ngữ' },
    'pk9-aura-mandala': { key: 'mandala', c1: '#fb923c', c2: '#ea580c', c3: '#fed7aa', label: 'Ma Trận Cổ Ngữ' },
    'aura-void-infinity': { key: 'infinity', c1: '#a855f7', c2: '#22d3ee', c3: '#f5d0fe', label: 'Lục Nhãn Vô Hạn' },
    'pk9-aura-infinity': { key: 'infinity', c1: '#a855f7', c2: '#22d3ee', c3: '#f5d0fe', label: 'Lục Nhãn Vô Hạn' },
    'aura-crimson-shrine': { key: 'crimson', c1: '#ef4444', c2: '#991b1b', c3: '#fecaca', label: 'Lĩnh Vực Phục Ma' },
    'pk9-aura-crimson': { key: 'crimson', c1: '#ef4444', c2: '#991b1b', c3: '#fecaca', label: 'Lĩnh Vực Phục Ma' },
    'aura-shadow-monarch': { key: 'shadow', c1: '#9333ea', c2: '#312e81', c3: '#c084fc', label: 'Hắc Ảnh Quân Vương' },
    'pk9-aura-shadow': { key: 'shadow', c1: '#9333ea', c2: '#312e81', c3: '#c084fc', label: 'Hắc Ảnh Quân Vương' },
    'aura-ultra-instinct': { key: 'ui', c1: '#e2e8f0', c2: '#818cf8', c3: '#ffffff', label: 'Bản Năng Vô Cực' },
    'pk9-aura-ui': { key: 'ui', c1: '#e2e8f0', c2: '#818cf8', c3: '#ffffff', label: 'Bản Năng Vô Cực' }
  };

  function getAuraSpec(idOrClass) {
    if (!idOrClass) return null;
    return AURA_PALETTES[idOrClass] || null;
  }

  function renderAuraSvgLayers(spec, gid, cx, cy, scale) {
    if (!spec) return { defs: '', back: '', front: '' };
    const r = 74 * scale;
    const defs = `
      <radialGradient id="${gid}_ag" cx="50%" cy="50%" r="52%">
        <stop offset="0%" stop-color="${spec.c3}" stop-opacity="0.78"/>
        <stop offset="44%" stop-color="${spec.c1}" stop-opacity="0.52"/>
        <stop offset="80%" stop-color="${spec.c2}" stop-opacity="0.24"/>
        <stop offset="100%" stop-color="${spec.c2}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${gid}_fl" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${spec.c2}" stop-opacity="0.96"/>
        <stop offset="52%" stop-color="${spec.c1}" stop-opacity="0.82"/>
        <stop offset="100%" stop-color="${spec.c3}" stop-opacity="0.06"/>
      </linearGradient>
    `;

    let back = `
      <circle class="pk9-svg-pulse" cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid}_ag)"/>
      <ellipse cx="${cx}" cy="${cy + 58 * scale}" rx="${58 * scale}" ry="${14 * scale}" fill="none" stroke="${spec.c1}" stroke-width="${2 * scale}" opacity="0.65" class="pk9-svg-pulse"/>
    `;
    let front = '';

    if (spec.key === 'saiyan' || spec.key === 'ui') {
      const innerColor = spec.key === 'ui' ? '#ffffff' : '#fef9c3';
      const boltColor = spec.key === 'ui' ? '#a5b4fc' : '#67e8f9';
      back += `
        <g class="pk9-svg-flame">
          <path d="M${cx - 64 * scale},${cy + 48 * scale} Q${cx - 82 * scale},${cy - 8 * scale} ${cx - 48 * scale},${cy - 76 * scale} Q${cx - 28 * scale},${cy - 26 * scale} ${cx - 10 * scale},${cy - 94 * scale} Q${cx + 8 * scale},${cy - 36 * scale} ${cx + 24 * scale},${cy - 88 * scale} Q${cx + 40 * scale},${cy - 26 * scale} ${cx + 66 * scale},${cy - 70 * scale} Q${cx + 78 * scale},${cy - 4 * scale} ${cx + 62 * scale},${cy + 48 * scale} Z" fill="url(#${gid}_fl)"/>
          <path d="M${cx - 42 * scale},${cy + 44 * scale} Q${cx - 56 * scale},${cy - 4 * scale} ${cx - 28 * scale},${cy - 58 * scale} Q${cx - 10 * scale},${cy - 20 * scale} ${cx},${cy - 72 * scale} Q${cx + 12 * scale},${cy - 22 * scale} ${cx + 32 * scale},${cy - 56 * scale} Q${cx + 52 * scale},${cy - 4 * scale} ${cx + 42 * scale},${cy + 44 * scale} Z" fill="${innerColor}" opacity="0.52"/>
        </g>
        <circle cx="${cx}" cy="${cy}" r="${64 * scale}" fill="none" stroke="${spec.c3}" stroke-width="${1.5 * scale}" stroke-dasharray="10 6 3 6" opacity="0.82" class="pk9-svg-spin-slow"/>
      `;
      front += `
        <g class="pk9-svg-bolt" stroke="${boltColor}" stroke-width="${2.4 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="${cx - 68 * scale},${cy + 20 * scale} ${cx - 52 * scale},${cy - 4 * scale} ${cx - 64 * scale},${cy - 18 * scale} ${cx - 42 * scale},${cy - 46 * scale} ${cx - 50 * scale},${cy - 58 * scale}"/>
          <polyline points="${cx + 68 * scale},${cy + 16 * scale} ${cx + 50 * scale},${cy - 8 * scale} ${cx + 64 * scale},${cy - 22 * scale} ${cx + 42 * scale},${cy - 52 * scale}"/>
          <polyline points="${cx - 26 * scale},${cy - 68 * scale} ${cx - 12 * scale},${cy - 56 * scale} ${cx - 18 * scale},${cy - 42 * scale}"/>
        </g>
        <circle cx="${cx - 48 * scale}" cy="${cy - 34 * scale}" r="${2.8 * scale}" fill="#fff" class="pk9-svg-pulse"/>
        <circle cx="${cx + 50 * scale}" cy="${cy - 28 * scale}" r="${2.4 * scale}" fill="${spec.c3}" class="pk9-svg-pulse"/>
        <circle cx="${cx + 22 * scale}" cy="${cy - 62 * scale}" r="${2.1 * scale}" fill="#fff" class="pk9-svg-pulse"/>
      `;
    } else if (spec.key === 'mandala') {
      const s = 56 * scale;
      const d = 42 * scale;
      back += `
        <g class="pk9-svg-spin-slow" opacity="0.92">
          <circle cx="${cx}" cy="${cy}" r="${68 * scale}" fill="none" stroke="${spec.c1}" stroke-width="${2.4 * scale}" stroke-dasharray="10 4 3 4"/>
          <circle cx="${cx}" cy="${cy}" r="${60 * scale}" fill="none" stroke="${spec.c3}" stroke-width="${1.5 * scale}"/>
          <rect x="${cx - d}" y="${cy - d}" width="${d * 2}" height="${d * 2}" fill="none" stroke="${spec.c1}" stroke-width="${2.2 * scale}" rx="3"/>
          <rect x="${cx - d}" y="${cy - d}" width="${d * 2}" height="${d * 2}" fill="none" stroke="${spec.c3}" stroke-width="${1.8 * scale}" transform="rotate(45 ${cx} ${cy})" rx="3"/>
        </g>
        <g class="pk9-svg-spin-rev" opacity="0.9">
          <circle cx="${cx}" cy="${cy}" r="${s}" fill="none" stroke="${spec.c2}" stroke-width="${2.6 * scale}" stroke-dasharray="4 8"/>
          <polygon points="${cx},${cy - 66 * scale} ${cx + 58 * scale},${cy + 34 * scale} ${cx - 58 * scale},${cy + 34 * scale}" fill="none" stroke="${spec.c3}" stroke-width="${1.5 * scale}" opacity="0.72"/>
        </g>
      `;
    } else if (spec.key === 'water') {
      back += `
        <g class="pk9-svg-spin-slow" opacity="0.95">
          <path d="M${cx - 64 * scale},${cy + 12 * scale} C${cx - 72 * scale},${cy - 52 * scale} ${cx + 26 * scale},${cy - 84 * scale} ${cx + 62 * scale},${cy - 26 * scale} C${cx + 42 * scale},${cy - 44 * scale} ${cx + 12 * scale},${cy - 48 * scale} ${cx - 10 * scale},${cy - 36 * scale}" fill="none" stroke="${spec.c1}" stroke-width="${6.5 * scale}" stroke-linecap="round"/>
          <path d="M${cx + 64 * scale},${cy - 10 * scale} C${cx + 72 * scale},${cy + 52 * scale} ${cx - 26 * scale},${cy + 84 * scale} ${cx - 62 * scale},${cy + 26 * scale} C${cx - 42 * scale},${cy + 44 * scale} ${cx - 12 * scale},${cy + 48 * scale} ${cx + 10 * scale},${cy + 36 * scale}" fill="none" stroke="${spec.c2}" stroke-width="${6 * scale}" stroke-linecap="round"/>
          <path d="M${cx - 54 * scale},${cy - 20 * scale} C${cx - 32 * scale},${cy - 68 * scale} ${cx + 40 * scale},${cy - 62 * scale} ${cx + 56 * scale},${cy - 10 * scale}" fill="none" stroke="${spec.c3}" stroke-width="${2.6 * scale}" stroke-linecap="round" stroke-dasharray="12 6"/>
        </g>
      `;
      front += `
        <circle cx="${cx + 54 * scale}" cy="${cy - 36 * scale}" r="${3.6 * scale}" fill="#ffffff"/>
        <circle cx="${cx - 54 * scale}" cy="${cy + 36 * scale}" r="${3.2 * scale}" fill="#e0f2fe"/>
        <circle cx="${cx - 42 * scale}" cy="${cy - 48 * scale}" r="${2.4 * scale}" fill="#7dd3fc"/>
      `;
    } else if (spec.key === 'infinity') {
      back += `
        <g class="pk9-svg-spin-slow">
          <circle cx="${cx}" cy="${cy}" r="${66 * scale}" fill="none" stroke="${spec.c2}" stroke-width="${2.4 * scale}" stroke-dasharray="20 8 4 8"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${72 * scale}" ry="${32 * scale}" fill="none" stroke="${spec.c1}" stroke-width="${2.4 * scale}" transform="rotate(30 ${cx} ${cy})" opacity="0.9"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${72 * scale}" ry="${32 * scale}" fill="none" stroke="${spec.c2}" stroke-width="${2.4 * scale}" transform="rotate(-30 ${cx} ${cy})" opacity="0.9"/>
        </g>
        <g class="pk9-svg-spin-rev">
          <circle cx="${cx}" cy="${cy}" r="${52 * scale}" fill="none" stroke="#f43f5e" stroke-width="${1.6 * scale}" stroke-dasharray="14 22" opacity="0.72"/>
        </g>
      `;
      front += `
        <circle cx="${cx - 54 * scale}" cy="${cy - 26 * scale}" r="${6.5 * scale}" fill="#22d3ee" stroke="#ffffff" stroke-width="${1.2 * scale}" class="pk9-svg-pulse"/>
        <circle cx="${cx + 54 * scale}" cy="${cy + 26 * scale}" r="${6.5 * scale}" fill="#fb7185" stroke="#ffffff" stroke-width="${1.2 * scale}" class="pk9-svg-pulse"/>
        <circle cx="${cx}" cy="${cy - 68 * scale}" r="${5.5 * scale}" fill="#c084fc" opacity="0.9" class="pk9-svg-pulse"/>
      `;
    } else if (spec.key === 'crimson') {
      back += `
        <path class="pk9-svg-flame" d="M${cx - 64 * scale},${cy + 48 * scale} C${cx - 78 * scale},${cy - 22 * scale} ${cx - 20 * scale},${cy - 90 * scale} ${cx},${cy - 90 * scale} C${cx + 20 * scale},${cy - 90 * scale} ${cx + 78 * scale},${cy - 22 * scale} ${cx + 64 * scale},${cy + 48 * scale} Z" fill="url(#${gid}_fl)"/>
        <path d="M${cx - 48 * scale},${cy - 58 * scale} L${cx + 48 * scale},${cy - 58 * scale} M${cx - 38 * scale},${cy - 48 * scale} L${cx + 38 * scale},${cy - 48 * scale}" stroke="#7f1d1d" stroke-width="${3.2 * scale}" opacity="0.82"/>
        <g class="pk9-svg-spin-rev" opacity="0.95">
          <path d="M${cx - 66 * scale},${cy - 28 * scale} Q${cx},${cy - 80 * scale} ${cx + 66 * scale},${cy - 28 * scale}" fill="none" stroke="#fca5a5" stroke-width="${2.6 * scale}"/>
          <path d="M${cx + 64 * scale},${cy + 32 * scale} Q${cx},${cy + 78 * scale} ${cx - 64 * scale},${cy + 32 * scale}" fill="none" stroke="#ef4444" stroke-width="${2.8 * scale}"/>
        </g>
      `;
      front += `
        <g class="pk9-svg-bolt">
          <line x1="${cx - 66 * scale}" y1="${cy + 30 * scale}" x2="${cx + 66 * scale}" y2="${cy - 48 * scale}" stroke="#fecaca" stroke-width="${2.4 * scale}" stroke-linecap="round"/>
          <line x1="${cx - 58 * scale}" y1="${cy - 42 * scale}" x2="${cx + 60 * scale}" y2="${cy + 28 * scale}" stroke="#ef4444" stroke-width="${2.2 * scale}" stroke-linecap="round"/>
        </g>
      `;
    } else if (spec.key === 'shadow') {
      back += `
        <path class="pk9-svg-flame" d="M${cx - 66 * scale},${cy + 52 * scale} Q${cx - 74 * scale},${cy - 12 * scale} ${cx - 34 * scale},${cy - 82 * scale} Q${cx - 16 * scale},${cy - 32 * scale} ${cx + 4 * scale},${cy - 90 * scale} Q${cx + 24 * scale},${cy - 32 * scale} ${cx + 48 * scale},${cy - 76 * scale} Q${cx + 74 * scale},${cy - 6 * scale} ${cx + 64 * scale},${cy + 52 * scale} Z" fill="url(#${gid}_fl)"/>
        <path d="M${cx - 50 * scale},${cy + 48 * scale} Q${cx - 36 * scale},${cy - 40 * scale} ${cx - 12 * scale},${cy - 66 * scale} Q${cx + 4 * scale},${cy - 36 * scale} ${cx + 26 * scale},${cy - 62 * scale} Q${cx + 50 * scale},${cy - 24 * scale} ${cx + 46 * scale},${cy + 48 * scale} Z" fill="#09090b" opacity="0.68"/>
        <circle cx="${cx}" cy="${cy}" r="${63 * scale}" fill="none" stroke="${spec.c3}" stroke-width="${2.2 * scale}" stroke-dasharray="14 6 4 6" class="pk9-svg-spin-slow"/>
      `;
      front += `
        <polygon points="${cx - 52 * scale},${cy - 42 * scale} ${cx - 38 * scale},${cy - 46 * scale} ${cx - 46 * scale},${cy - 39 * scale}" fill="#e879f9"/>
        <polygon points="${cx + 52 * scale},${cy - 42 * scale} ${cx + 38 * scale},${cy - 46 * scale} ${cx + 46 * scale},${cy - 39 * scale}" fill="#e879f9"/>
      `;
    } else {
      back += `<circle cx="${cx}" cy="${cy}" r="${60 * scale}" fill="none" stroke="${spec.c1}" stroke-width="${2 * scale}" stroke-dasharray="12 6" opacity="0.78" class="pk9-svg-spin-slow"/>`;
    }

    return { defs, back, front };
  }

  // ---------- 2. CANONICAL ANIME & SUPERHERO AVATAR FRAMES ----------
  // Avatar portrait edge maps cleanly to r=39 on a 120x120 viewBox; r=40..59 is radial anime/superhero armor & aura!
  const FRAME_SPECS = {
    'pk9-frame-bronze': { ring1: '#92400e', ring2: '#fbbf24', mode: 'bronze' },
    'pk9-frame-emerald': { ring1: '#047857', ring2: '#34d399', mode: 'emerald' },
    'pk9-frame-neon': { ring1: '#0891b2', ring2: '#22d3ee', mode: 'cyber' },
    'pk9-frame-thunder': { ring1: '#2563eb', ring2: '#facc15', mode: 'thunder' },
    'pk9-frame-nichirin': { ring1: '#0284c7', ring2: '#f97316', mode: 'nichirin' },
    'pk9-frame-gold': { ring1: '#b45309', ring2: '#fde047', mode: 'crown' },
    'pk9-frame-eldritch': { ring1: '#ea580c', ring2: '#fdba74', mode: 'mandala' },
    'pk9-frame-sharingan': { ring1: '#991b1b', ring2: '#ef4444', mode: 'sharingan' },
    'pk9-frame-phoenix': { ring1: '#be123c', ring2: '#fb923c', mode: 'phoenix' },
    'pk9-frame-infinity': { ring1: '#7e22ce', ring2: '#22d3ee', mode: 'infinity' },
    'pk9-frame-galaxy': { ring1: '#4c1d95', ring2: '#f472b6', mode: 'galaxy' },
    'pk9-frame-valkyrie': { ring1: '#e2e8f0', ring2: '#fbbf24', mode: 'wings' }
  };

  function renderFrameRingSvg(frameClass, sizePx, opts = {}) {
    const spec = FRAME_SPECS[frameClass] || FRAME_SPECS['pk9-frame-bronze'];
    const gid = nextId('fr');
    const c = 60;
    const baseR = opts.baseR || 39;
    let extra = '';

    if (spec.mode === 'sharingan') {
      extra = `
        <!-- Amaterasu Black-Crimson Flames -->
        <g class="pk9-svg-flame">
          <path d="M16,62 C4,42 12,18 28,12 C22,26 26,38 30,44 Z" fill="#09090b" stroke="#ef4444" stroke-width="1.6"/>
          <path d="M104,62 C116,42 108,18 92,12 C98,26 94,38 90,44 Z" fill="#09090b" stroke="#ef4444" stroke-width="1.6"/>
          <path d="M46,16 C50,2 60,1 60,1 C60,1 70,2 74,16 L60,21 Z" fill="#09090b" stroke="#ef4444" stroke-width="1.5"/>
        </g>
        <!-- Outer Arterial Crimson Iris & Rotating 3-Tomoe Sharingan Ring -->
        <circle cx="${c}" cy="${c}" r="${baseR + 5}" fill="none" stroke="#7f1d1d" stroke-width="3.2"/>
        <g class="pk9-svg-spin-slow">
          <circle cx="${c}" cy="${c}" r="${baseR + 8.5}" fill="none" stroke="#ef4444" stroke-width="1.6" stroke-dasharray="16 5"/>
          ${[0, 120, 240].map(deg => `
            <g transform="rotate(${deg} ${c} ${c})">
              <circle cx="${c}" cy="${c - (baseR + 8.5)}" r="4.8" fill="#09090b" stroke="#fca5a5" stroke-width="1.2"/>
              <path d="M${c - 0.5},${c - (baseR + 13)} Q${c + 6.5},${c - (baseR + 9.5)} ${c + 2.5},${c - (baseR + 4.5)}" stroke="#09090b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
            </g>
          `).join('')}
        </g>
        <g class="pk9-svg-spin-rev">
          ${[60, 180, 300].map(deg => `<polygon points="${c},${c - (baseR + 13)} ${c + 3},${c - (baseR + 6)} ${c - 3},${c - (baseR + 6)}" fill="#ef4444" transform="rotate(${deg} ${c} ${c})"/>`).join('')}
        </g>
      `;
    } else if (spec.mode === 'mandala') {
      extra = `
        <!-- Doctor Strange Double Counter-Rotating Eldritch Mandalas -->
        <g class="pk9-svg-spin-slow">
          <circle cx="${c}" cy="${c}" r="${baseR + 10}" fill="none" stroke="#fb923c" stroke-width="2" stroke-dasharray="5 3"/>
          <circle cx="${c}" cy="${c}" r="${baseR + 15}" fill="none" stroke="#fed7aa" stroke-width="1.2" stroke-dasharray="2 5"/>
          <rect x="${c - 37}" y="${c - 37}" width="74" height="74" fill="none" stroke="#f97316" stroke-width="2" rx="3"/>
          <rect x="${c - 37}" y="${c - 37}" width="74" height="74" fill="none" stroke="#fde047" stroke-width="1.8" transform="rotate(45 ${c} ${c})" rx="3"/>
        </g>
        <g class="pk9-svg-spin-rev">
          ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => `<circle cx="${c}" cy="${c - (baseR + 12)}" r="2.2" fill="#fff" stroke="#f97316" stroke-width="1" transform="rotate(${deg} ${c} ${c})"/>`).join('')}
        </g>
      `;
    } else if (spec.mode === 'wings') {
      extra = `
        <!-- 6-Winged Valkyrie Platinum & 24K Gold Armor Wings + Halo Crown -->
        <g>
          <path d="M22,58 C2,34 4,10 26,6 C20,24 22,38 30,45 Z" fill="url(#${gid}_lg)" stroke="#fef08a" stroke-width="1.2"/>
          <path d="M18,70 C0,54 2,34 22,28 C18,44 22,56 28,62 Z" fill="url(#${gid}_lg)" stroke="#cbd5e1" stroke-width="1" opacity="0.94"/>
          <path d="M20,82 C4,72 6,54 22,50 C20,62 24,72 30,76 Z" fill="#f8fafc" stroke="#fbbf24" stroke-width="0.9" opacity="0.88"/>
          <path d="M98,58 C118,34 116,10 94,6 C100,24 98,38 90,45 Z" fill="url(#${gid}_lg)" stroke="#fef08a" stroke-width="1.2"/>
          <path d="M102,70 C120,54 118,34 98,28 C102,44 98,56 92,62 Z" fill="url(#${gid}_lg)" stroke="#cbd5e1" stroke-width="1" opacity="0.94"/>
          <path d="M100,82 C116,72 114,54 98,50 C100,62 96,72 90,76 Z" fill="#f8fafc" stroke="#fbbf24" stroke-width="0.9" opacity="0.88"/>
          <polygon points="48,18 53,5 60,12 67,5 72,18 60,22" fill="#fde047" stroke="#fff" stroke-width="1.1"/>
          <polygon points="60,2 65,11 60,16 55,11" fill="#38bdf8" stroke="#fff" stroke-width="1"/>
        </g>
      `;
    } else if (spec.mode === 'phoenix') {
      extra = `
        <!-- Blazing Phoenix Solar Wings & Flame Plumes -->
        <g class="pk9-svg-flame">
          <path d="M20,70 C2,44 8,14 30,8 C22,28 24,44 30,52 Z" fill="url(#${gid}_lg)" stroke="#fef08a" stroke-width="1"/>
          <path d="M100,70 C118,44 112,14 90,8 C98,28 96,44 90,52 Z" fill="url(#${gid}_lg)" stroke="#fef08a" stroke-width="1"/>
          <path d="M48,19 L60,1 L72,19 L60,25 Z" fill="#fde047" stroke="#f43f5e" stroke-width="1.2"/>
        </g>
        <circle cx="${c}" cy="${c}" r="${baseR + 7}" fill="none" stroke="#fb923c" stroke-width="2" stroke-dasharray="14 6" class="pk9-svg-spin-slow"/>
      `;
    } else if (spec.mode === 'infinity') {
      extra = `
        <!-- Gojo Limitless: Lapse Blue (Left) + Reversal Red (Right) -> Hollow Purple Orbit -->
        <g class="pk9-svg-spin-slow">
          <ellipse cx="${c}" cy="${c}" rx="56" ry="26" fill="none" stroke="#22d3ee" stroke-width="2.2" transform="rotate(28 ${c} ${c})"/>
          <ellipse cx="${c}" cy="${c}" rx="56" ry="26" fill="none" stroke="#fb7185" stroke-width="2.2" transform="rotate(-28 ${c} ${c})"/>
          <circle cx="${c}" cy="${c}" r="${baseR + 9}" fill="none" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="16 6 4 6"/>
        </g>
        <circle cx="13" cy="60" r="6" fill="#22d3ee" stroke="#ffffff" stroke-width="1.4" class="pk9-svg-pulse"/>
        <circle cx="107" cy="60" r="6" fill="#fb7185" stroke="#ffffff" stroke-width="1.4" class="pk9-svg-pulse"/>
        <circle cx="60" cy="11" r="6.5" fill="#a855f7" stroke="#ffffff" stroke-width="1.4" class="pk9-svg-pulse"/>
      `;
    } else if (spec.mode === 'galaxy') {
      const gems = ['#a855f7', '#38bdf8', '#ef4444', '#f97316', '#10b981', '#facc15'];
      extra = `
        <!-- Cosmic Ring Studded with 6 Glowing Infinity Stones -->
        <circle cx="${c}" cy="${c}" r="${baseR + 7}" fill="none" stroke="#c084fc" stroke-width="2.2" stroke-dasharray="12 5" class="pk9-svg-spin-slow"/>
        <ellipse cx="${c}" cy="${c}" rx="57" ry="20" fill="none" stroke="#f472b6" stroke-width="1.5" transform="rotate(-22 ${c} ${c})" opacity="0.85"/>
        <g class="pk9-svg-spin-rev">
          ${gems.map((col, idx) => `<polygon points="60,8 64,14 60,20 56,14" fill="${col}" stroke="#ffffff" stroke-width="1" transform="rotate(${idx * 60} ${c} ${c})"/>`).join('')}
        </g>
      `;
    } else if (spec.mode === 'thunder') {
      extra = `
        <!-- Thor / Flash Winged Bolts & High-Voltage Arcs -->
        <g class="pk9-svg-bolt">
          <polyline points="16,32 5,45 15,50 7,68 18,74" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="104,32 115,45 105,50 113,68 102,74" fill="none" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="42,14 54,4 58,13 72,3 66,16" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round"/>
        </g>
        <path d="M22,42 L6,26 L26,32 Z" fill="#facc15" stroke="#fff" stroke-width="0.9"/>
        <path d="M98,42 L114,26 L94,32 Z" fill="#facc15" stroke="#fff" stroke-width="0.9"/>
      `;
    } else if (spec.mode === 'nichirin') {
      extra = `
        <!-- Tanjiro Dual Water Wave (Left/Bottom) + Hinokami Sun Flame (Right/Top) -->
        <g class="pk9-svg-spin-slow">
          <path d="M20,76 C8,46 18,16 54,12 C38,20 30,30 34,38" fill="none" stroke="#38bdf8" stroke-width="5.2" stroke-linecap="round"/>
          <path d="M22,74 C12,50 22,22 50,16" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-dasharray="10 5"/>
          <path d="M100,44 C112,74 102,104 66,108 C82,100 90,90 86,82" fill="none" stroke="#ef4444" stroke-width="5.2" stroke-linecap="round"/>
          <path d="M98,46 C108,70 98,98 70,104" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="10 5"/>
        </g>
        <circle cx="${c}" cy="${c + baseR + 6}" r="5.5" fill="#09090b" stroke="#f59e0b" stroke-width="2"/>
      `;
    } else if (spec.mode === 'crown') {
      extra = `
        <!-- Imperial Golden Laurel Wreath & Crown -->
        <path d="M36,100 Q16,80 18,46" fill="none" stroke="#fde047" stroke-width="3.6" stroke-dasharray="5 3" stroke-linecap="round"/>
        <path d="M84,100 Q104,80 102,46" fill="none" stroke="#fde047" stroke-width="3.6" stroke-dasharray="5 3" stroke-linecap="round"/>
        <polygon points="42,19 48,4 60,12 72,4 78,19" fill="url(#${gid}_lg)" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="${c}" cy="13" r="2.8" fill="#ef4444" stroke="#fff" stroke-width="0.8"/>
      `;
    } else if (spec.mode === 'cyber') {
      extra = `
        <!-- Iron-Tech / Edgerunner Tactical HUD Bezel -->
        <g class="pk9-svg-spin-slow">
          <circle cx="${c}" cy="${c}" r="${baseR + 7}" fill="none" stroke="#22d3ee" stroke-width="2.4" stroke-dasharray="22 8 6 8"/>
          <circle cx="${c}" cy="${c}" r="${baseR + 12}" fill="none" stroke="#a855f7" stroke-width="1.6" stroke-dasharray="12 18"/>
        </g>
        <path d="M12,32 L12,14 L30,14 M90,14 L108,14 L108,32 M12,88 L12,106 L30,106 M90,106 L108,106 L108,88" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>
      `;
    } else if (spec.mode === 'emerald') {
      extra = `
        <!-- One For All Full Cowling Jade Bio-Lightning -->
        <g class="pk9-svg-bolt" stroke="#6ee7b7" stroke-width="2.2" fill="none" stroke-linecap="round">
          <polyline points="15,44 7,54 16,60 8,72"/>
          <polyline points="105,44 113,54 104,60 112,72"/>
          <circle cx="${c}" cy="${c}" r="${baseR + 7}" stroke="#34d399" stroke-width="1.6" stroke-dasharray="16 8"/>
        </g>
        <polygon points="60,8 65,15 60,22 55,15" fill="#10b981" stroke="#ecfdf5" stroke-width="1"/>
      `;
    } else {
      extra = `
        <circle cx="${c}" cy="${c}" r="${baseR + 5}" fill="none" stroke="${spec.ring2}" stroke-width="1.5" stroke-dasharray="6 4"/>
        <circle cx="${c}" cy="${c - (baseR + 4)}" r="3.6" fill="#fde047" stroke="#78350f" stroke-width="1"/>
        <circle cx="${c}" cy="${c + (baseR + 4)}" r="3.6" fill="#fde047" stroke="#78350f" stroke-width="1"/>
      `;
    }

    return `
      <svg viewBox="0 0 120 120" width="${sizePx || '100%'}" height="${sizePx || '100%'}" style="overflow:visible;display:block;">
        <defs>
          <linearGradient id="${gid}_lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${spec.ring2}"/>
            <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="${spec.ring1}"/>
          </linearGradient>
        </defs>
        <circle cx="${c}" cy="${c}" r="${baseR}" fill="none" stroke="url(#${gid}_lg)" stroke-width="4.4"/>
        ${extra}
      </svg>
    `;
  }

  // ---------- 3. 3D HERO OUTFIT VECTOR SCULPTOR ----------
  const OUTFIT_SPECS = {
    'outfit-scholar': { p1: '#1d4ed8', p2: '#0f172a', accent: '#fde047', hair: '#1e293b', skin: '#ffdec7', emblem: 'K9', type: 'scholar', defaultAura: 'aura-none' },
    'outfit-chemist': { p1: '#059669', p2: '#ecfdf5', accent: '#34d399', hair: '#0f766e', skin: '#ffdec7', emblem: 'H₂O', type: 'chemist', defaultAura: 'aura-none' },
    'outfit-wizard': { p1: '#6d28d9', p2: '#312e81', accent: '#c084fc', hair: '#e2e8f0', skin: '#ffdec7', emblem: '∫', type: 'wizard', defaultAura: 'aura-mystic-mandala' },
    'outfit-speedster': { p1: '#dc2626', p2: '#7f1d1d', accent: '#facc15', hair: '#991b1b', skin: '#ffdec7', emblem: '⚡', type: 'speedster', defaultAura: 'aura-saiyan-gold' },
    'outfit-astronaut': { p1: '#f8fafc', p2: '#334155', accent: '#38bdf8', hair: '#f59e0b', skin: '#ffdec7', emblem: '🚀', type: 'astronaut', defaultAura: 'aura-none' },
    'outfit-slayer': { p1: '#10b981', p2: '#111827', accent: '#38bdf8', hair: '#450a0a', skin: '#ffdec7', emblem: '水', type: 'slayer', defaultAura: 'aura-water-breath' },
    'outfit-saiyan': { p1: '#f97316', p2: '#1d4ed8', accent: '#fde047', hair: '#facc15', skin: '#ffdec7', emblem: '武', type: 'saiyan', defaultAura: 'aura-saiyan-gold' },
    'outfit-ninja': { p1: '#1e293b', p2: '#0f172a', accent: '#ef4444', hair: '#0f172a', skin: '#ffdec7', emblem: '忍', type: 'ninja', defaultAura: 'aura-crimson-shrine' },
    'outfit-sorcerer': { p1: '#1e1b4b', p2: '#09090b', accent: '#22d3ee', hair: '#f8fafc', skin: '#f8fafc', emblem: '∞', type: 'sorcerer', defaultAura: 'aura-void-infinity' },
    'outfit-nano': { p1: '#dc2626', p2: '#b45309', accent: '#38bdf8', hair: '#facc15', skin: '#dc2626', emblem: '⚛', type: 'nano', defaultAura: 'aura-mystic-mandala' },
    'outfit-hero': { p1: '#2563eb', p2: '#dc2626', accent: '#fde047', hair: '#1e293b', skin: '#ffdec7', emblem: 'K9', type: 'hero', defaultAura: 'aura-saiyan-gold' },
    'outfit-monarch': { p1: '#312e81', p2: '#09090b', accent: '#c084fc', hair: '#0f172a', skin: '#e2e8f0', emblem: 'S', type: 'monarch', defaultAura: 'aura-shadow-monarch' },
    'outfit-celestial': { p1: '#f8fafc', p2: '#eab308', accent: '#38bdf8', hair: '#fef08a', skin: '#fff1e6', emblem: '✦', type: 'celestial', defaultAura: 'aura-ultra-instinct' }
  };

  function buildHeroCharacterSvg(outfitId, gid, cx, cy, s) {
    const o = OUTFIT_SPECS[outfitId] || OUTFIT_SPECS['outfit-scholar'];
    let backGear = '';
    let headAccessory = '';
    let weaponGear = '';
    let chestOverlay = '';

    let eyes = `
      <ellipse cx="${cx - 6.8 * s}" cy="${cy - 19 * s}" rx="${2.4 * s}" ry="${3 * s}" fill="#0f172a"/>
      <circle cx="${cx - 7.4 * s}" cy="${cy - 20 * s}" r="${0.95 * s}" fill="#fff"/>
      <ellipse cx="${cx + 6.8 * s}" cy="${cy - 19 * s}" rx="${2.4 * s}" ry="${3 * s}" fill="#0f172a"/>
      <circle cx="${cx + 6.2 * s}" cy="${cy - 20 * s}" r="${0.95 * s}" fill="#fff"/>
      <path d="M${cx - 11 * s},${cy - 24 * s} Q${cx - 7 * s},${cy - 26 * s} ${cx - 3.5 * s},${cy - 23.5 * s}" fill="none" stroke="#0f172a" stroke-width="${1.3 * s}" stroke-linecap="round"/>
      <path d="M${cx + 11 * s},${cy - 24 * s} Q${cx + 7 * s},${cy - 26 * s} ${cx + 3.5 * s},${cy - 23.5 * s}" fill="none" stroke="#0f172a" stroke-width="${1.3 * s}" stroke-linecap="round"/>
    `;

    let hairShape = `
      <path d="M${cx - 21 * s},${cy - 20 * s} C${cx - 24 * s},${cy - 45 * s} ${cx + 24 * s},${cy - 45 * s} ${cx + 21 * s},${cy - 20 * s} L${cx + 15 * s},${cy - 29 * s} L${cx + 5 * s},${cy - 24 * s} L${cx - 3 * s},${cy - 29 * s} L${cx - 12 * s},${cy - 24 * s} Z" fill="${o.hair}"/>
    `;

    if (o.type === 'hero' || o.type === 'wizard' || o.type === 'monarch') {
      backGear = `
        <path d="M${cx - 22 * s},${cy + 2 * s} Q${cx - 48 * s},${cy + 28 * s} ${cx - 46 * s},${cy + 58 * s} Q${cx},${cy + 67 * s} ${cx + 46 * s},${cy + 58 * s} Q${cx + 48 * s},${cy + 28 * s} ${cx + 22 * s},${cy + 2 * s} Z" fill="url(#${gid}_c2)" stroke="${o.accent}" stroke-width="${1.1 * s}" opacity="0.94"/>
      `;
    } else if (o.type === 'celestial') {
      backGear = `
        <g>
          <path d="M${cx - 14 * s},${cy + 6 * s} L${cx - 70 * s},${cy - 38 * s} L${cx - 56 * s},${cy + 8 * s} L${cx - 66 * s},${cy + 36 * s} L${cx - 18 * s},${cy + 28 * s} Z" fill="url(#${gid}_wing)" stroke="#fef08a" stroke-width="${1.3 * s}"/>
          <path d="M${cx + 14 * s},${cy + 6 * s} L${cx + 70 * s},${cy - 38 * s} L${cx + 56 * s},${cy + 8 * s} L${cx + 66 * s},${cy + 36 * s} L${cx + 18 * s},${cy + 28 * s} Z" fill="url(#${gid}_wing)" stroke="#fef08a" stroke-width="${1.3 * s}"/>
          <ellipse cx="${cx}" cy="${cy - 54 * s}" rx="${22 * s}" ry="${5.5 * s}" fill="none" stroke="#fef08a" stroke-width="${2.6 * s}"/>
        </g>
      `;
      weaponGear = `
        <line x1="${cx + 38 * s}" y1="${cy - 44 * s}" x2="${cx + 32 * s}" y2="${cy + 54 * s}" stroke="#fef08a" stroke-width="${3.4 * s}" stroke-linecap="round"/>
        <polygon points="${cx + 38 * s},${cy - 54 * s} ${cx + 44 * s},${cy - 40 * s} ${cx + 38 * s},${cy - 34 * s} ${cx + 32 * s},${cy - 40 * s}" fill="#38bdf8" stroke="#fff" stroke-width="${1.2 * s}"/>
      `;
    }

    // Per-hero iconic silhouettes & weapons
    if (o.type === 'saiyan') {
      hairShape = `
        <path d="M${cx - 22 * s},${cy - 16 * s} L${cx - 35 * s},${cy - 34 * s} L${cx - 20 * s},${cy - 38 * s} L${cx - 25 * s},${cy - 57 * s} L${cx - 8 * s},${cy - 44 * s} L${cx + 2 * s},${cy - 63 * s} L${cx + 12 * s},${cy - 44 * s} L${cx + 30 * s},${cy - 52 * s} L${cx + 23 * s},${cy - 34 * s} L${cx + 34 * s},${cy - 26 * s} L${cx + 20 * s},${cy - 15 * s} Z" fill="url(#${gid}_goldhair)" stroke="#fef9c3" stroke-width="${1.1 * s}"/>
      `;
      eyes = `
        <polygon points="${cx - 12 * s},${cy - 21 * s} ${cx - 4 * s},${cy - 19 * s} ${cx - 10 * s},${cy - 16.5 * s}" fill="#22d3ee"/>
        <polygon points="${cx + 12 * s},${cy - 21 * s} ${cx + 4 * s},${cy - 19 * s} ${cx + 10 * s},${cy - 16.5 * s}" fill="#22d3ee"/>
      `;
      weaponGear = `
        <circle cx="${cx - 36 * s}" cy="${cy + 20 * s}" r="${10 * s}" fill="#fde047" opacity="0.88" class="pk9-svg-pulse"/>
        <circle cx="${cx - 36 * s}" cy="${cy + 20 * s}" r="${5.5 * s}" fill="#ffffff"/>
        <circle cx="${cx + 36 * s}" cy="${cy + 20 * s}" r="${10 * s}" fill="#fde047" opacity="0.88" class="pk9-svg-pulse"/>
        <circle cx="${cx + 36 * s}" cy="${cy + 20 * s}" r="${5.5 * s}" fill="#ffffff"/>
      `;
    } else if (o.type === 'sorcerer') {
      hairShape = `
        <path d="M${cx - 22 * s},${cy - 22 * s} L${cx - 26 * s},${cy - 48 * s} L${cx - 12 * s},${cy - 39 * s} L${cx},${cy - 55 * s} L${cx + 12 * s},${cy - 39 * s} L${cx + 26 * s},${cy - 48 * s} L${cx + 22 * s},${cy - 22 * s} Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="${0.9 * s}"/>
      `;
      eyes = `
        <rect x="${cx - 19.5 * s}" y="${cy - 25 * s}" width="${39 * s}" height="${11 * s}" rx="${4 * s}" fill="#09090b" stroke="#22d3ee" stroke-width="${1.2 * s}"/>
        <circle cx="${cx - 7 * s}" cy="${cy - 19.5 * s}" r="${2.5 * s}" fill="#38bdf8"/>
        <circle cx="${cx + 7 * s}" cy="${cy - 19.5 * s}" r="${2.5 * s}" fill="#38bdf8"/>
      `;
      weaponGear = `
        <circle cx="${cx + 36 * s}" cy="${cy + 4 * s}" r="${12 * s}" fill="url(#${gid}_hollow)" class="pk9-svg-pulse"/>
        <circle cx="${cx - 36 * s}" cy="${cy + 14 * s}" r="${7 * s}" fill="#22d3ee" opacity="0.85" class="pk9-svg-pulse"/>
      `;
    } else if (o.type === 'monarch') {
      hairShape = `<path d="M${cx - 21 * s},${cy - 20 * s} L${cx - 22 * s},${cy - 42 * s} L${cx - 10 * s},${cy - 35 * s} L${cx},${cy - 46 * s} L${cx + 10 * s},${cy - 36 * s} L${cx + 22 * s},${cy - 42 * s} L${cx + 21 * s},${cy - 20 * s} Z" fill="#09090b"/>`;
      eyes = `
        <polygon points="${cx - 12 * s},${cy - 21 * s} ${cx - 4 * s},${cy - 18.5 * s} ${cx - 9.5 * s},${cy - 16 * s}" fill="#c084fc"/>
        <polygon points="${cx + 12 * s},${cy - 21 * s} ${cx + 4 * s},${cy - 18.5 * s} ${cx + 9.5 * s},${cy - 16 * s}" fill="#c084fc"/>
      `;
      chestOverlay = `<path d="M${cx - 26 * s},${cy + 2 * s} Q${cx},${cy - 8 * s} ${cx + 26 * s},${cy + 2 * s} L${cx + 19 * s},${cy + 15 * s} Q${cx},${cy + 7 * s} ${cx - 19 * s},${cy + 15 * s} Z" fill="#1e1b4b" stroke="#c084fc" stroke-width="${1.4 * s}"/>`;
      weaponGear = `
        <path d="M${cx - 34 * s},${cy + 22 * s} L${cx - 50 * s},${cy + 44 * s} L${cx - 30 * s},${cy + 30 * s} Z" fill="#e879f9" stroke="#fff" stroke-width="${1 * s}"/>
        <path d="M${cx + 34 * s},${cy + 22 * s} L${cx + 50 * s},${cy + 44 * s} L${cx + 30 * s},${cy + 30 * s} Z" fill="#e879f9" stroke="#fff" stroke-width="${1 * s}"/>
      `;
    } else if (o.type === 'slayer') {
      backGear = `<path d="M${cx - 34 * s},${cy + 36 * s} Q${cx},${cy + 62 * s} ${cx + 46 * s},${cy - 28 * s}" fill="none" stroke="#38bdf8" stroke-width="${5 * s}" stroke-linecap="round" opacity="0.72"/>`;
      chestOverlay = `
        <rect x="${cx - 16 * s}" y="${cy + 9 * s}" width="${16 * s}" height="${15 * s}" fill="#10b981"/>
        <rect x="${cx}" y="${cy + 9 * s}" width="${16 * s}" height="${15 * s}" fill="#0f172a"/>
        <rect x="${cx - 16 * s}" y="${cy + 24 * s}" width="${16 * s}" height="${14 * s}" fill="#0f172a"/>
        <rect x="${cx}" y="${cy + 24 * s}" width="${16 * s}" height="${14 * s}" fill="#10b981"/>
      `;
      weaponGear = `
        <line x1="${cx + 26 * s}" y1="${cy + 26 * s}" x2="${cx + 56 * s}" y2="${cy - 24 * s}" stroke="#f8fafc" stroke-width="${3.6 * s}" stroke-linecap="round"/>
        <circle cx="${cx + 30 * s}" cy="${cy + 20 * s}" r="${4.2 * s}" fill="#f59e0b" stroke="#09090b" stroke-width="${1 * s}"/>
      `;
    } else if (o.type === 'nano') {
      hairShape = `<path d="M${cx - 20 * s},${cy - 37 * s} L${cx + 20 * s},${cy - 37 * s} L${cx + 16 * s},${cy - 13 * s} L${cx},${cy - 6 * s} L${cx - 16 * s},${cy - 13 * s} Z" fill="#facc15" stroke="#9a3412" stroke-width="${1.2 * s}"/>`;
      eyes = `
        <polygon points="${cx - 13 * s},${cy - 21.5 * s} ${cx - 4 * s},${cy - 19 * s} ${cx - 5 * s},${cy - 16 * s} ${cx - 13 * s},${cy - 17 * s}" fill="#67e8f9"/>
        <polygon points="${cx + 13 * s},${cy - 21.5 * s} ${cx + 4 * s},${cy - 19 * s} ${cx + 5 * s},${cy - 16 * s} ${cx + 13 * s},${cy - 17 * s}" fill="#67e8f9"/>
      `;
      chestOverlay = `<polygon points="${cx - 9 * s},${cy + 12 * s} ${cx + 9 * s},${cy + 12 * s} ${cx},${cy + 27 * s}" fill="#67e8f9" stroke="#fff" stroke-width="${1.6 * s}"/>`;
      weaponGear = `
        <circle cx="${cx - 35 * s}" cy="${cy + 26 * s}" r="${6.5 * s}" fill="#67e8f9" stroke="#fff" stroke-width="${1.2 * s}" class="pk9-svg-pulse"/>
        <circle cx="${cx + 35 * s}" cy="${cy + 26 * s}" r="${6.5 * s}" fill="#67e8f9" stroke="#fff" stroke-width="${1.2 * s}" class="pk9-svg-pulse"/>
      `;
    } else if (o.type === 'hero') {
      weaponGear = `
        <circle cx="${cx - 34 * s}" cy="${cy + 26 * s}" r="${7 * s}" fill="#fde047" opacity="0.72" class="pk9-svg-pulse"/>
        <circle cx="${cx + 34 * s}" cy="${cy + 26 * s}" r="${7 * s}" fill="#fde047" opacity="0.72" class="pk9-svg-pulse"/>
      `;
    } else if (o.type === 'wizard') {
      headAccessory = `<path d="M${cx - 28 * s},${cy - 32 * s} Q${cx},${cy - 25 * s} ${cx + 28 * s},${cy - 32 * s} L${cx + 4 * s},${cy - 65 * s} Z" fill="#4c1d95" stroke="#fde047" stroke-width="${1.3 * s}"/>`;
      weaponGear = `
        <line x1="${cx - 35 * s}" y1="${cy + 50 * s}" x2="${cx - 35 * s}" y2="${cy - 14 * s}" stroke="#fbbf24" stroke-width="${3.2 * s}" stroke-linecap="round"/>
        <circle cx="${cx - 35 * s}" cy="${cy - 18 * s}" r="${6.5 * s}" fill="#c084fc" stroke="#fff" stroke-width="${1.4 * s}" class="pk9-svg-pulse"/>
        <circle cx="${cx + 36 * s}" cy="${cy + 12 * s}" r="${12 * s}" fill="none" stroke="#fb923c" stroke-width="${2.2 * s}" stroke-dasharray="4 3" class="pk9-svg-spin-slow"/>
      `;
    } else if (o.type === 'speedster') {
      headAccessory = `
        <path d="M${cx - 21 * s},${cy - 20 * s} L${cx - 34 * s},${cy - 34 * s} L${cx - 25 * s},${cy - 25 * s} L${cx - 32 * s},${cy - 21 * s} Z" fill="#facc15"/>
        <path d="M${cx + 21 * s},${cy - 20 * s} L${cx + 34 * s},${cy - 34 * s} L${cx + 25 * s},${cy - 25 * s} L${cx + 32 * s},${cy - 21 * s} Z" fill="#facc15"/>
      `;
      weaponGear = `<polyline points="${cx - 46 * s},${cy + 28 * s} ${cx - 30 * s},${cy + 22 * s} ${cx - 38 * s},${cy + 14 * s}" fill="none" stroke="#facc15" stroke-width="${2.2 * s}" class="pk9-svg-bolt"/>`;
    } else if (o.type === 'astronaut') {
      headAccessory = `<circle cx="${cx}" cy="${cy - 20 * s}" r="${25 * s}" fill="rgba(186,230,253,0.22)" stroke="#e2e8f0" stroke-width="${2.6 * s}"/>`;
      eyes = `<ellipse cx="${cx}" cy="${cy - 19 * s}" rx="${15.5 * s}" ry="${10 * s}" fill="url(#${gid}_visor)" stroke="#f59e0b" stroke-width="${1.3 * s}"/>`;
    } else if (o.type === 'scholar') {
      headAccessory = `
        <polygon points="${cx},${cy - 56 * s} ${cx + 26 * s},${cy - 45 * s} ${cx},${cy - 34 * s} ${cx - 26 * s},${cy - 45 * s}" fill="#0f172a" stroke="#fde047" stroke-width="${1.3 * s}"/>
        <line x1="${cx + 22 * s}" y1="${cy - 44 * s}" x2="${cx + 24 * s}" y2="${cy - 30 * s}" stroke="#fde047" stroke-width="${2 * s}"/>
      `;
      weaponGear = `<rect x="${cx + 25 * s}" y="${cy + 12 * s}" width="${16 * s}" height="${20 * s}" rx="${3 * s}" fill="#1e3a8a" stroke="#fde047" stroke-width="${1.4 * s}" transform="rotate(-10 ${cx + 33 * s} ${cy + 22 * s})"/>`;
    } else if (o.type === 'chemist') {
      weaponGear = `<circle cx="${cx + 34 * s}" cy="${cy + 18 * s}" r="${8 * s}" fill="#34d399" stroke="#ecfdf5" stroke-width="${1.5 * s}" class="pk9-svg-pulse"/>`;
    } else if (o.type === 'ninja') {
      eyes = `
        <rect x="${cx - 20 * s}" y="${cy - 33 * s}" width="${40 * s}" height="${8 * s}" rx="${3 * s}" fill="#0f172a" stroke="#94a3b8" stroke-width="${1.1 * s}"/>
        <circle cx="${cx - 7 * s}" cy="${cy - 19 * s}" r="${2.5 * s}" fill="#ef4444"/>
        <circle cx="${cx + 7 * s}" cy="${cy - 19 * s}" r="${2.5 * s}" fill="#ef4444"/>
        <path d="M${cx - 17 * s},${cy - 10 * s} Q${cx},${cy - 4 * s} ${cx + 17 * s},${cy - 10 * s} L${cx + 17 * s},${cy + 3 * s} Q${cx},${cy + 7 * s} ${cx - 17 * s},${cy + 3 * s} Z" fill="#b91c1c"/>
      `;
      weaponGear = `<polygon points="${cx + 36 * s},${cy + 10 * s} ${cx + 42 * s},${cy + 20 * s} ${cx + 36 * s},${cy + 30 * s} ${cx + 30 * s},${cy + 20 * s}" fill="#e2e8f0" stroke="#ef4444" stroke-width="${1.2 * s}" class="pk9-svg-spin-fast"/>`;
    }

    const defs = `
      <linearGradient id="${gid}_c1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${o.p1}"/>
        <stop offset="65%" stop-color="${o.p2}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="${gid}_c2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${o.p2}"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <radialGradient id="${gid}_sk" cx="35%" cy="30%" r="68%">
        <stop offset="0%" stop-color="#fff5eb"/>
        <stop offset="60%" stop-color="${o.skin}"/>
        <stop offset="100%" stop-color="#d49c7c"/>
      </radialGradient>
      <radialGradient id="${gid}_hollow" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="45%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#6b21a8"/>
      </radialGradient>
      <linearGradient id="${gid}_goldhair" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#eab308"/>
        <stop offset="60%" stop-color="#fde047"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
      <linearGradient id="${gid}_visor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
      <linearGradient id="${gid}_wing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="55%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    `;

    const svgBody = `
      <!-- Multi-Ring 3D Isometric Energy Pedestal -->
      <ellipse cx="${cx}" cy="${cy + 58 * s}" rx="${48 * s}" ry="${13 * s}" fill="rgba(2,6,23,0.82)" stroke="${o.accent}" stroke-width="${1.8 * s}"/>
      <ellipse cx="${cx}" cy="${cy + 57 * s}" rx="${34 * s}" ry="${8 * s}" fill="none" stroke="${o.p1}" stroke-width="${1.5 * s}" stroke-dasharray="8 4" class="pk9-svg-pulse"/>
      ${backGear}
      <!-- Sculpted Left & Right Hero Arms & Gauntlets -->
      <path d="M${cx - 21 * s},${cy + 8 * s} L${cx - 34 * s},${cy + 24 * s} L${cx - 28 * s},${cy + 30 * s} L${cx - 17 * s},${cy + 18 * s} Z" fill="url(#${gid}_c1)" stroke="${o.accent}" stroke-width="${1 * s}"/>
      <path d="M${cx + 21 * s},${cy + 8 * s} L${cx + 34 * s},${cy + 24 * s} L${cx + 28 * s},${cy + 30 * s} L${cx + 17 * s},${cy + 18 * s} Z" fill="url(#${gid}_c1)" stroke="${o.accent}" stroke-width="${1 * s}"/>
      <!-- 3D Muscular / Armored Hero Torso & Waist Belt -->
      <path d="M${cx - 22 * s},${cy + 5 * s} L${cx + 22 * s},${cy + 5 * s} L${cx + 16 * s},${cy + 42 * s} L${cx - 16 * s},${cy + 42 * s} Z" fill="url(#${gid}_c1)" stroke="rgba(255,255,255,0.34)" stroke-width="${1.3 * s}"/>
      <path d="M${cx - 18 * s},${cy + 42 * s} L${cx - 21 * s},${cy + 56 * s} L${cx - 5 * s},${cy + 56 * s} L${cx},${cy + 45 * s} L${cx + 5 * s},${cy + 56 * s} L${cx + 21 * s},${cy + 56 * s} L${cx + 18 * s},${cy + 42 * s} Z" fill="#090d1a" stroke="${o.accent}" stroke-width="${1.1 * s}"/>
      <rect x="${cx - 17 * s}" y="${cy + 36 * s}" width="${34 * s}" height="${5.5 * s}" rx="${2 * s}" fill="${o.accent}"/>
      <!-- Sculpted Metallic Pauldrons -->
      <path d="M${cx - 27 * s},${cy + 9 * s} Q${cx - 18 * s},${cy - 3 * s} ${cx - 8 * s},${cy + 6 * s} L${cx - 16 * s},${cy + 18 * s} Z" fill="${o.accent}" opacity="0.94"/>
      <path d="M${cx + 27 * s},${cy + 9 * s} Q${cx + 18 * s},${cy - 3 * s} ${cx + 8 * s},${cy + 6 * s} L${cx + 16 * s},${cy + 18 * s} Z" fill="${o.accent}" opacity="0.94"/>
      <!-- 3D Rim Light -->
      <path d="M${cx - 14 * s},${cy + 10 * s} L${cx - 12 * s},${cy + 33 * s}" stroke="rgba(255,255,255,0.42)" stroke-width="${2.2 * s}" stroke-linecap="round"/>
      ${chestOverlay || `<circle cx="${cx}" cy="${cy + 20 * s}" r="${9 * s}" fill="rgba(2,6,23,0.78)" stroke="${o.accent}" stroke-width="${1.6 * s}"/><text x="${cx}" y="${cy + 23.5 * s}" text-anchor="middle" font-size="${8 * s}" font-weight="900" fill="${o.accent}" font-family="system-ui,sans-serif">${esc(o.emblem)}</text>`}
      ${weaponGear}
      <!-- Sculpted Anime Head & Chin -->
      <path d="M${cx - 19 * s},${cy - 20 * s} C${cx - 20 * s},${cy - 40 * s} ${cx + 20 * s},${cy - 40 * s} ${cx + 19 * s},${cy - 20 * s} Q${cx + 18 * s},${cy - 4 * s} ${cx},${cy - 1 * s} Q${cx - 18 * s},${cy - 4 * s} ${cx - 19 * s},${cy - 20 * s} Z" fill="url(#${gid}_sk)" stroke="rgba(255,255,255,0.24)" stroke-width="${1 * s}"/>
      ${hairShape}
      ${eyes}
      ${headAccessory}
    `;

    return { defs, body: svgBody, defaultAura: o.defaultAura };
  }

  // ---------- 4. 3D COMPANION PET SCULPTOR ----------
  const PET_SPECS = {
    'pet-owl': { c1: '#b45309', c2: '#fef3c7', eye: '#fbbf24', tag: 'owl' },
    'pet-fox': { c1: '#38bdf8', c2: '#e0f2fe', eye: '#0284c7', tag: 'fox' },
    'pet-cat': { c1: '#f59e0b', c2: '#fffbeb', eye: '#10b981', tag: 'cat' },
    'pet-spark': { c1: '#facc15', c2: '#fef9c3', eye: '#dc2626', tag: 'spark' },
    'pet-mecha': { c1: '#3b82f6', c2: '#e2e8f0', eye: '#22d3ee', tag: 'mecha' },
    'pet-dragon': { c1: '#ef4444', c2: '#fb923c', eye: '#fde047', tag: 'dragon' },
    'pet-shadow-wolf': { c1: '#4c1d95', c2: '#a855f7', eye: '#e879f9', tag: 'wolf' },
    'pet-unicorn': { c1: '#ec4899', c2: '#fdf4ff', eye: '#a855f7', tag: 'unicorn' },
    'pet-spirit-dragon': { c1: '#10b981', c2: '#fde047', eye: '#fef08a', tag: 'shenron' }
  };

  function renderPetSvg(petId, sizePx) {
    const p = PET_SPECS[petId] || PET_SPECS['pet-owl'];
    const gid = nextId('pet');
    const c = 60;
    let model = '';

    if (p.tag === 'mecha') {
      model = `
        <circle cx="${c}" cy="${c}" r="30" fill="url(#${gid}_b)" stroke="#93c5fd" stroke-width="2.5"/>
        <circle cx="${c}" cy="${c}" r="18" fill="#090d1a" stroke="#22d3ee" stroke-width="2"/>
        <circle cx="${c}" cy="${c}" r="8" fill="#22d3ee" class="pk9-svg-pulse"/>
        <ellipse cx="${c}" cy="${c}" rx="44" ry="12" fill="none" stroke="#38bdf8" stroke-width="2" transform="rotate(-18 ${c} ${c})" class="pk9-svg-spin-slow"/>
      `;
    } else if (p.tag === 'fox') {
      model = `
        <path d="M26,74 Q10,50 24,34 Q36,48 44,68 Z" fill="url(#${gid}_b)" opacity="0.88"/>
        <path d="M94,74 Q110,50 96,34 Q84,48 76,68 Z" fill="url(#${gid}_b)" opacity="0.88"/>
        <polygon points="36,44 30,16 52,32" fill="${p.c1}"/>
        <polygon points="84,44 90,16 68,32" fill="${p.c1}"/>
        <ellipse cx="${c}" cy="58" rx="28" ry="26" fill="url(#${gid}_b)"/>
        <polygon points="44,68 76,68 60,84" fill="#ffffff"/>
        <circle cx="49" cy="54" r="4" fill="#0f172a"/><circle cx="71" cy="54" r="4" fill="#0f172a"/>
        <circle cx="49" cy="53" r="1.6" fill="#fff"/><circle cx="71" cy="53" r="1.6" fill="#fff"/>
      `;
    } else if (p.tag === 'spark') {
      model = `
        <path d="M84,68 L104,48 L92,46 L108,28" fill="none" stroke="#facc15" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polygon points="36,40 24,14 48,30" fill="#facc15"/><polygon points="29,22 24,14 34,19" fill="#0f172a"/>
        <polygon points="84,40 96,14 72,30" fill="#facc15"/><polygon points="91,22 96,14 86,19" fill="#0f172a"/>
        <circle cx="${c}" cy="58" r="28" fill="url(#${gid}_b)"/>
        <circle cx="42" cy="64" r="6" fill="#ef4444"/><circle cx="78" cy="64" r="6" fill="#ef4444"/>
        <circle cx="49" cy="52" r="4.2" fill="#0f172a"/><circle cx="71" cy="52" r="4.2" fill="#0f172a"/>
        <circle cx="48" cy="50.5" r="1.5" fill="#fff"/><circle cx="70" cy="50.5" r="1.5" fill="#fff"/>
      `;
    } else if (p.tag === 'dragon' || p.tag === 'shenron') {
      model = `
        <path d="M24,66 C8,46 18,22 38,34 L42,56 Z" fill="${p.c2}"/>
        <path d="M96,66 C112,46 102,22 82,34 L78,56 Z" fill="${p.c2}"/>
        <polygon points="44,32 36,12 52,26" fill="#fde047"/>
        <polygon points="76,32 84,12 68,26" fill="#fde047"/>
        <circle cx="${c}" cy="56" r="27" fill="url(#${gid}_b)" stroke="#fde047" stroke-width="2"/>
        <polygon points="44,50 54,53 47,57" fill="${p.eye}"/><polygon points="76,50 66,53 73,57" fill="${p.eye}"/>
        <circle cx="${c}" cy="76" r="8" fill="#f59e0b" stroke="#fff" stroke-width="1.2"/>
      `;
    } else if (p.tag === 'wolf') {
      model = `
        <polygon points="34,46 28,12 52,30" fill="${p.c1}" stroke="#c084fc" stroke-width="1.5"/>
        <polygon points="86,46 92,12 68,30" fill="${p.c1}" stroke="#c084fc" stroke-width="1.5"/>
        <polygon points="${c},28 88,52 76,84 44,84 32,52" fill="url(#${gid}_b)" stroke="#a855f7" stroke-width="1.5"/>
        <polygon points="43,53 55,56 46,60" fill="#e879f9"/><polygon points="77,53 65,56 74,60" fill="#e879f9"/>
      `;
    } else if (p.tag === 'unicorn') {
      model = `
        <polygon points="60,8 52,32 68,32" fill="#fde047" stroke="#fff" stroke-width="1.4"/>
        <ellipse cx="${c}" cy="58" rx="28" ry="26" fill="url(#${gid}_b)" stroke="#f9a8d4" stroke-width="2"/>
        <circle cx="49" cy="54" r="4" fill="#4c1d95"/><circle cx="71" cy="54" r="4" fill="#4c1d95"/>
        <circle cx="48" cy="52.5" r="1.5" fill="#fff"/><circle cx="70" cy="52.5" r="1.5" fill="#fff"/>
      `;
    } else {
      model = `
        <polygon points="36,44 32,16 52,30" fill="${p.c1}"/>
        <polygon points="84,44 88,16 68,30" fill="${p.c1}"/>
        <circle cx="${c}" cy="58" r="28" fill="url(#${gid}_b)"/>
        <ellipse cx="${c}" cy="66" rx="18" ry="14" fill="${p.c2}" opacity="0.9"/>
        <circle cx="49" cy="53" r="4.5" fill="#0f172a"/><circle cx="71" cy="53" r="4.5" fill="#0f172a"/>
        <circle cx="48" cy="51.5" r="1.6" fill="#fff"/><circle cx="70" cy="51.5" r="1.6" fill="#fff"/>
      `;
    }

    return `
      <svg viewBox="0 0 120 120" width="${sizePx || 110}" height="${sizePx || 110}" style="display:block;overflow:visible;">
        <defs>
          <radialGradient id="${gid}_b" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stop-color="${p.c2}"/>
            <stop offset="55%" stop-color="${p.c1}"/>
            <stop offset="100%" stop-color="#090d1a"/>
          </radialGradient>
        </defs>
        <ellipse cx="${c}" cy="96" rx="28" ry="6" fill="rgba(2,6,23,0.6)" stroke="${p.c1}" stroke-width="1.2"/>
        <g class="pk9-pedestal-model-3d" style="animation-duration:3.4s;">${model}</g>
      </svg>
    `;
  }

  // ---------- 5. FULL COMPOSITE 3D HERO + AURA + FRAME + PET SCENE ----------
  function renderHeroSceneSvg(eq, opts = {}) {
    const size = opts.size || 210;
    const gid = nextId('hero');
    const outfitId = eq?.outfit?.id || eq?.outfit || 'outfit-scholar';
    const frameClass = eq?.frame?.cssClass || eq?.frame || 'pk9-frame-bronze';
    const heroData = buildHeroCharacterSvg(outfitId, gid, 110, 120, 1.05);
    const auraKey = (eq?.aura === null)
      ? null
      : (eq?.aura?.cssClass || eq?.aura?.id || heroData.defaultAura || 'aura-none');
    const auraSpec = auraKey ? getAuraSpec(auraKey) : null;
    const auraLayers = renderAuraSvgLayers(auraSpec, gid, 110, 112, 1.32);

    const petId = eq?.pet?.id || eq?.pet || '';
    const petHtml = petId
      ? `<g transform="translate(150, 126) scale(0.56)">${renderPetSvg(petId, 120).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`
      : '';

    const frameHtml = frameClass && opts.showFrame !== false
      ? `<g transform="translate(-8, -8) scale(1.96)" opacity="0.96">${renderFrameRingSvg(frameClass, 120, { baseR: 43 }).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`
      : '';

    return `
      <svg viewBox="0 0 220 220" width="${size}" height="${size}" style="display:block;overflow:visible;">
        <defs>${auraLayers.defs}${heroData.defs}</defs>
        ${auraLayers.back}
        ${frameHtml}
        ${heroData.body}
        ${auraLayers.front}
        ${petHtml}
      </svg>
    `;
  }

  // ---------- 6. SHOP ITEM 3D STAGE RENDERER ----------
  function renderItemStageInner(item) {
    const gid = nextId('it');
    const cat = item.category;

    if (cat === 'outfit') {
      return renderHeroSceneSvg({ outfit: item.id, frame: null, aura: null }, { size: 128, showFrame: false });
    }
    if (cat === 'aura') {
      const spec = getAuraSpec(item.cssClass || item.id);
      const layers = renderAuraSvgLayers(spec, gid, 65, 65, 0.85);
      return `
        <svg viewBox="0 0 130 130" width="126" height="126" style="display:block;overflow:visible;">
          <defs>${layers.defs}</defs>
          ${layers.back}
          <circle cx="65" cy="65" r="22" fill="rgba(15,23,42,0.85)" stroke="${spec?.c3 || '#fff'}" stroke-width="2"/>
          <text x="65" y="72" text-anchor="middle" font-size="22">${item.icon || '✨'}</text>
          ${layers.front}
        </svg>
      `;
    }
    if (cat === 'frame') {
      const fClass = item.cssClass || 'pk9-frame-bronze';
      const fSpec = FRAME_SPECS[fClass] || FRAME_SPECS['pk9-frame-bronze'];
      return `
        <div style="position:relative;width:124px;height:124px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 35% 30%, ${fSpec.ring2}44, #090d1a 78%);display:flex;align-items:center;justify-content:center;overflow:hidden;">
            <svg viewBox="0 0 60 60" width="66" height="66" opacity="0.9">
              <path d="M14,56 L18,32 Q30,26 42,32 L46,56 Z" fill="${fSpec.ring1}"/>
              <circle cx="30" cy="21" r="10.5" fill="#ffdec7"/>
              <path d="M18,20 Q30,6 42,20 Q35,14 25,14 Z" fill="#0f172a"/>
              <circle cx="26.5" cy="21" r="1.4" fill="${fSpec.ring2}"/><circle cx="33.5" cy="21" r="1.4" fill="${fSpec.ring2}"/>
            </svg>
          </div>
          ${renderFrameRingSvg(fClass, 124)}
        </div>
      `;
    }
    if (cat === 'pet') {
      return renderPetSvg(item.id, 118);
    }
    if (cat === 'cardbg') {
      return `
        <div class="${esc(item.cssClass || 'pk9-cardbg-ocean')}" style="width:134px;height:84px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.45);box-shadow:0 12px 24px rgba(0,0,0,0.55);display:flex;flex-direction:column;justify-content:space-between;padding:8px 10px;color:#fff;transform:rotateX(10deg) rotateY(-12deg);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.62rem;font-weight:900;letter-spacing:0.06em;opacity:0.9;">PHÚC K9 ID</span>
            <span style="font-size:0.95rem;">${item.icon || '🪪'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:20px;height:20px;border-radius:4px;background:#fff;opacity:0.9;"></div>
            <div style="height:6px;flex:1;border-radius:999px;background:rgba(255,255,255,0.38);"></div>
          </div>
        </div>
      `;
    }
    if (cat === 'title') {
      const rarityGlow = item.rarity === 'mythic' ? '#f43f5e' : item.rarity === 'legendary' ? '#f59e0b' : item.rarity === 'epic' ? '#a855f7' : '#38bdf8';
      return `
        <div style="padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,rgba(15,23,42,0.92),${rarityGlow}44);border:2px solid ${rarityGlow};box-shadow:0 0 22px ${rarityGlow}88;color:#fff;font-weight:900;font-size:0.84rem;display:inline-flex;align-items:center;gap:6px;transform:translateZ(12px);">
          <span style="font-size:1.15rem;">${item.icon || '🏅'}</span>
          <span>${esc(item.name)}</span>
        </div>
      `;
    }
    return `
      <div style="width:76px;height:76px;border-radius:20px;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.28),rgba(59,130,246,0.22));border:2px solid rgba(125,211,252,0.55);box-shadow:0 0 26px rgba(56,189,248,0.45);display:flex;align-items:center;justify-content:center;font-size:2.35rem;animation:pk9Float3D 3s ease-in-out infinite;">
        ${item.icon || '⚡'}
      </div>
    `;
  }

  const CAT_LABELS = {
    outfit: 'Trang phục 3D',
    aura: 'Hào quang Aura',
    frame: 'Khung Anime',
    pet: 'Linh thú 3D',
    title: 'Danh hiệu',
    cardbg: 'Nền Thẻ QR',
    consumable: 'Vật phẩm'
  };

  function renderCatalogStageHtml(item, isPreviewed) {
    const rarity = item?.rarity || 'common';
    const catLabel = CAT_LABELS[item?.category] || 'Trang bị';
    const canTry = ['outfit', 'aura', 'frame', 'pet', 'title', 'cardbg'].includes(item?.category);
    return `
      <div class="pk9-shop-stage-3d rarity-${esc(rarity)}"${canTry ? ` data-rpg-try="${esc(item.id)}" role="button" tabindex="0" title="Nhấn để mặc thử 3D lên Nhân vật"` : ''}>
        <div class="pk9-shop-stage-topbar">
          <span class="pk9-shop-cat-pill">${esc(catLabel)}</span>
          <span class="pk9-badge pk9-rarity-${esc(rarity)}">${esc(rarity.toUpperCase())}</span>
        </div>
        <div class="pk9-shop-stage-svg">${renderItemStageInner(item)}</div>
        ${canTry ? `
          <span class="pk9-shop-try-pill">
            ${isPreviewed ? '✨ Đang thử' : '👁️ Thử 3D'}
          </span>
        ` : ''}
      </div>
    `;
  }

  // ---------- 7. COMPOSABLE AVATAR STAGE FOR HOME / ID CARD / LEADERBOARD ----------
  function renderAvatarStageHtml(opts = {}) {
    const size = opts.size || 'md';
    const pxMap = { sm: 42, md: 64, lg: 88, xl: 124 };
    const px = pxMap[size] || 64;
    const frameClass = opts.frameClass || 'pk9-frame-bronze';
    const outfitId = opts.outfitId || 'outfit-scholar';
    const auraClass = opts.auraClass || '';
    const petId = opts.petId || '';
    const petIcon = opts.petIcon || '';
    const navAttr = opts.navTab ? ` data-nav-tab="${esc(opts.navTab)}"` : '';
    const titleAttr = opts.title ? ` title="${esc(opts.title)}"` : '';

    const hero = buildHeroCharacterSvg(outfitId, nextId('av'), 60, 66, 0.72);
    const auraSpec = auraClass ? getAuraSpec(auraClass) : null;
    const auraSvg = auraSpec
      ? `<svg viewBox="0 0 120 120" width="100%" height="100%" style="overflow:visible;">${(() => { const g = nextId('aa'); const l = renderAuraSvgLayers(auraSpec, g, 60, 60, 0.8); return `<defs>${l.defs}</defs>${l.back}${l.front}`; })()}</svg>`
      : '';

    const petBadge = petId || petIcon
      ? `<span class="pk9-avatar-stage-pet" title="${esc(opts.petName || 'Thú cưng')}">${petId ? renderPetSvg(petId, size === 'sm' ? 16 : 26) : esc(petIcon)}</span>`
      : '';

    return `
      <div class="pk9-avatar-stage is-${esc(size)}"${navAttr}${titleAttr}>
        ${auraSvg ? `<div class="pk9-avatar-stage-aura">${auraSvg}</div>` : ''}
        <div class="pk9-avatar-stage-core ${esc(frameClass)}">
          <svg viewBox="0 0 120 120" width="${px}" height="${px}" style="display:block;">
            <defs>${hero.defs}</defs>
            ${hero.body}
          </svg>
        </div>
        <div class="pk9-avatar-stage-frame-fx">${renderFrameRingSvg(frameClass, '100%')}</div>
        ${petBadge}
      </div>
    `;
  }

  window.PK9_RPG_MODELS = {
    renderHeroSceneSvg,
    renderCatalogStageHtml,
    renderAvatarStageHtml,
    renderFrameRingSvg,
    renderPetSvg,
    getAuraSpec
  };
})();
