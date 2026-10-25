// IF-032 hand-walk (TC-03..TC-08 step 3). Launch + fixtures copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60 and its fresh()/
// dismissCard()/pause()/setScale(). The probe's HELPERS (contrast/box
// measurement) are not used by these cases, so install() is omitted.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-032/if032.mjs
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
const OUT = new globalThis.URL('.', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = (name) => page.screenshot({ path: `${OUT}${name}.png` })
const log = []
const note = (s) => { log.push(s); console.log(s) }

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
const dismissCard = () =>
  store(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    useTutorialStore.getState().markSeen('hint-worldmap')
  })
const setScale = (scale) =>
  store(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)
const pause = () =>
  store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ paused: true })
  })

// Fixture timeline-live (cases file). Re-applied per case without reload.
let didFresh = false
async function timelineLive() {
  if (!didFresh) { await fresh(); didFresh = true }
  await dismissCard()
  await pause()
  await setScale(100)
  await store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    useWorldStore.setState({ t: 30 * 3600, review: null })
  })
  await page.mouse.move(5, 5)
  await wait(500)
  const card = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'UNDERSTOOD')
    return !!b
  })
  if (card) { note('card still up: clicking UNDERSTOOD'); await page.getByRole('button', { name: 'UNDERSTOOD' }).click(); await wait(500) }
}
const read = () =>
  page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    const el = document.querySelector('.wm-tl-track')
    return {
      valuenow: Number(el.getAttribute('aria-valuenow')),
      valuetext: el.getAttribute('aria-valuetext'),
      review: s.review,
      t: s.t,
      paused: s.paused,
      liveShown: !!document.querySelector('.wm-live:not(.review)'),
      goLive: !!document.querySelector('.wm-live-go'),
    }
  })
const geo = () =>
  page.evaluate(() => {
    const r = document.querySelector('.wm-tl-track').getBoundingClientRect()
    return { top: r.top, height: r.height, left: r.left, width: r.width, right: r.right, cy: r.top + r.height / 2 }
  })
const J = (o) => JSON.stringify(o)

note('HEAD ' + execSync('git rev-parse --short HEAD').toString().trim() + ' chrome ' + CHROME)

