# Pixxo

Zum Spielen [pixxo.html](pixxo.html) oder [index.html](index.html) im Browser öffnen. Die HTML-Datei und `assets` müssen zusammenbleiben. Die weitergebbare Fassung ist `Pixxo_lokal.zip`.

| Ordner / Datei | Inhalt |
| --- | --- |
| `assets/js` | Aktive Spielmodule |
| `assets/css` | Zusätzliche Oberflächenstile |
| `assets/sprites` | Eingebettete Sprite-Daten, Bilddateien und Grafikquellen |
| `Dokumentation` | Spielregeln und Änderungsberichte |
| `pixxo_tests` | Prüfskripte, Ergebnisse und Screenshots |
| `Sicherung` | Ältere Entwicklungsstände, ursprünglicher Spielstand und frühere Grafikmodule |
| `scripts` | Werkzeug zum Erstellen der lokalen ZIP |
| `Spielstart.txt` | Kurzanleitung für den lokalen Start |

Die ursprüngliche Spielstandsicherung liegt unter `Sicherung/Spielstände`. Ältere Prüfberichte und Browserprofile bleiben im Prüfordner erhalten.

Die ZIP mit dem aktuellen Stand erstellen:

```sh
python scripts/pack_lokal.py
```

Das Werkzeug ermittelt die geladenen Spieldateien aus der HTML-Datei, übernimmt deren Ordnerstruktur und prüft die ZIP-Inhalte. Dokumentation, Tests, Browserprofile und Sicherungen gehören nicht zum Spielpaket.

Spielstände lassen sich im Menü als JSON exportieren und importieren. Exportiere vor einem Ordnerwechsel oder dem Wechsel zu GitHub Pages deine Partie. Ein Import sichert die vorherige Partie; sie lässt sich anschließend im Menü wiederherstellen.

Für GitHub Pages sind `index.html`, `pixxo.html`, `.nojekyll` und der Ordner `assets` vorbereitet. `index.html` öffnet das Spiel. Die Veröffentlichung erfolgt über das GitHub-Repository; der lokale Stand wurde nicht veröffentlicht.

Die aktuellen Regeln und Prüfungen stehen in [Aktuelle Spieländerungen](Dokumentation/Aktuelle_Spieländerungen.md). Das Tutorial ist vorerst deaktiviert.
