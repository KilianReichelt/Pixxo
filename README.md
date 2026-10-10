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

Bei jedem Laden erscheint das Startmenü mit „Spiel fortsetzen“ (bei vorhandener Partie), „Neues Spiel“, „Einstellungen“ und „Credits“. Die Welt läuft erst nach der Auswahl einer Partie; beim Öffnen des Startmenüs im Spiel pausiert sie.

Neue Partien starten mit einer Einführung in 15 Schritten. Die jeweiligen Bedienelemente werden hervorgehoben. Zurück, Weiter, Einklappen und Überspringen sind jederzeit verfügbar. Die Einführung kann im Spielmenü oder in den Einstellungen erneut gestartet werden.

Die Hintergrundmusik verwendet zwölf MP3-Dateien (192 kbit/s) in `assets/music/compressed`. Die WAV-Originale in `assets/music` bleiben als lokale Sicherung erhalten und gehören nicht in ZIP oder Hosting. Musik und Geräusche haben unabhängige Lautstärken. Das Spiel versucht sofort beim Laden die Musik zu starten; blockiert der Browser hörbares Autoplay, beginnt sie bei der ersten Eingabe. Verdeckte Tabs pausieren die Musik. Credits: Spiel von Kilian Reichelt; BGM: Open World Field BGM Series Vol.01 — Vacuous BGM, [Quelle](https://vacuous2409.itch.io/open-world-field-bgm-series-vol01).

Tutorial-Texte bearbeiten: `assets/js/pixxo_start.js`, Liste `TOUR_STEPS`, Felder `title` und `text`. Während der gesamten Einführung bleibt die Simulation pausiert; nach Abschluss oder Überspringen wird das vorherige bzw. gewählte Tempo wiederhergestellt. Die Kachelmarkierung erscheint nur bei Tastatursteuerung und verschwindet bei Maus-/Touch-Eingaben sowie nach dem Tutorial. Nebel und Kartenränder folgen der Nachtfärbung, ohne die Aufdeckung zu verändern.

Die kompakten Einstellungen benötigen bei normaler Textgröße auch auf 320 × 568 Pixeln kein Scrollen. Aus dem laufenden Spiel führen „Spiel fortsetzen“ und Escape direkt zurück in die Partie; aus dem Startmenü führt der untere Button zurück dorthin. Bei starker Textvergrößerung oder besonders geringer Fensterhöhe bleibt vertikales Scrollen für die Zugänglichkeit möglich.

Musik neu komprimieren: `python scripts/compress_music.py --ffmpeg PFAD_ZU_FFMPEG`. Optional kann das Werkzeug `imageio-ffmpeg` verwenden. MP3-Kompression ist verlustbehaftet; die Originale werden nicht verändert. Für GitHub Pages nur die tatsächlich geladenen Spieldateien veröffentlichen, insbesondere `assets/music/compressed` statt der WAV-Originale; die relativen Musikpfade funktionieren auch unter einem Repository-Unterpfad.

Der Menühintergrund verwendet `assets/start-world.png`: eine Aufnahme einer regulär entwickelten Beispielpartie mit dem echten Spielrenderer. `pixxo_tests/generate_start_world.py` und `build_showcase.js` reproduzieren die Entwicklung über normale Bau-, Produktions- und Aufstiegsfunktionen. Die Kamerafahrt lässt sich unter Einstellungen → Spiel deaktivieren; reduzierte Bewegung des Betriebssystems wird respektiert. Es gibt keinen separaten „Hintergrund anhalten“-Button.

Betriebsflächen mit genau 1 × 1 Kachel lassen sich einzeln anklicken oder als Rechteck ziehen. Mehrkachelige Gehege werden ausschließlich einzeln per Klick beziehungsweise Enter platziert. Nur zulässige Positionen werden angelegt; Betriebszuordnung, Gelände, Belegung, Reichweite und Flächenlimit werden für jedes Feld geprüft. Die Rechteckvorschau zeigt erlaubte Felder mit einzelnen Umrissen und zählt übersprungene Positionen. Bei 1 × 1 Feldern setzt Enter per Tastatur Start und Ziel; Escape bricht ab.

Brandtöne sind an neue ungeschützte Brandwarnungen gekoppelt; die frühere Wiederholung alle 18 Sekunden für beliebige Brände auf allen Inseln entfällt. Die CPU-Bauplanung verarbeitet bis zu 96 Bauplätze oder einen begrenzten Straßenweg pro Teilabschnitt, setzt laufende Aufträge im Spieltakt fort und prüft keine Straßen außerhalb des möglichen Korridors der bisherigen maximal 36 Straßenpositionen. Diagonale Steinstraßen besitzen richtungsabhängige Pflasterreihen mit einer kachelübergreifenden, gecachten Musterphase.

Die aktuellen Regeln und Prüfungen stehen in [Aktuelle Spieländerungen](Dokumentation/Aktuelle_Spieländerungen.md).

Hausvarianten und Drehungen behalten die native Quellauflösung der Originalgrafiken. `assets/js/pixxo_house_variants.js` erzeugt die Varianten ohne erneute Verkleinerung. Die Landschaft verwendet `assets/js/pixxo_landscape_variants.js`: vier Baumformen (einschließlich Birke und Eiche) mit acht kräftigeren Farbtönen, nativen Blatttexturen und kleinen Blumen in unregelmäßigen Wiesenflecken. Alle Varianten sind positions- und seedabhängig, gecacht und rein visuell; Ressourcen, Bauplätze und Spielstände bleiben unverändert.

Lager-Spaltenbreiten ändern: `assets/css/pixxo_start.css`, Abschnitt „Lager-Spaltenbreiten“. `--store-icon-width` steuert das Symbol, `--store-name-width` den Warennamen, `--store-stock-width` den Lagerbestand und `--store-balance-width` die Bilanz. Die letzte Spalte füllt mit `auto` den übrigen Platz. Spaltenüberschriften sind zentriert. Das Spielmenü verwendet kompakte Aktionsgruppen und direkt sichtbare Audiozeilen; Zoomauswahl, Steuerungs-Dropdown und letzte Meldungen sind entfernt. Schriftgrößen und Bedienflächen bleiben zugänglich.

Das Lager zeigt Waren bis zur höchsten dauerhaft freigeschalteten Bevölkerungsstufe. Zuordnung und detaillierte 32-Pixel-Waren-/Deko-Icons: `assets/js/pixxo_goods_presentation.js`. Häute und Leder unterscheiden sich zusätzlich in ihrer Form. Der Deko-Schalter zeigt in der Deko-Ansicht das Gebäude-Icon als Rückkehrziel.

Hausbelegung ohne Luxus: Siedler 6 Plätze (1 je Bedürfnis), Bürger 10 (1 je Bedürfnis), Patrizier 16 (2 je Bedürfnis). Pflichtwaren, zusätzliche Versorgung und Dienste zählen jeweils einmal; Luxus beeinflusst weiterhin seine bestehenden Boni, aber nicht die Bewohnerzahl. Ein-/Auszug erfolgt in ganzen Personen, alte Bruchzahlen werden beim Laden normalisiert. Berechnung: `assets/js/pixxo.js`, `pixxoHouseNeeds` und `pixxoHousePopulationStep`.

Die Musik wird bei jedem Laden zufällig gemischt; alle zwölf Titel kommen pro Runde einmal vor. Der erste Titel unterscheidet sich vom zuvor zuletzt gewählten Titel, auch am Rundenwechsel. Ein neues Spiel mischt erneut. Straßen verbinden diagonale Nachbarn nur, wenn auf beiden Zwischenkacheln keine Straße und kein unbebaubares Gelände liegt; seitlich angrenzende Gebäude trennen eine bestehende Diagonalverbindung nicht; Zeichnung, Transport und Fußgänger nutzen dieselbe Regel. Fußgänger bleiben 2 × 8 Pixel groß; nur die untersten zwei Reihen wechseln beim Gehen.

Felsmassive erhalten in `assets/js/pixxo_mountain_terraces.js` nach innen versetzte Konturen mit zwei Kacheln Abstand je Stufe. Breitere Regionen bilden höhere Gipfel, ohne Gelände- oder Abbaudaten zu ändern. `assets/js/pixxo_kontor_flag.js` animiert ausschließlich das Flaggtuch des Kontors; Pause und reduzierte Bewegung lassen es stillstehen.

Wetterbasis: `assets/js/pixxo_weather.js`, `WEATHER_RULES` für Häufigkeit und Dauer. Der erste Regen und weitere Trockenpausen liegen bei 15–30 Minuten Simulationszeit; Regen dauert jetzt 6–12 Minuten (vierfache Dauer). Regenrauschen folgt dem separaten Ambient-Regler, ist unabhängig von Musik und Spieleffekten und pausiert bei verdecktem Tab, Spielpause, Startmenü oder Tutorial. Zufällige kleine/große Pfützen entstehen nur auf freiem flachem Land, sind kontrastreicher und auch bei weiter herausgezoomter Karte sichtbar und trocknen innerhalb von 75–300 Sekunden unterschiedlich schnell. Wetterzustand und Pfützenereignisse werden gespeichert. Gewitter sind als zukünftiger Ereignistyp vorbereitet, aber noch nicht aktiviert. Reduzierte Bewegung unterdrückt fallende Regentropfen; Wirtschaft und Spielregeln bleiben vom Wetter unberührt.

Musik, Geräusche und Ambiente besitzen jeweils einen eigenen Lautstärkeregler und direkt dahinter einen An-/Aus-Button. Stummschalten erhält die eingestellte Lautstärke; alle drei Kanalzustände werden gespeichert. Der globale Ton-Button entfällt. Die Audio-Labels im Spielmenü haben 30 px Mindesthöhe, die Regler und Buttons bleiben mindestens 44 px hoch.

Pfützen verwenden fünf feste, unterschiedlich große Pixel-Sprites (9 × 5 bis 37 × 15 Pixel) in `PUDDLE_SHAPES`. Position und Variante werden pro Regenereignis zufällig, aber reproduzierbar gewählt. Jede Pfütze blendet nach einer zufälligen Verzögerung von bis zu 45 Sekunden über 90–180 Spielsekunden weich ein. Die Sprite-Größe bleibt dabei unverändert; nach Regenende blendet die Pfütze langsam aus.

Transportkarren: `assets/js/pixxo_streetlife.js`, `wagonSprite`. Native 40 × 40 Pixel werden auf die unveränderte Spielgröße von 20 × 20 Pixeln gezeichnet. Holzplanken, Eisenbeschläge, Radnaben, Deichsel und Zugfigur sind detaillierter. Ladungen unterscheiden sich als Holz, Steine/Erz, Säcke, Fässer oder Kisten; ein leerer Wagen bleibt ebenfalls darstellbar. Alle acht Fahrtrichtungen und zwei Laufphasen werden gecacht. Auf Steinstraßen fahren Karren abschnittsgenau 30 % schneller, auch diagonal. Warenmengen, Fahrwege und Ausblendung bleiben unverändert; reduzierte Bewegung unterdrückt die Laufphasen weiterhin.

Das Lagerfenster ist bis zu 520 px breit und bleibt auf kleinen Displays innerhalb des Bildschirms. Die Tabellenbeschriftung entfällt; „Alle“, „Rohstoffe“ und „Handwerk“ filtern die bereits freigeschalteten Waren. Zurück zum Startmenü erfordert eine Bestätigung und speichert die Partie. „Neues Spiel“ im Spielmenü ist rot hinterlegt. Gebäude melden ihre Transportreichweite nur noch, wenn kein Lager erreichbar ist. Der Markt erhält nachts warme Lämpchen und Lichterketten, ohne die ursprüngliche Tagesgrafik zu verändern.
