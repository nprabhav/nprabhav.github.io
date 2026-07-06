/* notes.js — constellation graph, index filters, and reading enhancements.
   Pure progressive enhancement: every feature null-guards its mount point. */
(function () {
'use strict';
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const NOTES = window.NOTES || [];
if (!NOTES.length) return;
const bySlug = Object.fromEntries(NOTES.map(n => [n.slug, n]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const root = document.documentElement;

/* undirected adjacency derived from directed links */
const EDGES = [];
const NEIGH = {};
NOTES.forEach(n => { NEIGH[n.slug] = new Set(); });
NOTES.forEach(n => n.links.forEach(to => {
  if (!bySlug[to]) return;
  EDGES.push([n.slug, to]);
  NEIGH[n.slug].add(to); NEIGH[to].add(n.slug);
}));

const seriesColor = key => {
  const v = window.NOTES_SERIES && window.NOTES_SERIES[key];
  return getComputedStyle(root).getPropertyValue(v ? v.cssVar : '--accent').trim() || '#6ee7a0';
};
const hexRGB = hex => {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)).join(',');
};

/* ---------- toast ---------- */
let toastEl, toastT;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ================================================================
   CONSTELLATION — notes as nodes, ideas as edges, packets as reads
   ================================================================ */
(function () {
  const canvas = $('#constellation');
  if (!canvas) return;
  const wrapEl = canvas.parentElement;
  const tip = $('#graph-tip');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, nodes = [], packets = [], hover = null, leaving = false, t0 = performance.now();
  let mx = -1e4, my = -1e4;

  const CLUSTER = { systems: [.26, .40], llm: [.70, .46], research: [.48, .82] };

  function build() {
    const r = wrapEl.getBoundingClientRect();
    W = r.width; H = Math.max(r.height, 200);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 56;
    nodes = NOTES.map((n, i) => {
      const [cx, cy] = CLUSTER[n.series] || [.5, .5];
      return {
        slug: n.slug, note: n, i,
        x: cx * W + (Math.random() - .5) * W * .22,
        y: cy * H + (Math.random() - .5) * H * .3,
        r: 3.5 + n.min * .55,
        phase: Math.random() * Math.PI * 2,
        f1: .00022 + Math.random() * .0002, f2: .00028 + Math.random() * .0002,
        pop: 0, dim: false,
      };
    });
    const idx = Object.fromEntries(nodes.map(nd => [nd.slug, nd]));
    /* settle with a tiny force sim: repulsion + edge springs + cluster gravity */
    for (let it = 0; it < 320; it++) {
      for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
        const A = nodes[a], B = nodes[b];
        let dx = A.x - B.x, dy = A.y - B.y;
        let d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2);
        const rep = Math.min(2600 / d2, 6);
        dx /= d; dy /= d;
        A.x += dx * rep; A.y += dy * rep; B.x -= dx * rep; B.y -= dy * rep;
      }
      EDGES.forEach(([f, t]) => {
        const A = idx[f], B = idx[t];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
        const pull = (d - Math.min(W * .16, 150)) * .012;
        A.x += dx / d * pull; A.y += dy / d * pull;
        B.x -= dx / d * pull; B.y -= dy / d * pull;
      });
      nodes.forEach(nd => {
        const [cx, cy] = CLUSTER[nd.note.series] || [.5, .5];
        nd.x += (cx * W - nd.x) * .012; nd.y += (cy * H - nd.y) * .012;
        nd.x = Math.max(pad, Math.min(W - pad, nd.x));
        nd.y = Math.max(38, Math.min(H - 44, nd.y));
      });
    }
    nodes.forEach(nd => { nd.bx = nd.x; nd.by = nd.y; });
    packets = [];
  }

  const nodeAt = (x, y) => nodes.find(nd => Math.hypot(nd.x - x, nd.y - y) < Math.max(nd.r + 14, 20));

  function spawnPacket(preferSlug) {
    if (!EDGES.length) return;
    let pool = EDGES;
    if (preferSlug) pool = EDGES.filter(e => e.includes(preferSlug));
    if (!pool.length) pool = EDGES;
    const e = pool[(Math.random() * pool.length) | 0];
    packets.push({ e, t: 0, speed: .0035 + Math.random() * .003 });
  }

  let lastSpawn = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = now - t0;
    ctx.clearRect(0, 0, W, H);
    const idx = Object.fromEntries(nodes.map(nd => [nd.slug, nd]));
    const light = root.getAttribute('data-theme') === 'light';
    const baseAlpha = light ? .34 : .30;

    /* drift + mouse repel */
    if (!reduced) nodes.forEach(nd => {
      nd.x = nd.bx + Math.sin(dt * nd.f1 + nd.phase) * 7;
      nd.y = nd.by + Math.cos(dt * nd.f2 + nd.phase * 1.7) * 6;
      const d = Math.hypot(nd.x - mx, nd.y - my);
      if (d < 90 && d > 0) { const k = (90 - d) / 90 * 10; nd.x += (nd.x - mx) / d * k; nd.y += (nd.y - my) / d * k; }
      nd.pop += ((hover === nd ? 1 : 0) - nd.pop) * .14;
    });

    /* edges */
    EDGES.forEach(([f, t]) => {
      const A = idx[f], B = idx[t];
      if (!A || !B) return;
      const active = hover && (hover.slug === f || hover.slug === t);
      const ghost = (hover && !active) || A.dim || B.dim;
      const rgbA = hexRGB(seriesColor(A.note.series));
      ctx.strokeStyle = active
        ? `rgba(${rgbA},.75)`
        : `rgba(${light ? '20,20,24' : '255,255,255'},${ghost ? baseAlpha * .25 : baseAlpha * .55})`;
      ctx.lineWidth = active ? 1.4 : 1;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    });

    /* packets — little telemetry pulses travelling the edges */
    if (!reduced) {
      if (now - lastSpawn > (hover ? 420 : 1500) && packets.length < (hover ? 10 : 5)) {
        spawnPacket(hover && hover.slug); lastSpawn = now;
      }
      packets = packets.filter(p => (p.t += p.speed * 16) < 1);
      packets.forEach(p => {
        const A = idx[p.e[0]], B = idx[p.e[1]];
        if (!A || !B) return;
        const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
        const rgb = hexRGB(seriesColor(A.note.series));
        const fade = Math.sin(p.t * Math.PI);
        ctx.fillStyle = `rgba(${rgb},${.9 * fade})`;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${rgb},${.18 * fade})`;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      });
    }

    /* nodes + labels */
    nodes.forEach(nd => {
      const col = seriesColor(nd.note.series);
      const rgb = hexRGB(col);
      const isN = hover && (hover === nd || NEIGH[hover.slug].has(nd.slug));
      const faded = (hover && !isN) || nd.dim;
      const a = faded ? .18 : 1;
      const R = nd.r + nd.pop * 3;
      /* halo */
      ctx.fillStyle = `rgba(${rgb},${(faded ? .03 : .10) + nd.pop * .16})`;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R * 2.6, 0, Math.PI * 2); ctx.fill();
      /* core */
      ctx.fillStyle = `rgba(${rgb},${a})`;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, R, 0, Math.PI * 2); ctx.fill();
      /* label */
      ctx.font = `${hover === nd ? '500 ' : ''}10.5px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = light
        ? `rgba(60,60,65,${faded ? .25 : hover === nd ? 1 : .78})`
        : `rgba(201,201,196,${faded ? .22 : hover === nd ? 1 : .72})`;
      ctx.fillText(nd.note.s, nd.x, nd.y + R + 15);
    });
  }

  function place(e) {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left; my = e.clientY - r.top;
    const h = nodeAt(mx, my);
    if (h !== hover) {
      hover = h;
      canvas.style.cursor = h ? 'pointer' : '';
      if (tip) tip.classList.toggle('show', !!h);
    }
    if (h && tip) {
      tip.innerHTML = `<b>${h.note.t}</b><span>${h.note.min} min · ${window.NOTES_SERIES[h.note.series].label.toLowerCase()}</span>`;
      const tx = Math.min(Math.max(mx, 90), W - 90);
      tip.style.left = tx + 'px';
      tip.style.top = Math.max(my - 16, 40) + 'px';
    }
  }
  canvas.addEventListener('pointermove', place);
  canvas.addEventListener('pointerleave', () => { hover = null; mx = my = -1e4; if (tip) tip.classList.remove('show'); });
  canvas.addEventListener('click', e => {
    place(e);
    if (!hover || leaving) return;
    leaving = true;
    const target = hover;
    const url = target.slug + '/';
    if (reduced) { location.href = url; return; }
    /* warp out: chosen star swells, the rest of the sky dims */
    nodes.forEach(nd => { if (nd !== target) nd.dim = true; });
    const grow = setInterval(() => { target.r += 1.6; }, 16);
    setTimeout(() => { clearInterval(grow); location.href = url; }, 300);
  });

  /* re-layout on resize (debounced) */
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 180); });

  build();
  requestAnimationFrame(frame);

  /* expose dimming to the filter code */
  window.__constellationFilter = match => {
    nodes.forEach(nd => { nd.dim = !match(nd.note); });
  };
})();

