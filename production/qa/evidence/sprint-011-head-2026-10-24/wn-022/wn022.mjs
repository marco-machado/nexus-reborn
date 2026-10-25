// WN-022 hand-walk, Sprint 11 at HEAD 131a5c1. Launch copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60; fixtures (fresh,
// dismissCard, setScale, setHC, pause, sector) copied from its lines 297-342.
// Run: PROBE_URL=http://localhost:4200/ node wn022.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.PROBE_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.PROBE_URL || 'http://localhost:4200/'
const OUT = process.env.PROBE_OUT || new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const R = {}
const rec = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)) }
let errMark = 0
const newErrs = () => { const e = errs.slice(errMark); errMark = errs.length; return e }

async function fresh() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  await page.evaluate(async () => {
    const save = await import('/src/state/save.ts')
    save.startNewOperation()
    const { useAppStore } = await import('/src/state/appStore.ts')
    useAppStore.getState().goto('world')
  })
  await wait(700)
}
const store = (fn, arg) => page.evaluate(fn, arg)
const dismissCard = async () => {
  await store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.getState().markSeen('hint-worldmap')
  })
  await wait(300)
  const btn = page.getByRole('button', { name: /UNDERSTOOD/i })
  if (await btn.count()) { await btn.first().click(); await wait(300) }
}
const setScale = (scale) => store(async (scale) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setTextScale(scale)
}, scale)
const setHC = (on) => store(async (on) => {
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  useSettingsStore.getState().setHighContrast(on)
}, on)
const pause = () => store(async () => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useWorldStore.setState({ paused: true })
})
const sector = (id, patch) => store(async ({ id, patch }) => {
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const s = useWorldStore.getState()
  useWorldStore.setState({ selected: id, sectors: { ...s.sectors, [id]: { ...s.sectors[id], ...patch } } })
}, { id, patch })
const select = async (id) => { await sector(id, {}); await settle() }
const own = async (city, corp) => {
  await store(async ({ city, corp }) => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    useWorldStore.setState({ owner: { ...s.owner, [city]: corp } })
  }, { city, corp })
  await settle()
}
const settle = async () => {
  await wait(120)
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => { const t = a.effect && a.effect.getComputedTiming(); return t && Number.isFinite(t.iterations) && Number.isFinite(t.endTime) })
    .map((a) => a.finished.catch(() => {}))))
  await wait(60)
}
const row = (label) => page.evaluate((label) => {
  const kv = [...document.querySelectorAll('.kv')].find((k) => k.querySelector('span')?.textContent.trim() === label)
  if (!kv) return null
  const b = kv.querySelector('b')
  return { text: b?.textContent.trim(), cls: b?.className, color: b ? getComputedStyle(b).color : null,
    children: [...kv.children].map((c) => c.tagName.toLowerCase()) }
}, label)
const order = () => page.evaluate(() => {
  const sc = document.querySelector('.wm-sector-scroll')
  if (!sc) return null
  return [...sc.querySelectorAll('.kv > span:first-child, .wm-cu label')].map((e) => e.textContent.trim())
})

