#!/usr/bin/env python3
"""
MERVELLE GEMSTONES – KATALOG-GENERATOR
===============================================================================
Dieses Script baut aus der Bild-Ordnerstruktur automatisch die Datei
assets/data/catalog-data.js, die anschließend von assets/script.js gelesen wird.

ORDNERPRINZIP
-------------
assets/catalog/<kategorie>/<farbe>/<dateiname>.webp

Beispiel:
assets/catalog/straenge/blau/lapislazuli-rund.webp

OPTIONALE METADATEN
-------------------
Neben einem Bild darf eine JSON-Datei mit exakt demselben Dateinamen liegen:
assets/catalog/straenge/blau/lapislazuli-rund.json

Beispielinhalt:
{
  "title": "Lapislazuli – Rundstrang",
  "description": "Beispielbeschreibung",
  "alt": "Blauer Lapislazuli-Strang",
  "tags": ["lapislazuli", "blau", "rund"],
  "order": 10,
  "featured": true
}

WICHTIG FÜR SPÄTERE ÄNDERUNGEN
------------------------------
- Neue Kategorie?      CATEGORY_LABELS ergänzen.
- Neue Farbe?          COLOR_LABELS ergänzen (optional; ohne Eintrag wird der
                       Ordnername automatisch lesbar gemacht).
- Neues Bildformat?    IMAGE_EXTS ergänzen.
- Nach neuen Bildern:  python tools/build_catalog.py ausführen.

Die generierte Datei assets/data/catalog-data.js sollte NICHT von Hand gepflegt
werden, weil sie beim nächsten Build überschrieben wird.
"""

from __future__ import annotations

import json
from pathlib import Path


# ----------------------------------------------------------------------------
# DATEIPFADE
# ----------------------------------------------------------------------------

# Projektwurzel = ein Ordner oberhalb von /tools.
ROOT = Path(__file__).resolve().parents[1]

# Hier liegen alle dynamischen Produktbilder.
CATALOG = ROOT / "assets" / "catalog"

# Diese JavaScript-Datei wird vom Browser geladen.
OUT = ROOT / "assets" / "data" / "catalog-data.js"


# ----------------------------------------------------------------------------
# KONFIGURATION
# ----------------------------------------------------------------------------

# EDIT: Weitere unterstützte Bildformate bei Bedarf hier ergänzen.
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}

# EDIT: Schlüssel = Ordnername, Wert = sichtbarer Text auf der Website.
CATEGORY_LABELS = {
    "perlen": "Perlen & Perlenstränge",
    "straenge": "Edelstein- & Schmucksteinstränge",
    "rohsteine": "Rohsteine & Mineralien",
    "geschliffen": "Geschliffene Edel- & Farbsteine",
    "beads": "Lose Steine & Beads",
}

# EDIT: Sichtbare Bezeichnungen der Farb-Unterordner.
# Fehlt ein Eintrag, wird der Ordnername automatisch über humanize() lesbar.
COLOR_LABELS = {
    "gruen": "Grün",
    "blau": "Blau",
    "orange": "Orange / Gold",
    "rosa": "Rosa / Peach",
    "schwarz": "Schwarz",
    "dunkel": "Dunkel / Anthrazit",
    "klar": "Klar / Weiß",
    "hell": "Hell / Creme",
    "mehrfarbig": "Mehrfarbig",
}


# ----------------------------------------------------------------------------
# HILFSFUNKTIONEN
# ----------------------------------------------------------------------------

def humanize(stem: str) -> str:
    """Macht aus einem Dateinamen einen einfachen lesbaren Titel.

    Beispiel:
    "lapislazuli-rund" -> "Lapislazuli Rund"

    Für fachlich exakte Produktnamen besser eine optionale JSON-Datei verwenden.
    """
    words = stem.replace("_", "-").split("-")
    return " ".join(word.capitalize() for word in words if word)