// TC-03
{
  await timelineLive()
  const pre = await read(); const t0 = pre.t
  const r = await geo()
  note('TC03 pre ' + J(pre) + ' geo ' + J(r))
  await page.mouse.move(r.left + 0.25 * r.width, r.cy - 11)
  await page.mouse.down(); await wait(100)
  const a = await read(); note('TC03 press ' + J(a) + ' expReview ' + (t0 - 64800))
  await page.mouse.move(r.left + 0.5 * r.width, r.cy - 11, { steps: 10 }); await wait(100)
  const b = await read(); note('TC03 move ' + J(b) + ' expReview ' + (t0 - 43200))
  await page.mouse.up(); await wait(100)
  const c = await read(); note('TC03 up ' + J(c) + ' t0 ' + t0)
  await shot('if-032-drag-above-review')
}
// TC-04
{
  await timelineLive()
  const pre = await read(); const t0 = pre.t
  const r = await geo()
  note('TC04 pre ' + J(pre) + ' geo ' + J(r))
  await page.mouse.move(r.left + 0.75 * r.width, r.cy + 11)
  await page.mouse.down(); await wait(100)
  const a = await read(); note('TC04 press ' + J(a) + ' expReview ' + (t0 - 21600))
  await page.mouse.move(r.left + 0.4 * r.width, r.cy + 11, { steps: 10 }); await wait(100)
  const b = await read(); note('TC04 move ' + J(b) + ' expReview ' + (t0 - 51840))
  await page.mouse.up(); await wait(100)
  const c = await read(); note('TC04 up ' + J(c) + ' t0 ' + t0)
  await shot('if-032-drag-below-review')
}
// TC-05
{
  await timelineLive()
  const pre = await read()
  const r = await geo()
  note('TC05 pre ' + J(pre) + ' geo ' + J(r))
  for (const dy of [-14, 14]) {
    const x = r.left + 0.25 * r.width, y = r.cy + dy
    const el = await page.evaluate(({ x, y }) => {
      const e = document.elementFromPoint(x, y)
      return e ? { tag: e.tagName, cls: String(e.className), inTrack: !!e.closest('.wm-tl-track') } : null
    }, { x, y })
    // band edges along this x: scan y for elementFromPoint inside the track
    const band = await page.evaluate(({ x, top }) => {
      let lo = null, hi = null
      for (let y = top - 20; y <= top + 40; y += 0.5) {
        const e = document.elementFromPoint(x, y)
        if (e && e.closest('.wm-tl-track')) { if (lo === null) lo = y; hi = y }
      }
      return { lo, hi }
    }, { x, top: r.top })
    await page.mouse.move(x, y); await page.mouse.down()
    await page.mouse.move(r.left + 0.5 * r.width, y, { steps: 10 }); await page.mouse.up(); await wait(100)
    const s = await read()
    note(`TC05 dy=${dy} elementFromPoint ${J(el)} band ${J(band)} after ${J(s)}`)
    if (s.review !== null) await store(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ review: null }) })
  }
}
// TC-06
{
  await timelineLive()
  const t0 = (await read()).t
  const r = await geo()
  for (const [dy, endX, tag] of [[-11, r.left + 0.99 * r.width, 'above'], [11, r.right + 20, 'below']]) {
    await page.mouse.move(r.left + 0.25 * r.width, r.cy + dy); await page.mouse.down(); await wait(100)
    const a = await read(); note(`TC06 ${tag} press ${J(a)}`)
    await page.mouse.move(r.left + 0.97 * r.width, r.cy + dy, { steps: 10 }); await wait(100)
    const b = await read(); note(`TC06 ${tag} 0.97 ${J(b)}`)
    await page.mouse.move(endX, r.cy + dy, { steps: 5 }); await wait(100)
    const c = await read(); note(`TC06 ${tag} end x=${endX} ${J(c)}`)
    await page.mouse.up(); await wait(100)
    const d = await read(); note(`TC06 ${tag} up ${J(d)}`)
    await shot(tag === 'above' ? 'if-032-drag-to-live' : 'if-032-drag-to-live-below')
  }
  note('TC06 t ' + (await read()).t + ' t0 ' + t0)
}
// TC-07
{
  await timelineLive()
  const t0 = (await read()).t
  const sy0 = await page.evaluate(() => [scrollX, scrollY, document.scrollingElement.scrollTop])
  await page.focus('.wm-tl-track')
  const foc = () => page.evaluate(() => document.activeElement?.className)
  note('TC07 focus ' + (await foc()) + ' ' + J(await read()))
  for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'Home', 'ArrowLeft', 'End', 'ArrowRight']) {
    await page.keyboard.press(k); await wait(80)
    const s = await read(); note(`TC07 ${k} valuenow=${s.valuenow} valuetext=${s.valuetext} review=${s.review}`)
  }
  const sy1 = await page.evaluate(() => [scrollX, scrollY, document.scrollingElement.scrollTop])
  note(`TC07 end t=${(await read()).t} t0=${t0} focus=${await foc()} scroll before ${J(sy0)} after ${J(sy1)}`)
  await shot('if-032-keys-live')
}
// TC-08 step 3
{
  await timelineLive()
  const res = await page.evaluate(() => [...document.querySelectorAll('.wm-tbtn')].map((b) => {
    const r = b.getBoundingClientRect()
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { text: b.textContent.trim(), hit: e?.closest('.wm-tbtn') === b }
  }))
  note('TC08 count ' + res.length + ' ' + J(res))
}
note('errors ' + errs.length + ' ' + J(errs))
writeFileSync(OUT + 'run.log', log.join('\n') + '\n')
await browser.close()
