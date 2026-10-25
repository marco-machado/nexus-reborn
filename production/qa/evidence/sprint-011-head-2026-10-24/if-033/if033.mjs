// IF-033 hand-walk (TC-02..TC-06) at HEAD 131a5c1. Launch/fixture copied from
// production/qa/evidence/sprint-011/probe.mjs lines 22-60 and its fresh()/
// dismissCard()/pause() + IF-031..035 Feed seed. Headless Chrome for Testing, 1280x720.
// Run: node production/qa/evidence/sprint-011-head-2026-10-24/if-033/if033.mjs
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.PROBE_CHROME ||
  process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = process.env.PROBE_URL || 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname

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
const dismissCard = () => store(async () => {
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  useTutorialStore.getState().markSeen('hint-worldmap')
})
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

async function fixture() {
  await fresh(); await dismissCard(); await pause()
  await store(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const s = useWorldStore.getState()
    const base = s.events[0]
    const events = Array.from({ length: 14 }, (_, i) => ({ ...base, id: 9000 + i, t: i * 60 }))
    useWorldStore.setState({ events, unread: 3 })
  })
  await setScale(100); await setHC(false)
  await wait(300)
  if (await page.evaluate(() => !!document.querySelector('.wm-onboard-wrap'))) {
    note('card still up -> clicking UNDERSTOOD')
    await page.getByRole('button', { name: /UNDERSTOOD/ }).first().click()
    await wait(300)
  }
  await page.waitForFunction(() => !document.querySelector('.wm-onboard-wrap'), null, { timeout: 5000 })
  note('fixture ' + JSON.stringify(await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, card: !!document.querySelector('.wm-onboard-wrap') }))))
}

const tbtns = () => page.evaluate(() => [...document.querySelectorAll('.wm-tbtn')].map((b) => {
  const r = b.getBoundingClientRect()
  return { t: b.textContent.trim(), label: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed'), on: b.classList.contains('on'), x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }
}))
const speedSel = (n) => page.locator('.wm-tbtn', { hasText: new RegExp('^\\s*' + n + 'X\\s*$') })
const clickCentre = async (n) => {
  const bb = await speedSel(n).boundingBox()
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2)
  await wait(250)
}
const reading = async (step) => {
  const st = await page.evaluate(async () => {
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { paused, speed } = useWorldStore.getState()
    return { paused, speed, readout: document.querySelector('.wm-speed b')?.textContent.trim() ?? null }
  })
  const bs = await tbtns()
  const speeds = bs.filter((b) => /X$/.test(b.t))
  const pressedSpeeds = speeds.filter((b) => b.pressed === 'true')
  const agree = bs.every((b) => (b.pressed === 'true') === b.on)
  const okCount = st.paused ? pressedSpeeds.length === 0 : pressedSpeeds.length === 1
  const okMatch = st.paused ? bs[0].pressed === 'true' : (pressedSpeeds[0]?.t === st.speed + 'X' && bs[0].pressed === 'false')
  const okReadout = st.paused ? st.readout === 'PAUSED' : st.readout === st.speed + 'X'
  const ok = okCount && okMatch && agree && okReadout
  note(`TC-04 ${step} ${ok ? 'OK' : 'MISMATCH'} // ${JSON.stringify({ ...st, btns: bs.map((b) => `${b.t || b.label}:${b.pressed}${b.on ? '+on' : ''}`) })}`)
  return ok
}

await fixture()

// TC-02: 5 points per speed button.
{
  const res = await page.evaluate(() => [...document.querySelectorAll('.wm-tbtn')].filter((b) => /X$/.test(b.textContent.trim())).map((b) => {
    const r = b.getBoundingClientRect()
    const pts = [[(r.left + r.right) / 2, (r.top + r.bottom) / 2], [r.left + 1, r.top + 1], [r.right - 1, r.top + 1], [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1]]
    return { t: b.textContent.trim(), w: r.width, h: r.height, hits: pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e?.closest('.wm-tbtn') === b ? 1 : (e ? e.className || e.tagName : 'null') }) }
  }))
  const n = res.reduce((a, r) => a + r.hits.filter((h) => h === 1).length, 0)
  note(`TC-02 ${n}/20 elementFromPoint hits // ${JSON.stringify(res)}`)
}

