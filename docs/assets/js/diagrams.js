/* diagrams.js - theme-aware Mermaid rendering (hand-drawn look).
   Re-renders every diagram when the site theme toggles, remapping the
   light-tuned palette to dark equivalents so both themes look native. */
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

const els = [...document.querySelectorAll('pre.mermaid')];
if (els.length) {
  els.forEach(el => { el.dataset.src = el.textContent; });

  const DARK_MAP = {
    '#1e1e1e': '#e2e2dc', /* ink strokes & text */
    '#c92a2a': '#ff7b7b', /* alert red */
    '#2f9e44': '#6ee7a0', /* green */
    '#2383E2': '#7dd3fc', '#2383e2': '#7dd3fc', /* blue */
    '#e8f1fb': '#132430', /* pale blue fill */
    '#eaf6ec': '#13291c', /* pale green fill */
    '#fde7e7': '#301717', /* pale red fill */
  };
  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';

  async function render() {
    const dark = isDark();
    els.forEach(el => {
      let src = el.dataset.src;
      if (dark) for (const [from, to] of Object.entries(DARK_MAP)) src = src.split(from).join(to);
      el.removeAttribute('data-processed');
      el.textContent = src;
    });
    mermaid.initialize({
      startOnLoad: false, look: 'handDrawn', securityLevel: 'loose',
      theme: dark ? 'dark' : 'neutral',
      themeVariables: dark ? {
        fontFamily: "'Patrick Hand', cursive",
        background: 'transparent',
        primaryColor: '#161616', primaryTextColor: '#d6d6d0', primaryBorderColor: '#8a8a84',
        secondaryColor: '#101010', tertiaryColor: '#101010',
        lineColor: '#9a9a94', nodeTextColor: '#d6d6d0',
        clusterBkg: '#101010', clusterBorder: '#3a3a36',
        edgeLabelBackground: '#0a0a0a',
      } : {
        fontFamily: "'Patrick Hand', cursive",
        lineColor: '#4a4a46', primaryBorderColor: '#4a4a46',
      },
    });
    try { await mermaid.run({ nodes: els }); } catch (e) { /* keep source text visible on parse failure */ }
  }

  render();
  new MutationObserver(muts => {
    if (muts.some(m => m.attributeName === 'data-theme')) render();
  }).observe(document.documentElement, { attributes: true });
}