/* ================================================================
   FILTERS — series chips on the notes index
   ================================================================ */
(function () {
  const bar = $('#note-filters');
  const list = $('#notes-list');
  if (!bar || !list) return;
  const cards = $$('.note-row', list);
  const countEl = $('#notes-count');
  const chips = $$('button', bar);
  function apply(key) {
    chips.forEach(c => c.classList.toggle('on', c.dataset.filter === key));
    let shown = 0, mins = 0;
    cards.forEach((card, i) => {
      const ok = key === 'all' || card.dataset.series === key;
      card.classList.toggle('hide', !ok);
      if (ok) {
        shown++;
        mins += +(card.dataset.min || 0);
        card.style.animationDelay = (Math.min(shown, 12) * 28) + 'ms';
        card.classList.remove('pop');
        void card.offsetWidth; /* restart the entrance animation */
        card.classList.add('pop');
      }
    });
    if (countEl) countEl.textContent = `${shown} note${shown === 1 ? '' : 's'} · ${mins} min of thinking`;
    if (window.__constellationFilter) window.__constellationFilter(n => key === 'all' || n.series === key);
  }
  chips.forEach(c => c.addEventListener('click', () => apply(c.dataset.filter)));
  apply('all');
})();

/* ================================================================
   NOTE PAGE — read chip, anchors, keyboard thread nav, reveals
   ================================================================ */
