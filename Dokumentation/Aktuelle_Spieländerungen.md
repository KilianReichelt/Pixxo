# Pixxo – aktuelle Spieländerungen

Stand: 10. Oktober 2026

## Aktuelle Korrekturen

Häute, Leder und Lederstiefel gehören zur Waren-Freischaltung der Siedlerstufe und werden bereits ab Stufe 1 im Lager angezeigt. Im Rohstofffilter erscheinen Häute, im Handwerksfilter Leder und Lederstiefel. Die bestehenden Baukosten, Produktionsketten und Hausbedürfnisse ändern sich dadurch nicht.

Rinder- und Schafgehege verwenden den gemeinsamen nativen Generator `livestockEnclosureArt` in `assets/js/pixxo_field_art.js`: 32 × 48 Quellpixel, unverändert 2 × 3 Kacheln, detaillierte Holzpfosten und Torbeschläge, strukturierter Boden, Stroh und Tränke. Rinder haben Fellflecken, Hörner, Augen, Hufe und bewegte Schwänze; Schafe strukturierte Wollkörper, Köpfe und Beine. Beide Arten besitzen sechs unterschiedliche, gecachte Gras-/Bewegungsphasen mit drei Frames pro Spielsekunde. Betriebspause, Spielpause und reduzierte Bewegung verwenden das ruhige Standbild. Bauvorschau und platzierte Gehege verwenden dieselbe detaillierte Grafik; Drehungen behalten ihre korrekte Größe. Produktionsmengen, Lager, Gehegezahl und Baukosten bleiben unverändert.

Nachprüfung der längeren Aussetzer: Mit genügend CPU-Baumaterial reproduzierte eine erfolglose Bauplanung 633 Wegsuchen über acht Bauversuche. Der langsamste Versuch blockierte 3.141 ms. Diese Suche wird nach 90 Spielsekunden erneut erlaubt. Jetzt läuft jeder Bauauftrag fortsetzbar im normalen Spieltakt, mit bis zu 96 Bauplatzprüfungen oder einer einzigen Straßenwegsuche pro Teilabschnitt und frühestens 16 ms Abstand zwischen Teilabschnitten. Der Wegsuchraum ist auf den möglichen Korridor der bisherigen maximal 36 Straßenpositionen begrenzt (einschließlich 35 diagonaler Abschnitte); manuelle Straßenplanung bleibt unbegrenzt. Im gezielten Vergleich betrug der längste CPU-Teilabschnitt 10,2 ms und die längste Wegsuche 3,1 ms. Insgesamt erfolglose Bauaufträge behalten die bisherige 90-Sekunden-Wartezeit. Laufende Aufträge sind nicht Teil des Spielstands und werden nach dem Laden bei Bedarf neu geplant.

Der dreifache Brandwarnton hatte unabhängig von der Hinweisliste sämtliche Inseln alle 250 ms auf Brände geprüft und sich alle 18 Sekunden wiederholt. Diese Wiederholung entfällt vollständig. Nur eine neue ungeschützte Brandwarnung löst den Brandton aus; geschützte Gebäude, CPU-Brände und bereits gemeldete Brände erzeugen keine erneuten Alarmtöne. Andere Spieleffekte bleiben erhalten.

Die Rechteckplatzierung gilt ausschließlich für genau 1 × 1 Kachel große Felder. Mehrkachelige Gehege verwenden wieder Einzelklick beziehungsweise Enter. Ziehen legt dort keine weiteren Gehege an. Hilfetexte unterscheiden beide Bedienungen. Die Tests verwenden echte Mausbewegungen, Einzelklicks und Tastatureingaben und prüfen weiterhin Belegung, Gelände, Reichweite, Größe und Höchstzahl.

Diagonales Kopfsteinpflaster erhält eigene, tatsächlich diagonal orientierte Steinreihen statt des bisherigen horizontalen Musters. Die Phasen der Fugen sind kachelübergreifend verankert und in neun wiederkehrenden Varianten je Verbindungsmaske gecacht. Die native Auflösung, Straßenkontur, Transportregeln und der 30-%-Steinstraßenbonus bleiben erhalten.

