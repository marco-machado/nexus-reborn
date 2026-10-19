// Smoke-check driver helpers (2026-10-13). Drives the real app in Chrome for
// Testing (headed, real GPU, real requestAnimationFrame) against the dev server
// on 4200. Missions are played by the sim's own order API; the only harness
// assists are named where they are applied (heal-to-full "god" mode and extra
// sim ticks to fast-forward), and both stay inside the mission sim.
import { createRequire } from 'module'
import { execSync } from 'child_process'
const require_root = execSync('npm root -g').toString().trim() + '/@playwright/cli/node_modules/'
const require = createRequire(require_root)
const { chromium } = require('playwright-core')

export const CHROME =
  process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
export const URL = process.env.SMOKE_URL || 'http://localhost:4200/'
export const OUT = new globalThis.URL('.', import.meta.url).pathname

export async function open() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: false, args: ['--window-size=1300,820'] })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror ' + String(e)))
  page.on('console', (m) => m.type() === 'error' && errs.push('console ' + m.text() + ' @ ' + (m.location()?.url ?? '')))
  page.on('requestfailed', (r) => errs.push('requestfailed ' + r.url()))
  page.on('response', (r) => r.status() >= 400 && errs.push('HTTP ' + r.status() + ' ' + r.url()))
  // Frame recorder: every rAF delta, tagged with the app phase, plus long tasks.
  await ctx.addInitScript(() => {
    window.__frames = []
    window.__long = []
    let last = performance.now()
    const f = (now) => {
      window.__frames.push([now, now - last, window.__phase || '?'])
      last = now
      requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__long.push([e.startTime, e.duration, window.__phase || '?'])
      }).observe({ type: 'longtask', buffered: true })
    } catch {}
  })
  return { browser, ctx, page, errs }
}

export const btns = (page) =>
  page.$$eval('button', (b) => b.map((x) => (x.disabled ? '[X] ' : '') + (x.getAttribute('aria-label') || x.textContent.trim())))

export async function newOperation(page) {
  await page.goto(URL)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByText('NEW OPERATION').first().click()
  await page.waitForTimeout(1200)
  await dismiss(page)
  await tagPhases(page)
}

// Tags every recorded frame with the live app phase.
export const tagPhases = (page) =>
  page.evaluate(async () => {
    const A = (await import('/src/state/appStore.ts')).useAppStore
    window.__phase = A.getState().phase
    A.subscribe((s) => (window.__phase = s.phase))
  })

export async function dismiss(page) {
  await page.locator('[aria-label="Dismiss the orientation"]').click({ timeout: 1500 }).catch(() => {})
}

// Live store reads through the dev server's own module instances.
export const state = (page) =>
  page.evaluate(async () => {
    const w = (await import('/src/state/worldStore.ts')).useWorldStore.getState()
    const c = (await import('/src/state/campaignStore.ts')).useCampaignStore.getState()
    const a = (await import('/src/state/appStore.ts')).useAppStore.getState()
    return {
      phase: a.phase,
      credits: a.credits,
      t: w.t,
      influence: w.influence,
      intelLevel: c.intelLevel,
      intelProgress: c.intelProgress,
      sectors: JSON.parse(JSON.stringify(w.sectors)),
      owner: { ...w.owner },
      contracts: w.contracts.map((k) => ({ id: k.id, sector: k.sector, cityId: k.cityId, expedited: k.expedited })),
      contractsWon: [...c.contractsWon],
      campaignWon: c.campaignWon,
      campaignFailed: c.campaignFailed,
      living: c.operatives.length,
      roster: c.operatives.map((o) => o.codename + ':' + (c.roster[o.id]?.status ?? '?')),
      events: w.events.length,
      lastEvent: w.events[w.events.length - 1]?.text ?? null,
      missionId: a.missionId,
    }
  })

