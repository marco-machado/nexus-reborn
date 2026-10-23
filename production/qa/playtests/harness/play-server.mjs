// Agent playtest harness (2026-10-23). Holds one headless Chrome for Testing
// page at 1280x720 on the dev server. In a mission the harness keeps the
// game's own Pause on between the playtester's turns: any input first closes
// Pause (Escape, as a player would), and `wait <ms>` lets the mission run for
// that many real milliseconds, captures the frame, and pauses again. On the
// four Screens time runs in real time; the playtester uses the game's own
// strategic Pause. (Chrome virtual time was tried first: the mission
// renderer never initialises under it.)
// Every command is appended to <session>/log.jsonl.
//
// This is a proxy for real-time play, not a replacement: the playtester
// thinks while paused, which a real player can also do but would not do
// every second. Playtest reports must say so.
//
// Run: node play-server.mjs <sessionDir> [port]   (dev server on :4200)
import http from 'http'
import { createRequire } from 'module'
import { execSync } from 'child_process'
import { appendFileSync, mkdirSync } from 'fs'

const gRoot = execSync('npm root -g').toString().trim()
const require = createRequire(gRoot + '/@playwright/cli/node_modules/')
const { chromium } = require('playwright-core')
const CHROME =
  process.env.HOME +
  '/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const DIR = process.argv[2].replace(/\/?$/, '/')
