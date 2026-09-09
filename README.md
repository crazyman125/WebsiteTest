# ATELIER ÉCLAT — Schmuck-Website

## Enthalten
- `index.html` — Startseite
- `assets/styles.css` — komplettes responsive Styling
- `assets/script.js` — Scroll-/Canvas-Animation der diamantenbesetzten DNA-Kette
- `impressum.html` — Impressums-Vorlage mit Pflicht-Platzhaltern
- `datenschutz.html` — Datenschutz-Vorlage für diesen privacy-first Build
- `assets/favicon.svg` — lokales Favicon

## Lokal starten
Einfach `index.html` im Browser öffnen. Für realistischere Tests empfiehlt sich ein lokaler Webserver, z.B. `python -m http.server 8080` im Projektordner.

## Vor dem Livegang zwingend anpassen
1. Brandname `ATELIER ÉCLAT` und Ort/Claim
2. E-Mail `atelier@ihredomain.de`
3. Alle gelben Platzhalter in Impressum und Datenschutz
4. Hosting-Anbieter und tatsächliche Server-Log-Verarbeitung
5. HTTPS aktivieren
6. Falls Analytics/Ads/Instagram/Maps/Videos eingebunden werden: Consent- und Datenschutzzustand neu prüfen
7. Falls echte Onlinekäufe/Checkout hinzukommen: zusätzliche Verbraucher-, Preis-, Versand-, Widerrufs- und E-Commerce-Pflichten prüfen

## Datenschutz-Design
Der Build lädt keine Google Fonts, keine CDNs, keine externen Bilder, keine Analytics-Skripte und setzt selbst keine Cookies oder Local-Storage-Einträge.
