# Full-HD-Performance und lokale Prüfung

Gemessen am 11.10.2026 mit der echten Datei `Pixxo_Demo_Flussstadt.json`: 864 Einwohner, 74 Gebäude, 452 Straßenkacheln, 1920 × 1080, isolierter Chrome ohne sichtbares Fenster, Gerätepixeldichte 1. Der Test verwendet einen eigenen Speicherstand und verändert keine Browser-Spielstände des Nutzers.

## Ursachen und Änderungen

- Der Landschafts-Cache konnte nur 128 Kachelblöcke halten; an der kritischen Zoomgrenze sind ungefähr 180 sichtbar. Dadurch wurden dieselben Blöcke in jedem Bild neu berechnet. 512 native Blöcke bleiben nun im Cache. Der maximale Pixel-Speicher bleibt bei etwa 128 MiB: 512 × 256² statt zuvor 128 × 512² Pixel.
- Fehlende Landschaftsblöcke werden innerhalb eines Budgets von 5 ms je Bild aufgebaut. Bis dahin erscheinen die vorhandenen Landschaftsfarben. Beim Bewegen der Kamera muss nicht das gesamte neue Sichtfeld auf einmal berechnet werden.
- Bei Zoom unter 0,7 entfallen Straßenpersonen und Feldarbeiter. Unter 0,6 entfällt animierte Brandung.
- Unter 0,45 gilt dieselbe Übersicht für alle 118 Gebäudetypen. Alle natürlichen Baum-Sprites, Wagen, Sprechblasen, Wolkenschatten und einzelne Nachtfenster entfallen. Waldflächen und die globale Nachtfärbung bleiben sichtbar; Gebäudeauswahl, Warenverkehr und Simulation laufen weiter.
- Native Fenster verwenden ihre ausdrücklich markierten Paneele. Dadurch entfällt das GPU-Auslesen dieser Sprites für die Nachtbeleuchtung. Fenster älterer Gebäude werden beim Laden vorbereitet.

## Zeichenzeit in Millisekunden

Je Zoom 40 direkte Zeichenaufrufe. Der p95-Wert gibt die Zeit an, die 95 % der Proben nicht überschreiten. Direkte Aufrufe können den GPU-Puffer anders belasten als die reguläre Spielschleife; deshalb werden tatsächliche Spielbilder zusätzlich gemessen.

| Zoom | Vorher Mittel | Nachher Mittel | Nachher p95 |
| --- | ---: | ---: | ---: |
| 1 | 7.8 | 8.0 | 17.5 |
| 0.75 | 8.4 | 8.7 | 12.7 |
| 0.5 | 136.6 | 10.9 | 16.4 |
| 0.451 | 155.8 | 4.4 | 9.9 |
| 0.4 | 14.4 | 1.2 | 2.2 |
| 0.2 | 13.9 | 3.0 | 3.0 |
| 0.05 | 24.5 | 2.9 | 5.0 |

Die kritische Grenze bei Zoom 0,451 sinkt von 155.8 auf 4.4 ms. Die Simulation benötigt im Mittel 0.9 ms pro Takt.

## Tatsächlich gezeichnete Spielbilder

Je Ansicht 120 Bilder bei laufender Simulation. Gemessen werden Aufrufe von `render`, nicht bloß Browser-Animationscallbacks. Die sieben Zoomstufen erreichen im Mittel 46.8–48.0 FPS. Nachtansicht: 46.7 FPS; Kamerabewegung: 46.7 FPS.

Die p95-Bildzeiten liegen in allen gemessenen Szenarien unter 33,3 ms. Einzelne Ausreißer bleiben: nachts wurde eine Bildzeit von 46.0 ms gemessen. **Eine ausnahmslose Garantie von mindestens 30 FPS ist damit noch nicht belegt.** Die tatsächliche Hardware des Spielers und deutlich größere Städte sind durch diese Messung ebenfalls nicht abgedeckt.

Rohdaten: [vorher](performance-city-before.json), [nachher](performance-city-after.json). Wiederholbarer Ablauf: [profile_city.py](profile_city.py).

## Regressionen und Zugänglichkeit

Bestanden: native Grafik- und Fensterprüfungen, zwölf Hausvarianten und 48 Drehansichten, 48 Deko-Sprites in sechs Kategorien, Brücken/Transport/Speicherung, vier stationäre Stadthintergründe, Aristokraten-Produktion und Dienste, inaktive Großprojekte sowie Werft-Aktualisierung, Zeitformat und kompaktes Layout. Außerdem 382 bestehende Spielprüfungen.

Die betroffenen Menüs bestehen die automatisierten WCAG-2.2-AA-Prüfungen. Kategorie- und Objektauswahl wurden mit Tastatur, 320–1440 Pixel Breite und 200 % Textgröße geprüft. Werft und Startmenü wurden ebenfalls auf Kontrast, Schriftgröße, Reflow und Tastaturbedienung geprüft; reduzierte Bewegung bleibt unterstützt.

Verbleibende Einschränkung: Die Canvas-Spielkarte bietet keine vollständige semantische Darstellung aller Gebäude, Wege und Zustände für Screenreader. Daher wird keine vollständige WCAG-Konformität des gesamten Spiels behauptet.

## Lokal ansehen

- [Spiel](../pixxo.html)
- [Sprite-Übersicht Tag/Nacht](city-refresh-art.png)
- [Waren und Zylinder-Porträt](native-goods-grid.png)
- [Deko-Auswahl](deko-categories-1440.png)
- [Kompakte Werft](shipyard-compact.png)

# Sparse ambient life

Full-HD regression on the 864-resident demo city: mean 46.9–48.0 FPS,
critical zoom 0.451: 4.76 ms mean render time, 21.9 ms p95 frame interval.
Night: 25.6 ms p95, with one 42.5 ms frame. These are local headless Chrome
measurements and do not guarantee 30 FPS on every device or every frame.

Wildlife uses a bounded cache of 80 spatial chunks, populates at most one new
chunk per frame, and shows at most 24 decorative entities including two boats.
Residential smoke is limited to eight visible chimneys. All additions are
disabled below zoom 0.7; reduced motion freezes wildlife and suppresses smoke.
See `performance-city-ambient.json` for the full measurements.

