
/* ============ IF-035 hand-walk pass 2: clip-aware neighbour overlap (IF035-17 steps 1, 3) and running-animation names ============ */
const R2 = {}
// Visible part of an element: its rect intersected with every ancestor that clips (overflow != visible).
const CLIPRECT = () => {
  window.__clipRect = (el) => {
    const r = el.getBoundingClientRect()
    let L = r.left, T = r.top, Rt = r.right, B = r.bottom
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const q = n.getBoundingClientRect()
        L = Math.max(L, q.left); T = Math.max(T, q.top); Rt = Math.min(Rt, q.right); B = Math.min(B, q.bottom)
      }
    }
    return { left: L, top: T, right: Rt, bottom: B, w: Math.max(0, Rt - L), h: Math.max(0, B - T) }
  }
}
const clipNeighbours = (sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel); const r = window.__clipRect(el)
  const cand = [...document.querySelectorAll('button, a[href], [role=button], [role=slider], [tabindex], .wm-feed-line, .wm-tl-track, input, select')]
    .filter((n) => window.__probe.visible(n) && n !== el && !n.contains(el) && !el.contains(n))
  return { target: { sel, ...window.__probe.box(el), visiblePart: r }, neighbours: cand.map((n) => {
    const q = window.__clipRect(n)
    if (q.w <= 0 || q.h <= 0) return null
    const d = Math.hypot(Math.max(0, q.left - r.right, r.left - q.right), Math.max(0, q.top - r.bottom, r.top - q.bottom))
    if (d > 48) return null
    const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)
    return { label: (n.getAttribute('aria-label') || n.textContent).trim().slice(0, 30), dist: Math.round(d * 10) / 10, visiblePart: q, overlap: w > 0.5 && h > 0.5 ? `${w.toFixed(1)}x${h.toFixed(1)}` : null }
  }).filter(Boolean) }
}, sel)
const anims = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => ({ name: a.animationName || a.constructor.name, target: a.effect?.target ? window.__probe.path(a.effect.target) : null, iterations: a.effect?.getTiming().iterations })))

note('# IF-035 hand-walk pass 2 — ' + new Date().toISOString())
await enter('opening'); await ensureNoCard(); await seed(); await wait(400); await install(); await page.evaluate(CLIPRECT)
R2.runningAnimationsOpening = await anims()
R2.step1_unread = await clipNeighbours('.wm-unread')
R2.step1_opButtonRaw = await page.evaluate(() => [...document.querySelectorAll('.wm-op')].map((b) => ({ label: b.getAttribute('aria-label')?.slice(0, 30), box: window.__probe.box(b), visiblePart: window.__clipRect(b) })))
await enter('influence-note'); await wait(400); await install(); await page.evaluate(CLIPRECT)
R2.step3_before = await clipNeighbours('.wm-moment-btn')
R2.step3_noteContainer = await page.evaluate(() => { const b = document.querySelector('.wm-moment-btn'); const s = b.closest('.scroll, [class*=scroll]'); return s ? { path: window.__probe.path(s), scrollTop: s.scrollTop, scrollHeight: s.scrollHeight, clientHeight: s.clientHeight, box: window.__probe.box(s) } : null })
await page.evaluate(() => document.querySelector('.wm-moment-btn').scrollIntoView({ block: 'nearest' }))
await wait(400); await settle()
R2.step3_afterScroll = await clipNeighbours('.wm-moment-btn')
R2.step3_hitsAfterScroll = await hits(['.wm-moment-btn'])
await shot('if-035-IF035-17-note-scrolled')
R2.errors = errs
writeFileSync(OUT + 'handwalk-output-pass2.json', JSON.stringify(R2, null, 2) + '\n')
note(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no console or page errors')
await browser.close()
process.exit(0)
