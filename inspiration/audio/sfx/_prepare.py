"""Master generated one-shots and existing rain into Vite-bundled MP3s.

Requires numpy, scipy, imageio-ffmpeg (offline processing only).
python _prepare.py --source /tmp/nexus-sfx-raw --rain /tmp/nexus-sfx-original --out /tmp/nexus-sfx-mastered
python _prepare.py --check inspiration/audio/sfx
"""
import argparse
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, sosfilt

RATE = 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
# Maximum seconds, peak dBFS, RMS ceiling dBFS, lowpass Hz.
# UI transients are intentionally much quieter than a weapon report.
PROFILES = {
    'gun-assault': (.24, -6, -19, 7800),
    'gun-smg': (.16, -7, -20, 6800),
    'gun-pistol': (.20, -6, -19, 7800),
    'gun-longrifle': (.40, -5, -18, 7000),
    'gun-shotgun': (.34, -5, -18, 6500),
    'reload': (.40, -13, -25, 5200),
    'blast': (.85, -5, -18, 6000),
    'death': (.28, -12, -23, 3000),
    'agent-hit': (.16, -10, -22, 3200),
    'ability': (.24, -12, -24, 3800),
    'alert-sting': (.42, -10, -23, 3500),
    'confirm': (.09, -16, -28, 3200),
    'ui-click': (.055, -18, -30, 3000),
    'objective': (.55, -11, -24, 4000),
    'interact': (.045, -21, -32, 2600),
}


def decode(path):
    return np.frombuffer(subprocess.check_output([
        FFMPEG, '-v', 'error', '-i', str(path), '-f', 'f32le', '-ac', '1', '-ar', str(RATE), '-'
    ]), dtype=np.float32).copy()


def encode(path, samples):
    subprocess.run([
        FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', '-',
        '-codec:a', 'libmp3lame', '-b:a', '192k', str(path)
    ], input=np.asarray(samples, dtype=np.float32).tobytes(), check=True)


def bandlimit(x, low, high):
    return sosfilt(butter(2, [low, high], btype='bandpass', fs=RATE, output='sos'), x)


def level(x, peak_db, rms_db):
    peak = np.max(np.abs(x))
    rms = np.sqrt(np.mean(x * x))
    if peak < 1e-6 or rms < 1e-7:
        raise ValueError('Source has no usable audio')
    return x * min(10 ** (peak_db / 20) / peak, 10 ** (rms_db / 20) / rms)


def master_shot(x, name):
    seconds, peak_db, rms_db, cutoff = PROFILES[name]
    x = bandlimit(x, 55 if name.startswith('gun-') or name == 'blast' else 100, cutoff)
    # Find the first useful transient, ignoring codec pre-echo and padding.
    width = int(.002 * RATE)
    envelope = np.convolve(x * x, np.ones(width) / width, mode='same')
    onset = np.flatnonzero(envelope > envelope.max() * .04)[0]
    start = max(0, onset - int(.002 * RATE))
    x = x[start:start + int(seconds * RATE)].copy()
    attack = min(len(x), int(.001 * RATE))
    release = min(len(x) // 3, int(.04 * RATE))
    x[:attack] *= np.linspace(0, 1, attack)
    x[-release:] *= np.linspace(1, 0, release) ** 2
    return level(x, peak_db, rms_db)


def master_rain(x, heavy):
    x = bandlimit(x, 180, 5500 if heavy else 4500)
    # Join the end to the beginning with a 120ms equal-gain crossfade.
    n = int(.12 * RATE)
    ramp = np.linspace(0, 1, n)
    join = x[-n:] * (1 - ramp) + x[:n] * ramp
    x = np.concatenate([join, x[n:-n]])
    return level(x, -10, -24 if heavy else -27)


def check(root):
    report = []
    errors = []
    expected = list(PROFILES) + [n + '-corpsec' for n in PROFILES if n.startswith('gun-')] + ['rain-light', 'rain-heavy']
    for name in expected:
        path = root / (name + '.mp3')
        x = decode(path)
        peak = float(20 * np.log10(max(1e-9, np.max(np.abs(x)))))
        rms = float(20 * np.log10(max(1e-9, np.sqrt(np.mean(x * x)))))
        duration = len(x) / RATE
        # Check decoded output: MP3 can overshoot the pre-encode peak.
        if not np.isfinite(x).all() or peak > -3:
            errors.append(f'{name}: decoded peak {peak:.1f} dBFS')
        if name in PROFILES and duration > PROFILES[name][0] + .01:
            errors.append(f'{name}: tail too long ({duration:.3f}s)')
        report.append({'file': path.name, 'seconds': round(duration, 3), 'peak_dbfs': round(peak, 1), 'rms_dbfs': round(rms, 1)})
    rows = {r['file']: r for r in report}
    for name in PROFILES:
        if name.startswith('gun-'):
            difference = rows[name + '.mp3']['rms_dbfs'] - rows[name + '-corpsec.mp3']['rms_dbfs']
            if not 1 <= difference <= 6:
                errors.append(f'{name}: squad / CorpSec level mismatch ({difference:.1f} dB)')
    print(json.dumps(report, indent=2))
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'PASS: {len(report)} decoded clips; peak headroom, durations and faction balance')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    parser.add_argument('--rain', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--check', type=Path)
    args = parser.parse_args()
    if args.check:
        check(args.check)
        return
    if not all([args.source, args.rain, args.out]):
        parser.error('--source, --rain and --out are required for mastering')
    args.out.mkdir(parents=True, exist_ok=True)
    for name in PROFILES:
        x = master_shot(decode(args.source / (name + '.mp3')), name)
        encode(args.out / (name + '.mp3'), x)
        if name.startswith('gun-'):
            # Same physical weapon, a narrower darker report at a lower level.
            enemy = bandlimit(x, 180, 4200)
            enemy *= np.sqrt(np.mean(x*x)) / max(1e-8, np.sqrt(np.mean(enemy*enemy)))
            enemy *= 10 ** (-3 / 20)
            encode(args.out / (name + '-corpsec.mp3'), enemy)
    for kind in ['light', 'heavy']:
        x = master_rain(decode(args.rain / ('rain-' + kind + '.mp3')), kind == 'heavy')
        encode(args.out / ('rain-' + kind + '.mp3'), x)
    check(args.out)


if __name__ == '__main__':
    main()
