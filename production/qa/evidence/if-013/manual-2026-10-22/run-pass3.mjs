// IF-013 manual-case session, 2026-10-22. Headless Chrome for Testing via the
// playwright-core inside the global @playwright/cli, own browser context,
// viewport 1280x720, against the already-running dev server on :4200.
// Writes raw observations to observations.json and screenshots next to this file.
// Harness assists are named in each case's record ("assists").
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { writeFileSync, existsSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const URL = 'http://localhost:4200/'
const OUT = new globalThis.URL('.', import.meta.url).pathname
const SCALES = [90, 100, 110, 125]

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--enable-unsafe-webgpu'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await ctx.newPage()
let cur = 'setup'
const rec = {}
const R = (k, v) => { (rec[cur] ??= { assists: [], errors: [] })[k] = v; console.log(cur, k, JSON.stringify(v)) }
const assist = (s) => { (rec[cur] ??= { assists: [], errors: [] }).assists.push(s) }
const begin = (id) => { cur = id; rec[id] ??= { assists: [], errors: [] }; console.log('=== ' + id) }
page.on('pageerror', (e) => (rec[cur] ??= { assists: [], errors: [] }).errors.push('pageerror ' + String(e)))
page.on('console', (m) => m.type() === 'error' && (rec[cur] ??= { assists: [], errors: [] }).errors.push('console ' + m.text()))
const wait = (ms) => page.waitForTimeout(ms)
const shot = async (name) => {
  const p = `${OUT}${name}.png`
  if (existsSync(p)) throw new Error('refusing to overwrite ' + p)
  await page.screenshot({ path: p })
  ;(rec[cur].shots ??= []).push(name + '.png')
}
const vp = () => page.evaluate(() => [innerWidth, innerHeight])
const setScale = async (scale) => {
  await page.evaluate(async (scale) => {
    const { useSettingsStore } = await import('/src/state/settingsStore.ts')
    useSettingsStore.getState().setTextScale(scale)
  }, scale)
  await wait(350)
}
// clippedSel verbatim from capture.mjs
const clippedSel = (sel) =>
  page.evaluate((sel) => {
    const out = []
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect()
      let overflow = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      if (el.tagName === 'BUTTON') {
        const range = document.createRange()
        range.selectNodeContents(el)
        const t = range.getBoundingClientRect()
        overflow = t.left < r.left - 0.5 || t.right > r.right + 0.5 || t.top < r.top - 0.5 || t.bottom > r.bottom + 0.5
      }
      const clip =
        overflow ||
        r.right > innerWidth + 0.5 ||
        r.bottom > innerHeight + 0.5 ||
        r.left < -0.5 ||
        r.top < -0.5
      if (clip) out.push(sel + ' ' + (el.textContent || '').slice(0, 40) + ' sw' + el.scrollWidth + '/cw' + el.clientWidth + ' sh' + el.scrollHeight + '/ch' + el.clientHeight + ' b' + Math.round(r.bottom))
    }
    return out
  }, sel)
const state = () =>
  page.evaluate(async () => {
    const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
    const { useWorldStore } = await import('/src/state/worldStore.ts')
    const { useAppStore } = await import('/src/state/appStore.ts')
    const { useCampaignStore } = await import('/src/state/campaignStore.ts')
    const ops = document.querySelector('.wm-ops')?.getBoundingClientRect()
    const seen = useTutorialStore.getState().seen
    return {
      phase: useAppStore.getState().phase,
      missionId: useAppStore.getState().missionId,
      intel: useCampaignStore.getState().intelLevel,
      influence: useWorldStore.getState().influence,
      selected: useWorldStore.getState().selected,
      seenWorldmap: seen.filter((i) => i === 'hint-worldmap').length,
      seenInfluence: seen.filter((i) => i === 'hint-influence').length,
      seen,
      card: !!document.querySelector('.wm-onboard'),
      moments: document.querySelectorAll('.wm-moment').length,
      momentTitle: document.querySelector('.wm-moment-title')?.textContent ?? null,
      momentBody: document.querySelector('.wm-moment-body')?.textContent ?? null,
      momentText: document.querySelector('.wm-moment')?.textContent ?? null,
      inset: !!document.querySelector('.wm-inset'),
      acts: [...document.querySelectorAll('.wm-act')].map((b) => ({
        name: b.querySelector('.wm-act-name')?.textContent?.trim(),
        status: b.querySelector('.wm-act-status')?.textContent,
        disabled: b.disabled,
        title: b.title,
      })),
      opsBottom: ops ? Math.round(ops.bottom) : null,
      opsHeight: ops ? Math.round(ops.height) : null,
      opsRows: document.querySelectorAll('.wm-ops .wm-op').length,
      rightOver: (() => { const c = document.querySelector('.wm-right'); return c ? c.scrollHeight - c.clientHeight : null })(),
    }
  })
