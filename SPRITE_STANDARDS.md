# Verbindlicher Pixelart-Standard

Diese Regeln gelten für alle neuen und überarbeiteten Sprites. Sie sind vor jeder
Grafikänderung zu lesen und durch Browser-Tests zu prüfen.

- Eine Weltkachel entspricht **16 × 16 nativen Grafikpixeln**. Kein doppeltes oder
  höher aufgelöstes Zeichenraster, das anschließend für mehr Details verkleinert wird.
- Aristokraten-Wohnhäuser: **48 × 48 Pixel** für die 3 × 3 Kacheln. Keine
  gestreckten Fassaden, Grundplatten oder großen transparenten Ränder.
- Andere Gebäude: höchstens 16 native Pixel je Kachel; zusätzliche Höhe nur für
  tatsächlich über die Grundfläche ragende Architektur. Großprojekte richten
  sich nach ihrer tatsächlichen größeren Grundfläche, nicht nach dem Hausraster.
- **Alle Waren-Icons: höchstens 16 × 16 Pixel**, einschließlich Transparenzrand.
  Der logische Sprite darf ebenfalls nicht größer sein. UI-Vergrößerung erfolgt
  ausschließlich mit `image-rendering: pixelated`; sie erhöht nicht die Quelldetails.
- Einheitliche Konturen, zwei bis drei Farbstufen je Material, wenige klare
  Glanzpunkte, erkennbare Silhouetten. Häute sind unregelmäßige Felle; Leder ist
  verarbeitetes, gefaltetes Material. Keine Glättung, weichen Verlaufskanten oder
  subpixeligen Linien an Architektur und Waren.
- Fenster als vollständige Paneele darstellen und für die Nachtbeleuchtung mit
  `_nightWindows` am nativen Canvas markieren. Keine zufälligen einzelnen
  Fassadenpixel beleuchten. Fensterrahmen und Sprossen bleiben erhalten.
- Weltgebäude dürfen die vorhandenen begrenzten Animationsframes nutzen.
  **Gebäudevorschauen in Fenstern verwenden immer Frame 0.**
- Neue Waren-Icons ausschließlich über `publishPixel` registrieren. Die zentrale
  Prüfung in `pixxo_native_civic_art.js` verweigert übergroße Waren-Sprites.
- Jede Änderung braucht eine vergrößerte Sprite-Übersicht, Prüfung aller
  Richtungen, Nachtansichten und den Rastertest. Auch reduzierte Bewegung prüfen.

Die externen Referenzen wurden nur zur Stilorientierung angesehen; keine Assets
wurden übernommen: [Hypnobius: Medieval Village Exterior](https://hypnobius.itch.io/medieval-village-exterior-tileset)
und [Mudassir Khan: Stone Village & Inn](https://mudassirkhan35.artstation.com/projects/3EJ6zo).