(function () {
  const article = $('article.post-body');
  if (!article) return;
  root.classList.add('notes-enhanced');
  const slug = document.body.dataset.note;
  const note = slug && bySlug[slug];
  const mins = +document.body.dataset.min || (note && note.min) || 0;
  const i = note ? NOTES.findIndex(n => n.slug === slug) : -1;
  const prev = i > -1 && NOTES[i - 1], next = i > -1 && NOTES[i + 1];

  /* --- time-left chip with draining ring --- */
  if (mins) {
    const chip = document.createElement('button');
    chip.id = 'read-chip';
    chip.title = 'jump to takeaways';
    chip.innerHTML = `<svg viewBox="0 0 28 28" aria-hidden="true"><circle class="bg" cx="14" cy="14" r="11"/><circle class="fg" cx="14" cy="14" r="11"/></svg><span></span>`;
    document.body.appendChild(chip);
    const fg = $('.fg', chip), txt = $('span', chip);
    const C = 2 * Math.PI * 11;
    fg.style.strokeDasharray = C;
    let progress = 0;
    function paint() {
      const r = article.getBoundingClientRect();
      const total = r.height - innerHeight;
      progress = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 1;
      fg.style.strokeDashoffset = C * (1 - progress);
      const left = Math.ceil(mins * (1 - progress));
      txt.textContent = progress >= .985 ? 'read ✓' : `${left} min left`;
      chip.classList.toggle('done', progress >= .985);
      chip.classList.toggle('show', scrollY > 320);
    }
    addEventListener('scroll', paint, { passive: true });
    paint();
    chip.addEventListener('click', () => {
      const tk = $('.takeaways');
      (tk || article).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: tk ? 'center' : 'start' });
    });
  }

  /* --- heading anchor copy-links --- */
  $$('.prose h2[id]').forEach(h => {
    const a = document.createElement('a');
    a.className = 'hlink';
    a.href = '#' + h.id;
    a.textContent = '#';
    a.setAttribute('aria-label', 'Copy link to section');
    a.addEventListener('click', e => {
      e.preventDefault();
      const url = location.origin + location.pathname + '#' + h.id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(() => toast('$ section link copied ✓'))
        .catch(() => { location.hash = h.id; });
    });
    h.appendChild(a);
  });

  /* --- ← / → move along the thread --- */
  if (note) document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const pal = $('#palette-overlay');
    if (pal && pal.classList.contains('open')) return;
    if (e.key === 'ArrowLeft' && prev) location.href = '../' + prev.slug + '/';
    if (e.key === 'ArrowRight' && next) location.href = '../' + next.slug + '/';
  });
  try {
    if (note && !localStorage.getItem('kbd-hint') && finePointer) {
      setTimeout(() => { toast('tip: ← → moves along the thread'); localStorage.setItem('kbd-hint', '1'); }, 9000);
    }
  } catch (e) {}

  /* --- reveal choreography: pull quotes sweep, takeaways stamp in --- */
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: .4 });
    $$('.pullquote, .takeaways').forEach(el => io.observe(el));
  } else {
    $$('.pullquote, .takeaways').forEach(el => el.classList.add('in'));
  }

  /* --- reading progress spine in the TOC --- */
  const toc = $('.toc');
  if (toc && article) {
    const spine = document.createElement('div');
    spine.className = 'toc-spine';
    spine.innerHTML = '<i></i>';
    toc.appendChild(spine);
    const fill = $('i', spine);
    addEventListener('scroll', () => {
      const r = article.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 1;
      fill.style.height = (p * 100) + '%';
    }, { passive: true });
  }
})();
})();
