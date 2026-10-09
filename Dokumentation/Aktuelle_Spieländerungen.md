# Pixxo – aktuelle Spieländerungen

Stand: 9. Oktober 2026

## Versorgung und Wirtschaft

Grundwaren und öffentliche Dienste ermöglichen gemeinsam 60 % der Hauskapazität. Zusatzwaren und Luxusversorgung erschließen die übrigen 40 %. Fehlende Versorgung senkt die Zielbelegung; Einwohner ziehen schrittweise aus. Nur über einen Markt versorgte Einwohner verbrauchen Waren. Der Verbrauch richtet sich nach tatsächlicher Einwohnerzahl.

Neue Pflichtwaren: Kartoffelschnaps für Siedler (Kartoffelhof → Brennerei), Lederstiefel für Bürger (Rinderhof → Gerberei → Schuster), Kerzen für Patrizier (Wachs der Imkerei + Tuch → Kerzenzieherei). Die Betriebe sind bereits vor dem jeweiligen Wohnhausaufstieg verfügbar. Kartoffelhöfe benötigen 16 Ackerflächen, Rinderhöfe drei Gehege.

Bürger verbrauchen pro Einwohner 50 % der bisherigen Pflichtwarenmenge. Ab Bürgerfreischaltung steigen Gebäudekosten und Goldunterhalt um 30 %, aufgerundet; Hausaufwertungen kosten ebenfalls 30 % mehr. Eine neue Partie beginnt mit 30 Brettern.

Im Finanzfenster stehen Darlehen über 1.000, 2.500 und 5.000 Gold zur Verfügung. Ein Darlehen läuft jeweils 30 Spielminuten; 10 % Gesamtzins sind in den laufenden Raten enthalten. Eine vorzeitige vollständige Rückzahlung ist möglich.

Wissensgewinn pro Minute: angeschlossene Einwohner im Forschungsradius / 5 × Wohnstufenfaktor (Siedler 1, Bürger 2, Patrizier 3). Angefangene Fünfergruppen zählen anteilig.

## Inseln und Bauflächen

Neue Startinseln besitzen mindestens einen Steinabbauplatz. Neue Steinbrüche und Eisenminen belegen Bergkacheln; die Zufahrtsseite bestimmt den Abbaustellensprite. Küsten bleiben unregelmäßig. Die Platzierung prüft die tatsächliche Wasserkante der Gebäudegrundfläche. Kontor, Fischerhütte und andere Küstenbetriebe ragen mit einem optischen Steg ins Wasser.

Lehm- und Bergvorkommen bleiben für ihren Abbaubetrieb frei. Gebäude auf Sand benötigen ausdrücklich Küstenplatzierung. Jede Insel besitzt höchstens zwei Fruchtbarkeiten. Bestehende Spielstände behalten ihre Geländeform und Gebäudepositionen. Neue Bergabbauplätze und der garantierte Steinbruch werden mit einer neuen Partie erzeugt.

Überlappende Holzfällerradien teilen vorhandene Baumkacheln anteilig. Pausierte oder nicht angeschlossene Betriebe erhalten keinen Anteil.

## Feuerwehr und Bedienung

Die Feuerwehr schickt einen sichtbaren Löschwagen über Straßen zum Brand. Jede Wache bearbeitet einen Einsatz und fährt anschließend zurück. Ab Ankunft ist das Gebäude vor dem Abbrennen geschützt. Der grüne Balken zeigt den Löschfortschritt; nach zwölf Sekunden ist der Brand gelöscht. Ungelöschte Brände können auf Nachbargebäude übergreifen.

Zwölf Dekorationen von 1 × 1 bis 4 × 3 Kacheln kosten ausschließlich Gold. Der Iconbutton für Dekoration steht über dem Schiffbutton; beide zusammen einschließlich Abstand entsprechen der Höhe der Bauleiste. Die Objekte und neuen Produktionsgebäude verwenden die vorhandene Pixelpalette und Detailstufe. Die Schmiede besitzt einen eigenen Sprite; Rinderhöfe zeigen Rinder in ihren Gehegen.

Pausieren und Fortsetzen aktualisieren das Gebäudefenster unmittelbar. Aufträge zeigen einen Zähler für neue und abgeschlossene Aufträge. Ereignisse zeigen relevante Meldungen; Verschieben und andere Routineaktionen erzeugen keine Einträge. Gebäude- und Ereignistexte wurden gekürzt und geben konkrete Anweisungen. Der Umgebungsradius entfällt bei Fischerhütten. Das Tutorial ist vorerst deaktiviert.

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

