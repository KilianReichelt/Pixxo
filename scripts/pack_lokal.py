"""Die lokale Spiel-ZIP mit den aktuell eingebundenen Dateien erstellen."""
from pathlib import Path
import os
import re
import zipfile

root = Path(__file__).resolve().parent.parent
entry = root / 'pixxo.html'
archive = root / 'Pixxo_lokal.zip'
temporary = archive.with_suffix('.neu.zip')
references = re.findall(
    r'<(?:script|link)\b[^>]*(?:src|href)=["\x27]([^"\x27]+)',
    entry.read_text(encoding='utf-8'),
)
files = [entry, root / "index.html", root / ".nojekyll", root / "assets/pixxo-logo.svg", root / "assets/start-world.png"]
for reference in references:
    source = (root / reference).resolve()
    if not source.is_relative_to(root) or not source.is_file():
        raise ValueError(f'Ungültige oder fehlende Spieldatei: {reference}')
    if source not in files:
        files.append(source)
instructions = (root / 'Spielstart.txt').read_bytes()
music = sorted((root / 'assets/music/compressed').glob('*.mp3'))
if len(music) != 12:
    raise ValueError('Es werden zwölf komprimierte Musikdateien benötigt.')
files.extend(music)
for name in ('Pixxo_Demo_Flussstadt.json', 'Pixxo_Demo_Anleitung.md', 'SPRITE_STANDARDS.md', 'AGENTS.md'):
    demo = root / name
    if demo.is_file():
        files.append(demo)

with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for source in files:
        package.write(source, source.relative_to(root).as_posix())
    package.writestr('START_HIER.txt', instructions)

with zipfile.ZipFile(temporary) as package:
    if package.testzip() is not None:
        raise ValueError('Die ZIP hat eine ungültige Prüfsumme.')
    for source in files:
        if package.read(source.relative_to(root).as_posix()) != source.read_bytes():
            raise ValueError(f'Der ZIP-Inhalt stimmt nicht überein: {source.name}')
    if package.read('START_HIER.txt') != instructions:
        raise ValueError('Die Startanleitung stimmt nicht überein.')

os.replace(temporary, archive)
print(f'ZIP aktualisiert und geprüft: {len(files) + 1} Dateien, {archive.stat().st_size} Bytes.')
