/*
  MERVELLE GEMSTONES – FRONTEND JAVASCRIPT
  ============================================================================
  Diese Datei steuert alle interaktiven Funktionen der Website:

  1. Sticky Header / Logo-Zustand beim Scrollen
  2. Mobile Navigation
  3. Dynamischer Produktkatalog + Filter + Suche + Sortierung
  4. Produkt-Modal
  5. Scroll-Story im Bereich "Individuelle Beschaffung"
  6. Offline-Demo des Anfrageformulars

  WICHTIG:
  Die Produktdaten werden NICHT hier von Hand eingetragen. Sie kommen aus
  assets/data/catalog-data.js. Diese Datei wird automatisch durch
  tools/build_catalog.py aus der Ordnerstruktur unter assets/catalog erzeugt.

  Tipp: Suche in dieser Datei nach "EDIT:" für die wichtigsten Anpassungen.
*/

(() => {
  'use strict';

  /* ------------------------------------------------------------------------
     HELPER
     Kleine Kurzfunktionen, damit der restliche Code lesbarer bleibt.
     ------------------------------------------------------------------------ */

  // qs = erstes passendes Element finden.
  const qs = (selector, root = document) => root.querySelector(selector);

  // qsa = alle passenden Elemente als echtes Array zurückgeben.
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Text für die Suche vereinheitlichen: klein schreiben und Akzente entfernen.
  const normalize = value => (value || '')
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');


  /* ------------------------------------------------------------------------
     E-MAIL / MAILTO
     ------------------------------------------------------------------------
     EDIT: Hier später EINMAL die echte Kontaktadresse eintragen.
     Beispiel: const CONTACT_EMAIL = 'info@mervelle-gemstones.de';

     Solange der Wert leer bleibt, öffnet sich das Mailprogramm trotzdem,
     nur ohne bereits eingetragenen Empfänger.
     ------------------------------------------------------------------------ */

  const CONTACT_EMAIL = '';

  const buildMailto = (subject, body) => {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  };

  // Statische Anfrage-Buttons aus index.html zentral auf die Kontaktadresse
  // umbiegen. Betreff und Nachricht bleiben im HTML editierbar.
  qsa('[data-mail-inquiry]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const href = link.getAttribute('href') || 'mailto:';
      const query = href.includes('?') ? href.split('?')[1] : '';
      const params = new URLSearchParams(query);
      const subject = params.get('subject') || 'MERVELLE GEMSTONES – Anfrage';
      const body = params.get('body') || '';
      window.location.href = buildMailto(subject, body);
    });
  });


  /* ------------------------------------------------------------------------
     1) HEADER / LOGO BEIM SCROLLEN
     ------------------------------------------------------------------------
     Der Header erhält ab einer kleinen Scroll-Distanz die Klasse .is-scrolled.
     styles.css schaltet dann von der vollen Logo-Version auf die kompakte
     M-Signet-Version um und macht den Header vollständig deckend.
     So bleibt die Navigation auf hellen Abschnitten lesbar.

     EDIT:
     - Scroll-Schwelle hier ändern: HEADER_SCROLL_THRESHOLD
     - Optik/Größe in styles.css unter "HEADER BRAND LOCKUP"
     ------------------------------------------------------------------------ */

  const header = qs('[data-header]');
  const HEADER_SCROLL_THRESHOLD = 8;

  const updateHeaderState = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > HEADER_SCROLL_THRESHOLD);
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });


  /* ------------------------------------------------------------------------
     2) MOBILE NAVIGATION
     ------------------------------------------------------------------------
     Der Button [data-menu-toggle] öffnet/schließt das mobile Menü.
     Nach Klick auf einen Menüpunkt wird das Menü automatisch geschlossen.
     ------------------------------------------------------------------------ */

  const menuToggle = qs('[data-menu-toggle]');
  const nav = qs('[data-nav]');

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';

    // ARIA-Status für Screenreader aktualisieren.
    menuToggle.setAttribute('aria-expanded', String(!isOpen));

    // CSS-Klasse schaltet das mobile Menü sichtbar/unsichtbar.
    nav?.classList.toggle('is-open', !isOpen);
  });

  qsa('a', nav).forEach(link => {
    link.addEventListener('click', () => {
      nav?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
    });
  });


  /* ------------------------------------------------------------------------
     3) DYNAMISCHER PRODUKTKATALOG
     ------------------------------------------------------------------------
     window.MERVELLE_CATALOG wird von assets/data/catalog-data.js bereitgestellt.

     Ordnerlogik:
       assets/catalog/<kategorie>/<farbe>/<datei>.webp

     Beispiel:
       assets/catalog/straenge/blau/lapislazuli.webp

     OPTIONAL kann daneben eine gleichnamige JSON-Datei liegen:
       lapislazuli.json

     Diese kann Titel, Beschreibung, Tags, Alt-Text und Reihenfolge enthalten.
     ------------------------------------------------------------------------ */

  const catalog = Array.isArray(window.MERVELLE_CATALOG)
    ? window.MERVELLE_CATALOG
    : [];

  // DOM-Elemente der Katalogsteuerung.
  const grid = qs('[data-catalog-grid]');
  const emptyState = qs('[data-catalog-empty]');
  const resultCount = qs('[data-result-count]');
  const searchInput = qs('[data-catalog-search]');
  const colorSelect = qs('[data-filter-color]');
  const sortSelect = qs('[data-sort]');
  const resetButton = qs('[data-filter-reset]');
  const categoryButtons = qsa('[data-filter-category]');
  const loadMoreButton = qs('[data-catalog-more]');
  const loadMoreWrap = qs('[data-catalog-more-wrap]');
  const shownStatus = qs('[data-catalog-shown]');

  // EDIT: Anzahl der Produkte, die auf der Produktseite zunächst sichtbar sind (Desktop 6, Mobile 4).
  // So bleibt die Seite kompakt, obwohl der Katalog deutlich größer sein kann.
  const CATALOG_PAGE_SIZE = window.matchMedia('(max-width: 560px)').matches ? 4 : 6;
  let visibleCount = CATALOG_PAGE_SIZE;

  // "all" bedeutet: keine Kategorie-Einschränkung.
  let activeCategory = 'all';

  /*
    Farbfilter dynamisch aufbauen.
    Neue Farb-Unterordner erscheinen dadurch automatisch als Option,
    sobald build_catalog.py erneut ausgeführt wurde.
  */
  if (colorSelect) {
    const colors = [...new Map(
      catalog.map(item => [item.color, item.colorLabel])
    ).entries()].sort((a, b) => a[1].localeCompare(b[1], 'de'));

    colors.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      colorSelect.append(option);
    });
  }

  /*
    Einzelne Produktkarte als HTML erzeugen.
    EDIT: Wenn das Aussehen/Inhalt einer Karte geändert werden soll,
    zuerst diese Vorlage UND die CSS-Klassen .catalog-* prüfen.
  */
  function cardTemplate(item) {
    return `
      <article class="catalog-card" data-product-id="${item.id}">
        <button
          class="catalog-open"
          type="button"
          data-modal-open="${item.id}"
          aria-label="${item.title} ansehen"
        >
          <span class="catalog-image">
            <img src="${item.image}" alt="${item.alt}" loading="lazy">
          </span>
          <span class="catalog-info">
            <small>${item.categoryLabel} · ${item.colorLabel}</small>
            <strong>${item.title}</strong>
            <p>${item.description}</p>
          </span>
        </button>
      </article>`;
  }

  /*
    Gesamten Katalog anhand der aktuellen Filter neu rendern.
    Diese Funktion wird bei Suche, Filterwechsel und Sortierung aufgerufen.
  */
  function renderCatalog() {
    if (!grid) return;

    const search = normalize(searchInput?.value.trim());
    const color = colorSelect?.value || 'all';
    const sort = sortSelect?.value || 'default';

    // 1. Filtern.
    let items = catalog.filter(item => {
      const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
      const colorMatches = color === 'all' || item.color === color;

      // Suchtext umfasst Titel, Beschreibung, Kategorie, Farbe und optionale Tags.
      const haystack = normalize([
        item.title,
        item.description,
        item.categoryLabel,
        item.colorLabel,
        ...(item.tags || [])
      ].join(' '));

      const searchMatches = !search || haystack.includes(search);
      return categoryMatches && colorMatches && searchMatches;
    });

    // 2. Optional sortieren.
    if (sort === 'title') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title, 'de'));
    }

    if (sort === 'category') {
      items = [...items].sort((a, b) =>
        a.categoryLabel.localeCompare(b.categoryLabel, 'de') ||
        a.title.localeCompare(b.title, 'de')
      );
    }

    // 3. Auf der Produktseite zunächst nur einen kompakten Ausschnitt zeigen.
    // Seiten ohne "Mehr anzeigen"-Button rendern weiterhin alle Treffer.
    const visibleItems = loadMoreButton ? items.slice(0, visibleCount) : items;
    grid.innerHTML = visibleItems.map(cardTemplate).join('');

    // 4. Trefferzahl / Leermeldung / Mehr-anzeigen-Status aktualisieren.
    if (resultCount) resultCount.textContent = String(items.length);
    if (emptyState) emptyState.hidden = items.length !== 0;

    if (loadMoreWrap && loadMoreButton) {
      const hasMore = visibleItems.length < items.length;
      loadMoreWrap.hidden = items.length === 0;
      loadMoreButton.hidden = !hasMore;
      if (shownStatus) {
        shownStatus.textContent = `${visibleItems.length} von ${items.length} Produkten`;
      }
    }
  }

  // Kategorie-Chips.
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.filterCategory || 'all';
      visibleCount = CATALOG_PAGE_SIZE;

      categoryButtons.forEach(btn => {
        btn.classList.toggle('is-active', btn === button);
      });

      renderCatalog();
    });
  });

  // Suche / Dropdowns.
  searchInput?.addEventListener('input', () => { visibleCount = CATALOG_PAGE_SIZE; renderCatalog(); });
  colorSelect?.addEventListener('change', () => { visibleCount = CATALOG_PAGE_SIZE; renderCatalog(); });
  sortSelect?.addEventListener('change', () => { visibleCount = CATALOG_PAGE_SIZE; renderCatalog(); });

  // EDIT: Weitere Produkte in festen Schritten nachladen, ohne die Seite neu zu laden.
  loadMoreButton?.addEventListener('click', () => {
    visibleCount += CATALOG_PAGE_SIZE;
    renderCatalog();
  });

  // Alle Filter auf Ausgangszustand zurücksetzen.
  resetButton?.addEventListener('click', () => {
    activeCategory = 'all';
    visibleCount = CATALOG_PAGE_SIZE;

    categoryButtons.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filterCategory === 'all');
    });

    if (searchInput) searchInput.value = '';
    if (colorSelect) colorSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'default';

    renderCatalog();
  });

  // Erster Render direkt beim Seitenstart.
  renderCatalog();


  /* ------------------------------------------------------------------------
     4) PRODUKT-MODAL
     ------------------------------------------------------------------------
     Klick auf eine dynamisch erzeugte Karte öffnet <dialog> aus index.html.
     Event Delegation ist wichtig, weil die Produktkarten erst später per JS
     in das DOM eingefügt werden.
     ------------------------------------------------------------------------ */

  const modal = qs('[data-product-modal]');
  const modalImage = qs('[data-modal-image]');
  const modalTitle = qs('[data-modal-title]');
  const modalDescription = qs('[data-modal-description]');
  const modalCategory = qs('[data-modal-category]');
  const modalColor = qs('[data-modal-color]');
  const modalType = qs('[data-modal-type]');
  const productInput = qs('[data-product-input]');

  let currentProduct = null;

  grid?.addEventListener('click', event => {
    const button = event.target.closest('[data-modal-open]');
    if (!button) return;

    currentProduct = catalog.find(item => item.id === button.dataset.modalOpen);
    if (!currentProduct || !modal) return;

    // Dynamische Produktdaten ins Modal schreiben.
    if (modalImage) {
      modalImage.src = currentProduct.image;
      modalImage.alt = currentProduct.alt;
    }
    if (modalTitle) modalTitle.textContent = currentProduct.title;
    if (modalDescription) modalDescription.textContent = currentProduct.description;
    if (modalCategory) modalCategory.textContent = currentProduct.categoryLabel;
    if (modalColor) modalColor.textContent = currentProduct.colorLabel;
    if (modalType) modalType.textContent = currentProduct.categoryLabel;

    document.body.classList.add('modal-open');

    // Fallback für ältere Browser ohne showModal().
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  });

  function closeModal() {
    modal?.close?.();
    modal?.removeAttribute('open');
    document.body.classList.remove('modal-open');
  }

  qsa('[data-modal-close]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  // Klick auf den abgedunkelten Hintergrund schließt ebenfalls.
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  modal?.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });

  // "Produkt anfragen" öffnet direkt das lokale Mailprogramm.
  qs('[data-product-inquiry]')?.addEventListener('click', () => {
    if (!currentProduct) return;

    // EDIT: Empfänger wird zentral über CONTACT_EMAIL weiter oben gesteuert.
    const subject = `MERVELLE GEMSTONES – Produktanfrage: ${currentProduct.title}`;
    const body = [
      'Guten Tag,',
      '',
      `ich interessiere mich für: ${currentProduct.title}`,
      '',
      'Bitte senden Sie mir weitere Informationen zu Verfügbarkeit, Qualität, Größe und Menge.',
      '',
      'Viele Grüße'
    ].join('\n');

    closeModal();
    window.location.href = buildMailto(subject, body);
  });


  /* ------------------------------------------------------------------------
     5) SOURCING / SCROLL-STORY
     ------------------------------------------------------------------------
     Früher wurde hier IntersectionObserver verwendet. Mehrere gleichzeitig
     sichtbare Schritte konnten sich gegenseitig überholen; dadurch sprang das
     Bild gelegentlich zurück.

     Jetzt wird pro Animation-Frame berechnet, welcher Text-Schritt einer festen
     Fokuslinie im Viewport am nächsten ist. Genau dieser Index steuert das Bild.
     Dadurch ist die Reihenfolge stabil, auch bei schnellem Scrollen.

     EDIT:
     focusLine = 0.42 bedeutet: Aktivierung ungefähr bei 42 % der Bildschirmhöhe.
     ------------------------------------------------------------------------ */

  const storySteps = qsa('[data-story-step]');
  const storyImages = qsa('[data-story-image]');
  const storyIndex = qs('[data-story-index]');

  let activeStory = -1;

  function setActiveStory(index) {
    // Nichts tun, wenn der gewünschte Zustand bereits aktiv ist.
    if (index === activeStory || index < 0) return;

    activeStory = index;

    storySteps.forEach((step, i) => {
      step.classList.toggle('is-active', i === index);
    });

    storyImages.forEach((image, i) => {
      image.classList.toggle('is-active', i === index);
    });

    if (storyIndex) {
      storyIndex.textContent = String(index + 1).padStart(2, '0');
    }
  }

  if (storySteps.length) {
    let rafId = null;

    const updateStory = () => {
      rafId = null;

      // EDIT: Position der imaginären Aktivierungs-Linie im Viewport.
      const focusLine = window.innerHeight * 0.42;

      let closestIndex = 0;
      let closestDistance = Infinity;

      storySteps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const center = rect.top + rect.height * 0.5;
        const distance = Math.abs(center - focusLine);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveStory(closestIndex);
    };

    // requestAnimationFrame verhindert unnötig viele Berechnungen beim Scrollen.
    const requestStoryUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(updateStory);
    };

    window.addEventListener('scroll', requestStoryUpdate, { passive: true });
    window.addEventListener('resize', requestStoryUpdate);

    setActiveStory(0);
    requestStoryUpdate();
  }


  /* ------------------------------------------------------------------------
     6) ANFRAGEFORMULAR -> MAILPROGRAMM
     ------------------------------------------------------------------------
     Das Formular speichert oder versendet keine Daten über die Website.
     Nach dem Absenden wird stattdessen das lokale Mailprogramm geöffnet und
     die eingegebenen Informationen als E-Mail-Text vorbereitet.

     EDIT:
     - Empfängeradresse zentral oben bei CONTACT_EMAIL eintragen.
     - Der Betreff kann je Formular über data-request-subject gesetzt werden.
     ------------------------------------------------------------------------ */

  const form = qs('[data-request-form]');
  const formStatus = qs('[data-form-status]');

  form?.addEventListener('submit', event => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (formStatus) formStatus.textContent = 'Bitte füllen Sie die Pflichtfelder aus.';
      return;
    }

    const data = new FormData(form);
    const subject = form.dataset.requestSubject || 'MERVELLE GEMSTONES – Anfrage';
    const text = [
      'Guten Tag,',
      '',
      'ich möchte eine Anfrage an MERVELLE GEMSTONES stellen.',
      '',
      `Unternehmen: ${data.get('company') || '–'}`,
      `Name: ${data.get('name') || '–'}`,
      `E-Mail: ${data.get('email') || '–'}`,
      `Telefon: ${data.get('phone') || '–'}`,
      `Stein / Perle: ${data.get('product') || '–'}`,
      `Form / Schliff: ${data.get('stage') || '–'}`,
      `Größe: ${data.get('size') || '–'}`,
      `Farbe / Qualität: ${data.get('color') || '–'}`,
      `Menge: ${data.get('quantity') || '–'}`,
      '',
      `Weitere Angaben: ${data.get('message') || '–'}`,
      '',
      'Viele Grüße'
    ].join('\n');

    if (formStatus) {
      formStatus.textContent = 'Ihr Mailprogramm wird geöffnet …';
    }
    window.location.href = buildMailto(subject, text);
  });
})();
