# MARIAM ÉCLAT — Website-Prototyp

Offline-fähiger Frontend-Prototyp für eine Fine-Jewelry-Website.

## Start

`index.html` im Browser öffnen.

Falls ein Browser lokale JavaScript-/Bilddateien restriktiv behandelt, den Ordner über einen kleinen lokalen Webserver öffnen, z. B.:

```bash
python -m http.server 8080
```

und anschließend `http://localhost:8080` aufrufen.

## Neue Hero-Mechanik

Der Hero nutzt eine Apple-artige scrollgebundene Produktsequenz:

- 96 lokal gespeicherte WebP-Frames unter `assets/sequence/`
- Start als extreme Makroansicht eines Diamanten
- Scrollposition steuert direkt die Bildsequenz
- kontinuierliche Kamerafahrt / Herauszoomen bis zur Gesamtansicht der Kette
- kein `rotateY`, kein horizontales Stauchen, kein Scroll-Hijacking
- Sticky Scene über mehrere Viewport-Höhen
- Haupttext blendet erst ein, wenn die Kette weitgehend vollständig sichtbar ist
- `prefers-reduced-motion` erhält eine statische, zugängliche Fallback-Version

## Datenschutz

Die Demo lädt keine externen Fonts, Tracker, Marketing-Pixel oder Drittanbieter-Embeds. Das Kontaktformular überträgt in diesem Prototyp keine Daten an einen Server.

Vor einem Livegang müssen Impressum, Kontaktdaten, Hosting-/Datenschutzangaben und die final tatsächlich eingesetzten Tools/Services geprüft und angepasst werden.
