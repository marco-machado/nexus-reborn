# Mission and Screen sounds

This directory contains 22 mastered MP3s from free CC0 libraries: 20 one-shots
(five weapons with squad and CorpSec variants, plus ten other cues) and two
recorded rain loops. Music / city beds in the parent directory and the
synthesized alert-tension layer are separate from this set.

## Sources and credits

All source pages were checked on 2026-09-03 and list **CC0 1.0**.
The source URLs, original archive members, SHA-256 hashes, excerpt timestamps,
and derivative mappings are recorded in [sources.json](sources.json).
These credits are retained even though CC0 does not require attribution.

| Shipping files | Original asset | Creator / source |
| --- | --- | --- |
| `gun-assault*.mp3` | AR-15, `D_32P.wav`, first single shot | [Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) — Ben Jaszczak, Brian Nelson, Kevin Heras, Matthew Nanney |
| `gun-smg*.mp3` | Carl Gustav M45, `G_31P.wav`, first single shot | Free Firearm Sound Library |
| `gun-pistol*.mp3` | Walther PPQ, `X_39P.wav`, first single shot | Free Firearm Sound Library |
| `gun-longrifle*.mp3` | Tikka T3, `W_29P.wav`, first single shot | Free Firearm Sound Library |
| `gun-shotgun*.mp3` | Benelli Nova, `O_21P.wav`, first single shot | Free Firearm Sound Library |
| `reload.mp3` | `reload.wav`: magazine removal / insertion and slide | [Handgun Reload Sound Effect](https://opengameart.org/content/handgun-reload-sound-effect) — zer0_sol |
| `blast.mp3` | opening 1.8 seconds of `Chunky Explosion.mp3` | [Chunky Explosion](https://opengameart.org/content/chunky-explosion) — Joth |
| `death.mp3` | `impactSoft_heavy_000.ogg` | [Impact Sounds 1.0](https://kenney.nl/assets/impact-sounds) — Kenney |
| `agent-hit.mp3` | `impactPunch_medium_000.ogg` | Impact Sounds 1.0 — Kenney |
| `ui-click.mp3` | `click_004.ogg` | [Interface Sounds 1.0](https://kenney.nl/assets/interface-sounds) — Kenney |
| `confirm.mp3` | `select_007.ogg` | Interface Sounds 1.0 — Kenney |
| `interact.mp3` | `tick_001.ogg` | Interface Sounds 1.0 — Kenney |
| `objective.mp3` | `confirmation_002.ogg` | Interface Sounds 1.0 — Kenney |
| `alert-sting.mp3` | `error_005.ogg` | Interface Sounds 1.0 — Kenney |
| `ability.mp3` | `switch_006.ogg` | Interface Sounds 1.0 — Kenney |
| `rain-light.mp3`, `rain-heavy.mp3` | `1.mp3`, `2.mp3` | [Rain (loopable)](https://opengameart.org/content/rain-loopable) — Ylmir |

The firearms are recordings identified by the library's Prepared Master Sheet.
Rain is a window field recording. Interface / impact effects and the explosion
are authored sound effects. No generated audio is used in these 22 files.
See [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) and the original
Kenney license notices in [licenses](licenses/).

## Runtime integration

The game bundles the mastered MP3s through
[`src/game/sfxClips.ts`](../../../src/game/sfxClips.ts).
[`src/game/audio.ts`](../../../src/game/audio.ts) fetches those local asset URLs,
decodes and caches buffers per AudioContext, and preloads all 20 one-shots when
the context is created. Source-library downloads and preparation run offline.
[`src/ui/sound.ts`](../../../src/ui/sound.ts) loads the audio module lazily and
swallows failures so unavailable audio does not block the game.

| Channel | Sounds |
| --- | --- |
| UI | Selection confirmation, menu click, objective completion, interaction progress |
| Combat | Gunfire, reload, blast, ability activation, alert sting, death, operative hit, synthesized alert-tension drone |
| Music | Strategy bed |
| Ambience | Mission city bed and weather-driven light / heavy rain |

Channel gains feed the master and a final compressor. UI and combat have
authored gain reductions beneath their sliders; player levels and mute persist
in settings separately from the campaign. The mixer allows eight simultaneous
combat one-shots and three UI one-shots. Gunshots are admitted only while fewer
than six combat one-shots are active, leaving room for impacts and warnings.
Loops and the drone do not consume these one-shot slots.

Per-event rate limits further reduce stacking. Each gunshot varies its playback
rate by up to ±3%. One-shots require a running AudioContext and are dropped if
decoding delays them by more than 120 ms. Finished sources disconnect and leave
the active-voice set. Bed stop operations invalidate pending decodes so a late
load cannot restart a departed screen's loop. Rain crossfades with weather and
fades out in dry conditions.

## Edits and reproduction

Preparation extracts one shot from each firearm recording, trims empty lead-in,
uses gentle peak compression to retain the body of the report, and applies a
short release fade. The source's upper frequencies are retained. CorpSec uses
the same recording, narrowed to 180–4200 Hz and about 3 dB lower in RMS. UI / foley
clips retain their original shape and sequence, including the whole reload.
Each cue has peak and RMS ceilings so quiet interface sounds stay below combat
reports. Rain keeps its longer
recorded texture, with a 120 ms seam crossfade (26.88 / 25.88 second loops).
Outputs: mono 44.1 kHz MP3, 192 kbps. Exact profiles and processing are in
[`_prepare.py`](_prepare.py).

From this directory, using a Python environment with `numpy`, `scipy`, and
`imageio-ffmpeg` (only needed to rebuild assets):

```sh
python3 _fetch.py --out /tmp/nexus-free-sfx
python3 _prepare.py --source /tmp/nexus-free-sfx --out /tmp/nexus-sfx-mastered
python3 _prepare.py --check /tmp/nexus-sfx-mastered
```

[`_fetch.py`](_fetch.py) uses `bsdtar` with 7z support (included on macOS). The firearm archive
is approximately 194 MB; it is cached outside the repository. Only the selected
sources are extracted. Every archive and source is checksum-verified before use.
Listen to the mastered files individually and in the mix, then copy the reviewed
MP3s into this directory and run `python3 _prepare.py --check .`. Always rebuild
from the original sources to avoid accumulating lossy encoding and processing.

For replacements, update the source URLs, license, archive and extracted-file
checksums, excerpt ranges, and output mappings in `sources.json`, and retain
source credits here. Update the preparation profiles if a cue needs different
timing or mastering. Keep the clip URL map in sync when adding or renaming a
shipping file.

## Validation

`_prepare.py --check` decodes all 22 outputs and checks finite samples, peak
headroom, cue lengths, and squad / CorpSec level differences. Source checksums
are checked during fetching and preparation. These checks complement listening
to the result; they do not establish sound quality.

After integrating assets or changing the mixer, run the repository's lint,
test, and build scripts and the audio checks in
[`docs/click-through.md`](../../../docs/click-through.md#audio-changes).

Replacement verification on 2026-09-03: lint, all 528 tests, and production build passed. All
22 shipping files differ from the previous generated set and map to verified
CC0 source bytes. The browser harness played all 20 one-shots, exercised light
rain → heavy rain → stop, and confirmed source completion and one-shot node
cleanup without console errors. Partial click-through at 1280×720: Menu and
Settings (open / close). No mission playthrough was run for this asset-only pass.
