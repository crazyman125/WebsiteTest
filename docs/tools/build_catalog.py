#!/usr/bin/env python3
"""Build assets/data/catalog-data.js from assets/catalog/<category>/<color>/.

Add a JPG/PNG/WEBP image to the appropriate folder and this script will expose it
in the website automatically. An optional JSON file with the same basename can
set title, description, tags, alt, order and featured.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "assets" / "catalog"
OUT = ROOT / "assets" / "data" / "catalog-data.js"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
CATEGORY_LABELS = {
    "perlen": "Perlen & Perlenstränge",
    "straenge": "Edelstein- & Schmucksteinstränge",
    "rohsteine": "Rohsteine & Mineralien",
    "geschliffen": "Geschliffene Edel- & Farbsteine",
    "beads": "Lose Steine & Beads",
}
COLOR_LABELS = {
    "gruen": "Grün",
    "blau": "Blau",
    "orange": "Orange / Gold",
    "rosa": "Rosa / Peach",
    "schwarz": "Schwarz / Dunkel",
    "dunkel": "Schwarz / Dunkel",
    "klar": "Klar / Weiß",
    "hell": "Klar / Weiß",
    "mehrfarbig": "Mehrfarbig",
}

def humanize(stem: str) -> str:
    words = stem.replace("_", "-").split("-")
    return " ".join(w.capitalize() for w in words if w)

def load_meta(image: Path) -> dict:
    meta_path = image.with_suffix(".json")
    if not meta_path.exists():
        return {}
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Warning: could not read {meta_path}: {exc}")
        return {}

def main() -> None:
    items = []
    for image in sorted(CATALOG.rglob("*")):
        if not image.is_file() or image.suffix.lower() not in IMAGE_EXTS:
            continue
        rel = image.relative_to(CATALOG)
        parts = rel.parts
        if len(parts) < 3:
            print(f"Skipping {rel}: expected category/color/filename")
            continue
        category, color = parts[0], parts[1]
        if category not in CATEGORY_LABELS:
            print(f"Skipping {rel}: unknown category '{category}'")
            continue
        meta = load_meta(image)
        title = meta.get("title") or humanize(image.stem)
        desc = meta.get("description") or "Sortimentsbeispiel – Details und Verfügbarkeit auf Anfrage."
        tags = list(dict.fromkeys([category, color, *meta.get("tags", [])]))
        url = "assets/catalog/" + rel.as_posix()
        items.append({
            "id": rel.with_suffix("").as_posix().replace("/", "--"),
            "title": title,
            "description": desc,
            "category": category,
            "categoryLabel": CATEGORY_LABELS[category],
            "color": color,
            "colorLabel": COLOR_LABELS.get(color, humanize(color)),
            "tags": tags,
            "image": url,
            "alt": meta.get("alt") or title,
            "order": int(meta.get("order", 9999)),
            "featured": bool(meta.get("featured", False)),
        })
    items.sort(key=lambda item: (item["order"], item["title"].lower()))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("window.MERVELLE_CATALOG = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"Wrote {len(items)} products to {OUT.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
