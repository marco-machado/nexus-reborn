# Mission and Screen sounds

These clips are wired through `src/game/sfxClips.ts` and loaded lazily by
`src/game/audio.ts`. Beds stay in the parent folder.

The September 2026 pass replaces all 20 one-shots and remasters both rain loops.
The direction is dry mechanical weapons, restrained tactile terminal cues, and
soft impacts. Squad / CorpSec weapons now share a source recording: CorpSec is
band-limited and 3 dB lower in RMS, rather than a separately generated unrelated
sound. Original squad / CorpSec RMS differences reached 42 dB.

| Files | Runtime event / channel | Maximum duration |
| --- | --- | --- |
| `gun-assault[-corpsec].mp3` | RFC-27 / combat | 240 ms |
| `gun-smg[-corpsec].mp3` | K-9 Rattler / combat | 160 ms |
| `gun-pistol[-corpsec].mp3` | S-18 / combat | 200 ms |
| `gun-longrifle[-corpsec].mp3` | VK-88 / combat | 400 ms |
| `gun-shotgun[-corpsec].mp3` | M6 Breacher / combat | 340 ms |
| `reload.mp3` | reload / combat | 400 ms |
| `blast.mp3` | grenade / charge / combat | 850 ms |
| `death.mp3` | death thud / combat | 280 ms |
| `agent-hit.mp3` | operative hit / combat | 160 ms |
| `ability.mp3` | role ability / combat | 240 ms |
| `alert-sting.mp3` | alert / combat | 420 ms |
| `confirm.mp3` | order acknowledgement / UI | 90 ms |
| `ui-click.mp3` | terminal click / UI | 55 ms |
| `objective.mp3` | objective completion / UI | 550 ms |
| `interact.mp3` | channel progress / UI | 45 ms |
| `rain-light.mp3`, `rain-heavy.mp3` | weather / ambience | 7.88 s loops |

All outputs are mono 44.1 kHz MP3 at 192 kbps. One-shots have trimmed onsets,
short release fades, band limiting, and peak / RMS ceilings. The exact mastering
settings live in `_prepare.py`; its `--check` mode measures decoded MP3 output
so codec overshoot is included. Rain uses a 120 ms seam crossfade and reduced
high frequencies. Weather `none` is silent. The alert-tension drone remains
synthesized so it can ramp with alert level.

The runtime retains the four user volume controls and master / mute. Authored
UI and combat gains are −3 and −1.5 dB beneath the existing master. Gunshots
vary playback rate by ±3%. At most eight combat one-shots and three UI cues
can overlap; gunfire stops admitting new voices at six combat voices so other
combat events have room. Sources disconnect on completion. Cues that load more
than 120 ms after their event are dropped. A master compressor catches summed
peaks (−3 dB threshold, 12:1 ratio, 3 ms attack, 150 ms release).

## Reproduction and provenance

`_generate.py` records every prompt, requested duration, loop flag, model
(`eleven_text_to_sound_v2`), and prompt influence (0.7). It reads
`ELEVENLABS_API_KEY` from the environment; credentials never enter the game.
One-shot sources were generated with ElevenLabs. Use of generated assets remains
subject to the account's provider terms; no new subscription was purchased.

```sh
python3 _generate.py --out /tmp/nexus-sfx-raw
# Offline mastering dependencies: numpy scipy imageio-ffmpeg, in a local venv.
python3 _prepare.py --source /tmp/nexus-sfx-raw --rain /path/to/original-rain --out /tmp/nexus-sfx-mastered
python3 _prepare.py --check /tmp/nexus-sfx-mastered
```

The raw generation directory must be separate from the shipping directory.
For this pass, `--rain` used the two existing committed rain clips. The attempted
new light-rain source had insufficient sustained texture, and heavy-rain
generation returned HTTP 401. Both shipping rain files were therefore remastered
from the original sources. Rerunning generation makes new takes, not byte-identical
recordings; mastering fixed source bytes is deterministic.

Reference ledger: `audio-design/SKILL.md`,
`threejs-audio-generator/SKILL.md`, and its `references/audio-workflows.md`.
Credential probe: `ELEVENLABS_API_KEY=SET`.

Validation: `_prepare.py --check` passes for all 22 decoded shipping clips,
including duration limits, at least 3 dB peak headroom, and faction RMS balance.
Audio tests cover overlap limits with reserved alert capacity, expired decode
requests, pitch variation, node cleanup, channel controls, and bed lifecycle.
Final tonal preference needs a listening check on the player's output device.

Browser verification (1280×720): Menu, Settings, World Network, Brief, Assembly,
and Mission. Exercised deployment, gunfire, operative selection, move order,
ability activation, minimap, pause / resume, combat volume, and mute. The isolated
Web Audio harness decoded and played all 20 one-shots, admitted six simultaneous
gunshots plus an alert, and confirmed every completed source disconnected.
No browser errors; the renderer emitted its existing THREE.Clock deprecation
warning. Research, debrief, and the scheduled weather front were not exercised.
Repository gates: lint, 528 tests, and production build passed.