// TC-03 / TC-06 paused
const overlap = async (state) => {
  const bs = await tbtns()
  const gaps = bs.slice(1).map((b, i) => +(b.x - bs[i].r).toFixed(3))
  let inter = 0
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const w = Math.min(bs[i].r, bs[j].r) - Math.max(bs[i].x, bs[j].x)
    const h = Math.min(bs[i].b, bs[j].b) - Math.max(bs[i].y, bs[j].y)
    if (w > 0 && h > 0) inter++
  }
  note(`TC-03 ${state} count ${bs.length} gaps ${JSON.stringify(gaps)} positive-area intersections ${inter}/10 // ${JSON.stringify(bs.map((b) => ({ t: b.t || b.label, x: b.x, w: b.w, h: b.h })))}`)
  note(`TC-06 ${state} first .wm-tbtn // ${JSON.stringify({ label: bs[0].label, pressed: bs[0].pressed, w: bs[0].w, h: bs[0].h })}`)
}
await overlap('paused')
await shot('if-033-transport-paused')
await clickCentre(1)
await overlap('1x')
await shot('if-033-transport-1x')

// TC-04 fresh fixture
await fixture()
const r = []
r.push(await reading('s1-paused'))
for (const n of [1, 2, 4, 8]) { await clickCentre(n); r.push(await reading(`s-click-${n}X`)) }
await clickCentre(2); r.push(await reading('s4-back-to-2X'))
{
  const bb = await page.locator('.wm-tbtn').first().boundingBox()
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await wait(250)
  r.push(await reading('s5-pause'))
}
await speedSel(4).focus()
note('TC-04 s6 focused ' + await page.evaluate(() => document.activeElement?.textContent.trim()))
await page.keyboard.press('Space'); await wait(250)
r.push(await reading('s6-space-4X'))
await shot('if-033-aria-4x-keyboard')
note(`TC-04 ${r.filter(Boolean).length}/7 readings OK`)

// TC-05 labels / accessible names / clipping
// Script fix (run 2): the TC-04 step-6 keyboard focus leaves 4X :focus-visible, whose
// focus-bracket ::after (src/index.css :where(button):focus-visible::after, inset -4px)
// adds scrollable overflow. Log the focused reading, then blur and measure the labels.
note('TC-05 focused-4X (pre-blur) ' + JSON.stringify(await speedSel(4).evaluate((b) => ({ focusVisible: b.matches(':focus-visible'), sw: b.scrollWidth, cw: b.clientWidth, sh: b.scrollHeight, ch: b.clientHeight, afterInset: getComputedStyle(b, '::after').inset }))))
await page.evaluate(() => document.activeElement?.blur())
await wait(100)
await shot('if-033-labels-blurred')
{
  const lab = await page.evaluate(() => [...document.querySelectorAll('.wm-tbtn')].filter((b) => /X$/.test(b.textContent.trim())).map((b) => ({
    t: b.textContent.trim(), label: b.getAttribute('aria-label'), sw: b.scrollWidth, cw: b.clientWidth, sh: b.scrollHeight, ch: b.clientHeight,
  })))
  const names = []
  for (const n of [1, 2, 4, 8]) names.push({ n, exactCount: await page.getByRole('button', { name: `CLOCK SPEED ${n}X`, exact: true }).count() })
  const snap = await page.locator('.wm-transport').ariaSnapshot()
  note(`TC-05 labels // ${JSON.stringify(lab)}`)
  note(`TC-05 getByRole exact counts // ${JSON.stringify(names)}`)
  note(`TC-05 ariaSnapshot .wm-transport:\n${snap}`)
}

note(errs.length ? 'ERRORS ' + JSON.stringify(errs) : 'no console or page errors')
writeFileSync(OUT + 'run.log', log.join('\n') + '\n')
await browser.close()
