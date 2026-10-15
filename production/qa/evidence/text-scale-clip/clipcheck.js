(() => {
  const out = []
  const isScroll = (s) => /auto|scroll/.test(s.overflowY) || /auto|scroll/.test(s.overflowX)
  const leaves = [...document.querySelectorAll('body *')].filter((el) => {
    if (el.closest('.globe-view, svg, [aria-hidden="true"]')) return false
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    if (!own) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  })
  for (const el of leaves) {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    const label = (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : el.tagName) + ' "' + el.textContent.trim().slice(0, 30) + '"'
    if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) { out.push('ELLIPSIS ' + label); continue }
    if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1) { out.push('OFFSCREEN ' + label); continue }
    let a = el.parentElement
    while (a && a !== document.body) {
      const as = getComputedStyle(a)
      if (as.position === 'absolute' || as.position === 'fixed') break
      const ar = a.getBoundingClientRect()
      if (isScroll(as)) {
        // inside a scroller: fine if reachable; stop walking
        break
      }
      const clips = /hidden|clip/.test(as.overflowY) || /hidden|clip/.test(as.overflowX)
      if (r.bottom > ar.bottom + 1 || r.top < ar.top - 1 || r.right > ar.right + 1 || r.left < ar.left - 1) {
        out.push((clips ? 'CLIPPED ' : 'OVERFLOWS ') + label + ' in ' + (a.className || a.tagName) + ` (${Math.round(r.bottom - ar.bottom)}px)`)
        break
      }
      a = a.parentElement
    }
  }
  return [...new Set(out)]
})()
