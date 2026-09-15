# MERVELLE GEMSTONES – Website-Prototyp

Statische, offline nutzbare B2B-Website für **MERVELLE GEMSTONES – Les trésors de la Terre**.

## Start
`index.html` im Browser öffnen. Für lokale Tests kann alternativ ein kleiner HTTP-Server im Ordner gestartet werden, z. B. `python3 -m http.server 8000`.

## Sortiment erweitern
Die Galerie ist für zusätzliche Bilder vorbereitet:

1. Neues Bild nach `assets/catalog/` legen (am besten WebP/JPG, sinnvoll komprimiert).
2. In `index.html` eine bestehende `.catalog-card` duplizieren.
3. `data-category` setzen: `perlen`, `straenge`, `rohsteine`, `geschliffen` oder `beads`.
4. `data-color` setzen: z. B. `gruen`, `blau`, `orange`, `rosa`, `schwarz`, `klar`, `mehrfarbig`.
5. `data-search` um sinnvolle Suchbegriffe ergänzen.
6. Bildpfad, Titel, Alt-Text und Modal-Daten anpassen.

Die Filter, Suche und Trefferzahl funktionieren danach automatisch.

## Kontaktformular
Die Demo sendet bewusst keine Daten an einen Server. Vor Livegang muss ein echter, DSGVO-konformer Formular-/E-Mail-Prozess angebunden und die Datenschutzerklärung entsprechend ergänzt werden.

## Rechtliches
Impressum und Datenschutz enthalten noch Platzhalter für Unternehmens-, Kontakt- und Hostingdaten. Diese müssen vor Veröffentlichung vervollständigt und auf die tatsächliche Rechtsform/technische Umsetzung geprüft werden.