- Hinweise enthalten nur Brände ohne einsatzbereite, über Straßen erreichbare Feuerwehr innerhalb ihrer Reichweite. Beim Schließen der angesehenen Liste oder beim Wechsel zu Aufträgen werden Meldungen und Zähler geleert. Derselbe Brand wird nicht wiederholt; neue Brände können wieder warnen.
- Reiner Goldmangel beim Aufwerten erzeugt keinen Warnhinweis und beim Hausaufstieg keinen Fehlerton. Fehlendes Baumaterial und fehlende Voraussetzungen bleiben am Werkzeug erkennbar.
- Seitlich angrenzende Gebäude unterbrechen bestehende diagonale Straßen nicht mehr. Zwischenstraßen verhindern weiterhin Dreiecke an T-Kreuzungen.
- Transportkarren besitzen acht gecachte Ansichten mit sechs Ladungsformen. Auf Steinstraßen fahren sie 30 % schneller; gemischte Strecken und diagonale Distanzen werden abschnittsgenau berechnet, einschließlich Zeicheninterpolation.
- Dämmerung beginnt um 18 Uhr und erreicht um 21 Uhr volle Nacht. Trockenzeiten einschließlich des ersten Regenintervalls betragen 15–30 Spielminuten; Regen bleibt 6–12 Minuten lang.
- Die CPU-Feldsuche verteilt ihre Arbeit auf maximal 96 Kandidaten pro Entscheidung und setzt die Suche später fort. Vollständig erfolglose Suchen warten 60 Sekunden vor dem nächsten Versuch, damit andere Höfe weiterkommen.
- Native Scrollleisten übernehmen kantige, kontrastreiche Pixelkanten und Menüfarben. Firefox verwendet die standardisierte Farbvariante; im Hochkontrastmodus gelten Systemfarben. Es werden keine eigenen Scroll-Widgets oder neuen Bewegungen eingeführt.
- ZIP und WAV-Originale werden nicht mehr von Git verfolgt und sind ignoriert. Lokale Originaldateien bleiben erhalten. Das Spiel verwendet ausschließlich die zwölf komprimierten MP3-Dateien; die lokale ZIP wird weiterhin gebaut, aber nicht gepusht.

Geprüft in isoliertem Chrome: 296 Spielregressionen, Startmenü und Tutorial, Audio/Wetter, Brandwarnungen mit erreichbarer, pausierter und nicht angebundener Feuerwehr, Lesen/Leeren und neue Brände, CPU-Suchbudget, Steinstraßenbonus einschließlich Misch- und Diagonalstrecken, acht Karrenansichten sowie native Pixel-Scrollleisten und Hochkontrast-Fallback. Automatisierte WCAG-Prüfungen bestanden für Startmenü, Einstellungen, Credits und Bestätigung. Eine vollständige manuelle WCAG-2.2-AA-Prüfung des gesamten Canvas-Spiels ist damit nicht ersetzt.

Lokale Vergleichsmessung in der ausgebauten Testwelt mit 480 Gebäuden: maximaler Welt-Takt zuvor etwa 37,5 ms, nach der begrenzten Feldsuche etwa 5,3 ms; maximale Feldsuche zuvor 31,7 ms, danach 0,5 ms. Das ist eine isolierte Stichprobe, kein DevTools-Profil und keine Garantie für sämtliche Lag-Ursachen oder andere Hardware.

## Tageszeit und lebendige Siedlungen

Der Uhrzeit-Button in der oberen Leiste öffnet die Tageszeit-Einstellungen. Der automatische Tag/Nacht-Wechsel dauert bei normalem Spieltempo 20 Minuten pro Tag und hält bei Spielpause an. Ein Zeitsprung behält den eingestellten Tag/Nacht-Wechsel bei. Eine Uhrzeit bleibt nur fest, wenn der Wechsel ausgeschaltet ist. Die Kopplung an die lokale Systemuhr berücksichtigt die Zeitzone des Computers und funktioniert auch bei pausierter Spielwirtschaft. Einstellung und Spieluhr werden im Spielstand gespeichert.

Nachts werden Häuser und Gebäude an erkannten Fensterflächen beleuchtet; Laternen und Straßenlampen erhalten einen Lichtschein. Die Karte wird von 19 bis 22 Uhr stufenlos dunkler und von 5 bis 7 Uhr heller. Eine geglättete Kurve lässt die Dämmerung weich beginnen und enden; Fenster und Lichtscheine folgen derselben Kurve. Die Oberfläche bleibt unverändert hell.