const ops = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.wm-ops .wm-op')].map((b) => ({
      codename: b.querySelector('.wm-op-main b')?.textContent,
      sub: b.querySelector('.wm-op-main i')?.textContent,
      lockedClass: b.classList.contains('locked'),
      ariaDisabled: b.getAttribute('aria-disabled'),
      ariaLabel: b.getAttribute('aria-label'),
      lockGlyph: !!b.querySelector('.wm-op-glyph svg') && b.classList.contains('locked'),
      chips: [...b.querySelectorAll('.wm-op-meta .chip')].map((c) => c.textContent),
    })),
  )
const sectorBtn = (name) => page.locator('button.wm-sector', { has: page.locator('.wm-sector-name', { hasText: new RegExp('^' + name + '$') }) })
const clickSector = async (name) => { await sectorBtn(name).click({ timeout: 3000 }); await wait(350) }
const nav = async (label) => { await page.click(`button.navtab[aria-label="${label}"]`, { timeout: 3000 }); await wait(500) }
const opRow = (codename) => page.locator('button.wm-op', { has: page.locator('.wm-op-main b', { hasText: new RegExp('^' + codename + '$') }) })

async function fno() {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await wait(1200)
  R('fno.viewport', await vp())
  const armed = await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').count()
  await page.click('button[aria-label="BEGIN NEW OPERATION"]', { timeout: 3000 })
  await wait(300)
  if (await page.locator('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]').count()) {
    await page.click('button[aria-label="CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN"]')
    R('fno.erasePrompt', true)
  }
  await wait(900)
  R('fno.path', 'real click << NEW OPERATION >> (localStorage.clear + reload first)')
}
const dismissCard = async () => { await page.click('button[aria-label="Dismiss the orientation"]', { timeout: 3000 }); await wait(300) }


async function run(id, fn) { begin(id); try { await fn() } catch (e) { R('EXCEPTION', String(e && e.stack || e)) } }
// PASS 3. IF013-12 supplement: OPEN CONTRACTS list usability at 125 with the panel up.
await run('IF013-12', async () => {
  await fno(); await dismissCard()
  await page.evaluate(async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ influence: 8 }) })
  assist('clean-win fixture influence 8'); assist('text scale 125 via settingsStore.setTextScale')
  await wait(400); await setScale(125)
  const s = await state(); R('moments', s.moments)
  const geo = () => page.evaluate(() => { const l = document.querySelector('.wm-ops-list'); const sc = l && (l.scrollHeight > l.clientHeight ? l : l.querySelector('*')); const el = [l, ...l.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflowY !== 'visible'); return el ? { cls: el.className, sh: el.scrollHeight, ch: el.clientHeight, top: el.scrollTop } : null })
  R('before', await geo())
  const box = await page.locator('.wm-ops-list').boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, 400); await wait(400)
  R('afterWheel', await geo())
  await shot('IF013-12-125-ops-scrolled')
})
writeFileSync(OUT + 'observations-pass3.json', JSON.stringify(rec, null, 2))
await browser.close()
