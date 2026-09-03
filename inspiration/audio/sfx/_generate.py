# One-shot generator. Not imported by the game.
import json
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV = Path("/Users/machado/.hermes/profiles/sound-engineer/.env")
URL = "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192"

JOBS = [
    (
        "gun-assault.mp3",
        0.6,
        False,
        "Dry mid-caliber assault rifle gunshot, single round, mechanical, close, no echo hall, no ricochet, no music, no voice. Tight crack then short mechanical decay. Corporate 2087 firearm.",
    ),
    (
        "gun-smg.mp3",
        0.5,
        False,
        "Dry small SMG gunshot, single round, thin and fast, high and light, close, no echo, no music, no voice. Short tick-crack. Compact close-quarters firearm.",
    ),
    (
        "gun-pistol.mp3",
        0.5,
        False,
        "Dry 9mm-class pistol gunshot, single round, crisp short crack, close, no echo hall, no music, no voice. Precise light sidearm.",
    ),
    (
        "gun-longrifle.mp3",
        0.9,
        False,
        "Dry heavy longrifle gunshot, single round, deep punch and longer low tail, close, no canyon echo, no music, no voice. Precision anti-personnel rifle.",
    ),
    (
        "gun-shotgun.mp3",
        0.8,
        False,
        "Dry combat shotgun blast, single shot, wide body, short-range, close, no hall reverb, no music, no voice. Thick mechanical thump.",
    ),
    (
        "gun-assault-corpsec.mp3",
        0.6,
        False,
        "Darker narrower restatement of an assault rifle gunshot. Muffled, cheaper, band-limited, slightly distant, no music, no voice. Same weapon class, worse radio.",
    ),
    (
        "gun-smg-corpsec.mp3",
        0.5,
        False,
        "Darker narrower restatement of a small SMG gunshot. Muffled, thin, band-limited, no music, no voice. Corporate security sidearm chatter.",
    ),
    (
        "gun-pistol-corpsec.mp3",
        0.5,
        False,
        "Darker narrower restatement of a pistol gunshot. Muffled, band-limited, cheaper crack, no music, no voice.",
    ),
    (
        "gun-longrifle-corpsec.mp3",
        0.9,
        False,
        "Darker narrower restatement of a longrifle gunshot. Muffled heavy punch, band-limited tail, no music, no voice. Garrison marksman.",
    ),
    (
        "gun-shotgun-corpsec.mp3",
        0.8,
        False,
        "Darker narrower restatement of a shotgun blast. Muffled, thicker, band-limited, no music, no voice. Corporate heavy.",
    ),
    (
        "reload.mp3",
        0.6,
        False,
        "Short mechanical magazine reload: two dry metal clicks, no voice, no music, close, no hall. Firearm handling only.",
    ),
    (
        "confirm.mp3",
        0.5,
        False,
        "Short band-limited radio acknowledgement click, synthetic, under 120 milliseconds of useful sound, no speech, no words, no music. Tiny comms tick.",
    ),
    (
        "ui-click.mp3",
        0.5,
        False,
        "Tiny dry corporate terminal UI click, digital tick, no reverb, no music, no voice. Secure OS button.",
    ),
    (
        "alert-sting.mp3",
        0.6,
        False,
        "Alert sting: dark combat body plus a brief high UI pip on top. No speech, no siren loop, no music. Danger mark, not an alarm song.",
    ),
    (
        "objective.mp3",
        0.7,
        False,
        "Short three-tone objective-complete chime, clean sine-like, rising, corporate terminal, no voice, no music bed. Confirmation, not fanfare.",
    ),
    (
        "death.mp3",
        0.6,
        False,
        "Dull body death thud, low and short, no scream, no voice, no music. A body hitting pavement.",
    ),
    (
        "agent-hit.mp3",
        0.5,
        False,
        "Dull operative body thump under a hit, low short impact, no voice, no music, no scream. Wounded body, not a gunshot.",
    ),
    (
        "blast.mp3",
        0.8,
        False,
        "Short grenade blast, close, dry urban, low body and brief crack, no hall, no music, no voice. One explosion.",
    ),
    (
        "ability.mp3",
        0.5,
        False,
        "Short rising double digital blip, brighter than a UI click, no voice, no music. Role ability arming.",
    ),
    (
        "interact.mp3",
        0.5,
        False,
        "One short data-progress blip, square digital, corporate terminal, no voice, no music. Channel tick.",
    ),
    (
        "rain-light.mp3",
        8.0,
        True,
        "Seamless looping light rain hiss on city pavement, high-frequency only, no thunder, no music, no voice, no traffic. Thin wet hiss.",
    ),
    (
        "rain-heavy.mp3",
        8.0,
        True,
        "Seamless looping heavy rain hiss on city pavement and metal, high-frequency wash, no thunder, no music, no voice. Dense wet hiss.",
    ),
]


def load_key() -> str:
    for line in ENV.read_text().splitlines():
        s = line.strip()
        if s.startswith("ELEVENLABS_API_KEY="):
            return s.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("missing ELEVENLABS_API_KEY")


def generate(key: str, name: str, seconds: float, loop: bool, text: str) -> None:
    dest = ROOT / name
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"skip {name} (exists)", flush=True)
        return
    body = json.dumps(
        {
            "text": text,
            "duration_seconds": seconds,
            "prompt_influence": 0.75,
            "loop": loop,
            "model_id": "eleven_text_to_sound_v2",
        }
    ).encode()
    ctx = ssl.create_default_context()
    delay = 2.0
    for attempt in range(6):
        req = urllib.request.Request(
            URL,
            data=body,
            method="POST",
            headers={
                "xi-api-key": key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=90, context=ctx) as resp:
                data = resp.read()
            if len(data) < 500:
                raise RuntimeError(f"tiny payload {len(data)}")
            dest.write_bytes(data)
            print(f"wrote {name} bytes={len(data)}", flush=True)
            return
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", "replace")
            print(f"fail {name} HTTP {e.code} try={attempt + 1}: {err[:240]}", flush=True)
            if e.code in (429, 500, 502, 503) and attempt < 5:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            raise SystemExit(f"stopped on {name}")
        except Exception as e:
            print(f"fail {name} {type(e).__name__} try={attempt + 1}: {e}", flush=True)
            if attempt < 5:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            raise SystemExit(f"stopped on {name}")


def main() -> None:
    key = load_key()
    ROOT.mkdir(parents=True, exist_ok=True)
    for name, seconds, loop, text in JOBS:
        generate(key, name, seconds, loop, text)
        time.sleep(0.4)
    print("done", flush=True)


if __name__ == "__main__":
    main()