Beim Auswählen eines Produktionsgebäudes zeigen gelbe gestrichelte Straßenlinien seine Lieferwege. Zugehörige Karren werden gelb umrandet. Die Wagen bestehen aus animierten Pixelgrafiken mit Zieher und wechseln ihre Ausrichtung passend zum Weg. Warenicons auf den Wagen entfallen. Transporte fahren mit 1,2 statt 3,2 Straßenfeldern pro Spielsekunde und laden maximal 2 t. Kleine Ladungen warten bis zu zwei Sekunden auf eine Ergänzung. Alte größere Ladungen werden beim Laden verlustfrei auf mehrere Wagen verteilt; ungültige Lieferziele werden weiterhin zu einem erreichbaren Lager umgeleitet.

Kleine Bewohner bewegen sich auf angeschlossenen Straßen rund um bewohnte Häuser. Ihre Anzahl steigt mit der Bevölkerung; die Darstellung ist auf 240 Figuren pro Insel begrenzt. Die Figuren beeinflussen weder Arbeitskräfte noch Waren und bleiben bei Spielpause stehen. Bei reduzierter Bewegung wird das Gewusel angehalten.

Jede Wohnstufe besitzt drei Hausvarianten mit unterschiedlicher Farbgebung, Schornsteinen und Fenstern. Die Form wird beim Platzieren zufällig gewählt und bei Aufstieg, Drehung und Laden beibehalten. Bestehende Häuser erhalten eine reproduzierbare Variante.

Straßenplanung und Darstellung unterstützen acht Richtungen. Diagonale Abschnitte werden direkt gebaut und gezeichnet. Wegfindung, Transporte, Lieferreichweiten und Wissensversorgung berücksichtigen ihre tatsächliche Länge. Gebäude und unbebaubare Flächen sperren diagonale Abkürzungen zwischen belegten Ecken.

## CPU-Siedler und Kontorhandel

Zwei CPU-Siedler gründen Kontore auf freien Inseln und entwickeln eigene Wohngebiete und Produktionsketten. Neue Nachbarn werden auch in bestehenden Partien auf bislang freien Inseln ergänzt. Ihre Einwohner, Finanzen, Lager und Aufträge sind von denen des Spielers getrennt. Die Bauplanung verbindet Betriebe mit einem gemeinsamen Straßennetz, bewahrt diagonale Zufahrten und Waldressourcen und priorisiert grundlegende Versorgung sowie Brandschutz. Ihre Entwicklung hängt von Gelände, Material, Geld und Versorgung ab. Größere Überschüsse verkaufen die Siedler an externe Händler; dabei werden reale Waren aus ihren Beständen abgezogen.

Ein Klick auf ein entdecktes CPU-Kontor öffnet dessen Angebote. Ein freies Schiff muss angehalten in der Nähe des Hafens liegen. Einkäufe von 1 oder 5 t werden bezahlt und direkt in freie Frachträume geladen; die Ware wird im CPU-Lager abgezogen. Zum Entladen fährt das Schiff zum eigenen Kontor zurück. Fremde Kontore stehen nicht als kostenlose Lager oder Stationen eigener Handelsrouten zur Verfügung. Entwicklung und Handelsbestände werden gespeichert.

Die Deko-Leiste bleibt begrenzt und verwendet dieselben Pfeil-Buttons wie die Gebäudeliste. Auf schmalen Displays liegt sie oberhalb der Minikarte.

## Versorgung und Wirtschaft

Grundwaren und öffentliche Dienste ermöglichen gemeinsam 60 % der Hauskapazität. Zusatzwaren und Luxusversorgung erschließen die übrigen 40 %. Fehlende Versorgung senkt die Zielbelegung; Einwohner ziehen schrittweise aus. Nur über einen Markt versorgte Einwohner verbrauchen Waren. Der Verbrauch richtet sich nach tatsächlicher Einwohnerzahl.

Neue Pflichtwaren: Schnaps für Siedler (Kartoffelhof → Brennerei), Lederstiefel für Bürger (Rinderhof → Gerberei → Schuster), Kerzen für Patrizier (Wachs der Imkerei + Tuch → Kerzenzieherei). Die Betriebe sind bereits vor dem jeweiligen Wohnhausaufstieg verfügbar. Kartoffelhöfe benötigen 16 Ackerflächen, Rinderhöfe drei Gehege.

Bürger verbrauchen pro Einwohner 50 % der bisherigen Pflichtwarenmenge. Ab Bürgerfreischaltung steigen Gebäudekosten und Goldunterhalt um 30 %, aufgerundet; Hausaufwertungen kosten ebenfalls 30 % mehr. Eine neue Partie beginnt mit 30 Brettern.

Im Finanzfenster stehen Darlehen über 1.000, 2.500 und 5.000 Gold zur Verfügung. Ein Darlehen läuft jeweils 30 Spielminuten; 10 % Gesamtzins sind in den laufenden Raten enthalten. Eine vorzeitige vollständige Rückzahlung ist möglich.

