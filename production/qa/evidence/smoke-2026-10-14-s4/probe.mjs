import * as L from './lib.mjs'
const { browser, page, errs } = await L.open()
await L.newOperation(page)
console.log(JSON.stringify((await L.btns(page)).filter(b=>/CONTRACT|EXPEDITE|ACCEPT/i.test(b))))
const s = await L.state(page)
console.log(JSON.stringify({phase:s.phase,credits:s.credits,contracts:s.contracts,won:s.contractsWon}))
console.log(await page.evaluate(async()=>{const w=(await import('/src/state/worldStore.ts')).useWorldStore.getState();return JSON.stringify(Object.keys(w).filter(k=>typeof w[k]==='function'))}))
console.log(errs.join('\n'))
await browser.close()
