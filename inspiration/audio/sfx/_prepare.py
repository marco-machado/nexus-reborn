"""Master the CC0 recordings in sources.json into Vite-bundled MP3s.

Requires numpy, scipy, imageio-ffmpeg (offline processing only).
python _fetch.py --out /tmp/nexus-free-sfx
python _prepare.py --source /tmp/nexus-free-sfx --out /tmp/nexus-sfx-mastered
python _prepare.py --check inspiration/audio/sfx
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.ndimage import maximum_filter1d

RATE = 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
MANIFEST = Path(__file__).with_name('sources.json')
# Maximum seconds, peak dBFS, RMS ceiling dBFS, lowpass Hz.
# UI transients are intentionally much quieter than a weapon report.
PROFILES = {
    'gun-assault': (.38, -6, -19, 15000),
    'gun-smg': (.22, -7, -20, 15000),
    'gun-pistol': (.36, -6, -19, 15000),
    'gun-longrifle': (.64, -5, -18, 14000),
    'gun-shotgun': (.48, -5, -18, 14000),
    'reload': (1.60, -13, -25, 12000),
    'blast': (1.80, -5, -18, 11000),
    'death': (.54, -12, -23, 9000),
    'agent-hit': (.44, -10, -22, 9000),
    'ability': (.62, -12, -24, 12000),
    'alert-sting': (.51, -10, -23, 12000),
    'confirm': (.07, -16, -28, 12000),
    'ui-click': (.03, -18, -30, 12000),
    'objective': (.55, -11, -24, 12000),
    'interact': (.05, -21, -32, 12000),
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
    x = bandlimit(x, 35, cutoff)
    # Remove empty lead-in without flattening the recording's attack.
    width = int(.002 * RATE)
    envelope = np.convolve(x * x, np.ones(width) / width, mode='same')[:len(x)]
    onset = np.flatnonzero(envelope > envelope.max() * .0025)[0]
    start = max(0, onset - int(.002 * RATE))
    x = x[start:start + int(seconds * RATE)].copy()
    if name.startswith('gun-'):
        # Recorded firearms have a very high crest factor. Gentle 3:1 peak
        # compression keeps the body audible at the existing mix level.
        # A 1ms lookahead catches the impulse without clipping the waveform.
        peaks = maximum_filter1d(np.abs(x), size=89)
        threshold = peaks.max() * .25
        release_coef = np.exp(-1 / (.045 * RATE))
        envelope = 0.0
        for i, peak in enumerate(peaks):
            envelope = max(peak, envelope * release_coef)
            if envelope > threshold:
                x[i] *= (threshold / envelope) ** (2 / 3)
    attack = min(len(x), int(.0003 * RATE))
    release = min(len(x) // 5, int((.07 if name.startswith('gun-') or name == 'blast' else .008) * RATE))
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
    parser.add_argument('--out', type=Path)
    parser.add_argument('--check', type=Path)
    args = parser.parse_args()
    if args.check:
        check(args.check)
        return
    if not all([args.source, args.out]):
        parser.error('--source and --out are required for mastering')
    manifest = json.loads(MANIFEST.read_text())
    def source(name):
        clip = manifest['clips'][name]
        package = manifest['packages'][clip['package']]
        root = args.source if package['format'] == 'file' else args.source / clip['package']
        path = root / clip['member']
        if hashlib.sha256(path.read_bytes()).hexdigest() != clip['sha256']:
            raise ValueError(f'Source checksum mismatch: {path}')
        x = decode(path)
        start = round(clip['start_seconds'] * RATE)
        duration = clip['duration_seconds']
        end = start + round(duration * RATE) if duration is not None else len(x)
        return x[start:end]
    args.out.mkdir(parents=True, exist_ok=True)
    for name in PROFILES:
        x = master_shot(source(name), name)
        encode(args.out / (name + '.mp3'), x)
        if name.startswith('gun-'):
            # Same physical weapon, a narrower darker report at a lower level.
            enemy = bandlimit(x, 180, 4200)
            enemy *= np.sqrt(np.mean(x*x)) / max(1e-8, np.sqrt(np.mean(enemy*enemy)))
            enemy *= 10 ** (-3 / 20)
            enemy *= min(1, 10 ** ((PROFILES[name][1] - 1) / 20) / np.max(np.abs(enemy)))
            encode(args.out / (name + '-corpsec.mp3'), enemy)
    for kind in ['light', 'heavy']:
        x = master_rain(source('rain-' + kind), kind == 'heavy')
        encode(args.out / ('rain-' + kind + '.mp3'), x)
    check(args.out)


if __name__ == '__main__':
    main()
