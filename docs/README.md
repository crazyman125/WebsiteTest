# MERVELLE GEMSTONES – Website

Statische, privacy-first Website für GitHub Pages oder klassischen Webspace.

## Bilder automatisch erweitern

Der Produktkatalog wird **nicht mehr im HTML gepflegt**. Die Website liest eine automatisch erzeugte Datenliste aus `assets/data/catalog-data.js`.

Neue Bilder kommen ausschließlich in diese Struktur:

```text
assets/
└── catalog/
    ├── perlen/
    │   ├── hell/
    │   ├── rosa/
    │   ├── dunkel/
    │   └── mehrfarbig/
    ├── straenge/
    │   ├── gruen/
    │   ├── blau/
    │   ├── orange/
    │   ├── klar/
    │   └── mehrfarbig/
    ├── rohsteine/
    │   └── mehrfarbig/
    ├── geschliffen/
    │   └── mehrfarbig/
    └── beads/
        ├── gruen/
        ├── blau/
        ├── orange/
        ├── rosa/
        ├── schwarz/
        ├── klar/
        └── mehrfarbig/
```

### So fügst du künftig ein Bild hinzu

1. Bild in den passenden Ordner legen, z. B. `assets/catalog/straenge/blau/lapislazuli-rund.webp`.
2. Einen möglichst sprechenden Dateinamen benutzen. Bindestriche werden automatisch in einen lesbaren Titel umgewandelt.
3. Änderungen zu GitHub pushen. Der enthaltene GitHub-Pages-Workflow erzeugt den Katalog automatisch neu.

### Optional: exakte Produktdaten ergänzen

Lege neben das Bild eine JSON-Datei mit demselben Namen, z. B.:

```text
lapislazuli-rund.webp
lapislazuli-rund.json
```

Beispielinhalt:

```json
{
  "title": "Lapislazuli-Stränge, rund",
  "description": "Polierte Lapislazuli-Kugelstränge in verschiedenen Größen.",
  "tags": ["lapislazuli", "blau", "kugel", "strang"],
  "order": 25,
  "featured": false
}
```

Ohne JSON-Datei funktioniert das Bild ebenfalls. Kategorie und Farbe werden direkt aus dem Ordnerpfad abgeleitet.

## Lokal aktualisieren

Wenn du die Website lokal bearbeitest, nach neuen Bildern einmal ausführen:

```bash
python tools/build_catalog.py
```

Danach `index.html` öffnen.

## GitHub Pages automatisch aktualisieren

Die Datei `.github/workflows/deploy-pages.yml` baut bei jedem Push auf `main` oder `master` den Bildkatalog neu und veröffentlicht die Website. In GitHub unter **Settings → Pages → Build and deployment** muss als Source **GitHub Actions** ausgewählt sein.

## Wichtige Dateien

- `index.html` – Hauptseite
- `assets/styles.css` – komplettes Layout
- `assets/script.js` – Filter, Produktdialog, Scroll-Story und Formularlogik
- `assets/data/catalog-data.js` – automatisch erzeugte Katalogdaten
- `tools/build_catalog.py` – scannt die Bildordner
- `impressum.html`, `datenschutz.html` – rechtliche Platzhalter vor Livegang mit echten Firmendaten vervollständigen

## Empfohlene Bildgrößen

Für eine saubere Darstellung im Grid:

- bevorzugt JPG oder WEBP
- mindestens ca. 1400 px an der langen Kante
- Produkt möglichst mittig fotografieren
- Hoch- und Querformat sind erlaubt; die Karten schneiden in der Übersicht kontrolliert zu, im Detaildialog wird das komplette Bild angezeigt

## Code selbst bearbeiten

Für spätere eigene Änderungen gibt es jetzt eine ausführliche technische Dokumentation:

**`CODE-DOKUMENTATION.md`**

Dort sind Aufbau, Header/Logo-Größe, Farben, Hero, Produktfilter, Scroll-Story, Formular, Bildordner, JSON-Metadaten und GitHub-Pages-Deployment erklärt.

Die wichtigsten visuellen Einstellungen liegen bewusst gebündelt am Ende von `assets/styles.css` im Abschnitt **MERVELLE CUSTOMIZATION BLOCK**.
