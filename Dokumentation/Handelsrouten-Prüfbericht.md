# Handelsrouten und letzte Bedienungsänderungen

Stand: 9. Oktober 2026

Die Routenplanung verwendet eine geordnete Stationsliste mit beliebig vielen Besuchen eigener Häfen. Wiederholte Inselbesuche sind möglich, wenn die gleiche Insel nicht direkt aufeinanderfolgt. Nach der letzten Station fährt das Schiff zur ersten zurück.

Jeder Frachtraum besitzt je Station einen eigenen Entladeauftrag und einen eigenen Ladeauftrag mit jeweils 1 bis 50 t. Entladen erfolgt vor dem Laden. Nicht ausgewählte Waren bleiben im selben Frachtraum. Restladung blockiert eine andere Ware in diesem Frachtraum. Fehlende Waren oder Lagerkapazität führen wahlweise zum Warten; bereits übertragene Teilmengen werden dabei nicht erneut gebucht. Der Mindestbestand gilt für alle Quelllager der Route.

Waren werden über beschriftete Symbolfelder und ein Warenraster ausgewählt. Stationen lassen sich ergänzen, entfernen und per Tastatur erreichbaren Pfeilbuttons sortieren. Kartenverbindungen, Schiffsdialog und Flottenübersicht zeigen die gesamte Route. Bestehende Zweihafenrouten werden übernommen. Im Hafen darf eine Route auch mit Restladung beendet werden. Änderungen können auch während der Fahrt gespeichert werden: Das aktuelle Fahrtziel und der Fortschritt bleiben erhalten; danach folgt das Schiff der neuen Stationsliste.

Zusätzlich enthalten: eigene Namen für entdeckte Inseln mit Speicherung im Spielstand; Ziehen zum Scrollen in der Gebäudeliste bei weiterhin funktionierenden Klicks, Pfeiltasten und Touchscrollen; kein Abstand zwischen den Fakten besiedelter Inseln.

Automatisierte Prüfungen decken unter anderem drei Häfen mit Teilentladung und Warenwechsel, Wartezustände, Mindestbestand, Frachtraumpositionen, Pausieren, alte Routen, wiederholte Besuche, atomare Validierung, Warenwahl und Stationsbearbeitung ab. Inselnamen werden einschließlich Umlauten und Sonderzeichen geprüft, ebenso Laden alter Spielstände und das Zurücksetzen bei einer neuen Welt. Die eingebundenen Module und Inline-Skripte werden auf gültige JavaScript-Syntax geprüft.

Eine visuelle Prüfung und eine vollständige manuelle Tastatur-, Screenreader- und Reflow-Prüfung sind weiterhin offen: Der Computer-Use-Dienst liefert keine verfügbaren Browser oder Apps; die bisherige lokale Browserautomatisierung war ebenfalls blockiert. Vollständige WCAG-Konformität wurde daher nicht bestätigt. Neue Bedienelemente besitzen Beschriftungen, sichtbare Fokuszustände, mindestens 44 × 44 px große Bedienziele und Schriftgrößen ab 0,875 rem. Die Stationsmatrix wechselt auf schmalen Bildschirmen in eine gestapelte Ansicht.
