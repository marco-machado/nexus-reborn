// Playtest client: node play.mjs <command> [args...]
//   look [label]          screenshot (path printed; open it with your image reader) + visible text
//   click <x> <y> [right] mouse click at 1280x720 coordinates
//   drag <x1> <y1> <x2> <y2>
//   move <x> <y>          move the pointer (hover)
//   wheel <dy>            mouse wheel (camera zoom)
//   key <Key>             e.g. Space, Escape, 1, q, g, Tab, Enter, ArrowLeft
//   holdkey <Key> [ms]    hold a key down (e.g. camera pan W/A/S/D), default 400 ms
//   type <text>
//   clicktext <words>     click the first element whose text contains the words
//   wait <ms>             mission: run ms real milliseconds, then the harness pauses the game
//                         again and returns a capture (max 30000). Screens: let ms pass.
// In a mission the harness keeps the game paused between your commands; each
// input lets about 120 ms pass. A pause YOU open (Space, Escape, PAUSE) stays.
const [cmd, ...args] = process.argv.slice(2)
const port = process.env.PLAY_PORT || 4399
const qs = args.map((a) => 'a=' + encodeURIComponent(a)).join('&')
const r = await fetch(`http://localhost:${port}/${cmd}?${qs}`)
const j = await r.json()
if (j.text) {
  console.log(j.screenshot || '')
  console.log(j.text)
} else console.log(JSON.stringify(j))