def load_meta(image: Path) -> dict:
    """Liest die optionale JSON-Datei neben einem Produktbild.

    Existiert keine JSON-Datei, wird ein leeres dict zurückgegeben und der
    Generator verwendet automatische Standardwerte.
    """
    meta_path = image.with_suffix(".json")

    if not meta_path.exists():
        return {}

    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception as exc:
        # Fehlerhafte Metadaten sollen nicht den gesamten Katalog-Build stoppen.
        print(f"Warning: could not read {meta_path}: {exc}")
        return {}


# ----------------------------------------------------------------------------
# HAUPTLOGIK
# ----------------------------------------------------------------------------

def main() -> None:
    """Durchsucht alle Katalogordner und erzeugt die Browser-Datenstruktur."""

    items: list[dict] = []

    # rglob("*") durchsucht rekursiv alle Kategorie-/Farb-Unterordner.
    for image in sorted(CATALOG.rglob("*")):
        # Nur echte Dateien mit erlaubter Bild-Endung berücksichtigen.
        if not image.is_file() or image.suffix.lower() not in IMAGE_EXTS:
            continue

        # Beispiel rel.parts:
        # ("straenge", "blau", "lapislazuli.webp")
        rel = image.relative_to(CATALOG)
        parts = rel.parts

        # Die Website erwartet mindestens Kategorie / Farbe / Datei.
        if len(parts) < 3:
            print(f"Skipping {rel}: expected category/color/filename")
            continue

        category, color = parts[0], parts[1]

        # Unbekannte Kategorien bewusst überspringen, damit Tippfehler auffallen.
        if category not in CATEGORY_LABELS:
            print(f"Skipping {rel}: unknown category '{category}'")
            continue

        # Optionale Produktmetadaten laden.
        meta = load_meta(image)

        # Fallback-Werte, falls keine JSON-Datei vorhanden ist.
        title = meta.get("title") or humanize(image.stem)
        description = (
            meta.get("description")
            or "Sortimentsbeispiel – Details und Verfügbarkeit auf Anfrage."
        )

        # Tags enthalten automatisch Kategorie + Farbe und optional eigene Tags.
        # dict.fromkeys entfernt Dubletten und erhält die Reihenfolge.
        tags = list(dict.fromkeys([
            category,
            color,
            *meta.get("tags", []),
        ]))

        # Browser-Pfad relativ zur Website.
        image_url = "assets/catalog/" + rel.as_posix()

        # Eine Produktkarte als Datenobjekt vorbereiten.
        items.append({
            # ID bleibt stabil, solange der Dateipfad gleich bleibt.
            "id": rel.with_suffix("").as_posix().replace("/", "--"),
            "title": title,
            "description": description,
            "category": category,
            "categoryLabel": CATEGORY_LABELS[category],
            "color": color,
            "colorLabel": COLOR_LABELS.get(color, humanize(color)),
            "tags": tags,
            "image": image_url,
            "alt": meta.get("alt") or title,
            "order": int(meta.get("order", 9999)),
            "featured": bool(meta.get("featured", False)),
        })

    # Zuerst nach optionaler Reihenfolge, danach alphabetisch sortieren.
    items.sort(key=lambda item: (item["order"], item["title"].lower()))

    # Zielordner sicherstellen.
    OUT.parent.mkdir(parents=True, exist_ok=True)

    # Kommentar wird mitgeneriert, damit klar ist, dass diese Datei automatisch
    # erstellt wurde und nicht manuell gepflegt werden sollte.
    generated = (
        "// AUTOMATISCH GENERIERT durch tools/build_catalog.py – nicht von Hand ändern.\n"
        "window.MERVELLE_CATALOG = "
        + json.dumps(items, ensure_ascii=False, indent=2)
        + ";\n"
    )

    OUT.write_text(generated, encoding="utf-8")
    print(f"Wrote {len(items)} products to {OUT.relative_to(ROOT)}")


# Python-Standardmuster: main() nur ausführen, wenn Script direkt gestartet wird.
if __name__ == "__main__":
    main()