// Wraps worldStore.advanceDays so the state at the instant the ETA starts
// (after the Debrief write-back, before catch-up) is captured. Observation
// only: the original function runs unchanged.
export const armEtaProbe = (page) =>
  page.evaluate(async () => {
    const W = (await import('/src/state/worldStore.ts')).useWorldStore
    const C = (await import('/src/state/campaignStore.ts')).useCampaignStore
    const A = (await import('/src/state/appStore.ts')).useAppStore
    window.__eta = null
    const orig = W.getState().advanceDays
    if (orig.__probe) return
    const wrapped = (days) => {
      const w = W.getState()
      const c = C.getState()
      window.__eta = {
        days,
        t: w.t,
        influence: w.influence,
        intelLevel: c.intelLevel,
        intelProgress: c.intelProgress,
        sectors: JSON.parse(JSON.stringify(w.sectors)),
        owner: { ...w.owner },
        credits: A.getState().credits,
        lastEvent: w.events[w.events.length - 1] ?? null,
      }
      orig(days)
    }
    wrapped.__probe = true
    W.setState({ advanceDays: wrapped })
  })

// Brief → Accept → Assembly → Deploy for the contract whose button label starts with `label`.
export async function deploy(page, label) {
  await page.locator('[aria-label="WORLD NETWORK"]').click().catch(() => {})
  await page.waitForTimeout(300)
  await dismiss(page)
  await page.locator(`[aria-label^="${label}"]`).first().click()
  await page.waitForTimeout(700)
  await page.locator('[aria-label^="ACCEPT CONTRACT"]').click()
  await page.waitForTimeout(800)
  // Fill empty bays with any assignable operative.
  for (;;) {
    const assign = page.locator('button[aria-label^="ASSIGN "]:not([disabled])')
    const txt = await page.innerText('body')
    if (/4 \/ 4 ASSIGNED/.test(txt) || (await assign.count()) === 0) break
    await assign.first().click()
    await page.waitForTimeout(150)
  }
  await page.locator('[aria-label^="DEPLOY STRIKE TEAM"]').click()
  await page.waitForFunction(() => window.__phase === 'mission' || document.body.innerText.includes('OBJECTIVES'), null, { timeout: 30000 }).catch(() => {})
}

// Plays the live mission to its end with the sim's order API.
// opts.god: heal agents to full every step. opts.wipe: march the squad at
// the garrison at 1 HP to lose. opts.ff: extra sim ticks per step.
export const play = (page, opts) =>
  page.evaluate(async (opts) => {
    const rt = await import('/src/game/runtime.ts')
    const MS = (await import('/src/state/missionStore.ts')).useMissionStore
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2
    let w = null
    for (let i = 0; i < 200 && !(w = rt.getWorld()); i++) await wait(100)
    if (!w) return { error: 'no world' }
    const city = w.city
    const zoneOf = (def) =>
      def.kind === 'extract' ? city.extraction : def.zone ?? (def.landmark && city.landmarks[def.landmark]) ?? city.checkpoint
    const log = []
    const t0 = performance.now()
    let lastKey = ''
    let lastOrder = 0
    while (performance.now() - t0 < (opts.budgetMs ?? 600000)) {
      const ms = MS.getState()
      if (ms.result !== 'none') break
      const agents = w.units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
      if (agents.length === 0) break
      const ids = agents.map((u) => u.id)
      if (opts.god) for (const a of agents) a.hp = a.maxHp
      // Escort assist (god mode): the asset is kept at full health too.
      if (opts.god) for (const v of w.units) if (v.kind === 'vip' && v.stance !== 'dead') v.hp = v.maxHp
      if (opts.wipe) for (const a of agents) a.hp = Math.min(a.hp, 1)
      const row = ms.objectives.find((o) => o.active && !o.done && !o.optional) ?? ms.objectives.find((o) => !o.done && !o.optional)
      const def = row && w.mission.objectives.find((d) => d.id === row.id)
      const key = row ? row.id : 'none'
      if (key !== lastKey) {
        log.push([Math.round(w.time), key, def?.kind])
        lastKey = key
        lastOrder = 0
      }
      const now = performance.now()
      if (def && now - lastOrder > 700) {
        lastOrder = now
        const c = agents[0].pos
        // Clean mode: agents fire only at the explicit attack target.
        if (opts.clean) w.orderHoldFire(ids, true)
        if (opts.wipe) {
          const e = w.units.filter((u) => u.kind === 'enemy' && u.stance !== 'dead').sort((a, b) => d2(a.pos, c) - d2(b.pos, c))[0]
          if (e) w.orderMove(ids, { x: e.pos.x, z: e.pos.z })
        } else if (def.kind === 'eliminate-tag' || def.kind === 'destroy') {
          const kind = def.kind === 'destroy' ? 'device' : 'enemy'
          const e = w.units.filter((u) => u.kind === kind && u.tag === def.tag && u.stance !== 'dead').sort((a, b) => d2(a.pos, c) - d2(b.pos, c))[0]
          if (e) w.orderAttack(ids, e.id)
        } else if (def.kind === 'escort') {
          const v = w.units.filter((u) => u.kind === 'vip' && u.stance !== 'dead')
          const lost = v.find((x) => !x.alerted)
          const near = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead' && v.some((x) => d2(u.pos, x.pos) < 18 * 18))
          if (near) w.orderAttack(ids, near.id)
          else if (lost) w.orderMove(ids, { x: lost.pos.x, z: lost.pos.z })
          else { const z = zoneOf(def); w.orderMove(ids, { x: z.x, z: z.z }) }
        } else {
          const z = zoneOf(def)
          const out = agents.filter((a) => d2(a.pos, z) > (z.r * 0.6) ** 2).map((a) => a.id)
          if (out.length) w.orderMove(out, { x: z.x, z: z.z })
          // Shoot anything that is shooting at us on the way.
          const threat = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead' && u.alerted && d2(u.pos, c) < 15 * 15)
          if (threat && def.kind !== 'extract') w.orderAttack(agents.filter((a) => !out.includes(a.id)).map((a) => a.id), threat.id)
        }
      }
      for (let i = 0; i < (opts.ff ?? 0); i++) w.tick(1 / 30)
      await wait(50)
    }
    const ms = MS.getState()
    return { result: ms.result, simTime: Math.round(w.time), log }
  }, opts)