const PORT = Number(process.argv[3] || 4399)
mkdirSync(DIR + 'shots', { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage()
await page.goto('http://localhost:4200/')
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForTimeout(1500)

let shotN = 0
const log = (o) => appendFileSync(DIR + 'log.jsonl', JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const inMission = () => page.evaluate(() => !!document.querySelector('.mission-screen'))
const pauseOpen = () => page.evaluate(() => !!document.querySelector('[aria-label="Mission paused"]'))
const missionLive = () =>
  page.evaluate(async () => {
    const { useMissionStore } = await import('/src/state/missionStore.ts')
    const s = useMissionStore.getState()
    return s.live && (!s.result || s.result === 'none')
  })
// The harness's own hold sets the store's paused flag directly rather than
// through setPaused, which also cancels grenade targeting: an armed grenade
// must survive the pause between the playtester's turns. The sim, camera and
// HUD read the same flag, so the scene freezes exactly as under PAUSE.
const setPaused = (on) =>
  page.evaluate(async (on) => {
    const { useMissionStore } = await import('/src/state/missionStore.ts')
    useMissionStore.setState({ paused: on })
  }, on)
// Only a pause the harness made is undone by the harness; a pause the
// playtester opened (Space, Escape, PAUSE) stays open and visible.
let harnessHeld = false
async function resume() {
  if (harnessHeld && (await inMission()) && (await pauseOpen())) {
    await setPaused(false)
    await sleep(60)
  }
  harnessHeld = false
}
// After a turn in a mission: pause so nothing moves while the playtester
// thinks.
async function hold() {
  if ((await inMission()) && (await missionLive()) && !(await pauseOpen())) {
    await setPaused(true)
    harnessHeld = true
    await sleep(60)
  }
}
const settle = () => sleep(120)
// Captures hide the Pause panel so the paused scene can be read; the panel
// is the game's, the hiding is the harness's.
async function capture(file) {
  if (harnessHeld) {
    await page.addStyleTag({ content: '.hud-menu-wrap[aria-label="Mission paused"]{visibility:hidden}' }).then((h) => h.evaluate((el) => el.setAttribute('data-harness', '1')))
  }
  await page.screenshot({ path: file, timeout: 15000 })
  await page.evaluate(() => document.querySelectorAll('style[data-harness]').forEach((e) => e.remove()))
}
// After any input in a mission the harness pauses again, so game time moves
// only while the playtester acts (about 120 ms per input) or waits.
const settleHold = async () => {
  await sleep(120)
  await hold()
}

const visibleText = () =>
  page.evaluate(() => (document.body.innerText || '').replace(/\n{3,}/g, '\n\n').slice(0, 6000))

async function run(cmd, a) {
  switch (cmd) {
    case 'look': {
      shotN += 1
      const file = DIR + 'shots/' + String(shotN).padStart(4, '0') + (a[0] ? '-' + a[0] : '') + '.png'
      await capture(file)
      return { screenshot: file, text: await visibleText(), missionPaused: await pauseOpen() }
    }
    case 'click': {
      await resume()
      const [x, y, button] = a
      await page.mouse.click(Number(x), Number(y), { button: button === 'right' ? 'right' : 'left' })
      await settleHold()
      return { ok: true }
    }
    case 'drag': {
      await resume()
      const [x1, y1, x2, y2] = a.map(Number)
      await page.mouse.move(x1, y1)
      await page.mouse.down()
      await page.mouse.move(x2, y2, { steps: 8 })
      await page.mouse.up()
      await settleHold()
      return { ok: true }
    }
    case 'move': {
      await resume()
      await page.mouse.move(Number(a[0]), Number(a[1]))
      await settleHold()
      return { ok: true }
    }
    case 'wheel': {
      await resume()
      await page.mouse.wheel(0, Number(a[0]))
      await settleHold()
      return { ok: true }
    }
    case 'key': {
      // Space and Escape are the player's own pause keys. While the harness
      // holds the game, pressing one hands the pause to the player: the
      // pause menu stays and shows.
      if ((a[0] === 'Space' || a[0] === 'Escape') && harnessHeld && (await pauseOpen())) {
        harnessHeld = false
        return { ok: true, note: 'game paused by you; the pause menu is open' }
      }
      if (a[0] !== 'Space' && a[0] !== 'Escape') await resume()
      await page.keyboard.press(a[0])
      await settleHold()
      return { ok: true }
    }
    case 'type': {
      await resume()
      await page.keyboard.type(a.join(' '))
      await settleHold()
      return { ok: true }
    }
    case 'clicktext': {
      await resume()
      // Click the first visible button or link whose text contains the words.
      const t = a.join(' ')
      // Playwright's actionability wait needs animation frames, which do not
      // run while game time is frozen: click the element's centre directly.
      const box = await page.getByText(t, { exact: false }).filter({ visible: true }).first().boundingBox({ timeout: 2000 })
      if (!box) return { error: 'no visible element with text: ' + t }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await settleHold()
      return { ok: true }
    }
    case 'holdkey': {
      // Hold a key down for ms real milliseconds (camera pan keys need it).
      await resume()
      const ms = Math.max(50, Math.min(3000, Number(a[1] || 400)))
      await page.keyboard.down(a[0])
      await sleep(ms)
      await page.keyboard.up(a[0])
      await settleHold()
      return { ok: true }
    }
    case 'wait': {
      // Mission: run for ms real milliseconds, capture, pause again.
      // Screens: just let ms pass (the strategic clock runs unless the
      // playtester paused it).
      const ms = Math.max(50, Math.min(30000, Number(a[0] || 1000)))
      await resume()
      await sleep(ms)
      shotN += 1
      const file = DIR + 'shots/' + String(shotN).padStart(4, '0') + '-after-wait.png'
      await capture(file)
      await hold()
      return { ranMs: ms, screenshot: file, text: await visibleText() }
    }
    // Harness-only (not for the playtester): carry a campaign between
    // sessions through the game's own save blob.
    case 'savefile': {
      const blob = await page.evaluate(async () => {
        const save = await import('/src/state/save.ts')
        save.writeSave()
        return localStorage.getItem(save.SAVE_KEY)
      })
      const { writeFileSync } = await import('fs')
      writeFileSync(DIR + 'save.json', blob || '')
      return { file: DIR + 'save.json', bytes: (blob || '').length }
    }
    case 'loadsave': {
      const { readFileSync } = await import('fs')
      const blob = readFileSync(a[0], 'utf8')
      await page.evaluate(async (blob) => {
        const save = await import('/src/state/save.ts')
        localStorage.setItem(save.SAVE_KEY, blob)
      }, blob)
      await page.reload()
      await sleep(1500)
      return { ok: true }
    }
    case 'state': {
      const st = await page.evaluate(async () => {
        const { useMissionStore } = await import('/src/state/missionStore.ts')
        const s = useMissionStore.getState()
        return { live: s.live, paused: s.paused, result: s.result }
      })
      return { inMission: await inMission(), pauseOpen: await pauseOpen(), ...st }
    }
    default:
      return { error: 'unknown command ' + cmd }
  }
}

const server = http
  .createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x')
    const cmd = u.pathname.slice(1)
    const a = u.searchParams.getAll('a')
    let out
    try {
      out = await run(cmd, a)
    } catch (e) {
      out = { error: String(e).split('\n')[0] }
    }
    log({ cmd, a, out: { ...out, text: out.text ? out.text.slice(0, 400) : undefined } })
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify(out))
  })
  .listen(PORT, () => console.log('harness on ' + PORT + ' -> ' + DIR))

// Close the port first, then the browser, so a restart never meets a half-dead server.
const stop = async () => {
  server.close()
  await browser.close().catch(() => {})
  process.exit(0)
}
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
