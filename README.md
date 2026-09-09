# MARIAM ÉCLAT — Fine Jewelry Website Prototype

## Start
`index.html` direkt im Browser öffnen. Alle für das visuelle Demo benötigten Assets liegen lokal im Ordner `assets/`; es gibt keine externen Font-, Analyse- oder Marketing-Abhängigkeiten.

## Was neu ist
- komplettes Redesign in einer reduzierten High-Jewelry-Ästhetik (Cartier/Tiffany als allgemeine Stilrichtung, keine Kopie)
- keine Canvas-Zeichnungen mehr
- lokale fotorealistische Schmuck-Demo-Assets
- neu entwickelte, stabile Scroll-Interaktion ohne Scroll-Hijacking und ohne 3D-Canvas
- ausgewählte Kreationen + individuelle Anfertigungen
- Diamant, Smaragd, Rubin, Saphir; Gelb-/Weiß-/Roségold und Platin
- Beratung/Kontakt als primäre Conversion
- Impressum- und Datenschutzstruktur
- keine Analyse-/Marketing-Cookies und keine Drittanbieter-Embeds im Demo-Stand

## Wichtiger Bildhinweis
Die mitgelieferten Bilder sind KI-generierte Demo-Visuals und **keine echten Produktfotos**. Sie sind lokal/offline eingebunden, damit der Prototyp ohne fremde Bildserver funktioniert. Vor Livegang durch eigene oder eindeutig lizenzierte echte Schmuckfotografie ersetzen. Die vom Nutzer genannten Referenzseiten wurden nur als Art-Direction genutzt; deren Fotos wurden aus Urheberrechtsgründen nicht kopiert.

## Vor Livegang zwingend ersetzen/prüfen
1. echter Firmen-/Inhabername, Rechtsform und ladungsfähige Anschrift im Impressum
2. echte E-Mail, Telefonnummer und ggf. Atelieradresse
3. Hosting-Anbieter + AV-Vertrag + Log-Speicherdauer in Datenschutz
4. Kontaktformular-Backend und dazugehörige Datenschutzangaben
5. echte/lizenzierte Produktbilder + korrekte Material- und Steindaten
6. VSBG-Hinweis passend zu Unternehmensgröße/Teilnahmebereitschaft
7. falls Tracking/Pixel/Maps/Social Embeds hinzukommen: Consent- und Datenschutz-Setup neu prüfen

## Technischer Hinweis zur Scroll-Funktion
Die Hero-Animation verwendet ausschließlich `requestAnimationFrame`, passive Scroll-Events und CSS-Transforms. Es wird kein Canvas gezeichnet und kein Scroll-Verhalten übernommen. Statt eines `rotateY()`-Flips, bei dem ein flaches Foto bei 90° optisch verschwindet, simuliert die Bewegung räumliche Drehung über X-Skalierung, Versatz, leichte Rotation und Lichtvariation. Das verhindert das vorherige „Buggen“.