export async function waitDebrief(page) {
  for (let i = 0; i < 240; i++) {
    const p = await page.evaluate(async () => (await import('/src/state/appStore.ts')).useAppStore.getState().phase)
    if (p === 'debrief') return page.waitForTimeout(800)
    await page.waitForTimeout(250)
  }
  throw new Error('no debrief')
}

export const outcome = (page) =>
  page.evaluate(async () => {
    const o = (await import('/src/state/appStore.ts')).useAppStore.getState().outcome
    return o && { won: o.won, civiliansHit: o.civiliansHit, quietReplay: o.quietReplay, casualties: o.casualties, deadIds: o.deadIds, applyKey: o.applyKey }
  })

export async function leaveDebrief(page) {
  const b = await btns(page)
  const ret = b.find((x) => /WORLD NETWORK|CONTINUE|RETURN/i.test(x) && !x.startsWith('[X]'))
  await page.locator(`button[aria-label="${ret}"], button:has-text("${ret}")`).first().click()
  await page.waitForTimeout(1200)
  await dismiss(page)
  return ret
}

// Frame stats between two performance.now() marks.
export const frames = (page, from, to) =>
  page.evaluate(([from, to]) => {
    const f = window.__frames.filter(([t]) => t >= from && t <= to).map(([, d]) => d).sort((a, b) => a - b)
    const L = window.__long.filter(([t]) => t >= from && t <= to)
    const q = (p) => f[Math.min(f.length - 1, Math.floor(p * f.length))]
    return {
      n: f.length,
      p50: +q(0.5)?.toFixed(1),
      p95: +q(0.95)?.toFixed(1),
      p99: +q(0.99)?.toFixed(1),
      max: +f[f.length - 1]?.toFixed(1),
      over50ms: f.filter((d) => d > 50).length,
      longTasks: L.length,
      longestTask: L.length ? +Math.max(...L.map((x) => x[1])).toFixed(1) : 0,
    }
  }, [from, to])

export const now = (page) => page.evaluate(() => performance.now())
export const setPhaseTag = (page, tag) => page.evaluate((t) => (window.__phase = t), tag)
