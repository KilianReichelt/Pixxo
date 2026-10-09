# Änderungen und Prüfungen vom 9. Oktober 2026

## Umsetzung

- Funktionierende Handelsroutenplanung mit Hafenpaar, Waren und Mengen je Richtung, Mindestbestand und Warteoption. Eingaben bleiben bei Spielaktualisierungen erhalten.
- Schiffe fahren in acht Richtungen, ohne Küstenecken diagonal zu schneiden. Ein Landziel wird auf die nächste erreichbare Wasserstelle umgesetzt.
- Neue Schiffszeichnungen in der vorhandenen Pixelpalette. Bewegung, Stillstand und Route erhalten unterschiedliche Zeichen mit Text.
- Manuelle Warenübergabe durch Warenfelder und anklickbare Frachträume. Mengenwahl 1, 10, 50 oder Maximum und gemeinsames Entladen. Restladung bleibt bei vollem Lager an Bord. Zustand, Route und Ladung sind im Schiffsfenster zusammengefasst.
- Erstkontakt mit unbekannten Inseln entfernt den Inselnebel unmittelbar. Unbesiedelte Inseln zeigen ausgeschriebene Ressourcen über der Minikarte; besiedelte Inseln verwenden wieder die bisherige Symbolreihe.
- Gezeichnete Hausanschlüsse an Straßen entfernt. Straßenverbindungen bleiben für Versorgung und Produktion wirksam.
- Neue Karten verwenden halbierte Größenparameter: Die größten Inseln entsprechen ungefähr den bisherigen kleinen. Strandzonen verwenden einen doppelten Radius an Hafenplätzen und eine breitere Höhenzone. Bestehende Spielstände behalten ihre bisherige Kartengeometrie.
- Forschungsstube: höchstens eine je Insel, ab Patrizierstufe. Baukosten: 5.000 Gold, 20 Bretter, 20 Stein, 25 Ziegel und 10 Werkzeuge; Unterhalt 20 Gold pro Minute.
- Wissen entsteht aus der Bevölkerung, die über zusammenhängende Straßen innerhalb von 30 Straßenfeldern erreichbar ist. Je 10 Einwohner entstehen 1 Wissen pro Minute. Wissen ist an die Insel gebunden. Pausierte oder nicht versorgte Forschungsstuben erzeugen keinen Fortschritt.
- 19 Forschungen in sechs Zweigen: Religion, Brandschutz, Marktversorgung, Logistik, Produktion und Wissenschaft. Voraussetzungen verbinden auch verschiedene Zweige. Forschungen verbrauchen ausschließlich Gold und Wissen; ihre Verbesserungen gelten auf der jeweiligen Insel.
- Lehmgrube und Ziegelei ergänzen die Warenkette. Die Ziegelei produziert aus zwei Lehm und einem Holz einen Ziegel. Die Kette ist auf Bürgerstufe verfügbar; der Patrizieraufstieg benötigt zusätzlich acht Ziegel.
- Straßenbau mit halbtransparenter Vorschau, berechneter zusammenhängender Strecke um Gebäude und genauer Goldanzeige. Erst Loslassen baut die angezeigten Felder. Einzelklick baut weiterhin eine Kachel. Fehlendes Gold verhindert einen Teilbau; Escape verwirft die Vorschau.
- Flächenabriss durch Ziehen eines Rechtecks: Vorschau der berührten Gebäude und Straßen, anschließend konkrete Bestätigung mit Rückerstattung und betroffener Bevölkerung. Kontore bleiben erhalten. Einzelabriss bleibt verfügbar.