Wissensgewinn pro Minute: angeschlossene Einwohner im Forschungsradius / 5 × Wohnstufenfaktor (Siedler 1, Bürger 2, Patrizier 3). Angefangene Fünfergruppen zählen anteilig.

## Inseln und Bauflächen

Lehmvorkommen bleiben unter ihrer gesamten Grundfläche baumfrei. Die Bereinigung erfolgt beim Start und Laden auch für bestehende Gruben; angrenzende Bäume bleiben erhalten.

Gebirge besitzen abgerundete, unregelmäßige Konturen statt rechteckiger Flächen. Steinbrüche belegen genau 2 × 3 Kacheln. Freie Abbaueingänge liegen mittig an der Zufahrtskante und zeigen zur passenden Himmelsrichtung; gebaute Abbaubetriebe verdecken den separaten Eingangsmarker. Gespeicherte Bergvorkommen behalten ihre Position und Zufahrt bei der Konturanpassung.

Neue Startinseln besitzen mindestens einen Steinabbauplatz. Neue Steinbrüche und Eisenminen belegen Bergkacheln; die Zufahrtsseite bestimmt den Abbaustellensprite. Küsten bleiben unregelmäßig. Die Platzierung prüft die tatsächliche Wasserkante der Gebäudegrundfläche. Kontor, Fischerhütte und andere Küstenbetriebe ragen mit einem optischen Steg ins Wasser.

Lehm- und Bergvorkommen bleiben für ihren Abbaubetrieb frei. Gebäude auf Sand benötigen ausdrücklich Küstenplatzierung. Jede Insel besitzt höchstens zwei Fruchtbarkeiten. Spielstände mit älteren Geländeformaten behalten ihre Geländeform. Gebäudepositionen bleiben erhalten. Neue Bergabbauplätze und der garantierte Steinbruch werden mit einer neuen Partie erzeugt.

Überlappende Holzfällerradien teilen vorhandene Baumkacheln anteilig. Pausierte oder nicht angeschlossene Betriebe erhalten keinen Anteil.

## Feuerwehr und Bedienung

Die Feuerwehr schickt einen sichtbaren Löschwagen über Straßen zum Brand. Jede Wache bearbeitet einen Einsatz und fährt anschließend zurück. Ab Ankunft ist das Gebäude vor dem Abbrennen geschützt. Der grüne Balken zeigt den Löschfortschritt; nach zwölf Sekunden ist der Brand gelöscht. Ungelöschte Brände können auf Nachbargebäude übergreifen.

Zwölf Dekorationen von 1 × 1 bis 4 × 3 Kacheln kosten ausschließlich Gold. Der Iconbutton für Dekoration steht über dem Schiffbutton; beide zusammen einschließlich Abstand entsprechen der Höhe der Bauleiste. Die Objekte und neuen Produktionsgebäude verwenden die vorhandene Pixelpalette und Detailstufe. Die Schmiede besitzt einen eigenen Sprite; Rinderhöfe zeigen Rinder in ihren Gehegen.

Pausieren und Fortsetzen aktualisieren das Gebäudefenster unmittelbar. Aufträge zählen ausschließlich eigene Inseln, Gebäude, Straßen und Einwohner. CPU-Siedlungen erfüllen keine Spieleraufträge und lösen keine Belohnungen aus. Der jeweils erste offene Auftrag blockiert alle nachfolgenden Aufträge.

Aufträge zeigen einen Zähler für neue und abgeschlossene Aufträge. Ereignisse zeigen relevante Meldungen; Verschieben und andere Routineaktionen erzeugen keine Einträge. Gebäude- und Ereignistexte wurden gekürzt und geben konkrete Anweisungen. Der Umgebungsradius entfällt bei Fischerhütten. Das Tutorial ist vorerst deaktiviert.

## Name, Start und Spielstände

Pixxo ersetzt den bisherigen Namen in Spiel, Dateinamen, Kommentaren, Grafikquellen, Dokumentation, Tests und Sicherungen. Ein Pixelwortlogo, Favicon und dunkelbrauner Ladebildschirm mit Fortschrittsbalken sind enthalten. Der Ladebildschirm blendet nach dem ersten gezeichneten Frame aus.

