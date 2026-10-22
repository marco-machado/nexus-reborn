() => { const sc = document.querySelector('.mb-dossier-scroll'); const cr = sc.getBoundingClientRect();
 const vis = (el) => { const r = el.getBoundingClientRect(); return r.top >= cr.top - 0.5 && r.bottom <= cr.bottom + 0.5 ? 'full' : (r.top >= cr.bottom ? 'below' : 'cut'); };
 const els = [...document.querySelectorAll('.mb-obj')].map(e => ({ t: 'row', text: e.textContent, vis: vis(e), sw: e.scrollWidth, cw: e.clientWidth }))
  .concat([...document.querySelectorAll('.mb-obj-kit')].map(e => ({ t: 'kit', text: e.textContent, vis: vis(e), sw: e.scrollWidth, cw: e.clientWidth, rendered: e.innerText })));
 const th = document.querySelector('.mb-threat').getBoundingClientRect();
 const boxes = [...sc.children].map(c => { const r = c.getBoundingClientRect(); return { cls: c.className, top: Math.round(r.top), bottom: Math.round(r.bottom) } });
 return JSON.stringify({ scale: getComputedStyle(document.documentElement).getPropertyValue('--text-scale') || document.documentElement.style.cssText, scrollTop: sc.scrollTop, scrollHeight: sc.scrollHeight, clientHeight: sc.clientHeight, colBottom: Math.round(cr.bottom), threat: { top: Math.round(th.top), bottom: Math.round(th.bottom) }, boxes, overflow: els.filter(e => e.sw > e.cw + 1).length, els }, null, 1) }