Die Warenübergabe orientiert sich an der direkten Bedienung von Frachträumen in Anno. Offizielle Hinweise zu vollständigem Entladen von Frachträumen: [Anno 1800, Game Update 9](https://www.anno-union.com/updates/game-update-9/) und [Game Update 17](https://www.anno-union.com/updates/anno-1800-pc-game-update-17/).

## Automatische Prüfungen

71 Prüfungen bestanden, ausgeführt in JavaScript-VMs mit kontrollierten Spiel- und Zeichenobjekten:

- test_navigation.cjs: 21 Prüfungen für Wegsuche, Landziele, diagonale Bewegung, Entdeckung, Schiffszeichen, Routen und die bestehende Handelssimulation einschließlich voller Lager.
- test_extensions.cjs: 34 Prüfungen für Straßenreichweite des Wissens, Forschungskosten und Voraussetzungen, Pause und Abschluss, Inseltrennung, Speicherung, Baugrenze, Ziegeldefinitionen, Warenübergabe, Inselanzeige, Kartenversionen, Straßenplanung und Flächenabriss einschließlich Abbruch und bestätigtem Abriss.
- test_terrain.cjs: 16 Prüfungen. Fünf Inselgrößen von 0,14 bis 0,56 bei drei Startwerten erzeugen Land und mindestens einen baubaren Hafenplatz; beide Kartenversionen bleiben nutzbar.

Alle eingebetteten Skripte und die zwölf geladenen Spielmodule wurden gemeinsam auf JavaScript-Syntax und doppelte Deklarationen geprüft. Die VM-Prüfungen ersetzen keine echten Browserinteraktionen; einzelne Formularprüfungen untersuchen den Quellcode.

## Performance

Verbesserungen: wiederverwendbare Suchfelder, gecachte Hafenwege und Gebäudelisten, Übersichtsdarstellung für Terrain und Nebel unter Zoom 0,45, weniger Baumzeichnungen und Prüfung nur tatsächlich vorhandener Straßen.

Synthetischer Wegsuchvergleich auf 896 × 672 Wasserzellen, Strecke von (30, 30) nach (650, 470):

| Wegsuche | Drei Durchläufe |
|---|---|
| Bisherige Breitensuche | 325,2 / 321,0 / 323,1 ms |
| Neue A*-Suche | 7,1 / 5,1 / 5,1 ms |

Dieser Vergleich misst ausschließlich die Wegsuche auf freier See. Eine Bildratenmessung auf komplexen echten Spielständen steht aus. Die Rohdaten liegen in navigation_results.json, extension_results.json, terrain_results.json und navigation_performance.json.

## Offene Browserprüfungen

Browserstarts sind in dieser Ausführungsumgebung gesperrt: Playwright meldet WinError 5 beziehungsweise spawn EPERM; der direkte Chrome-Teststart schlug ebenfalls fehl. Offen bleiben deshalb visuelle Sprite- und Layoutprüfung, echte Mausinteraktionen, manuelle Tastatur- und Fokusprüfung, Zoom/Reflow, Screenreaderprüfung und browserbasierte automatische Barrierefreiheitsprüfungen. Vollständige WCAG-2.2-AA-Konformität wird nicht behauptet.

Die ergänzten Oberflächen verwenden beschriftete Bedienfelder, mindestens 44 Pixel hohe Schaltflächen, sichtbare Fokusrahmen und mindestens 0,875 rem große Texte. Die bestehende Kartenbedienung mit Maus benötigt weiterhin eine vollständige Prüfung und gegebenenfalls zusätzliche Tastaturalternativen.

## Nachtrag: Dächer, Händler, Ladungsanzeige und Depots

- Rote Ziegeldächer richten sich nach tatsächlichen Bau- oder Aufstiegskosten. Patrizierhäuser und Forschungsstube erhalten rote Dächer; Gebäude ohne Ziegelkosten verwenden Stroh, Schiefer oder ihre bestehenden anderen Dachmaterialien. Nur Dachpixel werden gewechselt; rote Waren, Flaggen und andere Details bleiben erhalten. Auch Produktionsanimationen und Größenwechsel berücksichtigen die Dachvariante.
- Der Kirchenturm überlappt das Hauptgebäude; die transparente Fuge ist geschlossen.
- Der regelmäßige Händler-NPC, sein Zeitplan, seine Darstellung und seine Kauf-/Verkaufsmaske sind entfernt. Gespeicherte NPC-Daten alter Spielstände werden nicht übernommen und nicht mehr gespeichert. Der bisherige Händlerauftrag wurde durch das Einrichten einer eigenen Handelsroute ersetzt.
- Die sichtbare Statusbeschriftung activity-label ist vollständig entfernt. Schiffsicons behalten ihre zugänglichen Beschriftungen.
- Ein bestehender Fokusfilter blockierte die Aktualisierung des Schiffsfensters nach Schaltflächenklicks. Schiffs- und Forschungsschaltflächen erlauben jetzt die Aktualisierung; Textfeldeingaben bleiben geschützt. Die vorhandene Fokus- und Scrollwiederherstellung im Schiffsfenster bleibt wirksam.
- Neues Depot ab Bürgerstufe: mehrfach baubar, jeweils +150 Tonnen Lagerkapazität je Ware auf derselben Insel. Kosten: 750 Gold, 12 Bretter und 8 Stein; Unterhalt 12 Gold pro Minute. Eigenes Sprite mit Schieferdach. Die Kapazität gilt für Produktion und manuelles sowie automatisches Entladen von Schiffen.

Aktueller Prüflauf: 21 Navigationsprüfungen und 43 Erweiterungsprüfungen bestanden. Dazu 130 Rasterprüfungen für Dachvarianten aller Gebäude und Animationsbilder, Kirchenanschluss und Übereinstimmung der eingebetteten Sprite-Daten mit den PNG-Dateien. Die gemeinsame Syntaxprüfung aller 13 geladenen Spielmodule besteht. Die bisherigen 16 Terrainprüfungen bleiben unverändert gültig; ihre erneute Ausführung wurde nach einem Zeitlimit der JavaScript-Umgebung abgebrochen.

Die Übersicht roof_sprite_review.png wurde visuell geprüft. Die Einschränkungen bei Browser-, Maus-, Tastatur- und Screenreaderprüfungen gelten weiterhin.

Die Forschungsstube ist nun bereits ab Bürgerstufe verfügbar. Ihre Baukosten bleiben unverändert: 5.000 Gold, 20 Bretter, 20 Stein, 25 Ziegel und 10 Werkzeuge. Die 43 Erweiterungsprüfungen bestehen weiterhin.

## Nachtrag: Lehmvorkommen und Navigation der Bauliste

- Lehmgruben benötigen jetzt ein festes Lehmvorkommen an Land; die Küstenbedingung entfällt. Je Insel entstehen abhängig von ihrer Größe ein bis vier mit dem Inselstartwert zufällig verteilte, voneinander getrennte Plätze. Neue Vorkommen liegen auf bebaubarem Inland.
- Lehmplätze sind auf der Karte, der Minikarte, in der Ressourcenanzeige und in der Abbauplatzliste eingebunden. Anklicken öffnet den passenden Baudialog; Bauvorschau und tatsächlicher Klick rasten auf derselben Position ein. Auch Verschieben setzt ein passendes Vorkommen voraus.
- Bestehende Gruben bleiben nutzbar. Ihre Position wird beim Laden als Lehmplatz übernommen. Zusätzliche Plätze in bestehenden Spielständen meiden Gebäude und Straßen; gespeicherte Plätze behalten ihre Position.
- Die Gebäudeliste in #items besitzt keine sichtbare Scrollleiste mehr. Pfeiltasten am linken und rechten Innenrand verschieben die Liste bei Überlauf. Pfeile ohne weitere Gebäude sind deaktiviert; bei vollständig passender Liste bleiben beide verborgen. Kategorieänderungen beginnen am Anfang, regelmäßige Aktualisierungen erhalten die Scrollposition.
- Die Liste ist auch über Pfeiltasten sowie Pos1/Ende bedienbar. Reduzierte Bewegung wird berücksichtigt. Die Pfeile haben beschriftete, mindestens 44 × 44 Pixel große Bedienflächen.
- Die sichtbaren Kartenbuttons in .maptools sind 28 × 28 Pixel groß. Ein transparent erweitertes Pseudoelement vergrößert den Klickbereich auf 44 × 44 Pixel; Abstände verhindern eine Überlappung.

95 Logikprüfungen bestanden: 21 Navigation, 43 Erweiterungen, 21 Lehmvorkommen und 10 Gebäudelisten-Navigation. Die Lehmprüfungen enthalten sechs Kombinationen echter kleiner und großer Karten mit unterschiedlichen Startwerten sowie Prüfungen bestehender Spielstände. Die gemeinsame Syntaxprüfung aller 15 Spielmodule besteht.

Browserbasierte Maus-, Layout-, Fokus-, Reflow- und Screenreaderprüfungen bleiben wegen der bereits dokumentierten gesperrten Browserstarts offen.

Die Grundproduktion der Lehmgrube beträgt nun genau 1 Tonne pro Minute bei voller Effizienz: eine Tonne je 60 Sekunden. Beschreibung und Produktionszyklus sind entsprechend angepasst.

## Nachtrag: Direkte Vorkommenssprünge und detaillierte Sprites

- Das Fenster mit der Abbauplatzliste ist entfernt. Jedes Ressourcenicon führt direkt zum nächsten freien nutzbaren Vorkommen dieser Ressource auf der angezeigten Insel. Wiederholtes Klicken springt durch die Plätze und beginnt nach dem letzten wieder am ersten. Ressourcen und Inseln behalten unabhängige Wechselpositionen.
- Icons ohne freie Vorkommen werden vollständig ausgeblendet. Überbaute, durch Straßen blockierte und nicht wieder bebaubare historische Plätze zählen nicht als frei. Unentdeckte Inseln erlauben keine Sprünge. Der gewählte Platz wird auf der Karte eingerahmt; dabei öffnet sich keine Liste.
- Die Zahlen an den kleinen Ressourcenicons stehen jetzt bei right: -10px und bottom: -8px. Die Icons bleiben 22 × 22 Pixel groß; getrennte beschriftete Schaltflächen ermöglichen Tastaturbedienung und ausreichend große Klickflächen.
- Das Depot hat einen neuen nativen Pixelentwurf mit strukturierten Steinwänden, detailliertem Dach, Tor, Nebengebäude, Ladegerät, Warenkisten, Fass und Laterne. Die Dachmaterialregel berücksichtigt weiterhin die tatsächlichen Ziegelkosten.
- Der Markt zeigt Pflaster, Brunnen, verschiedene Warenstände mit Gemüse, Fisch, Brot und Stoffen sowie Besucher und Lagerdetails.
- Sechs eigene Ackerarten: Getreide beim Bauernhof, Hopfen bei der Hopfenfarm, Wein beim Weingut, Gewürze bei der Gewürzplantage, Obst beim Obsthof und Blumen beim Blumenhof. Der gespeicherte Mutterbetrieb bestimmt das Bild. Die Zuordnung funktioniert auch auf anderen Inseln und bei bestehenden Feldern ohne eigenes Inselattribut. Bau- und Verschiebevorschau verwenden dieselbe Kultur.
- Die Feldbilder werden gecacht und passen weiterhin in ihre unveränderte Grundfläche. Produktionswerte und Speicherlogik bleiben unverändert.

Aktueller Prüflauf: 13 Prüfungen der direkten Vorkommensnavigation, 7 Prüfungen der Feldzuordnung und Vorschau sowie die bisherigen 21 Navigations-, 43 Erweiterungs- und 10 Gebäudelistenprüfungen bestanden. Zusätzlich 137 Rasterprüfungen aller Dachvarianten, Animationsbilder, des Kirchenanschlusses und der eingebetteten Grafikdaten. Die Syntaxprüfung aller 17 geladenen Module besteht; alle neuen Bilder sind im geladenen Atlas vorhanden.

updated_sprite_review.png zeigt die tatsächlichen exportierten Depot-, Markt- und Ackerbilder und wurde visuell geprüft. Die sechs Ackerbilder sind unterschiedlich. Eine echte Prüfung der neuen Bedienelemente im Browser bleibt aufgrund der dokumentierten Browserbeschränkung offen.