`index.html` öffnet `pixxo.html`; `.nojekyll` ist für GitHub Pages enthalten. Die bestehende Firefox-Partie wurde beim Dateinamenswechsel einmalig lokal übertragen. Das Spielmenü bietet JSON-Export und Import; ein Import sichert die vorherige Partie. Exportiere vor einem Wechsel des Spielorts deine Partie, denn Browser behandeln die Speicherung lokaler Dateien je nach Dateipfad unterschiedlich ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)).

## Prüfung

296 Prüfungen im vollständigen Firefox-Spiel und 446 Node-Funktions- und Geländeprüfungen bestanden. Die vollständige Browserintegration prüft Versorgung, Produktionsketten, Feuerwehrfahrten, Löschfortschritt, Brandausbreitung, Darlehen, Speichern, Altspielstandsübernahme, Import, Küstenbau, Reservierung von Vorkommen, Baumanteile, Wissensgewinn, Auftragszähler und Schalterhöhe. JavaScript-Syntax und lokale ZIP werden zusätzlich geprüft. Die aktuellen Ergebnisse liegen unter `pixxo_tests`.

Die Wirtschaft wurde mit Spielwerten bei voller Produktionsauslastung modelliert; notwendige Siedler- und Bürgerarbeitskräfte werden durch zusätzliche Einwohner gedeckt. Alle drei voll versorgten Beispielstädte erzielen einen Überschuss. Die Patrizierstadt mit ausschließlich Grundversorgung erzielt ein Defizit. Transportengpässe, Handelsausgaben und Bauphasen sind in dieser Modellrechnung nicht enthalten; eine vollständige Langzeitpartie wurde nicht durchgespielt.

## Bereits vorhandene Änderungen

- Getreidehof und Brauerei belegen 5 × 4 Kacheln; beim Drehen 4 × 5. Ihre Aufbauten sind höher, um den transparenten Raum oberhalb zu verkleinern. Der Getreidehof benötigt weiterhin keine besondere Fruchtbarkeit.
- Ackerflächen zeigen im Namen ihren Mutterbetrieb, beispielsweise „Ackerfläche (Getreidehof)“.
- Lehmgrube und Ziegelei verwenden detaillierte native Pixelgrafiken mit vier Arbeitsbildern. Förderkübel, Arbeiter, Brennofen, Rauch und Ziegeltransport bewegen sich bei laufendem Betrieb. Lehm und Ziegel besitzen detailliertere Warenicons. Unbebaute Lehmvorkommen zeigen natürliche Erdschichten und feuchte Stellen.
- Tiere in Gehegen bewegen sich, wenn ihr Mutterbetrieb arbeitet. Auf dem angeschlossenen Markt laufen fünf einfache Figuren mit jeweils 2 × 7 Pixeln herum. Bei reduzierter Bewegung werden die Animationen angehalten.
- Ein separater Button im belegten Frachtraum wirft dessen gesamte Ladung über Bord. Andere Frachträume und das Inselvorratslager bleiben erhalten; die weggeworfene Ware ist verloren.
- Routenänderungen lassen sich während einer Fahrt speichern. Das Schiff erreicht sein bisheriges Ziel und folgt anschließend der geänderten Stationsliste. Wird ein anderes Schiff zugewiesen, beendet das bisherige Schiff seine laufende Fahrt mit seiner Restladung.
- Das Aufwertungswerkzeug markiert beim Ziehen einen Bereich und führt die Aufwertung erst beim Loslassen aus. Das zuerst angeklickte Objekt bestimmt die Art: Straßen, Häuser oder Kontore werden nie in derselben Auswahl gemischt. Vorschau und Kosten beziehen sich auf die aufwertbaren Objekte dieser Art. Fehlende Gesamtkosten verhindern eine teilweise Aufwertung. Einzelklick und Abbrechen funktionieren ebenfalls.
- Waren werden am Ziel unmittelbar geliefert. Anschließend blendet der Wagen während 0,45 Sekunden aus. Die verbleibende Grafik beeinflusst Warenbestände und Lieferlogik nicht.
- Die Ressourcenicons wechseln zwischen freien und bebauten Vorkommen. Der Zähler zeigt die Gesamtzahl; der Tooltip ergänzt die Zahl freier Stellen. Ressourcen ohne Vorkommen bleiben ausgeblendet.


## Prüfungen der Siedlungserweiterungen

