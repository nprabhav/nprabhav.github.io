/* Prabhav Nalhe — site.js (shared across pages; every feature null-guarded) */
(function () {
'use strict';
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- theme (view-transition wipe) ---------- */
const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
if (savedTheme) root.setAttribute('data-theme', savedTheme);
else if (matchMedia('(prefers-color-scheme: light)').matches) root.setAttribute('data-theme', 'light');
function applyTheme() {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) {}
}
const themeBtn = $('#theme-toggle');
function toggleTheme() {
  if (document.startViewTransition && !reduced && themeBtn) {
    const r = themeBtn.getBoundingClientRect();
    root.style.setProperty('--wipe-x', (r.left + r.width / 2) + 'px');
    root.style.setProperty('--wipe-y', (r.top + r.height / 2) + 'px');
    try { document.startViewTransition({ update: applyTheme, types: ['theme'] }); }
    catch (e) { document.startViewTransition(applyTheme); }
  } else applyTheme();
}
if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

/* ---------- boot preloader (index only) ---------- */
(function () {
  const boot = $('#boot');
  if (!boot) { document.body.classList.add('loaded'); return; }
  const pre = $('#boot-text');
  let seen = false;
  try { seen = sessionStorage.getItem('booted') === '1'; } catch (e) {}
  if (reduced || seen) { boot.remove(); document.body.classList.remove('locked'); document.body.classList.add('loaded'); return; }
  const LINES = [
    ['<span class="p">nprabhav:~$</span> ./portfolio --init', 0],
    ['loading systems........ <span class="ok">ok</span>', 220],
    ['fusing telemetry....... <span class="ok">ok</span>', 380],
    ['injecting faults....... <span class="ok">contained</span>', 540],
    ['<span class="p">nprabhav:~$</span> render', 720],
  ];
  LINES.forEach(([html, t]) => setTimeout(() => { pre.innerHTML += html + '\n'; }, t));
  setTimeout(() => {
    boot.classList.add('done');
    document.body.classList.remove('locked');
    document.body.classList.add('loaded');
    try { sessionStorage.setItem('booted', '1'); } catch (e) {}
    setTimeout(() => boot.remove(), 700);
  }, 1050);
})();

/* ---------- text scramble ---------- */
(function () {
  const el = $('#scramble');
  if (!el || reduced) return;
  const target = el.textContent, chars = '!<>-_\\/[]{}—=+*^?#$';
  let frame = 0; const total = 36;
  setTimeout(function tick() {
    let out = '';
    for (let i = 0; i < target.length; i++) {
      const th = (i / target.length) * total * .7;
      out += frame > th + 8 ? target[i] : target[i] === ' ' ? ' ' : chars[(Math.random() * chars.length) | 0];
    }
    el.textContent = out;
    if (frame++ < total + 12) requestAnimationFrame(tick);
    else el.textContent = target;
  }, 1100);
})();

/* ---------- custom cursor ---------- */
(function () {
  const dot = $('#cursor-dot'), ring = $('#cursor-ring');
  if (!dot || !ring || !finePointer || reduced) return;
  document.body.classList.add('has-cursor');
  let mx = -100, my = -100, rx = -100, ry = -100;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  (function loop() {
    rx += (mx - rx) * .16; ry += (my - ry) * .16;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  const hot = 'a, button, input, [data-hot]';
  document.addEventListener('pointerover', e => { if (e.target.closest(hot)) ring.classList.add('hot'); });
  document.addEventListener('pointerout', e => { if (e.target.closest(hot)) ring.classList.remove('hot'); });
})();

/* ---------- magnetic ---------- */
if (finePointer && !reduced) $$('.magnetic').forEach(el => {
  const k = .35;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width/2)*k}px,${(e.clientY - r.top - r.height/2)*k}px)`;
  });
  el.addEventListener('pointerleave', () => {
    el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
    el.style.transform = '';
    setTimeout(() => el.style.transition = '', 500);
  });
});

/* ---------- CTA letter split ---------- */
(function () {
  const el = $('#cta-huge');
  if (!el) return;
  el.innerHTML = [...el.textContent].map(c => c === ' ' ? ' ' : `<span class="ch">${c}</span>`).join('');
})();

/* ---------- reveals ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- scrollspy ---------- */
(function () {
  const links = $$('[data-spy]');
  if (!links.length) return;
  const spyIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.dataset.spy === e.target.id));
  }), { rootMargin: '-20% 0px -60% 0px' });
  links.forEach(l => { const t = document.getElementById(l.dataset.spy); if (t) spyIO.observe(t); });
})();

/* ---------- scroll progress + hero parallax ---------- */
(function () {
  const prog = $('#scroll-progress'), glow = $('#hero-glow');
  if (!prog && !glow) return;
  addEventListener('scroll', () => {
    const h = document.documentElement;
    if (prog) prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
    if (glow && !reduced && h.scrollTop < 900) glow.style.transform = `translateX(-50%) translateY(${h.scrollTop * .18}px)`;
  }, { passive: true });
})();

/* ---------- count-up ---------- */
(function () {
  const els = $$('.stat b[data-count]');
  if (!els.length) return;
  const fmt = n => n >= 1000 ? n.toLocaleString('en-US') : String(n);
  const statIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    statIO.unobserve(e.target);
    if (reduced) return;
    const el = e.target, target = +el.dataset.count;
    const prefix = el.dataset.prefix || '';
    const unitEl = el.querySelector('.unit');
    const unit = unitEl ? unitEl.outerHTML : '';
    const t0 = performance.now(), dur = 1100;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = prefix + fmt(Math.round(target * eased)) + unit;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .6 });
  els.forEach(el => statIO.observe(el));
})();

/* ---------- marquees ---------- */
(function () {
  const t = $('#marquee-track'); if (t) t.innerHTML += t.innerHTML;
  const n = $('#name-track'); if (n) n.innerHTML = n.innerHTML.repeat(6);
})();

/* ---------- case cards: spotlight + tilt + stack ---------- */
(function () {
  const cards = $$('.case-card');
  if (!cards.length) return;
  const state = cards.map(() => ({ tx: 0, ty: 0, overlap: 0 }));
  function apply(i) {
    const s = state[i];
    cards[i].style.transform = `scale(${1 - s.overlap * .05}) translateY(${-s.overlap * 10}px) rotateX(${s.ty}deg) rotateY(${s.tx}deg)`;
    cards[i].style.filter = `brightness(${1 - s.overlap * .25})`;
  }
  cards.forEach((card, i) => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      if (finePointer && !reduced) {
        state[i].tx = ((e.clientX - r.left) / r.width - .5) * 2.4;
        state[i].ty = -((e.clientY - r.top) / r.height - .5) * 2.4;
        apply(i);
      }
    });
    card.addEventListener('pointerleave', () => { state[i].tx = state[i].ty = 0; apply(i); });
  });
  if (!reduced) addEventListener('scroll', () => {
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      const next = cards[i + 1].getBoundingClientRect();
      state[i].overlap = Math.max(0, Math.min(1, (innerHeight - next.top) / innerHeight));
      apply(i);
    });
  }, { passive: true });
})();

/* ---------- local time ---------- */
(function () {
  const el = $('#local-time');
  if (!el) return;
  function setTime() {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' }) + ' PT';
  }
  setTime(); setInterval(setTime, 30000);
})();

/* ---------- hero graph canvas ---------- */
(function () {
  const canvas = $('#graph-canvas');
  if (!canvas || reduced) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], dpr = Math.min(devicePixelRatio || 1, 2);
  const N = 26, LINK_DIST = 150;
  const accentRGB = () => root.getAttribute('data-theme') === 'light' ? '15,138,77' : '110,231,160';
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function init() {
    nodes = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
      r: 1.2 + Math.random() * 1.6, pulse: Math.random() * Math.PI * 2,
    }));
  }
  /* the visitor is a node in the graph too */
  let px = -1e4, py = -1e4;
  if (finePointer) {
    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { px = py = -1e4; });
  }
  let last = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (t - last < 33) return;
    last = t;
    ctx.clearRect(0, 0, W, H);
    const rgb = accentRGB();
    nodes.forEach(n => {
      const d = Math.hypot(n.x - px, n.y - py);
      if (d < 170) {
        ctx.strokeStyle = `rgba(${rgb},${(1 - d / 170) * .32})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(px, py); ctx.stroke();
      }
    });
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const a = nodes[i], b = nodes[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < LINK_DIST) {
        ctx.strokeStyle = `rgba(${rgb},${(1 - d / LINK_DIST) * .14})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy; n.pulse += .02;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      ctx.fillStyle = `rgba(${rgb},${.35 + Math.sin(n.pulse) * .2})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
  }
  resize(); init(); requestAnimationFrame(frame);
  addEventListener('resize', () => { resize(); init(); });
})();

