"""Fetch pinned CC0 sources without credentials or generation services.

python3 _fetch.py --out /tmp/nexus-free-sfx
Needs bsdtar with 7z support for the firearm archive (available on macOS).
The large archive remains outside the repository and is reused on later runs.
"""
import argparse
import hashlib
import json
import subprocess
import urllib.request
import zipfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(Path(__file__).with_name('sources.json').read_text())
    for key, package in manifest['packages'].items():
        archive = args.out / package['file']
        if not archive.exists():
            temporary = archive.with_suffix(archive.suffix + '.part')
            print(f"Downloading {package['title']}", flush=True)
            urllib.request.urlretrieve(package['url'], temporary)
            if hashlib.sha256(temporary.read_bytes()).hexdigest() != package['sha256']:
                raise ValueError(f'Archive checksum mismatch: {key}')
            temporary.replace(archive)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != package['sha256']:
            raise ValueError(f'Archive checksum mismatch: {key}')
        clips = [c for c in manifest['clips'].values() if c['package'] == key]
        for clip in clips:
            member = Path(clip['member'])
            if member.is_absolute() or '..' in member.parts:
                raise ValueError(f'Unsafe source path: {member}')
            if package['format'] == 'file':
                target = archive
            else:
                target = args.out / key / member
                target.parent.mkdir(parents=True, exist_ok=True)
                if package['format'] == 'zip':
                    with zipfile.ZipFile(archive) as bundle:
                        data = bundle.read(clip['member'])
                else:
                    data = subprocess.check_output(['bsdtar', '-xOf', str(archive), clip['member']])
                target.write_bytes(data)
            if hashlib.sha256(target.read_bytes()).hexdigest() != clip['sha256']:
                raise ValueError(f'Source checksum mismatch: {target}')
        print(f"Verified {package['title']}: {len(clips)} sources", flush=True)


if __name__ == '__main__':
    main()
