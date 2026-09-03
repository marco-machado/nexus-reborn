"""Generate unmastered SFX with ElevenLabs; run _prepare.py before shipping.

ELEVENLABS_API_KEY stays in the environment. Requires Python 3.9+.
Usage: python _generate.py --out /tmp/nexus-sfx-raw
Existing outputs are skipped so an interrupted run can be resumed.
"""
import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

URL = 'https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192'
MODEL = 'eleven_text_to_sound_v2'
INFLUENCE = 0.7
DRY = ' Isolated dry studio game sound, immediate attack, natural short decay, no speech, no music, no background, no distortion or digital glitches.'

# name, generation duration, loop, source description. CorpSec is derived from
# these same weapon recordings in _prepare.py to keep one coherent sound set.
JOBS = [
    ('gun-assault', 0.6, False, 'Exactly one single assault rifle round. Solid sharp midrange ballistic crack, compact low chest punch, tiny steel action click. Tight outdoor report, no automatic burst, no shell bounce.'),
    ('gun-smg', 0.5, False, 'Exactly one single suppressed submachine gun round. Compact dry pneumatic pop with a crisp metal bolt tick and a small bass knock. Very short, no burst, no sustained hiss.'),
    ('gun-pistol', 0.5, False, 'Exactly one single pistol shot. Tight punchy ballistic pop with a dry slide snap. Clean distinct transient, modest low body, very short tail, no repeated shots.'),
    ('gun-longrifle', 0.9, False, 'Exactly one single heavy precision rifle shot. Weighty low punch beneath a firm ballistic crack, short outdoor low resonance fading away. No ricochet, no repeated shot, no bolt cycling.'),
    ('gun-shotgun', 0.8, False, 'Exactly one single combat shotgun discharge. Thick compressed air thump with a broad crunchy ballistic crack, brief low tail. No pump action, no second shot, no metallic ringing.'),
    ('reload', 0.6, False, 'Close firearm foley: a small magazine locking click followed by a short smooth metal slide clack. Two precise muted mechanical movements. Soft dry handling, no firing.'),
    ('blast', 1.2, False, 'One compact tactical grenade explosion. Immediate deep rounded pressure thump, brief coarse debris crack, low rumble that dies quickly. Weighty and controlled, outdoor perspective, no ringing, no second explosion.'),
    ('death', 0.6, False, 'One heavy clothed body dropping onto concrete. Soft low thud with a tiny equipment rattle and fabric movement. Restrained game foley, no vocalization, no splatter, no sharp crack.'),
    ('agent-hit', 0.5, False, 'One short dull impact into padded tactical body armor. Tight low leather thump and faint fabric crunch. Small controlled hit, no bullet report, no voice, no metallic ringing.'),
    ('ability', 0.5, False, 'A miniature powered mechanism engaging: soft relay click followed by a smooth short warm electrical pulse. Subtle advanced tactical equipment activation, low-mid register, no zapping, no laser sweep, no sharp beep.'),
    ('alert-sting', 0.6, False, 'A restrained tactical warning: two short low rounded electronic pulses, second slightly lower. Soft firm attack with a tiny dry relay click. Serious quiet terminal cue, no siren, no alarm loop, no rising shriek.'),
    ('confirm', 0.5, False, 'One tiny muted radio squelch click to acknowledge a tactical command. Soft compact midrange tactile tick, useful sound under 100 milliseconds, no sustained static, no beep, no voice.'),
    ('ui-click', 0.5, False, 'One tiny soft tactile terminal button click. Muted polymer switch with a warm low tick. Useful sound under 60 milliseconds, very dry and understated, no bright ping, no beep, no ringing.'),
    ('objective', 0.7, False, 'Two soft rounded electronic notes gently rising, warm sine tone with a short smooth release. Understated secure-terminal success cue in a low register, no bright bells, no fanfare, no glitter.'),
    ('interact', 0.5, False, 'One barely audible warm data tick. Soft wooden-like digital tap, tiny rounded transient under 60 milliseconds. Subtle terminal progress feedback, no tonal beep, no sustained note.'),
    ('rain-light', 8.0, True, 'Seamless quiet light rain ambience on city pavement, soft dispersed drops, warm filtered wash, distant perspective. No sharp foreground drops, no thunder, no traffic, no music, no voices, no electronic hiss.'),
    ('rain-heavy', 8.0, True, 'Seamless steady dense rain on city pavement, smooth low-mid wash with soft scattered drops. Warm distant rain texture, no harsh high-frequency hiss, no thunder, no traffic, no music, no voices.'),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--only', help='Generate just this stem')
    args = parser.parse_args()
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key:
        raise SystemExit('ELEVENLABS_API_KEY=MISSING')
    args.out.mkdir(parents=True, exist_ok=True)
    jobs = [job for job in JOBS if args.only is None or job[0] == args.only]
    if not jobs:
        raise SystemExit('Unknown sound name')
    for name, seconds, loop, prompt in jobs:
        path = args.out / (name + '.mp3')
        if path.exists():
            print(f'skip {name}', flush=True)
            continue
        payload = {'text': prompt + ('' if loop else DRY), 'duration_seconds': seconds,
                   'loop': loop, 'model_id': MODEL, 'prompt_influence': INFLUENCE}
        req = urllib.request.Request(URL, data=json.dumps(payload).encode(), method='POST',
                                     headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                data = response.read()
        except urllib.error.HTTPError as error:
            raise SystemExit(f'{name}: provider HTTP {error.code}') from None
        if len(data) < 500:
            raise SystemExit(f'{name}: invalid audio response')
        path.write_bytes(data)
        print(f'generated {name} ({len(data)} bytes)', flush=True)


if __name__ == '__main__':
    main()
