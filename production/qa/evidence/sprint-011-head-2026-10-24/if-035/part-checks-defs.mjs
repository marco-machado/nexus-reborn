
/* ============ IF-035 hand-walk (Sprint 11 HEAD) — checks below; everything above is copied verbatim from sprint-011/probe.mjs lines 22-412 ============ */
const R = {}
let errMark = 0
const caseErrs = () => { const e = errs.slice(errMark); errMark = errs.length; return e }
const settle = async () => {
  for (let i = 0; i < 50; i++) {
    const n = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
    if (n === 0) return 0
    await wait(100)
  }
  return await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
}
const env = () => page.evaluate(async () => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  const s = useSettingsStore.getState()
  return { vp: [innerWidth, innerHeight], textScale: s.textScale, highContrast: s.highContrast, card: !!document.querySelector('.wm-onboard') }
})
const ensureNoCard = async () => {
  if (await page.evaluate(() => !!document.querySelector('.wm-onboard'))) {
    note('card still up: clicking UNDERSTOOD')
    await page.locator('.wm-onboard .hud-btn').click()
    await wait(400)
  }
}
const seed = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const s = useWorldStore.getState()
  const base = s.events[0]
  const events = Array.from({ length: 14 }, (_, i) => ({ ...base, id: 9000 + i, t: i * 60 }))
  useWorldStore.setState({ events, unread: 3 })
})
// Read boxes of every visible element matching sel (list of selectors in order).
const read = (sels) => page.evaluate((sels) => {
  const out = []
  for (const sel of sels) for (const el of document.querySelectorAll(sel)) {
    if (!window.__probe.visible(el)) continue
    const r = el.getBoundingClientRect()
    out.push({ sel, label: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 60), cls: el.className, ariaDisabled: el.getAttribute('aria-disabled'), ariaPressed: el.getAttribute('aria-pressed'), x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, right: r.right, bottom: r.bottom })
  }
  return out
}, sels)
const overlaps = (list) => {
  const bad = []
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
    const A = list[a], B = list[b]
    const w = Math.min(A.right, B.right) - Math.max(A.x, B.x)
    const h = Math.min(A.bottom, B.bottom) - Math.max(A.y, B.y)
    if (w > 0.5 && h > 0.5) bad.push(`${A.label} x ${B.label} ${w.toFixed(1)}x${h.toFixed(1)}`)
  }
  return bad
}
// Hit-test centre + 4 corners inset 1 px for every visible element of sels.
const hits = (sels) => page.evaluate((sels) => {
  const miss = []; let n = 0
  for (const sel of sels) for (const el of document.querySelectorAll(sel)) {
    if (!window.__probe.visible(el)) continue
    const r = el.getBoundingClientRect()
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 1, r.top + 1], [r.right - 1, r.top + 1], [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1]]
    for (const [x, y] of pts) {
      n++
      const hit = document.elementFromPoint(x, y)
      if (!(hit && (hit === el || el.contains(hit)))) miss.push(`${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30)} @${x.toFixed(1)},${y.toFixed(1)} -> ${hit ? window.__probe.path(hit) : 'null'}`)
    }
  }
  return { points: n, miss }
}, sels)
const under = (list) => list.filter((b) => b.w < 24 || b.h < 24).map((b) => `${b.label} ${b.w}x${b.h}`)
const strip = (l) => l.map(({ right, bottom, cls, ...b }) => b)
const navState = async (name, shotName) => {
  await settle(); await install()
  const e = await env()
  const tabs = await read(['.navtab'])
  const ov = overlaps(tabs), ht = await hits(['.navtab'])
  if (shotName) await shot(shotName)
  return { name, env: e, phase: await page.evaluate(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); const s = useAppStore.getState(); return { phase: s.phase, missionId: s.missionId } }), tabs: tabs.map(({ right, bottom, ...b }) => b), under: under(tabs), overlaps: ov, hits: ht }
}