`pixxo_tests/city_features.cjs` prüft Uhrzeitsteuerung und Speicherung, schmale Displays, die unabhängige CPU-Wirtschaft, Kontorhandel, diagonale Wegfindung, Ladungsgrenzen, Warenerhaltung, Lieferwege, Bevölkerungsdichte und alle neun Hausvarianten. Zum Ausführen wird Playwright benötigt (`node pixxo_tests/city_features.cjs`); ein außerhalb des Projekts installiertes Modul kann über `PIXXO_PLAYWRIGHT_MODULE` angegeben werden. Die Ergebnisse und Tag-/Nacht-Screenshots liegen im selben Ordner.

### CPU-Fortschritt am Spielerstand

Die stärkste eigene Siedlung gibt den Rahmen für CPU-Ausbau vor: Häuserzahl, Einwohner, höchste Wohnstufe und unterschiedliche Produktionsbetriebe bestimmen den Fortschrittswert. Zurückliegende CPUs planen alle acht Sekunden, vergleichbare alle 20 Sekunden und führende alle 45 Sekunden. Führende CPUs pausieren zusätzlichen Ausbau; Versorgung, Felder, Reparaturen und Brandschutz laufen weiter. Die Häuserzahl darf den Spielerstand nur begrenzt überschreiten; Wohnaufwertungen und anspruchsvollere Betriebe folgen der eigenen erreichten Wohnstufe. Bestehende CPU-Gebäude bleiben erhalten. Warenverkäufe bleiben unabhängig vom Bautempo auf einen Takt von 20 Sekunden begrenzt.

Zusätzliche Browserprüfung: `pixxo_tests/world_progress.cjs` prüft 30 Gelände-Seeds, 2 × 3 beim Laden, verdeckte Eingänge, die Auftragsfolge ohne CPU-Belohnungen sowie beschleunigten und gebremsten CPU-Ausbau.

### Diagonale Straßentexturen

Diagonale Erdwege verwenden dieselbe helle Erdpalette wie gerade Straßen. Diagonale Straßen zeichnen mit vier Pixeln Überstand in die freien Kachelecken; dadurch bleiben diagonale Verbindungen durchgehend texturiert. Pflasterwege nutzen ebenfalls diese Verbindungen und ein durchgehendes Fugenraster. Die Wegfindung und Baukosten bleiben unverändert. `pixxo_tests/diagonal_road_art.cjs` prüft beide Beläge an den Kachelecken und erzeugt eine Browseransicht für die Sichtprüfung.

Gebäude lassen sich nicht mehr mit R drehen. Der Drehhinweis entfällt aus dem Baumodus. Bereits gespeicherte Ausrichtungen werden weiterhin geladen.

### Menü, Audio und Regen

- Musik, Geräusche und Ambiente besitzen separate Regler mit jeweils einem An-/Aus-Button unmittelbar dahinter. Die Lautstärken bleiben beim Stummschalten erhalten; Kanalzustände werden gespeichert. Der globale Ton-Button ist entfernt.
- Audio-Labels im Spielmenü haben 30 px Mindesthöhe; Regler und Buttons bleiben mindestens 44 px hoch. „Neues Spiel“ ist rot hinterlegt. „Startmenü“ fragt vor der Rückkehr nach und speichert nach Bestätigung die Partie.
- Regenphasen dauern jetzt 6–12 Spielminuten, viermal länger als zuvor. Fünf unterschiedlich große, feste Pixel-Sprites für Pfützen werden zufällig verteilt. Sie blenden nach einer kurzen zufälligen Verzögerung über 90–180 Spielsekunden weich ein, ohne ihre Größe zu verändern, und nach Regenende unterschiedlich langsam aus. Regenrauschen verwendet ausschließlich den Ambient-Kanal.
- Der Markt zeigt nachts warme Lämpchen und Lichterketten. Seine Tagesgrafik bleibt unverändert.
- Das Lagerfenster ist bis zu 520 px breit. Über der Tabelle ersetzen die Filter „Alle“, „Rohstoffe“ und „Handwerk“ die Caption. Alle Filter berücksichtigen weiterhin die freigeschaltete Bevölkerungsstufe und sind mit der Tastatur bedienbar.
- Gebäude zeigen den Transporthinweis nur dann, wenn kein Lager in Reichweite liegt.

Geprüft mit isolierten Browserprofilen: Menübestätigung einschließlich Abbrechen, einzelne Stummschalter mit Speicherung, mobile Layouts, Lagerfilter, Regenlaufzeit, tatsächlich gezeichnete Pfützen und nächtliche Marktbeleuchtung. Die geänderten Menü- und Lagerbereiche bestehen die automatisierten WCAG-Prüfungen; eine vollständige WCAG-2.2-AA-Prüfung des vorhandenen Canvas-Spiels ist damit nicht abgedeckt.
