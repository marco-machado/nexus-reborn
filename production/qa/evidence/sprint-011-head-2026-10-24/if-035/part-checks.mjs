
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

note('# IF-035 hand-walk — ' + new Date().toISOString() + ' — ' + URL)

// IF035-02 + IF035-13 (opening, 14 events, unread 3)
await enter('opening'); await ensureNoCard(); await seed(); await wait(250); await install()
{
  const left = await settle()
  const e = await env()
  const t = await read(['.wm-tbtn:first-child', '.wm-unread', '.globe-toolbar button', '.globe-credit', '.navtab'])
  const sels = ['.wm-tbtn:first-child', '.wm-unread', '.globe-toolbar button', '.globe-credit', '.navtab']
  await shot('if-035-IF035-02')
  R['IF035-02'] = { runningAnimations: left, env: e, count: t.length, targets: strip(t), under: under(t), measuredSelectors: sels, errors: caseErrs() }
  const tb = await read(['.globe-toolbar button'])
  const credit = await page.evaluate(() => { const a = document.querySelector('.globe-credit'); return a ? { tag: a.tagName, href: a.getAttribute('href'), visible: window.__probe.visible(a), text: a.textContent.trim() } : null })
  const markers = await page.evaluate(() => document.querySelectorAll('[data-marker]').length)
  R['IF035-13'] = { toolbarCount: tb.length, labels: tb.map((b) => b.label), credit, markersOnPage: markers, markerInMeasuredSet: sels.some((s) => s.includes('data-marker')), errors: caseErrs() }
}
// IF035-03
{
  const out = {}
  for (const p of [true, false]) {
    await store(async (p) => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ paused: p }) }, p)
    await wait(200); out['paused_' + p] = { runningAnimations: await settle(), btn: strip(await read(['.wm-tbtn:first-child'])) }
  }
  await pause(); await settle(); await shot('if-035-IF035-03')
  out.env = await env(); out.errors = caseErrs()
  R['IF035-03'] = out
}
// IF035-14 transport, paused and unpaused
{
  const out = {}
  for (const p of [true, false]) {
    await store(async (p) => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ paused: p }) }, p)
    await wait(200); await settle()
    const b = await read(['.wm-tbtn'])
    out['paused_' + p] = { count: b.length, buttons: strip(b), overlaps: overlaps(b), hits: await hits(['.wm-tbtn']) }
  }
  await pause(); out.errors = caseErrs()
  R['IF035-14'] = out
}
// IF035-15 globe toolbar + credit, LABELS both states
{
  const out = {}
  const S = ['.globe-toolbar button', '.globe-credit']
  for (const k of ['before', 'labelsToggled', 'restored']) {
    if (k !== 'before') { await page.locator('.globe-toolbar button', { hasText: 'LABELS' }).click(); await wait(300) }
    await settle()
    const b = await read(S)
    out[k] = { count: b.length, controls: strip(b), overlaps: overlaps(b), hits: await hits(S) }
    if (k === 'before') await shot('if-035-IF035-15')
  }
  out.errors = caseErrs()
  R['IF035-15'] = out
}
// IF035-17 step 1: .wm-unread neighbours (still opening + seeded)
const neighbour = (sel, scope) => page.evaluate(({ sel, scope }) => {
  const t = [...document.querySelectorAll(sel)].filter(window.__probe.visible)
  if (t.length !== 1) return { count: t.length }
  const el = t[0], r = el.getBoundingClientRect()
  const root = scope ? document.querySelector(scope) : document
  const cand = [...root.querySelectorAll('button, a[href], [role=button], [role=slider], [tabindex], .wm-feed-line, .wm-tl-track, input, select')]
    .filter((n) => window.__probe.visible(n) && n !== el && !n.contains(el) && !el.contains(n))
  const dist = (q) => Math.hypot(Math.max(0, q.left - r.right, r.left - q.right), Math.max(0, q.top - r.bottom, r.top - q.bottom))
  const near = cand.map((n) => ({ n, q: n.getBoundingClientRect() })).filter(({ q }) => dist(q) <= 48)
  const ov = near.map(({ n, q }) => {
    const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)
    return { label: (n.getAttribute('aria-label') || n.textContent).trim().slice(0, 30), path: window.__probe.path(n), dist: Math.round(dist(q) * 10) / 10, box: window.__probe.box(n), overlap: w > 0.5 && h > 0.5 ? `${w.toFixed(1)}x${h.toFixed(1)}` : null }
  })
  return { count: 1, target: window.__probe.box(el), neighbours: ov, overlapping: ov.filter((o) => o.overlap) }
}, { sel, scope })
{
  await settle()
  const n = await neighbour('.wm-unread')
  R['IF035-17'] = { step1_unread: { ...n, hits: await hits(['.wm-unread']) } }
}
// IF035-12 FEED CLEAR (opening, unread 0)
{
  await store(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ unread: 0 }) })
  await wait(250); await settle(); await install()
  const fc = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span, div, button, a')].find((n) => n.textContent.trim() === 'FEED CLEAR' && n.children.length === 0)
    if (!el) return null
    window.__fc = el
    const pk = Object.keys(el).find((k) => k.startsWith('__reactProps'))
    const props = pk ? el[pk] : {}
    return { tag: el.tagName, role: el.getAttribute('role'), tabIndex: el.tabIndex, onclickProp: el.onclick, reactHandlers: Object.keys(props).filter((k) => /^on[A-Z]/.test(k)), cursor: getComputedStyle(el).cursor, box: window.__probe.box(el) }
  })
  const unreadEls = await page.evaluate(() => document.querySelectorAll('.wm-unread').length)
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0) })
  let focusedFC = false; const seen = []
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab')
    const f = await page.evaluate(() => { const a = document.activeElement; return { fc: !!(window.__fc && (a === window.__fc || window.__fc.contains(a))), d: a ? (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().slice(0, 24) : null } })
    if (f.fc) focusedFC = true
    seen.push(f.d)
  }
  await shot('if-035-IF035-12')
  R['IF035-12'] = { feedClear: fc, wmUnreadCount: unreadEls, tabPresses: 80, focusedFeedClear: focusedFC, focusSequenceFirst30: seen.slice(0, 30), env: await env(), errors: caseErrs() }
}
// IF035-10 + IF035-16 World Network, Brief locked then unlocked
{
  const locked = await navState('world-brief-locked', 'if-035-IF035-10-locked')
  await store(async () => { const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().selectMission('m03') })
  await wait(400); await goto('world'); await wait(500)
  const open = await navState('world-brief-unlocked', 'if-035-IF035-10-open')
  R['IF035-10'] = { locked, open, errors: caseErrs() }
}
// IF035-07/08/09 + IF035-16
for (const [id, phase] of [['IF035-07', 'research'], ['IF035-08', 'team'], ['IF035-09', 'brief']]) {
  await onScreen(phase)
  R[id] = { ...(await navState(phase, `if-035-${id}`)), errors: caseErrs() }
}
// IF035-17 steps 2-4
{
  await enter('review'); await settle()
  R['IF035-17'].step2_golive = { ...(await neighbour('.wm-live.review')), hits: await hits(['.wm-live.review']) }
  await enter('influence-note'); await settle()
  R['IF035-17'].step3_note = { ...(await neighbour('.wm-moment-btn')), hits: await hits(['.wm-moment-btn']) }
  await enter('opening-card'); await settle()
  R['IF035-17'].step4_card = { ...(await neighbour('.wm-onboard .hud-btn', '.wm-onboard')), hits: await hits(['.wm-onboard .hud-btn']) }
  R['IF035-17'].errors = caseErrs()
}

R.allErrors = errs
writeFileSync(OUT + 'handwalk-output.json', JSON.stringify(R, null, 2) + '\n')
note(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no console or page errors')
await browser.close()
process.exit(0)
