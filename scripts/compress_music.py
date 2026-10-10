"""WAV-Originale behalten, browserfähige MP3-Dateien mit 192 kbit/s erstellen.

Aufruf: python scripts/compress_music.py --ffmpeg PFAD_ZU_FFMPEG
Alternativ wird ffmpeg aus PATH oder imageio-ffmpeg verwendet.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--ffmpeg', default=shutil.which('ffmpeg'))
args = parser.parse_args()
if not args.ffmpeg:
    import imageio_ffmpeg
    args.ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
tracks = sorted((root / 'assets/music').glob('*.wav'))
if len(tracks) != 12:
    raise ValueError('Zwölf WAV-Originale erwartet.')
destination = root / 'assets/music/compressed'
destination.mkdir(exist_ok=True)

def convert(source):
    target = destination / (source.stem + '.mp3')
    if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
        temporary = target.with_suffix('.tmp.mp3')
        subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
                        '-i', str(source), '-vn', '-map_metadata', '-1',
                        '-c:a', 'libmp3lame', '-b:a', '192k', str(temporary)], check=True)
        temporary.replace(target)
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error',
                    '-i', str(target), '-f', 'null', '-'], check=True)
    print(f'Geprüft: {target.name}', flush=True)
    return target.stat().st_size

with ThreadPoolExecutor(max_workers=3) as pool:
    compressed = sum(pool.map(convert, tracks))
original = sum(track.stat().st_size for track in tracks)
print(f'WAV: {original:,} Bytes; MP3: {compressed:,} Bytes; '
      f'Ersparnis: {100 * (1 - compressed / original):.1f} %. Originale unverändert.')