/* ---------- TOC highlighting (article pages) ---------- */
(function () {
  const links = $$('.toc a');
  if (!links.length) return;
  const heads = links.map(a => $(a.hash)).filter(Boolean);
  const hIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.hash === '#' + e.target.id));
  }), { rootMargin: '-15% 0px -70% 0px' });
  heads.forEach(h => hIO.observe(h));
})();

/* ---------- command palette ---------- */
(function () {
  const overlay = $('#palette-overlay');
  if (!overlay) return;
  const palInput = $('#pal-input'), palList = $('#pal-list');
  const home = document.body.dataset.root || '.';
  let sel = 0, filtered = [];
  const jump = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else location.href = home + '/index.html#' + id;
  };
  const ACTIONS = [
    { ic: '↧', label: 'Download résumé', hint: 'pdf', run: () => open('https://prabhavnalhe.com/resume.pdf', '_blank') },
    { ic: '✉', label: 'Email me', hint: 'mailto', run: () => location.href = 'mailto:nprabhav111@gmail.com' },
    { ic: '⌂', label: 'Go to top', hint: 'home', run: () => scrollTo({ top: 0, behavior: 'smooth' }) },
    { ic: '§', label: 'Jump to experience', hint: 'section', run: () => jump('experience') },
    { ic: '§', label: 'Jump to selected work', hint: 'section', run: () => jump('work') },
    { ic: '§', label: 'Jump to writing', hint: 'section', run: () => jump('writing') },
    { ic: '◐', label: 'Toggle theme', hint: 'dark/light', run: toggleTheme },
    { ic: '⎇', label: 'Open GitHub', hint: 'github.com/nprabhav', run: () => open('https://github.com/nprabhav', '_blank') },
    { ic: 'in', label: 'Open LinkedIn', hint: 'linkedin', run: () => open('https://linkedin.com/in/nprabhav', '_blank') },
    { ic: '✍', label: 'Read all notes', hint: 'blog', run: () => location.href = home + '/notes/index.html' },
    { ic: '$', label: 'whoami', hint: 'easter egg', run: () => alert('Prabhav Nalhe — software engineer, infrastructure & reliability.\nSix years across backend and infra, currently at Meta.') },
  ];
  /* every note is searchable from the palette */
  if (Array.isArray(window.NOTES)) {
    ACTIONS.push({
      ic: '⚄', label: 'Read a random note', hint: 'surprise me',
      run: () => location.href = home + '/notes/' + window.NOTES[(Math.random() * window.NOTES.length) | 0].slug + '/',
    });
    window.NOTES.forEach(n => ACTIONS.push({
      ic: '✍', label: 'Read: ' + n.t, hint: n.min + ' min',
      run: () => location.href = home + '/notes/' + n.slug + '/',
    }));
  }
  function renderList() {
    const q = palInput.value.trim().toLowerCase();
    filtered = ACTIONS.filter(a => !q || a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(filtered.length - 1, 0));
    palList.innerHTML = filtered.length
      ? filtered.map((a, i) => `<div class="pal-item ${i === sel ? 'sel' : ''}" data-i="${i}"><span class="ic">${a.ic}</span><span>${a.label}</span><span class="kbd">${a.hint}</span></div>`).join('')
      : `<div class="pal-empty">zsh: command not found — try "resume" or "email"</div>`;
    $$('.pal-item', palList).forEach(el => {
      el.addEventListener('click', () => runAction(+el.dataset.i));
      el.addEventListener('pointermove', () => { sel = +el.dataset.i; paint(); });
    });
  }
  const paint = () => $$('.pal-item', palList).forEach((el, i) => el.classList.toggle('sel', i === sel));
  function runAction(i) { const a = filtered[i]; if (!a) return; closePal(); a.run(); }
  function openPal() { overlay.classList.add('open'); palInput.value = ''; sel = 0; renderList(); setTimeout(() => palInput.focus(), 10); }
  function closePal() { overlay.classList.remove('open'); }
  const opener = $('#pal-open');
  if (opener) opener.addEventListener('click', openPal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePal(); });
  palInput.addEventListener('input', () => { sel = 0; renderList(); });
  document.addEventListener('keydown', e => {
    const isOpen = overlay.classList.contains('open');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); isOpen ? closePal() : openPal(); return; }
    if (!isOpen && e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openPal(); return; }
    if (!isOpen) return;
    if (e.key === 'Escape') closePal();
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); }
    else if (e.key === 'Enter') runAction(sel);
  });
})();
})();