try {
  // ---------- 01 / 02 / 03 ----------
  await fresh(); newErrs(); await dismissCard(); await pause(); await setScale(100); await setHC(false)
  const ord = {}
  for (const id of ['na', 'eu', 'sa', 'af', 'as', 'oc']) {
    await select(id)
    const o = await order()
    ord[id] = { order: o, held: o.filter((x) => x === 'HELD BY').length, diff: o.indexOf('TAX YIELD') - o.indexOf('HELD BY') }
    if (id === 'na') await shot('wn-022-row-order-na')
  }
  rec('01', { ord, errs: newErrs() })

  await select('na')
  const n1 = await row('HELD BY'); await setHC(true); await settle()
  const n2 = await row('HELD BY'); await setHC(false); await settle()
  await shot('wn-022-nexus-na')
  rec('02', { off: n1, hcColor: n2.color, errs: newErrs() })

  await own('dt', 'nexus'); const t3a = await row('HELD BY')
  await own('dt', 'stratos'); const t3b = await row('HELD BY')
  rec('03', { flip: t3a, back: t3b, errs: newErrs() })

  // ---------- 04 / 05 ----------
  await fresh(); newErrs(); await dismissCard(); await pause(); await setScale(100); await setHC(false)
  const o4 = {}
  for (const id of ['eu', 'af', 'as', 'oc']) {
    await select(id); o4[id] = await row('HELD BY')
    if (id === 'eu') await shot('wn-022-other-eu')
    if (id === 'oc') await shot('wn-022-other-oc')
  }
  await setHC(true); await select('eu'); o4.euHC = (await row('HELD BY')).color; await setHC(false); await settle()
  rec('04', { ...o4, errs: newErrs() })
  await select('sa')
  rec('05', { held: await row('HELD BY'), tax: await row('TAX PAID'), errs: newErrs() })
  await shot('wn-022-contested-sa')

  // ---------- 06 ----------
  await fresh(); newErrs(); await dismissCard(); await pause(); await setScale(100); await setHC(false)
  const s6 = {}
  await sector('na', { control: 86 }); await own('nb', 'omni')
  s6.s1 = { held: await row('HELD BY'), tax: await row('TAX PAID') }
  await sector('na', { control: 10 }); await settle(); s6.s2 = await row('HELD BY')
  await own('nb', 'nexus')
  await sector('eu', { control: 37 }); await own('ln', 'nexus'); await own('nc', 'nexus')
  s6.s3 = { held: await row('HELD BY'), tax: await row('TAX PAID') }
  await shot('wn-022-owner-not-control')
  await sector('eu', { control: 95 }); await settle(); s6.s4 = await row('HELD BY')
  rec('06', { ...s6, errs: newErrs() })

  // ---------- 07 ----------
  await fresh(); newErrs(); await dismissCard(); await pause(); await setScale(100); await setHC(false)
  await page.evaluate(() => { document.documentElement.style.filter = 'grayscale(1)' })
  const g = {}
  for (const [id, n] of [['na', 'nexus'], ['eu', 'other'], ['sa', 'contested']]) {
    await select(id); g[id] = await row('HELD BY'); await shot('wn-022-gray-' + n)
    // crop of the row for the pixel read
    const box = await page.evaluate(() => {
      const kv = [...document.querySelectorAll('.kv')].find((k) => k.querySelector('span')?.textContent.trim() === 'HELD BY')
      kv.scrollIntoView({ block: 'nearest' }); const r = kv.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
    })
    await page.screenshot({ path: `${OUT}wn-022-gray-${n}-row.png`, clip: { x: Math.max(0, box.x - 4), y: Math.max(0, box.y - 4), width: box.width + 8, height: box.height + 8 } })
  }
  await page.evaluate(() => { document.documentElement.style.filter = '' })
  rec('07', { ...g, errs: newErrs() })

  // ---------- 08 / 09 / 11 (card up) ----------
  await fresh(); newErrs(); await pause(); await setScale(100); await setHC(false); await settle()
  const card = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim()
    const job = q('.wm-onboard-row[data-row="job"]'), num = q('.wm-onboard-row[data-row="numbers"]')
    return {
      present: !!q('.wm-onboard'),
      jobTitle: norm(job?.querySelector('b')?.textContent), jobBody: norm(job?.querySelector('span')?.textContent),
      jobSpans: job ? [...job.querySelectorAll('span')].map((s) => norm(s.textContent)) : null,
      numTitle: norm(num?.querySelector('b')?.textContent),
      numLines: num ? [...num.querySelectorAll('.wm-onboard-lines span')].map((s) => norm(s.textContent)) : null,
      oldDef: (q('.wm-onboard')?.textContent || '').includes('how much of the sector Nexus holds'),
    }
  })
  await shot('wn-022-card-100')
  rec('08_09', { ...card, errs: newErrs() })

  const c11 = {}
  for (const cfg of [...SCALES.map((s) => [s, false]), [100, true]]) {
    await setScale(cfg[0]); await setHC(cfg[1]); await settle()
    const tag = cfg[1] ? 'hc' : String(cfg[0])
    c11[tag] = await page.evaluate(() => {
      const bx = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) } }
      const card = document.querySelector('.wm-onboard')
      const job = document.querySelector('.wm-onboard-row[data-row="job"]')
      const ctl = [...document.querySelectorAll('.wm-onboard-row[data-row="numbers"] .wm-onboard-lines span')].find((s) => s.textContent.trim().startsWith('CONTROL:'))
      const btn = [...document.querySelectorAll('button')].find((b) => /UNDERSTOOD/i.test(b.textContent))
      const ov = (e) => e ? { sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight, to: getComputedStyle(e).textOverflow } : null
      const cs = card ? getComputedStyle(card) : null
      const inside = (e) => { if (!e || !card) return null; const a = card.getBoundingClientRect(), r = e.getBoundingClientRect(); return r.x >= a.x - 0.5 && r.right <= a.right + 0.5 && r.y >= a.y - 0.5 && r.bottom <= a.bottom + 0.5 }
      return { card: bx(card), cardOverflowY: cs?.overflowY, cardScroll: card ? { sh: card.scrollHeight, ch: card.clientHeight } : null,
        job: bx(job), jobOv: ov(job), jobIn: inside(job), ctl: bx(ctl), ctlOv: ov(ctl), ctlIn: inside(ctl), btn: bx(btn), btnIn: inside(btn) }
    })
    await shot('wn-022-card-' + tag)
  }
  await setScale(100); await setHC(false); await settle()
  rec('11', { ...c11, errs: newErrs() })
  await dismissCard(); await select('na')
  rec('09_step5', { held: await row('HELD BY') })

  // ---------- 10 ----------
  await fresh(); newErrs(); await dismissCard(); await pause()
  const c10 = {}
  for (const cfg of [...SCALES.map((s) => [s, false]), [100, true]]) {
    await setScale(cfg[0]); await setHC(cfg[1])
    const tag = cfg[1] ? 'hc' : String(cfg[0])
    for (const id of ['na', 'oc', 'sa']) {
      await select(id)
      c10[id + '-' + tag] = await page.evaluate(() => {
        const kv = [...document.querySelectorAll('.kv')].find((k) => k.querySelector('span')?.textContent.trim() === 'HELD BY')
        kv.scrollIntoView({ block: 'nearest' })
        const b = kv.querySelector('b'), sp = kv.querySelector('span'), sc = document.querySelector('.wm-sector-scroll')
        const r = (e) => { const x = e.getBoundingClientRect(); return { x: +x.x.toFixed(1), y: +x.y.toFixed(1), r: +x.right.toFixed(1), b: +x.bottom.toFixed(1), h: +x.height.toFixed(1) } }
        const bb = r(b), sb = r(sp), cb = r(sc), cs = getComputedStyle(b)
        const overlap = !(bb.r <= sb.x || sb.r <= bb.x || bb.b <= sb.y || sb.b <= bb.y)
        return { text: b.textContent.trim(), sw: b.scrollWidth, cw: b.clientWidth, to: cs.textOverflow, ws: cs.whiteSpace,
          b: bb, span: sb, scroll: cb, insideX: bb.x >= cb.x - 0.5 && bb.r <= cb.r + 0.5, insideY: bb.y >= cb.y - 0.5 && bb.b <= cb.b + 0.5, overlap,
          inViewport: bb.x >= 0 && bb.r <= 1280 && bb.y >= 0 && bb.b <= 720 }
      })
      await shot(`wn-022-held-${id}-${tag}`)
    }
  }
  await setScale(100); await setHC(false)
  rec('10', { ...c10, errs: newErrs() })

  // ---------- 12 ----------
  await fresh(); newErrs(); await dismissCard(); await pause(); await setScale(100); await setHC(false)
  await select('an'); await wait(400)
  rec('12', { held: await row('HELD BY'), tax: await row('TAX PAID'), order: await order(), errs: newErrs() })
  await shot('wn-022-an')
} catch (e) {
  rec('SCRIPT_ERROR', String(e && e.stack || e))
} finally {
  rec('ALL_ERRS', errs)
  writeFileSync(OUT + 'wn022-output.json', JSON.stringify(R, null, 2))
  await ctx.close(); await browser.close()
}
